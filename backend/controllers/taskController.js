const mongoose = require("mongoose");
const Task = require("../models/Task");
const Comment = require("../models/Comment");
const Notification = require("../models/Notification");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

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
  return isTaskOwnerOrAdmin(task, user) || isAssignedUser(task, user);
};

const createTask = async (req, res) => {
  try {
    const { title, description, priority, assignedTo, dueDate } = req.body;

    if (!title || !description || !assignedTo || !dueDate) {
      return res.status(400).json({
        success: false,
        message: "Title, description, assigned users, and due date are required",
      });
    }

    const assignees = Array.isArray(assignedTo) ? assignedTo : [assignedTo];

    if (assignees.length === 0 || assignees.some((id) => !isValidObjectId(id))) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid assigned user IDs",
      });
    }

    const task = await Task.create({
      title,
      description,
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
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getTasks = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
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
        { title: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const totalTasks = await Task.countDocuments(filter);

    const tasks = await Task.find(filter)
      .populate("assignedTo", "name email role profileImage")
      .populate("assignedBy", "name email role profileImage")
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
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateTaskProgress = async (req, res) => {
  try {
    const progress = Number(req.body.progress);

    if (Number.isNaN(progress) || progress < 0 || progress > 100) {
      return res.status(400).json({
        success: false,
        message: "Progress must be a number between 0 and 100",
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    if (!canAccessTask(task, req.user)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    task.progress = progress;

    if (progress === 0) task.status = "PENDING";
    if (progress > 0 && progress < 100) task.status = "IN_PROGRESS";
    if (progress === 100) task.status = "COMPLETED";

    await task.save();

    return res.status(200).json({
      success: true,
      message: "Progress updated",
      task,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const allowedStatuses = [
      "PENDING",
      "IN_PROGRESS",
      "SUBMITTED",
      "APPROVED",
      "REJECTED",
      "COMPLETED",
    ];

    const { status } = req.body;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task status",
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    if (!isTaskOwnerOrAdmin(task, req.user)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    task.status = status;

    if (status === "COMPLETED" || status === "APPROVED") task.progress = 100;
    if (status === "PENDING") task.progress = 0;

    await task.save();

    return res.status(200).json({
      success: true,
      message: "Status updated",
      task,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const submitTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    if (!isAssignedUser(task, req.user)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
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
      message: "Task submitted",
      task,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const approveTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    if (!isTaskOwnerOrAdmin(task, req.user)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    task.status = "APPROVED";
    task.progress = 100;
    await task.save();

    const notifications = task.assignedTo.map((userId) => ({
      recipient: userId,
      sender: req.user._id,
      task: task._id,
      title: "Task Approved",
      message: `Your task was approved: ${task.title}`,
      type: "TASK_APPROVED",
    }));

    await Notification.insertMany(notifications);

    return res.status(200).json({
      success: true,
      message: "Task approved",
      task,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const rejectTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    if (!isTaskOwnerOrAdmin(task, req.user)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    task.status = "REJECTED";
    await task.save();

    const notifications = task.assignedTo.map((userId) => ({
      recipient: userId,
      sender: req.user._id,
      task: task._id,
      title: "Task Rejected",
      message: `Your task was rejected: ${task.title}`,
      type: "TASK_REJECTED",
    }));

    await Notification.insertMany(notifications);

    return res.status(200).json({
      success: true,
      message: "Task rejected",
      task,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const uploadTaskFile = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    if (!canAccessTask(task, req.user)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
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
    return res.status(500).json({ success: false, message: error.message });
  }
};

const addComment = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment message is required",
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    if (!canAccessTask(task, req.user)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
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
      ...task.assignedTo.map((id) => id.toString()),
    ].filter((id) => id !== req.user._id.toString());

    const uniqueRecipients = [...new Set(recipients)];

    if (uniqueRecipients.length > 0) {
      const notifications = uniqueRecipients.map((userId) => ({
        recipient: userId,
        sender: req.user._id,
        task: task._id,
        title: "New Comment",
        message: `${req.user.name} commented on task: ${task.title}`,
        type: "COMMENT_ADDED",
      }));

      await Notification.insertMany(notifications);
    }

    const populated = await Comment.findById(comment._id).populate(
      "user",
      "name email role profileImage"
    );

    return res.status(201).json({
      success: true,
      message: "Comment added",
      comment: populated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getTaskComments = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    if (!canAccessTask(task, req.user)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    const comments = await Comment.find({ task: req.params.id })
      .populate("user", "name email role profileImage")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const allowedPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];
    const allowedStatuses = [
      "PENDING",
      "IN_PROGRESS",
      "SUBMITTED",
      "APPROVED",
      "REJECTED",
      "COMPLETED",
    ];

    const { title, description, priority, status, dueDate } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    if (!isTaskOwnerOrAdmin(task, req.user)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    if (priority && !allowedPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid priority",
      });
    }

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    if (title) task.title = title;
    if (description) task.description = description;
    if (priority) task.priority = priority;
    if (status) task.status = status;
    if (dueDate) task.dueDate = dueDate;

    if (task.status === "APPROVED" || task.status === "COMPLETED") {
      task.progress = 100;
    }

    if (task.status === "PENDING") {
      task.progress = 0;
    }

    await task.save();

    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createTask,
  getTasks,
  updateTaskProgress,
  updateTaskStatus,
  submitTask,
  approveTask,
  rejectTask,
  uploadTaskFile,
  addComment,
  getTaskComments,
  updateTask,
};