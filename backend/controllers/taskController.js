const mongoose = require("mongoose");

const Task = require("../models/Task");
const User = require("../models/User");
const Comment = require("../models/Comment");
const Notification = require("../models/Notification");

// --------------------------------------------------
// Helpers
// --------------------------------------------------

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const validateTaskId = (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    res.status(400).json({
      success: false,
      message: "Invalid task ID",
    });

    return false;
  }

  return true;
};

const isTaskOwnerOrAdmin = (task, user) => {
  return (
    user.role === "ADMIN" ||
    task.assignedBy.toString() === user._id.toString()
  );
};

const isAssignedUser = (task, user) => {
  return task.assignedTo.some(
    (id) => id.toString() === user._id.toString()
  );
};

const canAccessTask = (task, user) => {
  return (
    isTaskOwnerOrAdmin(task, user) ||
    isAssignedUser(task, user)
  );
};

// --------------------------------------------------
// Create Task
// --------------------------------------------------

const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      assignedTo,
      dueDate,
    } = req.body;

    if (!title || !description || !assignedTo || !dueDate) {
      return res.status(400).json({
        success: false,
        message:
          "Title, description, assigned users, and due date are required",
      });
    }

    const assignees = Array.isArray(assignedTo)
      ? assignedTo
      : [assignedTo];

    if (
      assignees.length === 0 ||
      assignees.some((id) => !isValidObjectId(id))
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid assigned user IDs",
      });
    }

    // Make sure all assigned users actually exist,
    // are active, and have USER role.
    const validUsers = await User.find({
      _id: { $in: assignees },
      role: "USER",
      isActive: true,
    }).select("_id");

    if (validUsers.length !== assignees.length) {
      return res.status(400).json({
        success: false,
        message:
          "One or more assigned users do not exist, are inactive, or are not USER accounts",
      });
    }

    const task = await Task.create({
      title: title.trim(),
      description: description.trim(),
      priority,
      assignedTo: assignees,
      dueDate,
      assignedBy: req.user._id,
    });

    const notifications = assignees.map((userId) => ({
      recipient: userId,
      sender: req.user._id,
      task: task._id,
      title: "New Task Assigned",
      message: `You have been assigned a new task: ${task.title}`,
      type: "TASK_ASSIGNED",
    }));

    await Notification.insertMany(notifications);

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// --------------------------------------------------
// Get Tasks
// --------------------------------------------------

const getTasks = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);

    const limit = Math.min(
      Math.max(Number(req.query.limit) || 10, 1),
      100
    );

    const skip = (page - 1) * limit;

    const { search, status, priority } = req.query;

    const filter = {};

    if (req.user.role === "SUPERVISOR") {
      filter.assignedBy = req.user._id;
    }

    if (req.user.role === "USER") {
      filter.assignedTo = req.user._id;
    }

    if (search) {
      filter.$or = [
        {
          title: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          description: {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];
    }

    if (status) {
      filter.status = status;
    }

    if (priority) {
      filter.priority = priority;
    }

    const totalTasks = await Task.countDocuments(filter);

    const tasks = await Task.find(filter)
      .populate(
        "assignedTo",
        "name email role profileImage"
      )
      .populate(
        "assignedBy",
        "name email role profileImage"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      tasks,
      pagination: {
        totalTasks,
        currentPage: page,
        totalPages: Math.ceil(totalTasks / limit),
        limit,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// --------------------------------------------------
// Update Task Progress
// --------------------------------------------------

const updateTaskProgress = async (req, res) => {
  try {
    if (!validateTaskId(req, res)) {
      return;
    }

    const progress = Number(req.body.progress);

    if (
      Number.isNaN(progress) ||
      progress < 0 ||
      progress > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Progress must be a number between 0 and 100",
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (!canAccessTask(task, req.user)) {
      return res.status(403).json({
        success: false,
        message: "Not allowed",
      });
    }

    // Once task is under review or approved,
    // progress must not change.
    if (
      task.status === "SUBMITTED" ||
      task.status === "APPROVED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Progress cannot be changed while the task is submitted or approved",
      });
    }

    task.progress = progress;

    if (progress === 0) {
      task.status = "PENDING";
    } else if (progress > 0 && progress < 100) {
      task.status = "IN_PROGRESS";
    } else if (progress === 100) {
      task.status = "COMPLETED";
    }

    await task.save();

    return res.status(200).json({
      success: true,
      message: "Progress updated",
      task,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// --------------------------------------------------
// Submit Task
// --------------------------------------------------

const submitTask = async (req, res) => {
  try {
    if (!validateTaskId(req, res)) {
      return;
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (!isAssignedUser(task, req.user)) {
      return res.status(403).json({
        success: false,
        message:
          "Only an assigned user can submit this task",
      });
    }

    if (task.progress !== 100) {
      return res.status(400).json({
        success: false,
        message:
          "Task must be 100% complete before submission",
      });
    }

    if (task.status === "SUBMITTED") {
      return res.status(400).json({
        success: false,
        message: "Task has already been submitted",
      });
    }

    if (task.status === "APPROVED") {
      return res.status(400).json({
        success: false,
        message:
          "Approved task cannot be submitted again",
      });
    }

    task.status = "SUBMITTED";

    await task.save();

    await Notification.create({
      recipient: task.assignedBy,
      sender: req.user._id,
      task: task._id,
      title: "Task Submitted",
      message: `${req.user.name} submitted task: ${task.title}`,
      type: "TASK_SUBMITTED",
    });

    return res.status(200).json({
      success: true,
      message: "Task submitted successfully",
      task,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// --------------------------------------------------
// Approve Task
// --------------------------------------------------

const approveTask = async (req, res) => {
  try {
    if (!validateTaskId(req, res)) {
      return;
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (!isTaskOwnerOrAdmin(task, req.user)) {
      return res.status(403).json({
        success: false,
        message: "Not allowed",
      });
    }

    if (task.status !== "SUBMITTED") {
      return res.status(400).json({
        success: false,
        message:
          "Only submitted tasks can be approved",
      });
    }

    task.status = "APPROVED";
    task.progress = 100;

    await task.save();

    const notifications = task.assignedTo.map(
      (userId) => ({
        recipient: userId,
        sender: req.user._id,
        task: task._id,
        title: "Task Approved",
        message: `Your task was approved: ${task.title}`,
        type: "TASK_APPROVED",
      })
    );

    await Notification.insertMany(notifications);

    return res.status(200).json({
      success: true,
      message: "Task approved",
      task,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// --------------------------------------------------
// Reject Task
// --------------------------------------------------

const rejectTask = async (req, res) => {
  try {
    if (!validateTaskId(req, res)) {
      return;
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (!isTaskOwnerOrAdmin(task, req.user)) {
      return res.status(403).json({
        success: false,
        message: "Not allowed",
      });
    }

    if (task.status !== "SUBMITTED") {
      return res.status(400).json({
        success: false,
        message:
          "Only submitted tasks can be rejected",
      });
    }

    task.status = "REJECTED";

    await task.save();

    const notifications = task.assignedTo.map(
      (userId) => ({
        recipient: userId,
        sender: req.user._id,
        task: task._id,
        title: "Task Rejected",
        message: `Your task was rejected: ${task.title}`,
        type: "TASK_REJECTED",
      })
    );

    await Notification.insertMany(notifications);

    return res.status(200).json({
      success: true,
      message: "Task rejected",
      task,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// --------------------------------------------------
// Upload Task File
// --------------------------------------------------

const uploadTaskFile = async (req, res) => {
  try {
    if (!validateTaskId(req, res)) {
      return;
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (!canAccessTask(task, req.user)) {
      return res.status(403).json({
        success: false,
        message: "Not allowed",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    task.attachments.push({
      fileName: req.file.originalname,
      filePath: `uploads/${req.file.filename}`,
      fileType: req.file.mimetype,
      uploadedBy: req.user._id,
    });

    await task.save();

    return res.status(200).json({
      success: true,
      message: "File uploaded",
      attachments: task.attachments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// --------------------------------------------------
// Add Comment
// --------------------------------------------------

const addComment = async (req, res) => {
  try {
    if (!validateTaskId(req, res)) {
      return;
    }

    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment message is required",
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (!canAccessTask(task, req.user)) {
      return res.status(403).json({
        success: false,
        message: "Not allowed",
      });
    }

    const comment = await Comment.create({
      task: task._id,
      user: req.user._id,
      message: message.trim(),
    });

    task.comments.push(comment._id);

    await task.save();

    const recipients = [
      task.assignedBy.toString(),
      ...task.assignedTo.map((id) =>
        id.toString()
      ),
    ].filter(
      (id) =>
        id !== req.user._id.toString()
    );

    const uniqueRecipients = [
      ...new Set(recipients),
    ];

    if (uniqueRecipients.length > 0) {
      const notifications =
        uniqueRecipients.map((userId) => ({
          recipient: userId,
          sender: req.user._id,
          task: task._id,
          title: "New Comment",
          message: `${req.user.name} commented on task: ${task.title}`,
          type: "COMMENT_ADDED",
        }));

      await Notification.insertMany(
        notifications
      );
    }

    const populated =
      await Comment.findById(
        comment._id
      ).populate(
        "user",
        "name email role profileImage"
      );

    return res.status(201).json({
      success: true,
      message: "Comment added",
      comment: populated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// --------------------------------------------------
// Get Task Comments
// --------------------------------------------------

const getTaskComments = async (req, res) => {
  try {
    if (!validateTaskId(req, res)) {
      return;
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (!canAccessTask(task, req.user)) {
      return res.status(403).json({
        success: false,
        message: "Not allowed",
      });
    }

    const comments = await Comment.find({
      task: req.params.id,
    })
      .populate(
        "user",
        "name email role profileImage"
      )
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// --------------------------------------------------
// Update Task Information
// --------------------------------------------------

const updateTask = async (req, res) => {
  try {
    if (!validateTaskId(req, res)) {
      return;
    }

    const allowedPriorities = [
      "LOW",
      "MEDIUM",
      "HIGH",
      "URGENT",
    ];

    const {
      title,
      description,
      priority,
      dueDate,
    } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (!isTaskOwnerOrAdmin(task, req.user)) {
      return res.status(403).json({
        success: false,
        message: "Not allowed",
      });
    }

    if (
      priority &&
      !allowedPriorities.includes(priority)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid priority",
      });
    }

    // Workflow status is not changed from this endpoint.
    // Submit / Approve / Reject endpoints control status.

    if (title) {
      task.title = title.trim();
    }

    if (description) {
      task.description =
        description.trim();
    }

    if (priority) {
      task.priority = priority;
    }

    if (dueDate) {
      task.dueDate = dueDate;
    }

    await task.save();

    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createTask,
  getTasks,
  updateTaskProgress,
  submitTask,
  approveTask,
  rejectTask,
  uploadTaskFile,
  addComment,
  getTaskComments,
  updateTask,
};