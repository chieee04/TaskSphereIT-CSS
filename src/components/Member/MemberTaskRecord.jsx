
// src/components/Member/MemberTaskRecord.jsx
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../supabaseClient";
import Swal from "sweetalert2";
import {
  FaCalendarAlt,
  FaClock,
  FaChevronDown,
  FaEllipsisV,
  FaEdit,
  FaEye,
  FaTrash,
  FaSearch,
  FaTasks,
  FaChevronLeft,
  FaChevronRight,
  FaClock as FaClockAlt,
} from "react-icons/fa";

/**
 * MemberTaskRecord.jsx
 * Design: matches AdviserOralRecord.jsx UI exactly.
 * Logic: preserved from user's original component (fetch from 4 tables, find manager by group_number).
 *
 * Place in: src/components/Member/MemberTaskRecord.jsx
 */

export default function MemberTaskRecord() {
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [openKebabMenu, setOpenKebabMenu] = useState(null);
  const [currentView, setCurrentView] = useState(0); // 0 = overview, 1 = details
  const kebabRefs = useRef({});

  // Keep user's original fetch logic with small normalization
  const fetchCompletedTasks = async () => {
    setLoading(true);
    try {
      const storedUser = localStorage.getItem("customUser");
      if (!storedUser) {
        console.error("❌ No customUser found in localStorage");
        setLoading(false);
        return;
      }

      const currentUser = JSON.parse(storedUser);

      // 1) Get member info (with group_number)
      const { data: memberData, error: memberError } = await supabase
        .from("user_credentials")
        .select("id, group_number")
        .eq("id", currentUser.id)
        .single();

      if (memberError || !memberData) {
        console.error("❌ Failed to get member info:", memberError);
        setLoading(false);
        return;
      }

      // 2) Get manager for that group
      const { data: managerData, error: managerError } = await supabase
        .from("user_credentials")
        .select("id, first_name, last_name")
        .eq("group_number", memberData.group_number)
        .eq("user_roles", 1) // 1 = manager
        .single();

      if (managerError || !managerData) {
        console.error("❌ Failed to get manager info:", managerError);
        setLoading(false);
        return;
      }

      const managerId = managerData.id;

      // 3) Fetch from all 4 manager tables (Completed only)
      const taskTables = [
        "manager_title_task",
        "manager_final_task",
        "manager_final_redef",
        "manager_oral_task",
      ];

      let allCompleted = [];

      for (const table of taskTables) {
        const { data, error } = await supabase
          .from(table)
          .select("*")
          .eq("manager_id", managerId)
          .eq("member_id", memberData.id)
          .eq("status", "Completed");

        if (error) {
          console.error(`❌ Error fetching from ${table}:`, error);
        } else if (data) {
          const normalized = data.map((t) => ({
            id: t.id,
            table,
            manager: managerData,
            task_name: t.task_name || t.task || "Untitled Task",
            due_date: t.due_date || null,
            due_time: t.due_time || t.time || null,
            created_date: t.created_date || t.created_at || null,
            methodology: t.methodology || null,
            project_phase: t.project_phase || null,
            revision: t.revision || t.revision_no || "No Revision",
            status: t.status || "Completed",
            date_completed: t.date_completed || null,
          }));
          allCompleted.push(...normalized);
        }
      }

      // 4) Sort by created_date descending
      allCompleted.sort((a, b) => new Date(b.created_date || b.date_completed || 0) - new Date(a.created_date || a.date_completed || 0));

      setCompletedTasks(allCompleted);
    } catch (err) {
      console.error("❌ Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- UI Helpers (borrowed/design-aligned with AdviserOralRecord) ---
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("en-US");
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return "—";
    const parts = timeString.split(":");
    const hour = parseInt(parts[0], 10);
    const minute = parts[1] || "00";
    if (Number.isNaN(hour)) return timeString;
    const ampm = hour >= 12 ? "PM" : "AM";
    const h = hour % 12 || 12;
    return `${h}:${minute} ${ampm}`;
  };

  const cleanTaskName = (name) => (name ? name.replace(/^\d+\.\s*/, "") : "");

  // Selection & filters
  const filteredAndSearchedTasks = (completedTasks || []).filter((t) => {
    const mName = `${t.manager?.first_name || ""} ${t.manager?.last_name || ""}`.toLowerCase();
    const term = searchTerm.toLowerCase();
    return mName.includes(term) || (t.task_name || "").toLowerCase().includes(term) || (t.table || "").toLowerCase().includes(term);
  });

  const allTasksSelected = filteredAndSearchedTasks.length > 0 && selectedTaskIds.length === filteredAndSearchedTasks.length;

  const handleSelectTask = (taskId, isChecked) => {
    setSelectedTaskIds((prev) => (isChecked ? [...prev, taskId] : prev.filter((id) => id !== taskId)));
  };

  const handleSelectAllTasks = (isChecked) => {
    if (isChecked) {
      const ids = filteredAndSearchedTasks.map((t) => t.id);
      setSelectedTaskIds(ids);
    } else {
      setSelectedTaskIds([]);
    }
  };

  const handleToggleSelectionMode = (enable) => {
    setIsSelectionMode(enable);
    if (!enable) setSelectedTaskIds([]);
  };

  // Delete actions (grouped by table)
  const handleDeleteSelectedTasks = async () => {
    if (selectedTaskIds.length === 0) return;

    const result = await Swal.fire({
      title: "Delete Selected Tasks?",
      text: `You are about to delete ${selectedTaskIds.length} task(s). This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete Them",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#D60606",
      cancelButtonColor: "#6c757d",
    });

    if (result.isConfirmed) {
      try {
        const idsByTable = {};
        selectedTaskIds.forEach((id) => {
          const row = completedTasks.find((t) => t.id === id);
          if (!row) return;
          idsByTable[row.table] = idsByTable[row.table] || [];
          idsByTable[row.table].push(id);
        });

        for (const table of Object.keys(idsByTable)) {
          const ids = idsByTable[table];
          const { error } = await supabase.from(table).delete().in("id", ids);
          if (error) throw error;
        }

        setCompletedTasks((prev) => prev.filter((t) => !selectedTaskIds.includes(t.id)));
        setIsSelectionMode(false);
        setSelectedTaskIds([]);

        Swal.fire({
          title: "Deleted!",
          text: `${selectedTaskIds.length} task(s) have been deleted.`,
          icon: "success",
          confirmButtonColor: "#3B0304",
        });
      } catch (error) {
        console.error("Error deleting tasks:", error);
        Swal.fire({
          title: "Error!",
          text: "Failed to delete tasks",
          icon: "error",
          confirmButtonColor: "#3B0304",
        });
      }
    }
  };

  const handleSingleTaskDelete = async (taskId, taskName) => {
    const result = await Swal.fire({
      title: "Delete Task?",
      text: `You are about to delete "${taskName}". This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete It",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#D60606",
      cancelButtonColor: "#6c757d",
    });

    if (result.isConfirmed) {
      try {
        const row = completedTasks.find((t) => t.id === taskId);
        if (!row) throw new Error("Task not found locally");

        const { error } = await supabase.from(row.table).delete().eq("id", taskId);
        if (error) throw error;

        setCompletedTasks((prev) => prev.filter((t) => t.id !== taskId));
        setSelectedTaskIds((prev) => prev.filter((id) => id !== taskId));

        Swal.fire({
          title: "Deleted!",
          text: `"${taskName}" has been deleted.`,
          icon: "success",
          confirmButtonColor: "#3B0304",
        });
      } catch (error) {
        console.error("Error deleting task:", error);
        Swal.fire({
          title: "Error!",
          text: "Failed to delete task",
          icon: "error",
          confirmButtonColor: "#3B0304",
        });
      }
    }
  };

  // Kebab menu
  const toggleKebabMenu = (taskId) => {
    setOpenKebabMenu(openKebabMenu === taskId ? null : taskId);
  };

  const getMenuPosition = (taskId) => {
    const button = kebabRefs.current[taskId];
    if (!button) return { top: 0, left: 0 };
    const rect = button.getBoundingClientRect();
    return {
      top: rect.bottom + window.scrollY,
      left: rect.right + window.scrollX - 120,
    };
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".kebab-menu-container") && !event.target.closest(".kebab-menu")) {
        setOpenKebabMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update modal (only updates due_date/time in the correct table)
  const handleUpdateTask = (taskId) => {
    setOpenKebabMenu(null);
    const task = completedTasks.find((t) => t.id === taskId);
    if (!task) return;

    const dueDate = (task.due_date && new Date(task.due_date).toISOString().split("T")[0]) || new Date().toISOString().split("T")[0];
    const timeValue = task.due_time ? (task.due_time.includes(":") ? task.due_time.split("+")[0] : task.due_time) : "12:00";

    Swal.fire({
      title: `<div style="color: #3B0304; font-size: 1.3rem; font-weight: 600;">Update Task Details</div>`,
      html: `
        <div style="text-align:left;">
          <div style="margin-bottom:12px; padding:10px; background:#f8f9fa; border-radius:8px; border-left:4px solid #3B0304;">
            <div style="font-weight:600; color:#3B0304; margin-bottom:6px;">Manager: ${task.manager?.first_name || ""} ${task.manager?.last_name || ""}</div>
            <div style="color:#495057;"><strong>Task:</strong> ${cleanTaskName(task.task_name) || "N/A"}</div>
            <div style="font-size:0.9rem; color:#6c757d;">From: ${task.table}</div>
          </div>
          <div style="margin-bottom:10px;">
            <label style="display:block; margin-bottom:6px; font-weight:600;">Due Date</label>
            <input type="date" id="due-date" value="${dueDate}" style="width:100%; padding:8px; border:1.5px solid #ddd; border-radius:6px;">
          </div>
          <div>
            <label style="display:block; margin-bottom:6px; font-weight:600;">Time</label>
            <input type="time" id="due-time" value="${timeValue}" style="width:100%; padding:8px; border:1.5px solid #ddd; border-radius:6px;">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Save Changes",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#3B0304",
      cancelButtonColor: "#6c757d",
      width: "520px",
      customClass: { popup: "custom-swal-popup" },
      preConfirm: () => {
        const dueDateInput = document.getElementById("due-date");
        const dueTimeInput = document.getElementById("due-time");
        if (!dueDateInput.value || !dueTimeInput.value) {
          Swal.showValidationMessage("Please fill in both date and time");
          return false;
        }
        return { due_date: dueDateInput.value, due_time: dueTimeInput.value };
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        const { due_date, due_time } = result.value;
        try {
          const { error } = await supabase
            .from(task.table)
            .update({ due_date: due_date, due_time: due_time, time: due_time })
            .eq("id", taskId);

          if (error) throw error;

          setCompletedTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, due_date: due_date, due_time: due_time } : t))
          );

          Swal.fire({
            title: "Success!",
            text: "Task updated successfully",
            icon: "success",
            confirmButtonColor: "#3B0304",
          });
        } catch (error) {
          console.error("Error updating task:", error);
          Swal.fire({
            title: "Error!",
            text: "Failed to update task details",
            icon: "error",
            confirmButtonColor: "#3B0304",
          });
        }
      }
    });
  };

  // View task modal
  const handleViewTask = (taskId) => {
    setOpenKebabMenu(null);
    const task = completedTasks.find((t) => t.id === taskId);
    if (!task) return;

    Swal.fire({
      title: `<div style="color:#3B0304; font-size:1.3rem; font-weight:600;">Task Details</div>`,
      html: `
        <div style="text-align:left; font-size:0.95rem;">
          <div style="margin-bottom:12px; padding:10px; background:#f8f9fa; border-radius:8px; border-left:4px solid #3B0304;">
            <div style="font-weight:600; color:#3B0304; margin-bottom:6px;">Manager: ${task.manager?.first_name || ""} ${task.manager?.last_name || ""}</div>
            <div style="color:#495057; margin-bottom:6px;"><strong>Task:</strong> ${cleanTaskName(task.task_name) || "N/A"}</div>
            <div style="font-size:0.9rem; color:#6c757d;">From: ${task.table}</div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div><strong>Date Created:</strong><br/>${formatDate(task.created_date)}</div>
            <div><strong>Due Date:</strong><br/>${formatDate(task.due_date)}</div>
            <div><strong>Time:</strong><br/>${formatTime(task.due_time)}</div>
            <div><strong>Date Completed:</strong><br/>${formatDate(task.date_completed)}</div>
            <div><strong>Status:</strong><br/>${task.status || "Completed"}</div>
            <div><strong>Methodology:</strong><br/>${task.methodology || "—"}</div>
            <div><strong>Project Phase:</strong><br/>${task.project_phase || "—"}</div>
            <div><strong>Revision No.:</strong><br/>${task.revision || "—"}</div>
          </div>
        </div>
      `,
      confirmButtonText: "Close",
      confirmButtonColor: "#3B0304",
      width: "600px",
      customClass: { popup: "custom-swal-popup" },
    });
  };

  // Revision change - updates original table
  const handleRevisionChange = async (taskId, revision) => {
    try {
      const row = completedTasks.find((t) => t.id === taskId);
      if (!row) throw new Error("Task not found");

      const { error } = await supabase.from(row.table).update({ revision }).eq("id", taskId);
      if (error) throw error;

      setCompletedTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, revision } : t)));
    } catch (error) {
      console.error("Error updating revision:", error);
      Swal.fire({
        title: "Error!",
        text: "Failed to update revision number",
        icon: "error",
        confirmButtonColor: "#3B0304",
      });
    }
  };

  // Navigation
  const handleNextView = () => setCurrentView(1);
  const handlePrevView = () => setCurrentView(0);

  // Render table similar to AdviserOralRecord
  const renderTable = () => {
    if (currentView === 0) {
      return (
        <table className="tasks-table">
          <thead className="bg-gray-50">
            <tr>
              {isSelectionMode && (
                <th className="center-text" style={{ width: "40px" }}>
                  <input type="checkbox" checked={allTasksSelected} onChange={(e) => handleSelectAllTasks(e.target.checked)} disabled={filteredAndSearchedTasks.length === 0} />
                </th>
              )}
              <th className="center-text">NO</th>
              <th className="center-text">Manager</th>
              <th className="center-text">Task</th>
              <th className="center-text">Date Created</th>
              <th className="center-text">Due Date</th>
              <th className="center-text">Time</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSearchedTasks.length > 0 ? (
              filteredAndSearchedTasks.map((t, idx) => (
                <tr key={`${t.table}-${t.id}`} className="hover:bg-gray-50 transition duration-150">
                  {isSelectionMode && (
                    <td className="center-text">
                      <input type="checkbox" checked={selectedTaskIds.includes(t.id)} onChange={(e) => handleSelectTask(t.id, e.target.checked)} />
                    </td>
                  )}
                  <td className="center-text">{idx + 1}.</td>
                  <td className="center-text">{t.manager?.first_name} {t.manager?.last_name}</td>
                  <td className="center-text">{cleanTaskName(t.task_name)}</td>
                  <td className="center-text">{formatDate(t.created_date)}</td>
                  <td className="center-text"><div className="center-content-flex"><FaCalendarAlt size={14} style={{ color: "#3B0304" }} />{formatDate(t.due_date)}</div></td>
                  <td className="center-text"><div className="center-content-flex"><FaClockAlt size={14} style={{ color: "#3B0304" }} />{formatTime(t.due_time)}</div></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isSelectionMode ? 7 : 6} className="center-text" style={{ padding: "20px" }}>
                  {loading ? "Loading completed tasks..." : "No completed tasks found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      );
    }

    // view 1 - details
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
                <tr key={`${task.table}-${task.id}`} className="hover:bg-gray-50 transition duration-150">
                  <td className="center-text">{idx + 1}.</td>
                  <td className="center-text"><div className="center-content-flex"><FaClockAlt size={14} style={{ color: "#3B0304" }} />{formatTime(task.due_time)}</div></td>
                  <td className="center-text"><div className="center-content-flex"><FaCalendarAlt size={14} style={{ color: "#3B0304" }} />{formatDate(task.date_completed)}</div></td>
                  <td className="center-text">
                    <div className="dropdown-control-wrapper" style={{ minWidth: "100px" }}>
                      <select value={task.revision} onChange={(e) => handleRevisionChange(task.id, e.target.value)} className="revision-select">
                        {["No Revision","1st Revision","2nd Revision","3rd Revision","4th Revision","5th Revision"].map((r,i)=>(<option key={i} value={r}>{r}</option>))}
                      </select>
                      <FaChevronDown className="dropdown-icon-chevron" style={{ color: "#3B0304" }} />
                    </div>
                  </td>
                  <td className="center-text">
                    <div className="status-container" style={{ backgroundColor: statusColor }}>
                      <span style={{ padding: "4px 6px", color: "white", fontWeight: "500", fontSize: "0.85rem", minWidth: "90px" }}>{task.status}</span>
                    </div>
                  </td>
                  <td className="center-text">{task.methodology || "—"}</td>
                  <td className="center-text">{task.project_phase || "—"}</td>
                  <td className="center-text">
                    <div className="kebab-menu-container">
                      <button ref={(el)=>kebabRefs.current[task.id]=el} className="kebab-button" onClick={()=>toggleKebabMenu(task.id)} title="More options"><FaEllipsisV size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="8" className="center-text" style={{ padding: "20px" }}>
                {loading ? "Loading completed tasks..." : "No completed tasks found"}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    );
  };

  // getStatusColor function (copied from Adviser)
  function getStatusColor(value) {
    switch (value) {
      case "To Do": return "#FABC3F";
      case "In Progress": return "#809D3C";
      case "To Review": return "#578FCA";
      case "Completed": return "#AA60C8";
      case "Missed": return "#D60606";
      default: return "#ccc";
    }
  }

  return (
    <div className="page-wrapper">
      <h2 className="section-title"><FaTasks className="me-2" size={18} />Completed Tasks</h2>
      <hr className="divider" />

      <div className="header-wrapper">
        <div className="tasks-container">
          <div className="search-filter-wrapper">
            <div className="search-input-container">
              <FaSearch className="search-icon" />
              <input type="text" className="search-input" placeholder="Search Manager, Task or Table" value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} />
            </div>

            <div className="d-flex align-items-center gap-2">
              {isSelectionMode && (<button type="button" className="primary-button" onClick={()=>handleToggleSelectionMode(false)}>Cancel</button>)}
              <button type="button" className={`primary-button ${isSelectionMode ? "delete-selected-button-white":""}`} onClick={()=>{
                if(isSelectionMode) handleDeleteSelectedTasks(); else handleToggleSelectionMode(true);
              }} disabled={isSelectionMode && selectedTaskIds.length===0}>
                <FaTrash size={14} /> {isSelectionMode ? `Delete Selected` : "Delete"}
              </button>
            </div>
          </div>

          <div className="table-container">
            <div className="table-content">{renderTable()}</div>

            <div className="navigation-controls">
              <div className="nav-buttons">
                <button className="nav-button" onClick={handlePrevView} disabled={currentView===0}><FaChevronLeft size={12} /> Previous</button>
                <button className="nav-button" onClick={handleNextView} disabled={currentView===1}>Next <FaChevronRight size={12} /></button>
              </div>
            </div>
          </div>

          {openKebabMenu && (
            <div className="kebab-menu" style={{ top: getMenuPosition(openKebabMenu).top, left: getMenuPosition(openKebabMenu).left }}>
              <button className="kebab-menu-item update" onClick={()=>handleUpdateTask(openKebabMenu)}><FaEdit size={12} /> Update</button>
              <button className="kebab-menu-item view" onClick={()=>handleViewTask(openKebabMenu)}><FaEye size={12} /> View</button>
              <button className="kebab-menu-item delete" onClick={()=>handleSingleTaskDelete(openKebabMenu, completedTasks.find(t=>t.id===openKebabMenu)?.task_name || "Task")}><FaTrash size={12} /> Delete</button>
            </div>
          )}
        </div>
      </div>

      {/* Styles copied from AdviserOralRecord for exact look */}
      <style>{`
        * { box-sizing: border-box; }
        .page-wrapper { width: 100%; padding: 20px; }
        .section-title { font-size: 20px; font-weight: bold; color: #3B0304; margin-bottom: 5px; display: flex; align-items: center; gap: 8px; }
        .divider { border: none; border-top: 2px solid #3B0304; margin-bottom: 20px; }
        .header-wrapper { display: flex; gap: 20px; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap; }
        .tasks-container { background: #fff; border-radius: 20px; width: 100%; box-shadow: 0 2px 10px rgba(0,0,0,0.1); padding: 20px; border: 1px solid #B2B2B2; min-width: 320px; flex-grow: 1; }

        /* Search and Filter Styles */
        .search-filter-wrapper { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; gap: 12px; flex-wrap: wrap; }
        .search-input-container { position: relative; width: 100%; max-width: 350px; }
        .search-input { width: 100%; padding: 8px 12px 8px 35px; border: 1px solid #B2B2B2; border-radius: 6px; background-color: white; color: #3B0304; font-size: 0.85rem; height: 36px; }
        .search-input:focus { outline: none; border-color: #3B0304; }
        .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #B2B2B2; font-size: 0.85rem; }

        /* Button Styles */
        .primary-button {
          font-size: 0.85rem !important;
          padding: 6px 12px !important;
          border-radius: 6px !important;
          border: 1.5px solid #3B0304 !important;
          background-color: white !important;
          color: #3B0304 !important;
          font-weight: 500 !important;
          cursor: pointer !important;
          transition: background-color 0.2s !important;
          display: flex !important;
          align-items: center !important;
          gap: 6px !important;
          white-space: nowrap;
        }
        .primary-button:hover {
          background-color: #f0f0f0 !important;
        }
        .delete-selected-button-white {
          background-color: white !important;
          color: #3B0304 !important;
          border-color: #3B0304 !important;
        }
        .delete-selected-button-white:hover {
          background-color: #f0f0f0 !important;
        }

        /* Table Styles */
        .table-container {
          background: white;
          border-radius: 8px;
          overflow: hidden;
        }
        .table-content {
          overflow-x: auto;
          overflow-y: auto;
          max-height: 520px;
          width: 100%;
        }
        .tasks-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        .tasks-table th, .tasks-table td {
          padding: 12px 10px;
          text-align: center;
          white-space: nowrap;
          border-bottom: 1px solid #dee2e6;
        }
        .tasks-table th {
          background-color: #f8f9fa !important;
          font-weight: 600 !important;
          color: #3B0304 !important;
          text-transform: uppercase;
          font-size: 0.75rem;
          padding: 12px 6px !important;
        }
        .tasks-table tbody tr:hover {
          background-color: #f8f9fa;
        }
        .center-text { text-align: center; }

        /* Dropdown Control Styles */
        .dropdown-control-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
          vertical-align: middle;
          min-width: 90px;
        }
        .dropdown-icon-chevron {
          position: absolute;
          right: 6px;
          pointer-events: none;
          font-size: 0.75rem;
          z-index: 2;
        }
        .revision-select {
          border: 1px solid #ccc !important;
          background-color: white !important;
          color: #3B0304 !important;
          border-radius: 4px !important;
          padding: 4px 20px 4px 6px !important;
          font-size: 0.85rem !important;
          appearance: none !important;
          cursor: pointer;
          width: 100%;
        }
        .revision-select:focus {
          outline: 1px solid #3B0304;
        }
        .status-container {
          display: inline-flex;
          border-radius: 4px;
          overflow: hidden;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          min-width: 90px;
        }
        .center-content-flex {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          height: 100%;
        }

        /* Kebab Menu Styles */
        .kebab-menu-container {
          position: relative;
          display: inline-block;
        }
        .kebab-button {
          border: none;
          background: none;
          color: #3B0304;
          cursor: pointer;
          padding: 6px 8px;
          border-radius: 4px;
          transition: background-color 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .kebab-button:hover {
          background-color: #f0f0f0;
        }
        .kebab-menu {
          position: fixed;
          background: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          z-index: 9999;
          min-width: 140px;
          padding: 4px 0;
        }
        .kebab-menu-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          cursor: pointer;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          font-size: 0.85rem;
          color: #495057;
          transition: background-color 0.15s;
          white-space: nowrap;
        }
        .kebab-menu-item:hover {
          background-color: #f8f9fa;
        }
        .kebab-menu-item.update { color: #3B0304; }
        .kebab-menu-item.view { color: #578FCA; }
        .kebab-menu-item.delete { color: #D60606; }

        /* Navigation Controls */
        .navigation-controls {
          background: #f8f9fa;
          border-top: 1px solid #dee2e6;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }
        .nav-buttons {
          display: flex;
          gap: 8px;
        }
        .nav-button {
          padding: 8px 16px;
          border: 1px solid #3B0304;
          background: white;
          color: #3B0304;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.85rem;
          font-weight: 500;
        }
        .nav-button:hover {
          background: #3B0304;
          color: white;
        }
        .nav-button:disabled {
          border-color: #ccc;
          color: #ccc;
          cursor: not-allowed;
        }
        .nav-button:disabled:hover {
          background: white;
          color: #ccc;
        }

        .custom-swal-popup { border-radius: 12px; }

        .d-flex { display: flex; }
        .align-items-center { align-items: center; }
        .justify-content-between { justify-content: between; }
        .gap-2 { gap: 8px; }
        .gap-3 { gap: 12px; }
        .mb-3 { margin-bottom: 12px; }
        .mb-4 { margin-bottom: 16px; }
        .me-2 { margin-right: 8px; }
      `}</style>
    </div>
  );
}
