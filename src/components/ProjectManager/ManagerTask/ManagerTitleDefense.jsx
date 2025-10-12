// If your file lives at src/components/ProjectManager/ManagerTitleDefense.jsx,
// keep the import paths the same. If it lives under ManagerTask/, this file
// name/path already matches the tree you showed.

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../supabaseClient";
import {
  FaPlus, FaCalendarAlt, FaClock, FaCogs, FaTasks, FaTrash, FaSearch, FaFilter,
  FaChevronDown, FaEllipsisV, FaEdit, FaEye, FaSave, FaTimesCircle, FaChevronLeft
} from "react-icons/fa";
import "../../Style/ProjectManager/ManagerTitleDefense.css";
import { openCreateTask, openMethodology } from "../../../services/Manager/ManagerCreateTitleTask";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import Footer from "../../Footer";

const MySwal = withReactContent(Swal);

// --- Global Constants ---
const customUser = JSON.parse(localStorage.getItem("customUser"));
const managerId = customUser?.id;

const ManagerTitleDefense = () => {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [openKebabMenu, setOpenKebabMenu] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState({ due_date: "", due_time: "" });

  const kebabRefs = useRef({});

  const STATUS_OPTIONS = ["To Do", "In Progress", "To Review", "Completed"];
  const FILTER_OPTIONS = ["All", "To Do", "In Progress", "To Review", "Missed"];
  const REVISION_OPTIONS = Array.from({ length: 10 }, (_, i) => {
    const num = i + 1;
    if (num === 1) return "1st Revision";
    if (num === 2) return "2nd Revision";
    if (num === 3) return "3rd Revision";
    return `${num}th Revision`;
  });

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

  // ✅ Fetch tasks from Supabase (include member alias)
  const fetchTasks = async () => {
    const storedUser = JSON.parse(localStorage.getItem("customUser"));
    if (!storedUser) {
      console.error("❌ No customUser found in localStorage");
      return;
    }
    const currentManagerId = storedUser.id;

    const { data, error } = await supabase
      .from("manager_title_task")
      .select(`
        id,
        task_name,
        due_date,
        due_time,
        created_date,
        created_time,
        methodology,
        project_phase,
        revision,
        status,
        manager_id,
        member:user_credentials!manager_title_task_member_id_fkey(first_name, last_name)
      `)
      .eq("manager_id", currentManagerId)
      .order("created_date", { ascending: false });

    if (error) {
      console.error("❌ Fetch error:", error);
      return;
    }

    const isMissed = (task) => {
      if (!task.due_date || !task.due_time) return false;
      const now = new Date();
      const dueDateTime = new Date(`${task.due_date}T${task.due_time}`);
      return now > dueDateTime && task.status !== "Completed" && task.status !== "Missed";
    };

    const updatedTasks = await Promise.all(
      (data || []).map(async (task) => {
        if (task.status === "Completed") return task;
        if (isMissed(task)) {
          const { error: updateError } = await supabase
            .from("manager_title_task")
            .update({ status: "Missed" })
            .eq("id", task.id);
          if (updateError) console.error(`❌ Error updating task ${task.id}:`, updateError);
          return { ...task, status: "Missed" };
        }
        return task;
      })
    );

    setTasks(updatedTasks);
  };

  useEffect(() => { fetchTasks(); }, []);

  // Close kebab menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".kebab-menu-container") && !event.target.closest(".kebab-menu")) {
        setOpenKebabMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Selection and Deletion Handlers ---
  const handleSelectTask = (taskId, isChecked) => {
    setSelectedTaskIds((prev) => (isChecked ? [...prev, taskId] : prev.filter((id) => id !== taskId)));
  };
  const handleSelectAllTasks = (isChecked) => {
    if (isChecked) {
      const allTaskIds = filteredAndSearchedTasks.map((task) => task.id);
      setSelectedTaskIds(allTaskIds);
    } else setSelectedTaskIds([]);
  };
  const handleToggleSelectionMode = (enable) => {
    setIsSelectionMode(enable);
    if (!enable) setSelectedTaskIds([]);
  };

  const handleDeleteSelectedTasks = async () => {
    if (selectedTaskIds.length === 0) {
      MySwal.fire("No Selection", "Please select at least one task to delete.", "warning");
      return;
    }

    const result = await MySwal.fire({
      title: `Delete ${selectedTaskIds.length} Task(s)?`,
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete them",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#3B0304",
    });
    if (!result.isConfirmed) return;

    const { error } = await supabase.from("manager_title_task").delete().in("id", selectedTaskIds);
    if (error) {
      console.error("❌ Delete selected tasks error:", error);
      MySwal.fire("Error", "Failed to delete selected tasks.", "error");
    } else {
      setTasks((prev) => prev.filter((t) => !selectedTaskIds.includes(t.id)));
      setIsSelectionMode(false);
      setSelectedTaskIds([]);
      MySwal.fire("Deleted!", `${selectedTaskIds.length} task(s) have been deleted.`, "success");
    }
  };

  const handleSingleTaskDelete = async (taskId, taskName) => {
    const result = await MySwal.fire({
      title: `Delete Task: "${taskName}"?`,
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#3B0304",
    });
    if (!result.isConfirmed) return;

    const { error } = await supabase.from("manager_title_task").delete().eq("id", taskId);
    if (error) {
      console.error("❌ Single task delete error:", error);
      MySwal.fire("Error", "Failed to delete the task.", "error");
    } else {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      MySwal.fire("Deleted!", `Task "${taskName}" has been deleted.`, "success");
      setSelectedTaskIds((prev) => prev.filter((id) => id !== taskId));
    }
  };

  // Kebab menu handlers
  const toggleKebabMenu = (taskId) => setOpenKebabMenu(openKebabMenu === taskId ? null : taskId);
  const handleUpdateTask = (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setEditingTask(taskId);
      setEditForm({ due_date: task.due_date, due_time: task.due_time });
    }
    setOpenKebabMenu(null);
  };
  const handleViewTask = (taskId) => { setOpenKebabMenu(null); /* show modal if needed */ };
  const handleDeleteTask = (taskId, taskName) => { setOpenKebabMenu(null); handleSingleTaskDelete(taskId, taskName); };

  const handleSaveUpdate = async (taskId) => {
    if (!editForm.due_date || !editForm.due_time) {
      MySwal.fire("Error", "Please fill in both date and time.", "error");
      return;
    }
    const newDueDateTime = new Date(`${editForm.due_date}T${editForm.due_time}`);
    const now = new Date();
    const isFuture = newDueDateTime > now;
    let newStatus = "To Do";
    const currentTask = tasks.find((t) => t.id === taskId);
    if (currentTask && currentTask.status !== "Missed" && !isFuture) newStatus = currentTask.status;

    const { error } = await supabase
      .from("manager_title_task")
      .update({ due_date: editForm.due_date, due_time: editForm.due_time, status: newStatus })
      .eq("id", taskId);

    if (error) {
      console.error("❌ Update task error:", error);
      MySwal.fire("Error", "Failed to update task.", "error");
    } else {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...editForm, status: newStatus } : t)));
      setEditingTask(null);
      MySwal.fire("Success", "Task updated successfully!", "success");
    }
  };
  const handleCancelUpdate = () => { setEditingTask(null); setEditForm({ due_date: "", due_time: "" }); };

  const getMenuPosition = (taskId) => {
    const button = kebabRefs.current[taskId];
    if (!button) return { top: 0, left: 0 };
    const rect = button.getBoundingClientRect();
    return { top: rect.bottom + window.scrollY, left: rect.right + window.scrollX - 120 };
  };

  const handleRevisionChange = async (taskId, revisionText) => {
    const revisionInt = parseInt(revisionText);
    const { error } = await supabase.from("manager_title_task").update({ revision: revisionInt }).eq("id", taskId);
    if (error) {
      console.error("❌ Update revision error:", error);
      MySwal.fire("Error", "Failed to update revision.", "error");
    } else {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, revision: revisionInt } : t)));
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    if (newStatus === "Completed") {
      const result = await MySwal.fire({
        title: "Mark as Completed?",
        text: "Do you want to mark this task as completed?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, complete it",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#3B0304",
      });
      if (!result.isConfirmed) return;

      const today = new Date().toISOString().split("T")[0];
      const { error } = await supabase
        .from("manager_title_task")
        .update({ status: newStatus, date_completed: today })
        .eq("id", taskId);

      if (error) {
        console.error("❌ Update status error:", error);
        MySwal.fire("Error", "Failed to update status.", "error");
      } else {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        MySwal.fire("✅ Completed!", "Task has been marked as completed.", "success");
      }
    } else {
      const { error } = await supabase.from("manager_title_task").update({ status: newStatus }).eq("id", taskId);
      if (error) {
        console.error("❌ Update status error:", error);
        MySwal.fire("Error", "Failed to update status.", "error");
      } else {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
      }
    }
  };

  // --- Filtering and Search Logic ---
  const filteredAndSearchedTasks = tasks
    .filter((task) => task.status !== "Completed")
    .filter((task) => {
      if (selectedFilter !== "All" && task.status !== selectedFilter) return false;
      if (!searchTerm) return true;
      const lowerSearchTerm = searchTerm.toLowerCase();
      return (
        task.task_name.toLowerCase().includes(lowerSearchTerm) ||
        `${task.member?.first_name} ${task.member?.last_name}`.toLowerCase().includes(lowerSearchTerm) ||
        task.methodology.toLowerCase().includes(lowerSearchTerm) ||
        task.project_phase.toLowerCase().includes(lowerSearchTerm)
      );
    });

  const allTasksSelected =
    filteredAndSearchedTasks.length > 0 && selectedTaskIds.length === filteredAndSearchedTasks.length;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header: Back + Title */}
      <div className="px-4 pt-4">
        <div className="d-flex align-items-center gap-2 mb-2">
          <h2 className="section-title m-0">
            <FaTasks className="me-2" size={18} />
            Title Defense
          </h2>
        </div>
        <hr className="divider" />
      </div>

      {/* Main Content */}
      <main className="container-fluid px-4 pb-4 flex-1">
        <style>{`
          /* --- General Styles --- */
          .table-scroll-area::-webkit-scrollbar { display: none; }
          .section-title { font-weight: 600; color: #3B0304; display: flex; align-items: center; }

          .divider {
            height: 1.5px; background-color: #3B0304;
            width: calc(100% + 50px); margin-left: -16px;
            border-radius: 50px; margin-bottom: 1.0rem; border: none;
          }

          /* --- Button Styles --- */
          .primary-button {
            font-size: .85rem!important; padding:6px 12px!important; border-radius:6px!important;
            border:1.5px solid #3B0304!important; background:#fff!important; color:#3B0304!important;
            font-weight:500!important; cursor:pointer!important; transition:background .2s!important;
            display:inline-flex!important; align-items:center!important; gap:6px!important; white-space:nowrap;
          }
          .primary-button:hover { background:#f0f0f0!important; }
          .delete-selected-button-white { background:#fff!important; color:#3B0304!important; border-color:#3B0304!important; }
          .delete-selected-button-white:hover { background:#f0f0f0!important; }

          /* --- Search Bar --- */
          .search-input-container { position:relative; width:100%; max-width:200px; }
          .search-input {
            width:100%; padding:7px 12px 7px 35px; border:1px solid #B2B2B2; border-radius:6px;
            background:#fff; color:#3B0304; font-size:.85rem; box-shadow:none; transition:border-color .2s;
            height:34px;
          }
          .search-input:focus { outline:none; border-color:#3B0304; }
          .search-icon { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:#B2B2B2; font-size:.85rem; }

          /* --- Filter --- */
          .filter-wrapper {
            position:relative; display:flex; align-items:center; border:1px solid #B2B2B2; border-radius:6px;
            background:#fff; color:#3B0304; font-size:.85rem; font-weight:500; padding:6px 8px; gap:6px;
            cursor:pointer; transition:border-color .2s, background-color .2s;
          }
          .filter-wrapper:hover { background:#f0f0f0; border-color:#3B0304; }
          .filter-select { position:absolute; inset:0; opacity:0; cursor:pointer; z-index:10; }
          .filter-select option { background:#fff!important; color:#000!important; }
          .filter-content { display:flex; align-items:center; gap:6px; pointer-events:none; }

          /* --- Table/Dropdown --- */
          .tasks-table th {
            background:#f8f9fa!important; font-weight:600!important; color:#3B0304!important;
            text-transform:uppercase; font-size:.75rem; padding:12px 6px!important; white-space:nowrap;
            text-align:center;
          }
          .tasks-table td {
            padding:8px 6px!important; font-size:.875rem; color:#495057; border-bottom:1px solid #dee2e6; vertical-align:middle; text-align:center;
          }
          .tasks-table tbody tr:hover { background:#f8f9fa; }

          .dropdown-control-wrapper { position:relative; display:inline-flex; align-items:center; min-width:90px; }
          .dropdown-icon-chevron { position:absolute; right:6px; pointer-events:none; font-size:.75rem; z-index:2; }

          .revision-select {
            border:1px solid #ccc!important; background:#fff!important; color:#3B0304!important; border-radius:4px!important;
            padding:4px 20px 4px 6px!important; font-size:.85rem!important; appearance:none!important; cursor:pointer; width:100%;
          }
          .revision-select:focus { outline:1px solid #3B0304; }

          .status-select {
            min-width:90px; padding:4px 20px 4px 6px!important; border-radius:4px; font-weight:500; color:#fff; border:none;
            appearance:none; cursor:pointer; font-size:.85rem; text-align:center; width:100%;
          }
          .status-select option { color:#000!important; background:#fff!important; padding:4px 8px; }

          .status-container { display:inline-flex; border-radius:4px; overflow:hidden; box-shadow:0 1px 2px rgba(0,0,0,.1); min-width:90px; }
          .center-content-flex { display:flex; align-items:center; justify-content:center; gap:4px; height:100%; }

          /* Edit form */
          .edit-form-container { display:flex; flex-direction:column; gap:8px; padding:8px; background:#f8f9fa; border-radius:4px; margin:4px 0; }
          .edit-input-group { display:flex; gap:8px; align-items:center; }
          .edit-input { padding:4px 8px; border:1px solid #ccc; border-radius:4px; font-size:.85rem; flex:1; }
          .edit-buttons { display:flex; gap:4px; justify-content:flex-end; }
          .edit-button { padding:4px 8px; border:none; border-radius:4px; font-size:.8rem; cursor:pointer; display:flex; align-items:center; gap:4px; transition:background-color .2s; }
          .save-button { background:#3B0304; color:#fff; }
          .save-button:hover { background:#2a0203; }
          .cancel-button { background:#6c757d; color:#fff; }
          .cancel-button:hover { background:#5a6268; }

          /* Kebab Menu */
          .kebab-menu-container { position:relative; display:inline-block; }
          .kebab-button { border:none; background:none; color:#3B0304; cursor:pointer; padding:6px 8px; border-radius:4px; transition:background-color .15s; display:flex; align-items:center; justify-content:center; }
          .kebab-button:hover { background:#f0f0f0; }
          .kebab-menu {
            position:fixed; background:#fff; border:1px solid #ddd; border-radius:4px; box-shadow:0 2px 8px rgba(0,0,0,.15);
            z-index:9999; min-width:120px; padding:4px 0;
          }
          .kebab-menu-item {
            display:flex; align-items:center; gap:8px; padding:8px 12px; cursor:pointer; border:none; background:none; width:100%;
            text-align:left; font-size:.85rem; color:#495057; transition:background-color .15s; white-space:nowrap;
          }
          .kebab-menu-item:hover { background:#f8f9fa; }
          .kebab-menu-item.update { color:#3B0304; }
          .kebab-menu-item.view { color:#578FCA; }
          .kebab-menu-item.delete { color:#D60606; }
        `}</style>

        <div className="row">
          <div className="col-12">

            {/* Top Controls: Create + Methodology */}
            <div className="d-flex align-items-center gap-2 mb-3">
              <button
                type="button"
                className="primary-button"
                onClick={async () => {
                  const currentManagerId = customUser?.id;
                  const newTasks = await openCreateTask(currentManagerId, { revision: 1, status: "To Do" });
                  if (newTasks && Array.isArray(newTasks)) {
                    setTasks((prev) => [...newTasks, ...prev]);
                  }
                }}
              >
                <FaPlus size={14} /> Create Task
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={async () => {
                  const chosen = await openMethodology(managerId);
                  if (chosen) console.log("📌 Methodology saved:", chosen);
                }}
              >
                <FaCogs size={14} /> Methodology
              </button>
            </div>

            {/* Search / Delete / Filter */}
            <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
              <div className="search-input-container">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search member"
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
                  className={`primary-button ${isSelectionMode ? "delete-selected-button-white" : ""}`}
                  onClick={() => (isSelectionMode ? handleDeleteSelectedTasks() : handleToggleSelectionMode(true))}
                  disabled={isSelectionMode && selectedTaskIds.length === 0}
                >
                  <FaTrash size={14} />
                  {isSelectionMode ? `Delete Selected` : "Delete"}
                </button>

                <div className="filter-wrapper">
                  <span className="filter-content">
                    <FaFilter size={14} /> Filter: {selectedFilter}
                  </span>
                  <select
                    className="filter-select"
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                  >
                    {FILTER_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-md relative">
              <div
                className="table-scroll-area overflow-x-auto overflow-y-auto"
                style={{ maxHeight: "600px", scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                <table className="tasks-table min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      {isSelectionMode && (
                        <th className="center-text" style={{ width: "40px" }}>
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
                      <th className="center-text">Date Created</th>
                      <th className="center-text">Due Date</th>
                      <th className="center-text">Time</th>
                      <th className="center-text">Revision No.</th>
                      <th className="center-text" style={{ minWidth: "130px" }}>Status</th>
                      <th className="center-text">Methodology</th>
                      <th className="center-text">Project Phase</th>
                      <th className="center-text" style={{ width: "50px" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndSearchedTasks.map((task, idx) => {
                      const statusColor = getStatusColor(task.status);
                      const isMissed = task.status === "Missed";

                      return (
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
                          <td className="center-text">
                            {task.member?.first_name} {task.member?.last_name}
                          </td>
                          <td className="center-text">{task.task_name}</td>
                          <td className="center-text">{task.created_date}</td>

                          {/* Due Date */}
                          <td className="center-text">
                            {editingTask === task.id ? (
                              <div className="edit-form-container">
                                <div className="edit-input-group">
                                  <FaCalendarAlt size={14} style={{ color: "#3B0304" }} />
                                  <input
                                    type="date"
                                    className="edit-input"
                                    value={editForm.due_date}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, due_date: e.target.value }))}
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="center-content-flex">
                                <FaCalendarAlt size={14} style={{ color: "#3B0304" }} />
                                {task.due_date}
                              </div>
                            )}
                          </td>

                          {/* Time */}
                          <td className="center-text">
                            {editingTask === task.id ? (
                              <div className="edit-form-container">
                                <div className="edit-input-group">
                                  <FaClock size={14} style={{ color: "#3B0304" }} />
                                  <input
                                    type="time"
                                    className="edit-input"
                                    value={editForm.due_time}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, due_time: e.target.value }))}
                                  />
                                </div>
                                <div className="edit-buttons">
                                  <button className="edit-button save-button" onClick={() => handleSaveUpdate(task.id)}>
                                    <FaSave size={12} /> Save
                                  </button>
                                  <button className="edit-button cancel-button" onClick={handleCancelUpdate}>
                                    <FaTimesCircle size={12} /> Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="center-content-flex">
                                <FaClock size={14} style={{ color: "#3B0304" }} />
                                {task.due_time}
                              </div>
                            )}
                          </td>

                          {/* Revision */}
                          <td className="center-text">
                            <div className="dropdown-control-wrapper" style={{ minWidth: "100px" }}>
                              <select
                                value={task.revision}
                                onChange={(e) => handleRevisionChange(task.id, e.target.value)}
                                className="revision-select"
                              >
                                {REVISION_OPTIONS.map((label, i) => (
                                  <option key={i + 1} value={i + 1}>{label}</option>
                                ))}
                              </select>
                              <FaChevronDown className="dropdown-icon-chevron" style={{ color: "#3B0304" }} />
                            </div>
                          </td>

                          {/* Status */}
                          <td className="center-text">
                            {isMissed ? (
                              <div className="status-container" style={{ backgroundColor: statusColor }}>
                                <span style={{ padding: "4px 6px", color: "white", fontWeight: 500, fontSize: ".85rem", minWidth: 90 }}>
                                  Missed
                                </span>
                              </div>
                            ) : (
                              <div
                                className="dropdown-control-wrapper"
                                style={{ backgroundColor: statusColor, borderRadius: 4, boxShadow: "0 1px 2px rgba(0,0,0,.1)" }}
                              >
                                <select
                                  value={task.status}
                                  onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                  className="status-select"
                                  style={{ backgroundColor: statusColor }}
                                >
                                  {STATUS_OPTIONS.filter((s) => s !== "Missed").map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                                <FaChevronDown className="dropdown-icon-chevron" style={{ color: "white" }} />
                              </div>
                            )}
                          </td>

                          <td className="center-text">{task.methodology}</td>
                          <td className="center-text">{task.project_phase}</td>

                          {/* Action */}
                          <td className="center-text">
                            <div className="kebab-menu-container">
                              <button
                                ref={(el) => (kebabRefs.current[task.id] = el)}
                                className="kebab-button"
                                onClick={() => toggleKebabMenu(task.id)}
                                title="More options"
                                disabled={editingTask === task.id}
                              >
                                <FaEllipsisV size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredAndSearchedTasks.length === 0 && (
                      <tr>
                        <td colSpan={isSelectionMode ? "13" : "12"} className="text-center py-4 text-gray-500">
                          No active tasks found matching the current search or filter criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Kebab Menu (portal-like) */}
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
                    handleDeleteTask(openKebabMenu, tasks.find((t) => t.id === openKebabMenu)?.task_name)
                  }
                >
                  <FaTrash size={12} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManagerTitleDefense;
