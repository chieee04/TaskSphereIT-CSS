// src/components/Member/SoloModeTasksRecord.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import {
  FaTasks,
  FaCalendarAlt,
  FaClock,
  FaChevronDown,
  FaTrash,
  FaFilter,
  FaSearch,
} from "react-icons/fa";
import "../Style/ProjectManager/ManagerTitleRecord.css";

const SoloModeTasksRecord = () => {
  const [tasks, setTasks] = useState([]);

  const STATUS_OPTIONS = ["To Do", "In Progress", "To Review", "Completed", "Missed"];
  const REVISION_OPTIONS = Array.from({ length: 10 }, (_, i) => {
    const num = i + 1;
    if (num === 1) return "1st Revision";
    if (num === 2) return "2nd Revision";
    if (num === 3) return "3rd Revision";
    return `${num}th Revision`;
  });

  const getStatusColor = (value) => {
    switch (value) {
      case "To Do":
        return "#FABC3F";
      case "In Progress":
        return "#809D3C";
      case "To Review":
        return "#578FCA";
      case "Completed":
        return "#AA60C8";
      case "Missed":
        return "#D60606";
      default:
        return "#ccc";
    }
  };

  useEffect(() => {
    const fetchTasks = async () => {
      const storedUser = localStorage.getItem("customUser");
      if (!storedUser) {
        console.warn("⚠️ No logged-in user found in localStorage");
        return;
      }

      const currentUser = JSON.parse(storedUser);

      const { data, error } = await supabase
        .from("solo_mode_task")
        .select(`
          id,
          task,
          subtask,
          due_date,
          time,
          created_at,
          date_completed,
          methodology,
          project_phase,
          revision,
          status
        `)
        .eq("user_id", currentUser.id)
        .eq("status", "Completed"); // ✅ only completed tasks

      if (error) {
        console.error("❌ Error fetching solo mode tasks:", error);
      } else {
        setTasks(data);
      }
    };

    fetchTasks();
  }, []);

  const handleStatusChange = async (taskId, newStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    console.log(`Status changed for task ${taskId} to ${newStatus}`);
  };

  const handleRevisionChange = async (taskId, revisionInt) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, revision: revisionInt } : t))
    );
    console.log(`Revision changed for task ${taskId} to ${revisionInt}`);
  };

  return (
    <div className="page-wrapper">
      <h2 className="section-title">
        <FaTasks className="me-2" size={18} />
        Solo Mode Task Records
      </h2>
      <hr className="divider" />

      <div className="header-controls">
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input type="text" placeholder="Search task" />
        </div>
        <div className="action-buttons">
          <button className="delete-button">
            <FaTrash />
            Delete
          </button>
          <button className="filter">
            <FaFilter />
            Filter: Completed
          </button>
        </div>
      </div>

      <div className="tasks-container">
        <table className="tasks-table">
          <thead>
            <tr>
              <th className="center-text">NO</th>
              <th className="center-text">Tasks</th>
              <th className="center-text">Subtask</th>
              <th className="center-text">Date Created</th>
              <th className="center-text">Due Date</th>
              <th className="center-text">Time</th>
              <th className="center-text">Date Completed</th>
              <th className="center-text">Revision No.</th>
              <th className="center-text">Status</th>
              <th className="center-text">Methodology</th>
              <th className="center-text">Project Phase</th>
              <th className="center-text">Action</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan="12" className="center-text">
                  No completed tasks yet.
                </td>
              </tr>
            ) : (
              tasks.map((task, idx) => (
                <tr key={task.id}>
                  <td className="center-text">{idx + 1}.</td>
                  <td className="center-text">{task.task}</td>
                  <td className="center-text">{task.subtask || "-"}</td>
                  <td className="center-text">{task.created_at}</td>
                  <td className="center-text">
                    <div className="center-content-flex">
                      <FaCalendarAlt size={14} style={{ color: "#3B0304" }} />
                      {task.due_date}
                    </div>
                  </td>
                  <td className="center-text">
                    <div className="center-content-flex">
                      <FaClock size={14} style={{ color: "#3B0304" }} />
                      {task.time}
                    </div>
                  </td>
                  <td className="center-text">{task.date_completed || "-"}</td>
                  <td className="center-text">
                    <div className="dropdown-control-wrapper">
                      <select
                        value={task.revision || 1}
                        onChange={(e) =>
                          handleRevisionChange(task.id, parseInt(e.target.value))
                        }
                        className="revision-select"
                      >
                        {REVISION_OPTIONS.map((opt, i) => (
                          <option key={i + 1} value={i + 1}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      <FaChevronDown
                        className="dropdown-icon-chevron"
                        style={{ color: "#3B0304" }}
                      />
                    </div>
                  </td>
                  <td className="center-text">
                    <div
                      className="dropdown-control-wrapper"
                      style={{
                        backgroundColor: getStatusColor(task.status),
                        borderRadius: "4px",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                      }}
                    >
                      <select
                        value={task.status}
                        onChange={(e) =>
                          handleStatusChange(task.id, e.target.value)
                        }
                        className="status-select"
                        style={{ backgroundColor: getStatusColor(task.status) }}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <FaChevronDown
                        className="dropdown-icon-chevron"
                        style={{ color: "white" }}
                      />
                    </div>
                  </td>
                  <td className="center-text">{task.methodology}</td>
                  <td className="center-text">{task.project_phase}</td>
                  <td className="center-text">
                    <FaTrash className="delete-icon" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SoloModeTasksRecord;
