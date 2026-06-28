import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

import "../styles/task-details.css";

const uploadBaseUrl = import.meta.env.VITE_UPLOAD_URL || "http://localhost:5000";

const TaskDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const [commentText, setCommentText] = useState("");
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const isAdminOrSupervisor =
    user?.role === "ADMIN" || user?.role === "SUPERVISOR";

  const isAssignedUser = task?.assignedTo?.some(
    (assignedUser) =>
      assignedUser._id === user?.id ||
      assignedUser._id === user?._id ||
      assignedUser.id === user?.id ||
      assignedUser.id === user?._id
  );

  const fetchTask = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/tasks?limit=100");

      const taskList = res.data.tasks || [];
      const foundTask = taskList.find((item) => item._id === id || item.id === id);

      if (!foundTask) {
        setError("Task not found or you do not have permission to view it.");
        setTask(null);
        return;
      }

      setTask(foundTask);
      setProgress(foundTask.progress || 0);
    } catch (error) {
      setError("Failed to load task details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      setCommentsLoading(true);

      const res = await api.get(`/tasks/${id}/comments`);

      setComments(res.data.comments || []);
    } catch (error) {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
    fetchComments();
  }, [id]);

  const showMessage = (type, text) => {
    setMessageType(type);
    setMessage(text);
  };

  const updateProgress = async () => {
    if (progress < 0 || progress > 100) {
      showMessage("error", "Progress must be between 0 and 100.");
      return;
    }

    try {
      setActionLoading(true);

      await api.patch(`/tasks/${id}/progress`, {
        progress: Number(progress),
      });

      showMessage("success", "Progress updated successfully.");
      fetchTask();
    } catch (error) {
      showMessage(
        "error",
        error.response?.data?.message || "Failed to update progress."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const submitTask = async () => {
    try {
      setActionLoading(true);

      await api.post(`/tasks/${id}/submit`);

      showMessage("success", "Task submitted for review.");
      fetchTask();
    } catch (error) {
      showMessage(
        "error",
        error.response?.data?.message || "Failed to submit task."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const approveTask = async () => {
    try {
      setActionLoading(true);

      await api.post(`/tasks/${id}/approve`);

      showMessage("success", "Task approved.");
      fetchTask();
    } catch (error) {
      showMessage(
        "error",
        error.response?.data?.message || "Failed to approve task."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const rejectTask = async () => {
    try {
      setActionLoading(true);

      await api.post(`/tasks/${id}/reject`);

      showMessage("success", "Task rejected.");
      fetchTask();
    } catch (error) {
      showMessage(
        "error",
        error.response?.data?.message || "Failed to reject task."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const uploadFile = async () => {
    if (!file) {
      showMessage("error", "Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setActionLoading(true);

      await api.post(`/tasks/${id}/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      showMessage("success", "File uploaded successfully.");
      setFile(null);
      fetchTask();
    } catch (error) {
      showMessage(
        "error",
        error.response?.data?.message || "Failed to upload file."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const addComment = async (e) => {
    e.preventDefault();

    if (!commentText.trim()) {
      showMessage("error", "Comment cannot be empty.");
      return;
    }

    try {
      setActionLoading(true);

      await api.post(`/tasks/${id}/comments`, {
        message: commentText.trim(),
      });

      setCommentText("");
      fetchComments();
      showMessage("success", "Comment added successfully.");
    } catch (error) {
      showMessage(
        "error",
        error.response?.data?.message || "Failed to add comment."
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="task-details-page">
      {message && (
        <div
          className={
            messageType === "error"
              ? "task-details-message error"
              : "task-details-message"
          }
        >
          {message}
        </div>
      )}

      {loading && (
        <div className="task-details-state">Loading task details...</div>
      )}

      {error && <div className="task-details-error">{error}</div>}

      {!loading && !error && task && (
        <>
          <div className="task-details-grid">
            <div className="task-main-card">
              <div className="task-details-header">
                <div>
                  <h2>{task.title}</h2>
                  <p>{task.description}</p>
                </div>

                <span className={`details-status ${task.status.toLowerCase()}`}>
                  {task.status}
                </span>
              </div>

              <div className="task-info-grid">
                <div>
                  <strong>Priority</strong>
                  <p>{task.priority}</p>
                </div>

                <div>
                  <strong>Due Date</strong>
                  <p>
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString()
                      : "No due date"}
                  </p>
                </div>

                <div>
                  <strong>Assigned By</strong>
                  <p>{task.assignedBy?.name || "Unknown"}</p>
                </div>

                <div>
                  <strong>Assigned To</strong>
                  <p>
                    {task.assignedTo?.length
                      ? task.assignedTo.map((u) => u.name).join(", ")
                      : "—"}
                  </p>
                </div>
              </div>

              {(isAssignedUser || isAdminOrSupervisor) && (
                <div className="progress-section">
                  <h3>Progress</h3>

                  <div className="progress-control">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={progress}
                      onChange={(e) => setProgress(e.target.value)}
                    />

                    <button onClick={updateProgress} disabled={actionLoading}>
                      {actionLoading ? "Updating..." : "Update Progress"}
                    </button>
                  </div>

                  <div className="details-progress-bar">
                    <div
                      className="details-progress-fill"
                      style={{ width: `${task.progress || 0}%` }}
                    ></div>
                  </div>

                  <p>{task.progress || 0}% completed</p>
                </div>
              )}

              <div className="workflow-actions">
                {isAssignedUser && (
                  <button
                    onClick={submitTask}
                    className="submit-btn"
                    disabled={actionLoading}
                  >
                    Submit Task
                  </button>
                )}

                {isAdminOrSupervisor && (
                  <>
                    <Link to={`/tasks/${id}/edit`} className="edit-task-link">
                      Edit Task
                    </Link>

                    <button
                      onClick={approveTask}
                      className="approve-btn"
                      disabled={actionLoading}
                    >
                      Approve
                    </button>

                    <button
                      onClick={rejectTask}
                      className="reject-btn"
                      disabled={actionLoading}
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="task-side-card">
              <h3>Attachments</h3>

              <div className="upload-box">
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                />

                <button onClick={uploadFile} disabled={actionLoading}>
                  {actionLoading ? "Uploading..." : "Upload File"}
                </button>
              </div>

              <div className="attachments-list">
  {!task.attachments || task.attachments.length === 0 ? (
    <p>No files uploaded.</p>
  ) : (
    task.attachments.map((attachment) => (
      <a
        key={attachment._id}
        href={`${uploadBaseUrl}/uploads/${attachment.filePath
          .split(/[\\/]/)
          .pop()}`}
        target="_blank"
        rel="noreferrer"
        className="attachment-link"
      >
        {attachment.fileName}
      </a>
    ))
  )}
</div>
            </div>
          </div>

          <div className="comments-card">
            <h3>Comments</h3>

            <form onSubmit={addComment} className="comment-form">
              <input
                type="text"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />

              <button type="submit" disabled={actionLoading}>
                Add Comment
              </button>
            </form>

            {commentsLoading ? (
              <div className="task-details-state">Loading comments...</div>
            ) : comments.length === 0 ? (
              <div className="task-details-state">No comments yet.</div>
            ) : (
              <div className="comments-list">
                {comments.map((comment) => (
                  <div className="comment-item" key={comment._id}>
                    <div className="comment-avatar">
                      {comment.user?.name?.charAt(0) || "U"}
                    </div>

                    <div>
                      <strong>{comment.user?.name || "Unknown User"}</strong>
                      <p>{comment.message}</p>
                      <small>
                        {comment.createdAt
                          ? new Date(comment.createdAt).toLocaleString()
                          : ""}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TaskDetails;