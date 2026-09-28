const express = require("express");
const upload = require("../middleware/uploadMiddleware");

const {
  getUsers,
  getAssignableUsers,
  createUser,
  updateUser,
  deactivateUser,
  uploadProfileImage,
  changePassword,
} = require("../controllers/userController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.put(
  "/profile/image",
  protect,
  upload.single("file"),
  uploadProfileImage
);

router.put("/change-password", protect, changePassword);

// ADMIN and SUPERVISOR can load active USER accounts for task assignment
router.get(
  "/assignable",
  protect,
  authorizeRoles("ADMIN", "SUPERVISOR"),
  getAssignableUsers
);

// From this point downward, routes are ADMIN-only
router.use(protect);
router.use(authorizeRoles("ADMIN"));

router.get("/", getUsers);
router.post("/", createUser);
router.put("/:id", updateUser);
router.patch("/:id/deactivate", deactivateUser);

module.exports = router;