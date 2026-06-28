import { useEffect, useState } from "react";

import api from "../api/axios";

import "../styles/create-task.css";

const CreateTask = () => {
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    assignedTo: "",
    dueDate: "",
  });

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);

      const res = await api.get("/users");

      const userList = res.data.users || [];

      setUsers(userList.filter((user) => user.isActive));
    } catch (error) {
      setMessageType("error");
      setMessage("Failed to load users. Please try again.");
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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

    if (!formData.assignedTo) {
      setMessageType("error");
      setMessage("Please select a user to assign the task.");
      return;
    }

    if (!formData.dueDate) {
      setMessageType("error");
      setMessage("Due date is required.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      await api.post("/tasks", {
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        assignedTo: [formData.assignedTo],
        dueDate: formData.dueDate,
      });

      setMessageType("success");
      setMessage("Task created successfully.");

      setFormData({
        title: "",
        description: "",
        priority: "MEDIUM",
        assignedTo: "",
        dueDate: "",
      });
    } catch (error) {
      setMessageType("error");
      setMessage(error.response?.data?.message || "Failed to create task.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-task-page">
      <div className="create-task-card">
        <h2>Create New Task</h2>

        {message && (
          <div
            className={
              messageType === "error" ? "task-message error" : "task-message"
            }
          >
            {message}
          </div>
        )}

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
              <label>Assign User</label>

              <select
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleChange}
                required
                disabled={usersLoading}
              >
                <option value="">
                  {usersLoading ? "Loading users..." : "Select user"}
                </option>

                {users.map((user) => (
                  <option key={user.id || user._id} value={user.id || user._id}>
                    {user.name} ({user.role})
                  </option>
                ))}
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

          <button type="submit" className="create-task-btn" disabled={loading}>
            {loading ? "Creating..." : "Create Task"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateTask;