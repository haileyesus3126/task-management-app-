const express = require("express");
const upload = require("../middleware/uploadMiddleware");

const {
  createTask,
  getTasks,
  updateTask,
  updateTaskProgress,
  updateTaskStatus,
  submitTask,
  approveTask,
  rejectTask,
  uploadTaskFile,
  addComment,
  getTaskComments,
} = require("../controllers/taskController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(getTasks)
  .post(authorizeRoles("ADMIN", "SUPERVISOR"), createTask);

router.put("/:id", authorizeRoles("ADMIN", "SUPERVISOR"), updateTask);

router.patch("/:id/progress", updateTaskProgress);

router.patch(
  "/:id/status",
  authorizeRoles("ADMIN", "SUPERVISOR"),
  updateTaskStatus
);

router.post("/:id/submit", submitTask);

router.post(
  "/:id/approve",
  authorizeRoles("ADMIN", "SUPERVISOR"),
  approveTask
);

router.post(
  "/:id/reject",
  authorizeRoles("ADMIN", "SUPERVISOR"),
  rejectTask
);

router.post(
  "/:id/upload",
  upload.single("file"),
  uploadTaskFile
);

router
  .route("/:id/comments")
  .get(getTaskComments)
  .post(addComment);

module.exports = router;