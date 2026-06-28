import { useEffect, useState } from "react";
import { Bell, CheckCircle } from "lucide-react";

import api from "../api/axios";

import "../styles/notifications.css";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/notifications");

      setNotifications(res.data.notifications || []);
    } catch (error) {
      setError("Failed to load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      setMessage("");
      setMessageType("success");

      await api.patch(`/notifications/${id}/read`);

      setMessage("Notification marked as read.");
      fetchNotifications();
    } catch (error) {
      setMessageType("error");
      setMessage(
        error.response?.data?.message || "Failed to update notification."
      );
    }
  };

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h2>Notifications</h2>
        <p>Track task updates, comments, approvals, and assignments.</p>
      </div>

      {message && (
        <div
          className={
            messageType === "error"
              ? "notifications-message error"
              : "notifications-message"
          }
        >
          {message}
        </div>
      )}

      {loading && (
        <div className="notifications-state">Loading notifications...</div>
      )}

      {error && <div className="notifications-error">{error}</div>}

      {!loading && !error && (
        <div className="notifications-list">
          {notifications.length === 0 ? (
            <div className="empty-notifications">
              <Bell size={40} />
              <h3>No notifications yet</h3>
              <p>Your task updates will appear here.</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                className={`notification-card ${
                  notification.isRead ? "read" : "unread"
                }`}
                key={notification._id}
              >
                <div className="notification-icon">
                  <Bell size={22} />
                </div>

                <div className="notification-content">
                  <div className="notification-title-row">
                    <h3>{notification.title}</h3>

                    {!notification.isRead && (
                      <span className="unread-badge">Unread</span>
                    )}
                  </div>

                  <p>{notification.message}</p>

                  <div className="notification-meta">
                    <span>From: {notification.sender?.name || "System"}</span>

                    {notification.task && (
                      <span>Task: {notification.task.title}</span>
                    )}

                    <span>
                      {notification.createdAt
                        ? new Date(notification.createdAt).toLocaleString()
                        : "No date"}
                    </span>
                  </div>
                </div>

                {!notification.isRead && (
                  <button
                    className="mark-read-btn"
                    onClick={() => markAsRead(notification._id)}
                  >
                    <CheckCircle size={16} />
                    Mark Read
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;