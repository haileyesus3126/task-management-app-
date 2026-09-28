const express = require("express");
const upload = require("../middleware/uploadMiddleware");

const {
  createTask,
  getTasks,
  updateTask,
  updateTaskProgress,
  submitTask,
  approveTask,
  rejectTask,
  uploadTaskFile,
  addComment,
  getTaskComments,
} = require("../controllers/taskController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// All task routes require authentication
router.use(protect);

// Get tasks / Create task
router
  .route("/")
  .get(getTasks)
  .post(authorizeRoles("ADMIN", "SUPERVISOR"), createTask);

// Update general task information
router.put(
  "/:id",
  authorizeRoles("ADMIN", "SUPERVISOR"),
  updateTask
);

// Update progress
router.patch("/:id/progress", updateTaskProgress);

// Submit task
router.post("/:id/submit", submitTask);

// Approve submitted task
router.post(
  "/:id/approve",
  authorizeRoles("ADMIN", "SUPERVISOR"),
  approveTask
);

// Reject submitted task
router.post(
  "/:id/reject",
  authorizeRoles("ADMIN", "SUPERVISOR"),
  rejectTask
);

// Upload task attachment
router.post(
  "/:id/upload",
  upload.single("file"),
  uploadTaskFile
);

// Task comments
router
  .route("/:id/comments")
  .get(getTaskComments)
  .post(addComment);

module.exports = router;