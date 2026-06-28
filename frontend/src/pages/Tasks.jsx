import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../api/axios";

import "../styles/tasks.css";

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    priority: "",
  });

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError("");

      const query = new URLSearchParams();

      query.append("page", page);
      query.append("limit", 5);

      if (filters.search) query.append("search", filters.search);
      if (filters.status) query.append("status", filters.status);
      if (filters.priority) query.append("priority", filters.priority);

      const res = await api.get(`/tasks?${query.toString()}`);

      setTasks(res.data.tasks || []);
      setPagination(res.data.pagination || {});
    } catch (error) {
      setError("Failed to load tasks. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [page, filters]);

  const handleFilterChange = (name, value) => {
    setPage(1);
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  return (
    <div className="tasks-page">
      <div className="tasks-header">
        <h2>Tasks Management</h2>

        <div className="tasks-filters">
          <input
            type="text"
            placeholder="Search tasks..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
          />

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange("priority", e.target.value)}
          >
            <option value="">All Priority</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      {loading && <div className="tasks-state">Loading tasks...</div>}

      {error && <div className="tasks-error">{error}</div>}

      {!loading && !error && (
        <>
          <div className="tasks-table">
            <div className="tasks-table-head">
              <span>Title</span>
              <span>Status</span>
              <span>Priority</span>
              <span>Progress</span>
              <span>Due Date</span>
            </div>

            {tasks.length === 0 && (
              <div className="empty-tasks">No tasks found.</div>
            )}

            {tasks.map((task) => (
              <div className="tasks-row" key={task._id}>
                <div>
                  <Link to={`/tasks/${task._id}`} className="task-title-link">
                    <strong>{task.title}</strong>
                  </Link>

                  <p>{task.description}</p>
                </div>

                <span className={`badge ${task.status.toLowerCase()}`}>
                  {task.status}
                </span>

                <span className={`badge ${task.priority.toLowerCase()}`}>
                  {task.priority}
                </span>

                <div className="progress-wrapper">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${task.progress || 0}%` }}
                    ></div>
                  </div>

                  <small>{task.progress || 0}%</small>
                </div>

                <span>
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString()
                    : "No due date"}
                </span>
              </div>
            ))}
          </div>

          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}>
              Previous
            </button>

            <span>
              Page {pagination.currentPage || 1} of {pagination.totalPages || 1}
            </span>

            <button
              disabled={!pagination.totalPages || page >= pagination.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Tasks;