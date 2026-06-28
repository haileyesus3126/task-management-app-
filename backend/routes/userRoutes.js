const express = require("express");
const upload = require("../middleware/uploadMiddleware");

const {
  getUsers,
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

router.use(protect);
router.use(authorizeRoles("ADMIN"));

router.get("/", getUsers);
router.post("/", createUser);
router.put("/:id", updateUser);
router.patch("/:id/deactivate", deactivateUser);

module.exports = router;