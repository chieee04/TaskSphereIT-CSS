import React, { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";
import { FaTasks, FaCalendarAlt, FaClock, FaChevronDown, FaTrash, FaFilter, FaSearch } from 'react-icons/fa';
import "../../Style/ProjectManager/ManagerTitleRecord.css";
 
const ManagerTitleRecord = () => {
  const [tasks, setTasks] = useState([]);
 
  // Dummy data to match the design
  const dummyTasks = [
    {
      id: 1,
      task_name: "Brainstorming",
      due_date: "2025-08-15",
      due_time: "12:23",
      created_date: "2025-08-28",
      date_completed: "2025-08-29",
      methodology: "Prototyping",
      project_phase: "Requirements and Gathering Analysis",
      revision: 1,
      status: "To Do",
      member: { first_name: "Iamz", last_name: "Dela Cruz" }
    },
    {
      id: 2,
      task_name: "Interview Client",
      due_date: "2025-09-30",
      due_time: "20:30",
      created_date: "2025-09-26",
      date_completed: "2025-09-28",
      methodology: "Agile",
      project_phase: "Planning",
      revision: 1,
      status: "In Progress",
      member: { first_name: "Juan", last_name: "Dela Cruz" }
    },
    {
      id: 3,
      task_name: "Data Gathering, Internet Research",
      due_date: "2025-09-27",
      due_time: "20:29",
      created_date: "2025-09-26",
      date_completed: "2025-09-28",
      methodology: "Agile",
      project_phase: "Planning",
      revision: 1,
      status: "Missed",
      member: { first_name: "Juan", last_name: "Dela Cruz" }
    }
  ];
 
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
    const { data, error } = await supabase
      .from("manager_title_task")
      .select(`
        id,
        task_name,
        due_date,
        due_time,
        created_date,
        date_completed,
        methodology,
        project_phase,
        revision,
        status,
        member:member_id(first_name, last_name)
      `)
      .eq("status", "Completed"); // fetch only completed

    if (error) {
      console.error("Error fetching tasks:", error);
    } else {
      setTasks(data);
    }
  };

  fetchTasks();
}, []);

 
  const handleStatusChange = async (taskId, newStatus) => {
    setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, status: newStatus } : t)));
    console.log(`Status changed for task ${taskId} to ${newStatus}`);
  };
 
  const handleRevisionChange = async (taskId, revisionInt) => {
    setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, revision: revisionInt } : t)));
    console.log(`Revision changed for task ${taskId} to ${revisionInt}`);
  };
 
  return (
    <div className="page-wrapper">
      <style>{`
        /* --- General Styles --- */
        .page-wrapper {
          padding: 2rem;
          background-color: #f7f7f7;
          min-height: 100vh;
        }
 
        .section-title {
          font-weight: 600;
          color: #3B0304;
          display: flex;
          align-items: center;
          margin-bottom: 0.5rem;
          font-size: 1.5rem;
        }
 
        .divider {
          height: 1.5px;
          background-color: #3B0304;
          width: 100%;
          border-radius: 50px;
          margin-bottom: 1.5rem;
          border: none;
        }
 
        /* --- New Header Section --- */
        .header-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 0;
          margin-bottom: 1rem;
        }
 
        .search-bar {
          position: relative;
          display: flex;
          align-items: center;
        }
 
        .search-bar input {
          padding: 8px 12px 8px 35px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 1rem;
          min-width: 250px;
          background-color: transparent;
          box-shadow: none;
        }
 
        .search-bar input:focus {
          outline: none;
        }
 
        .search-bar .search-icon {
          position: absolute;
          left: 12px;
          color: #888;
        }
 
        .action-buttons {
          display: flex;
          gap: 0.5rem; 
        }
 
        .action-buttons button {
          display: flex;
          align-items: center;
          gap: 6px; 
          padding: 6px 12px; 
          border: 1px solid #D60606;
          background-color: white;
          color: #D60606;
          font-weight: 600;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          font-size: 0.875rem; 
        }
 
        .action-buttons button:hover {
          background-color: #D60606;
          color: white;
        }
 
        .action-buttons button.filter {
          border-color: #3B0304;
          color: #3B0304;
        }
 
        .action-buttons button.filter:hover {
          background-color: #3B0304;
          color: white;
        }
 
        /* --- Table Styles --- */
        .tasks-container {
          background-color: white;
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow-x: auto;
        }
 
        .tasks-table {
          width: 100%;
          min-width: 1000px; /* Optional: Sets a minimum width before scrollbar appears */
          border-collapse: collapse;
        }
 
        .tasks-table th, .tasks-table td {
          padding: 12px 8px;
          vertical-align: middle;
          border-bottom: 1px solid #e2e8f0;
          word-wrap: break-word; /* Allows long words to break */
          overflow-wrap: break-word; /* Alternative for word wrapping */
        }
 
        .tasks-table th {
          background-color: #f8f9fa;
          font-weight: 600;
          color: #3B0304;
          text-transform: uppercase;
          font-size: 0.75rem;
        }
 
        .tasks-table tbody tr:hover {
          background-color: #f8f9fa;
        }
 
        .center-text {
          text-align: center;
        }
 
        /* --- Icons and Dropdown Styling --- */
        .inline-icon {
          width: 16px;
          height: 16px;
          margin-right: 4px;
          vertical-align: middle;
        }
 
        .dropdown-control-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
          vertical-align: middle;
        }
 
        .dropdown-icon-chevron { 
          position: absolute;
          right: 6px;
          pointer-events: none; 
          font-size: 0.75rem;
          z-index: 2;
        }
 
        /* Status Dropdown */
        .status-select {
          min-width: 90px;
          padding: 4px 20px 4px 6px !important; 
          border-radius: 4px;
          font-weight: 500;
          color: white;
          border: none;
          appearance: none; 
          cursor: pointer;
          font-size: 0.85rem;
          text-align: center;
        }
 
        .status-select option {
          color: black !important;
          background-color: white !important;
        }
 
        /* Revision Dropdown */
        .revision-select {
          border: 1px solid #ccc !important;
          background-color: white !important;
          color: #3B0304 !important;
          border-radius: 4px !important;
          padding: 4px 20px 4px 6px !important; 
          font-size: 0.85rem !important;
          appearance: none !important; 
          cursor: pointer;
        }
 
        /* Action Icon */
        .delete-icon {
          color: #D60606;
          cursor: pointer;
          transition: color 0.2s;
        }
        .delete-icon:hover {
          color: #b70505;
        }
 
        /* Center content with icons */
        .center-content-flex {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          height: 100%;
        }
      `}</style>
 
      <h2 className="section-title">
        <FaTasks className="me-2" size={18} />
        Title Defense Records
      </h2>
      <hr className="divider" />
 
      <div className="header-controls">
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input type="text" placeholder="Search member" />
        </div>
        <div className="action-buttons">
          <button className="delete-button">
            <FaTrash />
            Delete
          </button>
          <button className="filter">
            <FaFilter />
            Filter: All
          </button>
        </div>
      </div>
 
      <div className="tasks-container">
        <table className="tasks-table">
          <thead>
            <tr>
              <th className="center-text">NO</th>
              <th className="center-text">Assigned</th>
              <th className="center-text">Tasks</th>
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
  {tasks.filter(task => task.status === "Completed").length === 0 ? (
    <tr>
      <td colSpan="12" className="center-text">
        No completed tasks yet.
      </td>
    </tr>
  ) : (
    tasks
      .filter(task => task.status === "Completed")
      .map((task, idx) => (
        <tr key={task.id}>
          <td className="center-text">{idx + 1}.</td>
          <td className="center-text">
            {task.member?.first_name} {task.member?.last_name}
          </td>
          <td className="center-text">{task.task_name}</td>
          <td className="center-text">{task.created_date}</td>
          <td className="center-text">
            <div className="center-content-flex">
              <FaCalendarAlt size={14} style={{ color: '#3B0304' }} />
              {task.due_date}
            </div>
          </td>
          <td className="center-text">
            <div className="center-content-flex">
              <FaClock size={14} style={{ color: '#3B0304' }} />
              {task.due_time}
            </div>
          </td>
          <td className="center-text">
            {task.date_completed || "-"}
          </td>
          <td className="center-text">
            <div className="dropdown-control-wrapper">
              <select
                value={task.revision}
                onChange={(e) => handleRevisionChange(task.id, parseInt(e.target.value))}
                className="revision-select"
              >
                {REVISION_OPTIONS.map((opt, i) => (
                  <option key={i + 1} value={i + 1}>
                    {opt}
                  </option>
                ))}
              </select>
              <FaChevronDown className="dropdown-icon-chevron" style={{ color: '#3B0304' }} />
            </div>
          </td>
          <td className="center-text">
            <div
              className="dropdown-control-wrapper"
              style={{ 
                backgroundColor: getStatusColor(task.status), 
                borderRadius: '4px', 
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)' 
              }}
            >
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(task.id, e.target.value)}
                className="status-select"
                style={{ backgroundColor: getStatusColor(task.status) }}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <FaChevronDown className="dropdown-icon-chevron" style={{ color: 'white' }} />
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
 
export default ManagerTitleRecord;
