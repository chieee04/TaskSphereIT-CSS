// src/components/CapstoneAdviser/AdviserOralRecord.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import taskIcon from "../../../assets/tasks-icon.png";
import searchIcon from "../../../assets/search-icon.png";
import dueDateIcon from "../../../assets/due-date-icon.png";
import timeIcon from "../../../assets/time-icon.png";
import { supabase } from "../../../supabaseClient";
import Swal from 'sweetalert2';
import {
  FaCalendarAlt, FaClock, FaChevronDown, FaEllipsisV, FaEdit, FaEye, FaTrash,
  FaSearch, FaTasks, FaChevronLeft, FaChevronRight
} from 'react-icons/fa';

const ACCENT = "#5a0d0e";

export default function AdviserOralRecord() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [openKebabMenu, setOpenKebabMenu] = useState(null);
  const [currentView, setCurrentView] = useState(0); // 0 = first view, 1 = second view

  const kebabRefs = useRef({});
  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    const [hour, minute] = timeString.split(":");
    let h = parseInt(hour, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${minute} ${ampm}`;
  };

  const STATUS_OPTIONS = ["To Do", "In Progress", "To Review", "Completed", "Missed"];
  const REVISION_OPTIONS = ["No Revision", ...Array.from({ length: 10 }, (_, i) => {
    const num = i + 1;
    if (num === 1) return "1st Revision";
    if (num === 2) return "2nd Revision";
    if (num === 3) return "3rd Revision";
    return `${num}th Revision`;
  })];

  const getStatusColor = (value) => {
    switch (value) {
      case "To Do": return "#FABC3F";
      case "In Progress": return "#809D3C";
      case "To Review": return "#578FCA";
      case "Completed": return "#AA60C8";
      case "Missed": return "#D60606";
      default: return "#ccc";
    }
  };

const fetchCompletedTasks = async () => {
  try {
    // 1️⃣ Get existing tasks in adviser_oral_def (so we exclude them)
    const { data: existingRecords, error: recordError } = await supabase
      .from("adviser_oral_def")
      .select("task");

    if (recordError) throw recordError;

    const recordedTasks = existingRecords?.map(r => r.task).filter(Boolean) || [];

    // 2️⃣ Fetch all Completed tasks from adviser_oral_task (not adviser_oral_defense ❌)
    const query = supabase
      .from("adviser_oral_def") // ✅ correct existing table name
      .select("*")
      .eq("status", "Completed");

    if (recordedTasks.length > 0) {
      query.not("task", "in", `(${recordedTasks.map(t => `'${t}'`).join(",")})`);
    }

    const { data: completedTasks, error: completedError } = await query;
    if (completedError) throw completedError;

    if (!completedTasks || completedTasks.length === 0) {
      setTasks([]);
      return;
    }

    // Optional group name lookup
    const managerIds = [...new Set(completedTasks.map(t => t.manager_id).filter(Boolean))];
    let teamMap = {};
if (managerIds.length > 0) {
  const { data: groupsData, error: groupsError } = await supabase
    .from("group") // ✅ correct table name
    .select("id, group_name, manager_id")
    .in("manager_id", managerIds);

  if (!groupsError && groupsData) {
    groupsData.forEach(group => {
      teamMap[group.manager_id] = group.group_name;
    });
  }
}

    const tasksWithTeamNames = completedTasks.map(task => ({
      ...task,
      team_name:
        teamMap[task.manager_id] ||
        `Team ${task.manager_id?.substring(0, 8)}` ||
        "Unknown Team",
      date_completed:
        task.date_completed ||
        task.date_created ||
        new Date().toISOString().split("T")[0],
    }));

    setTasks(tasksWithTeamNames);
  } catch (error) {
    console.error("Error fetching completed tasks:", error);
    Swal.fire({
      title: "Error!",
      text: "Failed to load completed tasks",
      icon: "error",
      confirmButtonColor: ACCENT,
    });
  }
};

  useEffect(() => { fetchCompletedTasks(); }, []);

  const cleanTaskName = (taskName) => (taskName || "").replace(/^\d+\.\s*/, "");
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try { return new Date(dateString).toLocaleDateString("en-US"); } catch { return "N/A"; }
  };

  const handleNextView = () => setCurrentView(1);
  const handlePrevView = () => setCurrentView(0);

  const handleSelectTask = (taskId, isChecked) => {
    setSelectedTaskIds(prev => isChecked ? [...prev, taskId] : prev.filter(id => id !== taskId));
  };
  const handleSelectAllTasks = (isChecked) => {
    if (isChecked) setSelectedTaskIds(filteredAndSearchedTasks.map(task => task.id));
    else setSelectedTaskIds([]);
  };
  const handleToggleSelectionMode = (enable) => { setIsSelectionMode(enable); if (!enable) setSelectedTaskIds([]); };

  const handleDeleteSelectedTasks = async () => {
    if (!selectedTaskIds.length) return;
    const result = await Swal.fire({
      title: 'Delete Selected Tasks?',
      text: `You are about to delete ${selectedTaskIds.length} task(s). This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete Them',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#D60606',
      cancelButtonColor: '#6c757d',
    });
    if (!result.isConfirmed) return;

    try {
      const { error } = await supabase.from("adviser_oral_def").delete().in('id', selectedTaskIds);
      if (error) throw error;

      setTasks(prev => prev.filter(t => !selectedTaskIds.includes(t.id)));
      setIsSelectionMode(false);
      setSelectedTaskIds([]);
      Swal.fire({ title: 'Deleted!', text: `${selectedTaskIds.length} task(s) have been deleted.`, icon: 'success', confirmButtonColor: ACCENT });
    } catch (error) {
      console.error("Error deleting tasks:", error);
      Swal.fire({ title: 'Error!', text: 'Failed to delete tasks', icon: 'error', confirmButtonColor: ACCENT });
    }
  };

  const handleSingleTaskDelete = async (taskId, taskName) => {
    const result = await Swal.fire({
      title: 'Delete Task?',
      text: `You are about to delete "${taskName}". This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete It',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#D60606',
      cancelButtonColor: '#6c757d',
    });
    if (!result.isConfirmed) return;

    try {
      const { error } = await supabase.from("adviser_oral_def").delete().eq('id', taskId);
      if (error) throw error;

      setTasks(prev => prev.filter(t => t.id !== taskId));
      setSelectedTaskIds(prev => prev.filter(id => id !== taskId));
      Swal.fire({ title: 'Deleted!', text: `"${taskName}" has been deleted.`, icon: 'success', confirmButtonColor: ACCENT });
    } catch (error) {
      console.error("Error updating task:", error);
      Swal.fire({ title: 'Error!', text: 'Failed to delete task', icon: 'error', confirmButtonColor: ACCENT });
    }
  };

  const toggleKebabMenu = (taskId) => setOpenKebabMenu(openKebabMenu === taskId ? null : taskId);

  const handleUpdateTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const dueDate = task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      const timeValue = task.time ? task.time.split('+')[0] : "12:00";
      const teamName = task.team_name || "Unknown Team";
      const taskName = cleanTaskName(task.task) || "Oral Defense Review";
      const subtask = task.subtask || "-";
      const elements = task.elements || "-";

      Swal.fire({
        title: `<div style="color:${ACCENT};font-size:1.5rem;font-weight:600;">Update Task Details</div>`,
        html: `
          <div style="text-align:left;">
            <div style="margin-bottom:15px;padding:12px;background:#f8f9fa;border-radius:8px;border-left:4px solid ${ACCENT};">
              <div style="font-weight:600;color:${ACCENT};margin-bottom:8px;font-size:1.1rem;">Team: ${teamName}</div>
              <div style="color:#495057;margin-bottom:6px;font-size:.95rem;"><strong>Task:</strong> ${taskName}</div>
              <div style="color:#495057;margin-bottom:6px;font-size:.95rem;"><strong>SubTask:</strong> ${subtask}</div>
              <div style="color:#495057;font-size:.95rem;"><strong>Elements:</strong> ${elements}</div>
            </div>
            <div style="margin-bottom:20px;">
              <label style="display:block;margin-bottom:8px;font-weight:600;color:#333;">Due Date</label>
              <input type="date" id="due-date" value="${dueDate}"
                style="width:100%;padding:10px;border:1.5px solid #ddd;border-radius:6px;font-size:14px;color:#333;background:white;">
            </div>
            <div>
              <label style="display:block;margin-bottom:8px;font-weight:600;color:#333;">Time</label>
              <input type="time" id="due-time" value="${timeValue}"
                style="width:100%;padding:10px;border:1.5px solid #ddd;border-radius:6px;font-size:14px;color:#333;background:white;">
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Save Changes',
        cancelButtonText: 'Cancel',
        confirmButtonColor: ACCENT,
        cancelButtonColor: '#6c757d',
        focusConfirm: false,
        width: '500px',
        customClass: { popup: 'custom-swal-popup' },
        preConfirm: () => {
          const dueDateInput = document.getElementById('due-date');
          const dueTimeInput = document.getElementById('due-time');
          if (!dueDateInput.value || !dueTimeInput.value) {
            Swal.showValidationMessage('Please fill in both date and time');
            return false;
          }
          return { due_date: dueDateInput.value, due_time: dueTimeInput.value };
        }
      }).then(async (result) => {
        if (!result.isConfirmed) return;
        const { due_date, due_time } = result.value;
        try {
          const { error } = await supabase
            .from("adviser_oral_def")
            .update({ due_date, time: due_time })
            .eq('id', taskId);
          if (error) throw error;

          setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, due_date, time: due_time } : t)));
          Swal.fire({ title: 'Success!', text: `Task details for ${teamName} updated successfully`, icon: 'success', confirmButtonColor: ACCENT });
        } catch (error) {
          console.error("Error updating task:", error);
          Swal.fire({ title: 'Error!', text: 'Failed to update task details', icon: 'error', confirmButtonColor: ACCENT });
        }
      });
    }
    setOpenKebabMenu(null);
  };

  const handleViewTask = (taskId) => {
    setOpenKebabMenu(null);
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    Swal.fire({
      title: `<div style="color:${ACCENT};font-size:1.5rem;font-weight:600;">Task Details</div>`,
      html: `
        <div style="text-align:left;font-size:.95rem;">
          <div style="margin-bottom:15px;padding:12px;background:#f8f9fa;border-radius:8px;border-left:4px solid ${ACCENT};">
            <div style="font-weight:600;color:${ACCENT};margin-bottom:8px;">Team: ${task.team_name || "N/A"}</div>
            <div style="color:#495057;margin-bottom:6px;"><strong>Task:</strong> ${cleanTaskName(task.task) || "N/A"}</div>
            <div style="color:#495057;margin-bottom:6px;"><strong>SubTask:</strong> ${task.subtask || "-"}</div>
            <div style="color:#495057;margin-bottom:6px;"><strong>Elements:</strong> ${task.elements || "-"}</div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;">
            <div><strong>Date Created:</strong><br>${formatDate(task.date_created)}</div>
            <div><strong>Due Date:</strong><br>${formatDate(task.due_date)}</div>
            <div><strong>Time:</strong><br>${formatTime(task.time) || "N/A"}</div>
            <div><strong>Date Completed:</strong><br>${formatDate(task.date_completed)}</div>
            <div><strong>Status:</strong><br>${task.status || "N/A"}</div>
            <div><strong>Methodology:</strong><br>${task.methodology || "N/A"}</div>
            <div><strong>Project Phase:</strong><br>${task.project_phase || "N/A"}</div>
            <div><strong>Revision No.:</strong><br>${task.revision_no || "No Revision"}</div>
          </div>
        </div>
      `,
      confirmButtonText: 'Close',
      confirmButtonColor: ACCENT,
      width: '600px'
    });
  };

  const handleDeleteTask = (taskId, taskName) => {
    setOpenKebabMenu(null);
    handleSingleTaskDelete(taskId, taskName);
  };

  const handleRevisionChange = async (taskId, revisionText) => {
    try {
      const { error } = await supabase.from("adviser_oral_def").update({ revision_no: revisionText }).eq('id', taskId);
      if (error) throw error;

      setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, revision_no: revisionText } : t)));
    } catch (error) {
      console.error("Error updating revision:", error);
      Swal.fire({ title: 'Error!', text: 'Failed to update revision number', icon: 'error', confirmButtonColor: ACCENT });
    }
  };

  const getMenuPosition = (taskId) => {
    const button = kebabRefs.current[taskId];
    if (!button) return { top: 0, left: 0 };
    const rect = button.getBoundingClientRect();
    return { top: rect.bottom + window.scrollY, left: rect.right + window.scrollX - 120 };
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.kebab-menu-container') && !event.target.closest('.kebab-menu')) {
        setOpenKebabMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredAndSearchedTasks = (tasks || [])
    .filter((t) => t.team_name && t.team_name.trim() !== "")
    .filter((t) =>
      (t.team_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.task || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

  const allTasksSelected = filteredAndSearchedTasks.length > 0 && selectedTaskIds.length === filteredAndSearchedTasks.length;

  const renderTable = () => {
    if (currentView === 0) {
      return (
        <table className="tasks-table">
          <thead className="bg-gray-50">
            <tr>
              {isSelectionMode && (
                <th className="center-text" style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={allTasksSelected}
                    onChange={(e) => handleSelectAllTasks(e.target.checked)}
                    disabled={filteredAndSearchedTasks.length === 0}
                  />
                </th>
              )}
              <th className="center-text">NO</th>
              <th className="center-text">Assigned</th>
              <th className="center-text">Tasks</th>
              <th className="center-text">SubTasks</th>
              <th className="center-text">Elements</th>
              <th className="center-text">Date Created</th>
              <th className="center-text">Due Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSearchedTasks.length > 0 ? (
              filteredAndSearchedTasks.map((task, idx) => (
                <tr key={task.id} className="hover:bg-gray-50 transition duration-150">
                  {isSelectionMode && (
                    <td className="center-text">
                      <input
                        type="checkbox"
                        checked={selectedTaskIds.includes(task.id)}
                        onChange={(e) => handleSelectTask(task.id, e.target.checked)}
                      />
                    </td>
                  )}
                  <td className="center-text">{idx + 1}.</td>
                  <td className="center-text">{task.team_name}</td>
                  <td className="center-text">{cleanTaskName(task.task) || "Oral Defense Review"}</td>
                  <td className="center-text">{task.subtask || "-"}</td>
                  <td className="center-text">{task.elements || "-"}</td>
                  <td className="center-text">{formatDate(task.date_created)}</td>
                  <td className="center-text">
                    <div className="center-content-flex">
                      <FaCalendarAlt size={14} style={{ color: ACCENT }} />
                      {formatDate(task.due_date)}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isSelectionMode ? 8 : 7} className="center-text" style={{ padding: '20px' }}>
                  No completed tasks found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      );
    }

    return (
      <table className="tasks-table">
        <thead className="bg-gray-50">
          <tr>
            <th className="center-text">NO</th>
            <th className="center-text">Time</th>
            <th className="center-text">Date Completed</th>
            <th className="center-text">Revision No.</th>
            <th className="center-text">Status</th>
            <th className="center-text">Methodology</th>
            <th className="center-text">Project Phase</th>
            <th className="center-text">Action</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredAndSearchedTasks.length > 0 ? (
            filteredAndSearchedTasks.map((task, idx) => {
              const statusColor = getStatusColor(task.status);
              return (
                <tr key={task.id} className="hover:bg-gray-50 transition duration-150">
                  <td className="center-text">{idx + 1}.</td>
                  <td className="center-text">
                    <div className="center-content-flex">
                      <FaClock size={14} style={{ color: ACCENT }} />
                      {formatTime(task.time) || "N/A"}
                    </div>
                  </td>
                  <td className="center-text">
                    <div className="center-content-flex">
                      <FaCalendarAlt size={14} style={{ color: ACCENT }} />
                      {formatDate(task.date_completed)}
                    </div>
                  </td>
                  <td className="center-text">
                    <div className="dropdown-control-wrapper" style={{ minWidth: '100px' }}>
                      <select
                        value={task.revision_no || "No Revision"}
                        onChange={(e) => handleRevisionChange(task.id, e.target.value)}
                        className="revision-select"
                      >
                        {REVISION_OPTIONS.map((label, i) => (
                          <option key={i} value={label}>{label}</option>
                        ))}
                      </select>
                      <FaChevronDown className="dropdown-icon-chevron" style={{ color: ACCENT }} />
                    </div>
                  </td>
                  <td className="center-text">
                    <div className="status-container" style={{ backgroundColor: statusColor }}>
                      <span style={{ padding: '4px 6px', color: 'white', fontWeight: 500, fontSize: '.85rem', minWidth: '90px' }}>
                        {task.status || "Completed"}
                      </span>
                    </div>
                  </td>
                  <td className="center-text">{task.methodology || "N/A"}</td>
                  <td className="center-text">{task.project_phase || "N/A"}</td>
                  <td className="center-text">
                    <div className="kebab-menu-container">
                      <button
                        ref={el => kebabRefs.current[task.id] = el}
                        className="kebab-button"
                        onClick={() => toggleKebabMenu(task.id)}
                        title="More options"
                      >
                        <FaEllipsisV size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="8" className="center-text" style={{ padding: '20px' }}>
                No completed tasks found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    );
  };

  return (
    // Page shell to keep footer pinned at bottom
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header + Back (left) */}
      <div className="px-5 pt-5">
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            className="primary-button"
            onClick={() => navigate("/Adviser/TasksRecord")}
            title="Back to Task Records"
          >
            <FaChevronLeft /> Back
          </button>
          <h2 className="section-title">
            <FaTasks className="me-2" size={18} />
            Oral Defense Records
          </h2>
        </div>
        <hr className="divider" />
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="page-wrapper pt-0">
          <div className="header-wrapper">
            <div className="tasks-container">
              {/* Search + Delete */}
              <div className="search-filter-wrapper">
                <div className="search-input-container">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search Team or Task"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="d-flex align-items-center gap-2">
                  {isSelectionMode && (
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => handleToggleSelectionMode(false)}
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="button"
                    className={`primary-button ${isSelectionMode ? 'delete-selected-button-white' : ''}`}
                    onClick={() => {
                      if (isSelectionMode) handleDeleteSelectedTasks();
                      else handleToggleSelectionMode(true);
                    }}
                    disabled={isSelectionMode && selectedTaskIds.length === 0}
                  >
                    <FaTrash size={14} />
                    {isSelectionMode ? `Delete Selected` : 'Delete'}
                  </button>
                </div>
              </div>

              {/* Table + pager */}
              <div className="table-container">
                <div className="table-content">{renderTable()}</div>

                <div className="navigation-controls">
                  <div className="nav-buttons">
                    <button className="nav-button" onClick={handlePrevView} disabled={currentView === 0}>
                      <FaChevronLeft size={12} /> Previous
                    </button>
                    <button className="nav-button" onClick={handleNextView} disabled={currentView === 1}>
                      Next <FaChevronRight size={12} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Kebab menu */}
              {openKebabMenu && (
                <div
                  className="kebab-menu"
                  style={{ top: getMenuPosition(openKebabMenu).top, left: getMenuPosition(openKebabMenu).left }}
                >
                  <button className="kebab-menu-item update" onClick={() => handleUpdateTask(openKebabMenu)}>
                    <FaEdit size={12} /> Update
                  </button>
                  <button className="kebab-menu-item view" onClick={() => handleViewTask(openKebabMenu)}>
                    <FaEye size={12} /> View
                  </button>
                  <button
                    className="kebab-menu-item delete"
                    onClick={() =>
                      handleDeleteTask(openKebabMenu, tasks.find(t => t.id === openKebabMenu)?.task)
                    }
                  >
                    <FaTrash size={12} /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        * { box-sizing: border-box; }
        .page-wrapper { width: 100%; padding: 20px; }
        .section-title { font-size: 20px; font-weight: 700; color: ${ACCENT}; display:flex; align-items:center; gap:8px; margin:0; }
        .divider { border: none; border-top: 2px solid ${ACCENT}; margin: 8px 0 16px; }

        .header-wrapper { display: flex; gap: 20px; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap; }
        .tasks-container { background: #fff; border-radius: 20px; width: 100%; box-shadow: 0 2px 10px rgba(0,0,0,0.1); padding: 20px; border: 1px solid #B2B2B2; min-width: 320px; flex-grow: 1; }

        /* Buttons (shared) */
        .primary-button {
          font-size: 0.85rem !important;
          padding: 6px 12px !important;
          border-radius: 6px !important;
          border: 1.5px solid ${ACCENT} !important;
          background-color: white !important;
          color: ${ACCENT} !important;
          font-weight: 500 !important;
          cursor: pointer !important;
          transition: background-color 0.2s !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 6px !important;
          white-space: nowrap;
        }
        .primary-button:hover { background-color: #f0f0f0 !important; }
        .delete-selected-button-white { background-color: white !important; color: ${ACCENT} !important; border-color: ${ACCENT} !important; }
        .delete-selected-button-white:hover { background-color: #f0f0f0 !important; }

        /* Search */
        .search-filter-wrapper { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; gap: 12px; flex-wrap: wrap; }
        .search-input-container { position: relative; width: 100%; max-width: 260px; }
        .search-input { width: 100%; padding: 8px 12px 8px 35px; border: 1px solid #B2B2B2; border-radius: 6px; background-color: white; color: ${ACCENT}; font-size: 0.9rem; height: 36px; }
        .search-input:focus { outline: none; border-color: ${ACCENT}; }
        .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #B2B2B2; font-size: 0.9rem; }

        /* Table */
        .table-container { background: white; border-radius: 8px; overflow: hidden; }
        .table-content { overflow-x: auto; overflow-y: auto; max-height: 500px; width: 100%; }
        .tasks-table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .tasks-table th, .tasks-table td { padding: 12px 10px; text-align: center; white-space: nowrap; border-bottom: 1px solid #dee2e6; }
        .tasks-table th { background-color: #f8f9fa !important; font-weight: 600 !important; color: ${ACCENT} !important; text-transform: uppercase; font-size: 0.75rem; padding: 12px 6px !important; }
        .tasks-table tbody tr:hover { background-color: #f8f9fa; }
        .center-text { text-align: center; }

        /* Dropdown */
        .dropdown-control-wrapper { position: relative; display: inline-flex; align-items: center; vertical-align: middle; min-width: 90px; }
        .dropdown-icon-chevron { position: absolute; right: 6px; pointer-events: none; font-size: 0.75rem; z-index: 2; }
        .revision-select {
          border: 1px solid #ccc !important;
          background-color: white !important;
          color: ${ACCENT} !important;
          border-radius: 4px !important;
          padding: 4px 20px 4px 6px !important;
          font-size: 0.85rem !important;
          appearance: none !important;
          cursor: pointer;
          width: 100%;
        }
        .revision-select:focus { outline: 1px solid ${ACCENT}; }
        .status-container { display: inline-flex; border-radius: 4px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.1); min-width: 90px; }
        .center-content-flex { display: flex; align-items: center; justify-content: center; gap: 4px; height: 100%; }

        /* Kebab */
        .kebab-menu-container { position: relative; display: inline-block; }
        .kebab-button { border: none; background: none; color: ${ACCENT}; cursor: pointer; padding: 6px 8px; border-radius: 4px; transition: background-color .15s; display: flex; align-items: center; justify-content: center; }
        .kebab-button:hover { background-color: #f0f0f0; }
        .kebab-menu { position: fixed; background: white; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 9999; min-width: 120px; padding: 4px 0; }
        .kebab-menu-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; cursor: pointer; border: none; background: none; width: 100%; text-align: left; font-size: 0.85rem; color: #495057; transition: background-color .15s; white-space: nowrap; }
        .kebab-menu-item:hover { background-color: #f8f9fa; }
        .kebab-menu-item.update { color: ${ACCENT}; }
        .kebab-menu-item.view { color: #578FCA; }
        .kebab-menu-item.delete { color: #D60606; }

        /* Pager */
        .navigation-controls { background: #f8f9fa; border-top: 1px solid #dee2e6; padding: 12px 16px; display: flex; align-items: center; justify-content: flex-end; }
        .nav-buttons { display: flex; gap: 8px; }
        .nav-button { padding: 8px 16px; border: 1px solid ${ACCENT}; background: white; color: ${ACCENT}; border-radius: 4px; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.2s; font-size: 0.85rem; font-weight: 500; }
        .nav-button:hover { background: ${ACCENT}; color: white; }
        .nav-button:disabled { border-color: #ccc; color: #ccc; cursor: not-allowed; }
        .nav-button:disabled:hover { background: white; color: #ccc; }

        .custom-swal-popup { border-radius: 12px; }

        /* small utility */
        .d-flex { display: flex; }
        .align-items-center { align-items: center; }
        .gap-2 { gap: 8px; }
      `}</style>
    </div>
  );
}
