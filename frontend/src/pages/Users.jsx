import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../api/axios";

import "../styles/users.css";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "123456",
    role: "USER",
    department: "",
    position: "",
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setMessage("");

      const res = await api.get("/users");

      setUsers(res.data.users || []);
    } catch (error) {
      setMessageType("error");
      setMessage("Failed to load users. Please try again.");
    } finally {
      setLoading(false);
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

  const handleCreateUser = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setMessageType("error");
      setMessage("Name is required.");
      return;
    }

    if (!formData.email.trim()) {
      setMessageType("error");
      setMessage("Email is required.");
      return;
    }

    if (!formData.password.trim() || formData.password.length < 6) {
      setMessageType("error");
      setMessage("Password must be at least 6 characters.");
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");

      await api.post("/users", {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
        department: formData.department.trim(),
        position: formData.position.trim(),
      });

      setMessageType("success");
      setMessage("User created successfully.");

      setFormData({
        name: "",
        email: "",
        password: "123456",
        role: "USER",
        department: "",
        position: "",
      });

      fetchUsers();
    } catch (error) {
      setMessageType("error");
      setMessage(error.response?.data?.message || "Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivateUser = async (id) => {
    const confirmAction = window.confirm(
      "Are you sure you want to deactivate this user?"
    );

    if (!confirmAction) return;

    try {
      setMessage("");

      await api.patch(`/users/${id}/deactivate`);

      setMessageType("success");
      setMessage("User deactivated successfully.");

      fetchUsers();
    } catch (error) {
      setMessageType("error");
      setMessage(error.response?.data?.message || "Failed to deactivate user.");
    }
  };

  return (
    <div className="users-page">
      <div className="users-header">
        <h2>User Management</h2>
        <p>Create and manage Hallmark team users.</p>
      </div>

      {message && (
        <div
          className={
            messageType === "error" ? "users-message error" : "users-message"
          }
        >
          {message}
        </div>
      )}

      <div className="users-grid">
        <div className="user-form-card">
          <h3>Create New User</h3>

          <form onSubmit={handleCreateUser}>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                placeholder="Full name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="text"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label>Role</label>
              <select name="role" value={formData.role} onChange={handleChange}>
                <option value="USER">User</option>
                <option value="SUPERVISOR">Supervisor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div className="form-group">
              <label>Department</label>
              <input
                type="text"
                name="department"
                placeholder="Operations"
                value={formData.department}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Position</label>
              <input
                type="text"
                name="position"
                placeholder="Staff"
                value={formData.position}
                onChange={handleChange}
              />
            </div>

            <button className="create-user-btn" type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create User"}
            </button>
          </form>
        </div>

        <div className="users-list-card">
          <h3>All Users</h3>

          {loading && <div className="users-state">Loading users...</div>}

          {!loading && users.length === 0 && (
            <div className="users-state">No users found.</div>
          )}

          {!loading && users.length > 0 && (
            <div className="users-table">
              <div className="users-table-head">
                <span>Name</span>
                <span>Role</span>
                <span>Department</span>
                <span>Status</span>
                <span>Action</span>
              </div>

              {users.map((user) => (
                <div className="users-row" key={user._id || user.id}>
                  <div>
                    <strong>{user.name}</strong>
                    <p>{user.email}</p>
                  </div>

                  <span className={`role-badge ${user.role.toLowerCase()}`}>
                    {user.role}
                  </span>

                  <span>{user.department || "—"}</span>

                  <span
                    className={user.isActive ? "active-status" : "inactive-status"}
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </span>

                  <div className="user-actions">
                    <Link
                      to={`/users/${user._id || user.id}/edit`}
                      className="edit-user-link"
                    >
                      Edit
                    </Link>

                    <button
                      className="deactivate-btn"
                      onClick={() => handleDeactivateUser(user._id || user.id)}
                      disabled={!user.isActive}
                    >
                      Deactivate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Users;