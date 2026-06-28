import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../api/axios";

import "../styles/create-task.css";

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const [formData, setFormData] = useState({
    name: "",
    role: "USER",
    department: "",
    position: "",
    isActive: true,
  });

  const fetchUser = async () => {
    try {
      setLoading(true);
      setMessage("");

      const res = await api.get("/users");
      const users = res.data.users || [];

      const foundUser = users.find(
        (user) => user._id === id || user.id === id
      );

      if (!foundUser) {
        setMessageType("error");
        setMessage("User not found.");
        return;
      }

      setFormData({
        name: foundUser.name || "",
        role: foundUser.role || "USER",
        department: foundUser.department || "",
        position: foundUser.position || "",
        isActive: Boolean(foundUser.isActive),
      });
    } catch (error) {
      setMessageType("error");
      setMessage("Failed to load user.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });

    setMessage("");
  };

  const handleStatusChange = (e) => {
    setFormData({
      ...formData,
      isActive: e.target.value === "true",
    });

    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setMessageType("error");
      setMessage("Full name is required.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      await api.put(`/users/${id}`, {
        name: formData.name.trim(),
        role: formData.role,
        department: formData.department.trim(),
        position: formData.position.trim(),
        isActive: formData.isActive,
      });

      setMessageType("success");
      setMessage("User updated successfully.");

      setTimeout(() => {
        navigate("/users");
      }, 700);
    } catch (error) {
      setMessageType("error");
      setMessage(error.response?.data?.message || "Failed to update user.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="create-task-page">
      <div className="create-task-card">
        <h2>Edit User</h2>

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
          <div className="task-message">Loading user...</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Full name"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Role</label>

                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="USER">User</option>
                  <option value="SUPERVISOR">Supervisor</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="form-group">
                <label>Status</label>

                <select
                  name="isActive"
                  value={formData.isActive ? "true" : "false"}
                  onChange={handleStatusChange}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Department</label>

              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="Operations"
              />
            </div>

            <div className="form-group">
              <label>Position</label>

              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                placeholder="Staff"
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

export default EditUser;