// src/components/caps tasks/caps-tasks.jsx/AdviserOralDef.jsx
import React, { useState, useEffect } from "react";
import taskIcon from "../../../assets/tasks-icon.png";
import createTasksIcon from "../../../assets/create-tasks-icon.png";
import searchIcon from "../../../assets/search-icon.png";
import "../../Style/Adviser/Task/AdviserOralDef.css";

// Import logic functions
import { fetchTasksFromDB, handleCreateTask, handleUpdateStatus } from "../../../services/Adviser/AdCapsTask";


const AdviserOralDef = () => {
  const [tasks, setTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ fetch tasks
  useEffect(() => {
    fetchTasksFromDB(setTasks);
  }, []);

  // ✅ filtered tasks
  const filteredTasks = (tasks || [])
    .filter((t) => t.group_name && t.group_name.trim() !== "")
    .filter((t) =>
      (t.task_type || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="page-wrapper container">
      <h2 className="section-title d-flex align-items-center gap-2">
        <img src={taskIcon} alt="Tasks Icon" className="icon-image" />
        Oral Defense Tasks
      </h2>
      <hr className="divider" />

      <div className="header-wrapper d-flex flex-wrap gap-3 align-items-start">
        <button
          type="button"
          className="create-task-button"
          onClick={() => handleCreateTask(setTasks)}
        >
          <img
            src={createTasksIcon}
            alt="Create Task Icon"
            className="create-task-icon"
          />
          Create Task
        </button>

        <div className="search-wrapper d-flex align-items-center">
          <img src={searchIcon} alt="Search Icon" className="search-icon" />
          <input
            type="text"
            placeholder="Search task..."
            className="form-control"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="tasks-container mt-4">
        <table className="tasks-table table table-bordered">
          <thead>
            <tr>
              <th>NO</th>
              <th>Team</th>
              <th>Methodology</th>
              <th>Project Phase</th>
              <th>Task</th>
              <th>Task Type</th>
              <th>Subtask</th>
              <th>Elements</th>
              <th>Status</th>
              <th>Date Created</th>
              <th>Due Date</th>
              <th>Time</th>
              <th>Comment</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((t, index) => (
              <tr key={t.id}>
                <td>{index + 1}</td>
                <td>{t.group_name}</td>
                <td>{t.methodology}</td>
                <td>{t.project_phase}</td>
                <td>{t.task}</td>
                <td>{t.task_type}</td>
                <td>{t.subtask}</td>
                <td>{t.elements}</td>
                <td>
 <select
  value={t.status || "To Do"}
  onChange={(e) => handleUpdateStatus(t.id, e.target.value, setTasks)}
  className="form-select">
  <option value="To Do">To Do</option>
  <option value="In Progress">In Progress</option>
  <option value="To Review">To Review</option>
  <option value="Completed">Completed</option>
</select>
</td>
                <td>
                  {t.date_created
                    ? new Date(t.date_created).toLocaleDateString("en-US")
                    : ""}
                </td>
                <td>
                  {t.due_date
                    ? new Date(t.due_date).toLocaleDateString("en-US")
                    : ""}
                </td>
                <td>{t.time || ""}</td>
                <td>{t.comment}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdviserOralDef;
