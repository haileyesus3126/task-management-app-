import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../api/axios";

import "../styles/create-task.css";

const EditTask = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    status: "PENDING",
    dueDate: "",
  });

  const fetchTask = async () => {
    try {
      setLoading(true);
      setMessage("");

      const res = await api.get("/tasks?limit=100");
      const taskList = res.data.tasks || [];

      const task = taskList.find((item) => item._id === id);

      if (!task) {
        setMessageType("error");
        setMessage("Task not found or you do not have permission.");
        return;
      }

      setFormData({
        title: task.title || "",
        description: task.description || "",
        priority: task.priority || "MEDIUM",
        status: task.status || "PENDING",
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
      });
    } catch (error) {
      setMessageType("error");
      setMessage("Failed to load task.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [id]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setMessageType("error");
      setMessage("Task title is required.");
      return;
    }

    if (!formData.description.trim()) {
      setMessageType("error");
      setMessage("Task description is required.");
      return;
    }

    if (!formData.dueDate) {
      setMessageType("error");
      setMessage("Due date is required.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      await api.put(`/tasks/${id}`, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        status: formData.status,
        dueDate: formData.dueDate,
      });

      setMessageType("success");
      setMessage("Task updated successfully.");

      setTimeout(() => {
        navigate(`/tasks/${id}`);
      }, 700);
    } catch (error) {
      setMessageType("error");
      setMessage(error.response?.data?.message || "Failed to update task.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="create-task-page">
      <div className="create-task-card">
        <h2>Edit Task</h2>

        {message && (
          <div
            className={
              messageType === "error" ? "task-message error" : "task-message"
            }
          >
            {message}
          </div>
        )}

        {loading ? (
          <div className="task-message">Loading task...</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Task Title</label>

              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter task title"
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>

              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Task description"
                rows={5}
                required
              ></textarea>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Priority</label>

                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div className="form-group">
                <label>Status</label>

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Due Date</label>

              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="create-task-btn" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditTask;