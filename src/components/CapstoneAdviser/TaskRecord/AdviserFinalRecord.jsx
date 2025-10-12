// src/components/CapstoneAdviser/AdviserFinalRecord.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../supabaseClient";
import Swal from "sweetalert2";
import {
  FaCalendarAlt, FaClock, FaChevronDown, FaEllipsisV, FaEdit, FaEye, FaTrash,
  FaSearch, FaTasks, FaChevronLeft, FaChevronRight
} from "react-icons/fa";

const ACCENT = "#5a0d0e";

export default function AdviserFinalRecord() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [openKebabMenu, setOpenKebabMenu] = useState(null);
  const [currentView, setCurrentView] = useState(0); // 0 = first view, 1 = second view
  const kebabRefs = useRef({});

  const STATUS_OPTIONS = ["To Do", "In Progress", "To Review", "Completed", "Missed"];
  const REVISION_OPTIONS = [
    "No Revision",
    ...Array.from({ length: 10 }, (_, i) => {
      const num = i + 1;
      return num === 1 ? "1st Revision" : num === 2 ? "2nd Revision" : num === 3 ? "3rd Revision" : `${num}th Revision`;
    }),
  ];

  const formatTime = (v) => {
    if (!v) return "N/A";
    const t = v.split("+")[0];
    const [hh, mm] = t.split(":");
    let h = parseInt(hh, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${mm} ${ampm}`;
  };

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

  // Fetch completed tasks with team names
  const fetchCompletedTasks = async () => {
    try {
      const { data: finalDefTasks, error: finalDefError } = await supabase
        .from("adviser_final_def")
        .select("*")
        .eq("status", "Completed");
      if (finalDefError) throw finalDefError;
      if (!finalDefTasks?.length) { setTasks([]); return; }

      const managerIds = [...new Set(finalDefTasks.map(t => t.manager_id).filter(Boolean))];
      let teamMap = {};
      if (managerIds.length) {
        const { data: groups, error: groupsError } = await supabase
          .from("groups")
          .select("group_name, manager_id")
          .in("manager_id", managerIds);
        if (!groupsError && groups) {
          groups.forEach(g => { teamMap[g.manager_id] = g.group_name; });
        }
      }

      const withNames = finalDefTasks.map(task => ({
        ...task,
        team_name: teamMap[task.manager_id] || `Team ${task.manager_id?.substring(0, 8)}` || "Unknown Team",
        date_completed: task.date_completed || task.date_created || new Date().toISOString().split("T")[0],
      }));
      setTasks(withNames);
    } catch (e) {
      console.error(e);
      Swal.fire({ title: "Error!", text: "Failed to load completed tasks", icon: "error", confirmButtonColor: ACCENT });
    }
  };

  useEffect(() => { fetchCompletedTasks(); }, []);

  const cleanTaskName = (s) => (s || "").replace(/^\d+\.\s*/, "");
  const formatDate = (d) => {
    if (!d) return "N/A";
    try { return new Date(d).toLocaleDateString("en-US"); } catch { return "N/A"; }
  };

  // navigation (pager)
  const handleNextView = () => setCurrentView(1);
  const handlePrevView = () => setCurrentView(0);

  // back button (route-first, then history fallback)
  const backToTaskRecords = () => {
    try { navigate("/Adviser/TasksRecord"); } catch {}
    setTimeout(() => {
      if (!location.pathname.includes("/Adviser/TasksRecord")) navigate(-1);
    }, 0);
  };

  // selection & delete
  const handleSelectTask = (id, v) => setSelectedTaskIds(prev => (v ? [...prev, id] : prev.filter(x => x !== id)));
  const handleSelectAllTasks = (v) => setSelectedTaskIds(v ? filteredAndSearchedTasks.map(t => t.id) : []);
  const handleToggleSelectionMode = (enable) => { setIsSelectionMode(enable); if (!enable) setSelectedTaskIds([]); };

  const handleDeleteSelectedTasks = async () => {
    if (!selectedTaskIds.length) return;
    const ok = await Swal.fire({
      icon: "warning",
      title: "Delete Selected Tasks?",
      text: `You are about to delete ${selectedTaskIds.length} task(s).`,
      showCancelButton: true,
      confirmButtonText: "Yes, Delete Them",
      confirmButtonColor: "#D60606",
      cancelButtonColor: "#6c757d",
    });
    if (!ok.isConfirmed) return;

    try {
      const { error } = await supabase.from("adviser_final_def").delete().in("id", selectedTaskIds);
      if (error) throw error;
      setTasks(prev => prev.filter(t => !selectedTaskIds.includes(t.id)));
      setSelectedTaskIds([]);
      setIsSelectionMode(false);
      Swal.fire({ icon: "success", title: "Deleted!", text: `${selectedTaskIds.length} task(s) deleted.`, confirmButtonColor: ACCENT });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error!", text: "Failed to delete tasks", confirmButtonColor: ACCENT });
    }
  };

  const handleSingleTaskDelete = async (taskId, taskName) => {
    const ok = await Swal.fire({
      icon: "warning",
      title: "Delete Task?",
      text: `You are about to delete "${taskName}".`,
      showCancelButton: true,
      confirmButtonText: "Yes, Delete It",
      confirmButtonColor: "#D60606",
      cancelButtonColor: "#6c757d",
    });
    if (!ok.isConfirmed) return;
    try {
      const { error } = await supabase.from("adviser_final_def").delete().eq("id", taskId);
      if (error) throw error;
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setSelectedTaskIds(prev => prev.filter(id => id !== taskId));
      Swal.fire({ icon: "success", title: "Deleted!", text: `"${taskName}" has been deleted.`, confirmButtonColor: ACCENT });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error!", text: "Failed to delete task", confirmButtonColor: ACCENT });
    }
  };

  // kebab menu
  const toggleKebabMenu = (id) => setOpenKebabMenu(openKebabMenu === id ? null : id);
  const getMenuPosition = (id) => {
    const el = kebabRefs.current[id];
    if (!el) return { top: 0, left: 0 };
    const r = el.getBoundingClientRect();
    return { top: r.bottom + window.scrollY, left: r.right + window.scrollX - 120 };
  };
  useEffect(() => {
    const close = (e) => {
      if (!e.target.closest(".kebab-menu-container") && !e.target.closest(".kebab-menu")) setOpenKebabMenu(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // update modal
  const handleUpdateTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const dueDate = task.due_date ? new Date(task.due_date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
    const timeValue = task.time ? task.time.split("+")[0] : "12:00";
    const teamName = task.team_name || "Unknown Team";
    const taskName = cleanTaskName(task.task) || "Final Defense Review";
    const subtask = task.subtask || "-";
    const elements = task.elements || "-";
    const taskType = task.task_type || "-";

    Swal.fire({
      title: `<div style="color:${ACCENT};font-size:1.5rem;font-weight:600;">Update Task Details</div>`,
      html: `
        <div style="text-align:left;">
          <div style="margin-bottom:15px;padding:12px;background:#f8f9fa;border-radius:8px;border-left:4px solid ${ACCENT};">
            <div style="font-weight:600;color:${ACCENT};margin-bottom:8px;font-size:1.1rem;">Team: ${teamName}</div>
            <div style="color:#495057;margin-bottom:6px;font-size:.95rem;"><strong>Task:</strong> ${taskName}</div>
            <div style="color:#495057;margin-bottom:6px;font-size:.95rem;"><strong>Task Type:</strong> ${taskType}</div>
            <div style="color:#495057;margin-bottom:6px;font-size:.95rem;"><strong>SubTask:</strong> ${subtask}</div>
            <div style="color:#495057;font-size:.95rem;"><strong>Elements:</strong> ${elements}</div>
          </div>
          <div style="margin-bottom:20px;">
            <label style="display:block;margin-bottom:8px;font-weight:600;">Due Date</label>
            <input id="due-date" type="date" value="${dueDate}" style="width:100%;padding:10px;border:1.5px solid #ddd;border-radius:6px;">
          </div>
          <div>
            <label style="display:block;margin-bottom:8px;font-weight:600;">Time</label>
            <input id="due-time" type="time" value="${timeValue}" style="width:100%;padding:10px;border:1.5px solid #ddd;border-radius:6px;">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Save Changes",
      cancelButtonText: "Cancel",
      confirmButtonColor: ACCENT,
      cancelButtonColor: "#6c757d",
      preConfirm: () => {
        const d = document.getElementById("due-date")?.value;
        const t = document.getElementById("due-time")?.value;
        if (!d || !t) { Swal.showValidationMessage("Please fill in both date and time"); return false; }
        return { due_date: d, due_time: t };
      },
    }).then(async (res) => {
      if (!res.isConfirmed) return;
      const { due_date, due_time } = res.value;
      try {
        const { error } = await supabase.from("adviser_final_def").update({ due_date, time: due_time }).eq("id", taskId);
        if (error) throw error;
        setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, due_date, time: due_time } : t)));
        Swal.fire({ icon: "success", title: "Success!", text: `Task details for ${teamName} updated`, confirmButtonColor: ACCENT });
      } catch (e) {
        Swal.fire({ icon: "error", title: "Error!", text: "Failed to update task", confirmButtonColor: ACCENT });
      }
    });

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
            <div style="color:#495057;margin-bottom:6px;"><strong>Task Type:</strong> ${task.task_type || "N/A"}</div>
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
            <div><strong>Comment:</strong><br>${task.comment || "-"}</div>
          </div>
        </div>
      `,
      confirmButtonText: "Close",
      confirmButtonColor: ACCENT,
      width: "600px",
    });
  };

  const handleDeleteTask = (id, name) => { setOpenKebabMenu(null); handleSingleTaskDelete(id, name); };

  // filter/search
  const filteredAndSearchedTasks = (tasks || [])
    .filter(t => t.team_name && t.team_name.trim() !== "")
    .filter(t =>
      (t.team_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.task || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.task_type || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

  const allTasksSelected = filteredAndSearchedTasks.length > 0 && selectedTaskIds.length === filteredAndSearchedTasks.length;

  // table renderer
  const renderTable = () => {
    if (currentView === 0) {
      return (
        <table className="tasks-table">
          <thead className="bg-gray-50">
            <tr>
              {isSelectionMode && (
                <th className="center-text" style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    checked={allTasksSelected}
                    onChange={(e) => handleSelectAllTasks(e.target.checked)}
                    disabled={!filteredAndSearchedTasks.length}
                  />
                </th>
              )}
              <th className="center-text">NO</th>
              <th className="center-text">Team</th>
              <th className="center-text">Task Type</th>
              <th className="center-text">Task</th>
              <th className="center-text">SubTasks</th>
              <th className="center-text">Elements</th>
              <th className="center-text">Date Created</th>
              <th className="center-text">Due Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSearchedTasks.length ? (
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
                  <td className="center-text">{task.task_type || "-"}</td>
                  <td className="center-text">{cleanTaskName(task.task) || "Final Defense Review"}</td>
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
                <td colSpan={isSelectionMode ? 9 : 8} className="center-text" style={{ padding: 20 }}>
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
            <th className="center-text">Comment</th>
            <th className="center-text">Action</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredAndSearchedTasks.length ? (
            filteredAndSearchedTasks.map((task, idx) => {
              const statusColor = getStatusColor(task.status);
              return (
                <tr key={task.id} className="hover:bg-gray-50 transition duration-150">
                  <td className="center-text">{idx + 1}.</td>
                  <td className="center-text">
                    <div className="center-content-flex">
                      <FaClock size={14} style={{ color: ACCENT }} />
                      {formatTime(task.time)}
                    </div>
                  </td>
                  <td className="center-text">
                    <div className="center-content-flex">
                      <FaCalendarAlt size={14} style={{ color: ACCENT }} />
                      {formatDate(task.date_completed)}
                    </div>
                  </td>
                  <td className="center-text">
                    <div className="dropdown-control-wrapper" style={{ minWidth: 100 }}>
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
                      <span style={{ padding: "4px 6px", color: "white", fontWeight: 500, fontSize: ".85rem", minWidth: 90 }}>
                        {task.status || "Completed"}
                      </span>
                    </div>
                  </td>
                  <td className="center-text">{task.methodology || "N/A"}</td>
                  <td className="center-text">{task.project_phase || "N/A"}</td>
                  <td className="center-text">{task.comment || "-"}</td>
                  <td className="center-text">
                    <div className="kebab-menu-container">
                      <button
                        ref={(el) => (kebabRefs.current[task.id] = el)}
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
              <td colSpan="9" className="center-text" style={{ padding: 20 }}>
                No completed tasks found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    );
  };

  return (
    // Page shell (footer pinned)
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header with Back (left) */}
      <div className="px-5 pt-5">
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            className="primary-button"
            onClick={backToTaskRecords}
            title="Back to Task Records"
          >
            <FaChevronLeft /> Back
          </button>
          <h2 className="section-title">
            <FaTasks className="me-2" size={18} />
            Final Defense Records
          </h2>
        </div>
        <hr className="divider" />
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="page-wrapper pt-0">
          <div className="header-wrapper">
            <div className="tasks-container">
              {/* Search & Delete */}
              <div className="search-filter-wrapper">
                <div className="search-input-container">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search Team, Task, or Task Type"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="d-flex align-items-center gap-2">
                  {isSelectionMode && (
                    <button type="button" className="primary-button" onClick={() => handleToggleSelectionMode(false)}>
                      Cancel
                    </button>
                  )}
                  <button
                    type="button"
                    className={`primary-button ${isSelectionMode ? "delete-selected-button-white" : ""}`}
                    onClick={() => (isSelectionMode ? handleDeleteSelectedTasks() : handleToggleSelectionMode(true))}
                    disabled={isSelectionMode && selectedTaskIds.length === 0}
                  >
                    <FaTrash size={14} />
                    {isSelectionMode ? "Delete Selected" : "Delete"}
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
                <div className="kebab-menu" style={{ top: getMenuPosition(openKebabMenu).top, left: getMenuPosition(openKebabMenu).left }}>
                  <button className="kebab-menu-item update" onClick={() => handleUpdateTask(openKebabMenu)}>
                    <FaEdit size={12} /> Update
                  </button>
                  <button className="kebab-menu-item view" onClick={() => handleViewTask(openKebabMenu)}>
                    <FaEye size={12} /> View
                  </button>
                  <button
                    className="kebab-menu-item delete"
                    onClick={() => handleDeleteTask(openKebabMenu, tasks.find(t => t.id === openKebabMenu)?.task)}
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
        .tasks-container { background: #fff; border-radius: 20px; width: 100%; box-shadow: 0 2px 10px rgba(0,0,0,.1); padding: 20px; border: 1px solid #B2B2B2; min-width: 320px; flex-grow: 1; }

        .primary-button { font-size:.85rem!important; padding:6px 12px!important; border-radius:6px!important; border:1.5px solid ${ACCENT}!important; background:#fff!important; color:${ACCENT}!important; font-weight:500!important; cursor:pointer!important; display:inline-flex!important; align-items:center!important; gap:6px!important; white-space:nowrap; transition:background .2s!important; }
        .primary-button:hover { background:#f0f0f0!important; }
        .delete-selected-button-white { background:#fff!important; color:${ACCENT}!important; border-color:${ACCENT}!important; }

        .search-filter-wrapper { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; gap:12px; flex-wrap:wrap; }
        .search-input-container { position:relative; width:100%; max-width:260px; }
        .search-input { width:100%; padding:8px 12px 8px 35px; border:1px solid #B2B2B2; border-radius:6px; background:#fff; color:${ACCENT}; font-size:.9rem; height:36px; }
        .search-input:focus { outline:none; border-color:${ACCENT}; }
        .search-icon { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:#B2B2B2; font-size:.9rem; }

        .table-container { background:#fff; border-radius:8px; overflow:hidden; }
        .table-content { overflow-x:auto; overflow-y:auto; max-height:500px; width:100%; }
        .tasks-table { width:100%; border-collapse:collapse; font-size:14px; }
        .tasks-table th, .tasks-table td { padding:12px 10px; text-align:center; white-space:nowrap; border-bottom:1px solid #dee2e6; }
        .tasks-table th { background:#f8f9fa!important; font-weight:600!important; color:${ACCENT}!important; text-transform:uppercase; font-size:.75rem; padding:12px 6px!important; }
        .tasks-table tbody tr:hover { background:#f8f9fa; }
        .center-text { text-align:center; }

        .dropdown-control-wrapper { position:relative; display:inline-flex; align-items:center; min-width:90px; }
        .dropdown-icon-chevron { position:absolute; right:6px; pointer-events:none; font-size:.75rem; z-index:2; }
        .revision-select { border:1px solid #ccc!important; background:#fff!important; color:${ACCENT}!important; border-radius:4px!important; padding:4px 20px 4px 6px!important; font-size:.85rem!important; appearance:none!important; cursor:pointer; width:100%; }
        .revision-select:focus { outline:1px solid ${ACCENT}; }
        .status-container { display:inline-flex; border-radius:4px; overflow:hidden; box-shadow:0 1px 2px rgba(0,0,0,.1); min-width:90px; }
        .center-content-flex { display:flex; align-items:center; justify-content:center; gap:4px; height:100%; }

        .kebab-menu-container { position:relative; display:inline-block; }
        .kebab-button { border:none; background:transparent; color:${ACCENT}; cursor:pointer; padding:6px 8px; border-radius:4px; transition:background .15s; display:flex; align-items:center; justify-content:center; }
        .kebab-button:hover { background:#f0f0f0; }
        .kebab-menu { position:fixed; background:#fff; border:1px solid #ddd; border-radius:4px; box-shadow:0 2px 8px rgba(0,0,0,.15); z-index:9999; min-width:120px; padding:4px 0; }
        .kebab-menu-item { display:flex; align-items:center; gap:8px; padding:8px 12px; cursor:pointer; border:none; background:none; width:100%; text-align:left; font-size:.85rem; color:#495057; transition:background .15s; white-space:nowrap; }
        .kebab-menu-item:hover { background:#f8f9fa; }
        .kebab-menu-item.update { color:${ACCENT}; }
        .kebab-menu-item.view { color:#578FCA; }
        .kebab-menu-item.delete { color:#D60606; }

        .navigation-controls { background:#f8f9fa; border-top:1px solid #dee2e6; padding:12px 16px; display:flex; align-items:center; justify-content:flex-end; }
        .nav-buttons { display:flex; gap:8px; }
        .nav-button { padding:8px 16px; border:1px solid ${ACCENT}; background:#fff; color:${ACCENT}; border-radius:4px; display:flex; align-items:center; gap:8px; cursor:pointer; transition:all .2s; font-size:.85rem; font-weight:500; }
        .nav-button:hover { background:${ACCENT}; color:#fff; }
        .nav-button:disabled { border-color:#ccc; color:#ccc; cursor:not-allowed; }
        .nav-button:disabled:hover { background:#fff; color:#ccc; }
      `}</style>
    </div>
  );
}
