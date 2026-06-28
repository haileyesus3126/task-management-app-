import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import api from "../api/axios";
import StatCard from "../components/StatCard";

import "../styles/dashboard.css";

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    progress: 0,
    approved: 0,
    rejected: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/tasks?limit=100");
      const taskList = res.data.tasks || [];

      setTasks(taskList);

      setStats({
        total: taskList.length,
        pending: taskList.filter((task) => task.status === "PENDING").length,
        progress: taskList.filter(
          (task) =>
            task.status === "IN_PROGRESS" || task.status === "SUBMITTED"
        ).length,
        approved: taskList.filter(
          (task) => task.status === "APPROVED" || task.status === "COMPLETED"
        ).length,
        rejected: taskList.filter((task) => task.status === "REJECTED").length,
      });
    } catch (error) {
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const statusChartData = [
    { name: "Pending", value: stats.pending, color: "#f59e0b" },
    { name: "In Progress", value: stats.progress, color: "#6b3fa0" },
    { name: "Approved", value: stats.approved, color: "#16a34a" },
    { name: "Rejected", value: stats.rejected, color: "#dc2626" },
  ];

  const priorityChartData = [
    {
      name: "Low",
      tasks: tasks.filter((task) => task.priority === "LOW").length,
    },
    {
      name: "Medium",
      tasks: tasks.filter((task) => task.priority === "MEDIUM").length,
    },
    {
      name: "High",
      tasks: tasks.filter((task) => task.priority === "HIGH").length,
    },
    {
      name: "Urgent",
      tasks: tasks.filter((task) => task.priority === "URGENT").length,
    },
  ];

  return (
    <div>
      <h2>Dashboard Overview</h2>

      {loading && <div className="page-state">Loading dashboard...</div>}

      {error && <div className="page-error">{error}</div>}

      {!loading && !error && (
        <>
          <div className="stats-grid">
            <StatCard title="Total Tasks" value={stats.total} color="#6b3fa0" />

            <StatCard
              title="Pending Tasks"
              value={stats.pending}
              color="#f59e0b"
            />

            <StatCard
              title="In Progress"
              value={stats.progress}
              color="#8b5cc7"
            />

            <StatCard
              title="Approved Tasks"
              value={stats.approved}
              color="#16a34a"
            />

            <StatCard
              title="Rejected Tasks"
              value={stats.rejected}
              color="#dc2626"
            />
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <h3>Tasks by Status</h3>

              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={95}
                    label
                  >
                    {statusChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>

                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3>Tasks by Priority</h3>

              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={priorityChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="tasks" fill="#6b3fa0" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="dashboard-section">
            <h2>Recent Tasks</h2>

            <div className="recent-tasks">
              {tasks.length === 0 ? (
                <div className="page-state">No recent tasks found.</div>
              ) : (
                tasks.slice(0, 5).map((task) => (
                  <div className="recent-task" key={task._id}>
                    <div>
                      <h4>{task.title}</h4>

                      <p>
                        Priority: {task.priority} • Due:{" "}
                        {task.dueDate
                          ? new Date(task.dueDate).toLocaleDateString()
                          : "No due date"}
                      </p>
                    </div>

                    <div
                      className={`task-status ${
                        task.status === "PENDING"
                          ? "status-pending"
                          : task.status === "REJECTED"
                          ? "status-rejected"
                          : task.status === "APPROVED" ||
                            task.status === "COMPLETED"
                          ? "status-approved"
                          : "status-progress"
                      }`}
                    >
                      {task.status}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;