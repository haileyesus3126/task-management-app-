import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Bell,
  LogOut,
  PlusSquare,
  UserCircle,
  LockKeyhole,
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/hallmark-logo.png";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState(0);

  const canManageTasks =
    user?.role === "ADMIN" || user?.role === "SUPERVISOR";

  const fetchUnreadNotifications = async () => {
    try {
      const res = await api.get("/notifications");

      const notifications = res.data.notifications || [];

      const count = notifications.filter(
        (notification) => !notification.isRead
      ).length;

      setUnreadCount(count);
    } catch (error) {
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    fetchUnreadNotifications();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar-logo">
          <img src={logo} alt="Hallmark Logo" />
          <span>BHTMS</span>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className="sidebar-link">
            <LayoutDashboard size={20} />
            Dashboard
          </NavLink>

          <NavLink to="/tasks" className="sidebar-link">
            <ClipboardList size={20} />
            Tasks
          </NavLink>

          {canManageTasks && (
            <NavLink to="/tasks/create" className="sidebar-link">
              <PlusSquare size={20} />
              Create Task
            </NavLink>
          )}

          {user?.role === "ADMIN" && (
            <NavLink to="/users" className="sidebar-link">
              <Users size={20} />
              Users
            </NavLink>
          )}

          <NavLink to="/notifications" className="sidebar-link notification-link">
            <Bell size={20} />
            Notifications

            {unreadCount > 0 && (
              <span className="notification-count">{unreadCount}</span>
            )}
          </NavLink>

          <NavLink to="/change-password" className="sidebar-link">
            <LockKeyhole size={20} />
            Change Password
          </NavLink>

          <NavLink to="/profile" className="sidebar-link">
            <UserCircle size={20} />
            Profile
          </NavLink>
        </nav>
      </div>

      <button className="logout-btn" onClick={handleLogout}>
        <LogOut size={18} />
        Logout
      </button>
    </aside>
  );
};

export default Sidebar;