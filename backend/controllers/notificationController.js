const mongoose = require("mongoose");
const Notification = require("../models/Notification");

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const getNotifications = async (
  req,
  res,
  next
) => {
  try {
    const notifications =
      await Notification.find({
        recipient: req.user._id,
      })
        .populate(
          "sender",
          "name email role profileImage"
        )
        .populate(
          "task",
          "title status priority dueDate"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      count:
        notifications.length,
      notifications,
    });
  } catch (error) {
    return next(error);
  }
};

const markNotificationAsRead =
  async (
    req,
    res,
    next
  ) => {
    try {
      if (
        !isValidObjectId(
          req.params.id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid notification ID",
        });
      }

      const notification =
        await Notification.findOne({
          _id: req.params.id,
          recipient:
            req.user._id,
        });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message:
            "Notification not found",
        });
      }

      notification.isRead =
        true;

      await notification.save();

      return res.status(200).json({
        success: true,
        message:
          "Notification marked as read",
        notification,
      });
    } catch (error) {
      return next(error);
    }
  };

module.exports = {
  getNotifications,
  markNotificationAsRead,
};