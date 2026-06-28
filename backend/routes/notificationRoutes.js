const express = require("express");

const {
  getNotifications,
  markNotificationAsRead,
} = require("../controllers/notificationController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| All Notification Routes Require Authentication
|--------------------------------------------------------------------------
*/

router.use(protect);

/*
|--------------------------------------------------------------------------
| Notification Routes
|--------------------------------------------------------------------------
*/

router.get("/", getNotifications);

router.patch("/:id/read", markNotificationAsRead);

module.exports = router;