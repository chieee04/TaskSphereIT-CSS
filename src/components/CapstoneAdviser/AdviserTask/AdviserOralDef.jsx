// src/components/CapstoneAdviser/AdviserOralDef.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  FaClock, FaChevronDown, FaChevronLeft, FaChevronRight, FaEllipsisV, FaEdit, FaEye, FaTrash,
  FaFilter, FaPlus, FaTasks, FaCheck, FaCalendarAlt, FaSearch
} from "react-icons/fa";
 
import { fetchTasksFromDB, handleCreateTask } from "../../../services/Adviser/AdCapsTask";
import { supabase } from "../../../supabaseClient";
 
const ACCENT = "#3B0304";
 
const STATUS_OPTS  = ["To Do", "In Progress", "To Review", "Completed", "Missed"];
const FILTER_OPTS  = ["All", "To Do", "In Progress", "To Review", "Missed"];
const REV_OPTS     = ["No Revision", ...Array.from({ length: 10 }, (_, i) => {
  const n = i + 1;
  return n === 1 ? "1st Revision" : n === 2 ? "2nd Revision" : n === 3 ? "3rd Revision" : `${n}th Revision`;
})];
 
const METHODOLOGIES = ["Agile", "Extreme Programming", "Prototyping", "Scrum", "Waterfall"];
const PHASES        = ["Planning", "Design", "Development", "Testing", "Deployment"];
 
const AdviserOralDef = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [menuFor, setMenuFor] = useState(null);
  const [currentView, setCurrentView] = useState(0); // 0 = first view, 1 = second view
  const kebabRefs = useRef({});
 
  useEffect(() => {
    const checkAndMarkMissed = async () => {
      const fetched = await new Promise((resolve) => fetchTasksFromDB(resolve));
      if (!fetched) return;
 
      const now = new Date();
      const overdue = fetched.filter((t) => {
        if (t.status === "Completed" || t.status === "Missed") return false;
        if (!t.due_date) return false;
        const deadline = new Date(`${t.due_date}T${t.time || "23:59:59"}`);
        return deadline < now;
      });
 
      if (overdue.length > 0) {
        const ids = overdue.map((t) => t.id);
        const { error } = await supabase
          .from("adviser_oral_def")
          .update({ status: "Missed" })
          .in("id", ids);
 
        if (error) console.error("❌ Error updating missed tasks:", error);
        else console.log("✅ Updated missed tasks:", ids);
      }
 
      // Update UI
      setTasks(
        fetched.map((t) =>
          overdue.some((o) => o.id === t.id) ? { ...t, status: "Missed" } : t
        )
      );
    };
 
    checkAndMarkMissed();
  }, []);
 
  // ✅ Function to get the correct color code
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
 
  const formatTime = (v) => {
    if (!v) return "8:00 AM";
    const t = v.split("+")[0];
    const [hh, mm] = t.split(":");
    let h = parseInt(hh, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${mm} ${ampm}`;
  };
 
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return "-";
    }
  };
 
  const clean = (s) => (s || "").replace(/^\d+\.\s*/, "");
  const isMissed = (t) => t.status === "Missed";
  const revCount = (txt) => (txt && txt !== "No Revision" ? parseInt(txt, 10) || 0 : 0);
  const nextRev  = (txt) => {
    const n = Math.min(10, revCount(txt) + 1);
    if (n === 0) return "No Revision";
    if (n === 1) return "1st Revision";
    if (n === 2) return "2nd Revision";
    if (n === 3) return "3rd Revision";
    return `${n}th Revision`;
  };
 
  // ——————— helpers ———————
  const uniqList = (arr) =>
    Array.from(
      new Set(
        (arr || [])
          .map((v) => (v ?? "").toString().trim())
          .filter((v) => v.length > 0)
      )
    );
 
  // === NEW: notify all members/managers of selected teams ===
  const createTeamTaskNotifications = async (teamNames) => {
    try {
      if (!teamNames?.length) return;
 
      const { data: users, error: usersErr } = await supabase
        .from("user_credentials")
        .select("id, group_name, user_roles")
        .in("group_name", teamNames)
        .in("user_roles", [1, 2]);
 
      if (usersErr) {
        console.error("Fetch recipients failed:", usersErr);
        await Swal.fire({
          icon: "error",
          title: "Couldn't fetch recipients",
          text: usersErr.message || "Unknown error",
        });
        return;
      }
 
      const ids = Array.from(new Set((users || []).map((u) => u.id).filter(Boolean)));
      if (!ids.length) {
        console.log("No recipients for teams:", teamNames);
        return;
      }
 
      const now = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
 
      const rows = ids.map((uid) => ({
        user_id: uid,
        title: "Task",
        type: "2",
        date,
        time,
      }));
 
      console.log("About to insert notifications for user_ids:", ids);
      const { error: insErr } = await supabase.from("user_notification").insert(rows);
      if (insErr) {
        console.error("user_notification insert failed:", insErr);
        await Swal.fire({
          icon: "error",
          title: "Failed to insert notifications",
          text: insErr.message || "Unknown error",
        });
        return;
      }
 
      console.log("Notifications inserted:", rows.length);
    } catch (e) {
      console.error("createTeamTaskNotifications exception:", e);
      await Swal.fire({
        icon: "error",
        title: "Unexpected error",
        text: e?.message || String(e),
      });
    }
  };
 
  // ---------- filter/search ----------
  const filtered = (tasks || [])
    .filter(t => t.group_name && t.group_name.trim() !== "")
    .filter(t => (filter === "All" ? true : t.status === filter))
    .filter(t => (t.group_name || "").toLowerCase().includes(search.toLowerCase()));
 
  const allSelected = filtered.length > 0 && selectedIds.length === filtered.length;
  const toggleSelectAll = (v) => setSelectedIds(v ? filtered.map(t => t.id) : []);
  const toggleSelectOne = (id, v) => setSelectedIds(p => v ? [...p, id] : p.filter(x => x !== id));
 
  const deleteSelected = async () => {
    if (!selectedIds.length) return;
    const ok = await Swal.fire({
      icon: "warning",
      title: "Delete selected tasks?",
      text: `You are about to delete ${selectedIds.length} task(s).`,
      showCancelButton: true,
      confirmButtonColor: "#d60606",
      cancelButtonColor: "#6c757d"
    });
    if (!ok.isConfirmed) return;
    setTasks(prev => prev.filter(t => !selectedIds.includes(t.id)));
    setSelectedIds([]);
    setSelectMode(false);
    Swal.fire({ icon: "success", title: "Deleted", confirmButtonColor: ACCENT });
  };
 
  // ---------- status / revision ----------
  const patch = (id, fn) => setTasks(prev => prev.map(t => (t.id === id ? fn(t) : t)));
 
  const handleRevisionChange = async (taskId, revisionText) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, revision_no: revisionText } : t
      )
    );
  };
 
  const handleStatusChange = async (taskId, newStatus) => {
    if (newStatus === "Completed") {
      const { isConfirmed } = await Swal.fire({
        title: "Mark as Completed?",
        text: "Are you sure you want to mark this task as completed?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Confirm",
        cancelButtonText: "Cancel",
        confirmButtonColor: ACCENT,
        cancelButtonColor: "#6c757d",
      });
 
      if (isConfirmed) {
        const currentDate = new Date().toISOString().split('T')[0];
 
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId 
              ? { 
                  ...t, 
                  status: newStatus,
                  date_completed: currentDate
                } 
              : t
          )
        );
 
        Swal.fire({
          title: 'Task Completed!',
          text: 'The task has been marked as completed and moved to records.',
          icon: 'success',
          confirmButtonColor: ACCENT
        });
      }
    } else {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: newStatus } : t
        )
      );
    }
  };
 
  const openUpdate = (id) => {
    const t = tasks.find(x => x.id === id);
    if (!t) return;
 
    // Format dates for the input fields
    const dueDate = t.due_date ? new Date(t.due_date).toISOString().split('T')[0] : "";
    const timeValue = t.time ? t.time.split('+')[0] : "";
    const teamName = t.group_name || "CS001, Et Al.";
    const taskName = clean(t.task) || "Milestone Review Meeting";
    const subtask = t.subtask || "-";
    const elements = t.elements || "-";
 
    Swal.fire({
      title: `<div style="color: ${ACCENT}; font-size: 1.5rem; font-weight: 600;">Update Task Details</div>`,
      html: `
        <div style="text-align: left;">
          <div style="margin-bottom: 15px; padding: 12px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid ${ACCENT};">
            <div style="font-weight: 600; color: ${ACCENT}; margin-bottom: 8px; font-size: 1.1rem;">Team: ${teamName}</div>
            <div style="color: #495057; margin-bottom: 6px; font-size: 0.95rem;">
              <strong>Task:</strong> ${taskName}
            </div>
            <div style="color: #495057; margin-bottom: 6px; font-size: 0.95rem;">
              <strong>SubTask:</strong> ${subtask}
            </div>
            <div style="color: #495057; font-size: 0.95rem;">
              <strong>Elements:</strong> ${elements}
            </div>
          </div>
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Due Date</label>
            <input 
              type="date" 
              id="due-date" 
              value="${dueDate}"
              style="width: 100%; padding: 10px; border: 1.5px solid #ddd; border-radius: 6px; font-size: 14px; color: #333; background: white; transition: border-color 0.2s;"
              onfocus="this.style.borderColor='${ACCENT}'"
              onblur="this.style.borderColor='#ddd'"
            >
          </div>
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Time</label>
            <input 
              type="time" 
              id="due-time" 
              value="${timeValue}"
              style="width: 100%; padding: 10px; border: 1.5px solid #ddd; border-radius: 6px; font-size: 14px; color: #333; background: white; transition: border-color 0.2s;"
              onfocus="this.style.borderColor='${ACCENT}'"
              onblur="this.style.borderColor='#ddd'"
            >
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
      customClass: {
        popup: 'custom-swal-popup'
      },
      preConfirm: () => {
        const dueDateInput = document.getElementById('due-date');
        const dueTimeInput = document.getElementById('due-time');
 
        if (!dueDateInput.value || !dueTimeInput.value) {
          Swal.showValidationMessage('Please fill in both date and time');
          return false;
        }
 
        return {
          due_date: dueDateInput.value,
          due_time: dueTimeInput.value
        };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const { due_date, due_time } = result.value;
 
        setTasks(prev =>
          prev.map(t =>
            t.id === id
              ? {
                  ...t,
                  due_date: due_date,
                  time: due_time
                }
              : t
          )
        );
 
        Swal.fire({
          title: 'Success!',
          text: `Task details for ${teamName} updated successfully`,
          icon: 'success',
          confirmButtonColor: ACCENT
        });
      }
    });
 
    setMenuFor(null);
  };
 
  const openView = (id) => {
    const t = tasks.find(x => x.id === id);
    setMenuFor(null);
    navigate("/Adviser/TeamsBoard/ViewTask", { state: { taskId: id, team: t?.group_name } });
  };
 
  const menuPos = (id) => {
    const el = kebabRefs.current[id];
    if (!el) return { top: 0, left: 0 };
    const r = el.getBoundingClientRect();
    return { top: r.bottom + window.scrollY, left: r.right + window.scrollX - 140 };
  };
 
  const backToTasks = () => navigate("/Adviser/Tasks");
 
  // Navigation handlers
  const handleNextView = () => {
    setCurrentView(1);
  };
 
  const handlePrevView = () => {
    setCurrentView(0);
  };
 
  // Render table based on current view
  const renderTable = () => {
    if (currentView === 0) {
      // --- FIRST VIEW: Basic Info ---
      return (
        <div className="table-responsive">
          <table className="tbl">
            <thead>
              <tr>
                {selectMode && (
                  <th className="text-center" style={{ width: 40 }}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                      disabled={!filtered.length}
                    />
                  </th>
                )}
                <th className="text-center">No</th>
                <th className="text-center">Assigned</th>
                <th className="text-center">Task</th>
                <th className="text-center">Subtask</th>
                <th className="text-center">Elements</th>
                <th className="text-center">Due Date</th>
                <th className="text-center">Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length ? (
                filtered.map((t, i) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    {selectMode && (
                      <td className="text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(t.id)}
                          onChange={(e) => toggleSelectOne(t.id, e.target.checked)}
                        />
                      </td>
                    )}
                    <td className="text-center">{i + 1}.</td>
                    <td className="text-center">{t.group_name}</td>
                    <td className="text-center">{clean(t.task) || "-"}</td>
                    <td className="text-center">{t.subtask || "-"}</td>
                    <td className="text-center">{t.elements || "-"}</td>
                    <td className="text-center">{formatDate(t.due_date)}</td>
                    <td className="text-center">{formatTime(t.time)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    className="text-center italic text-gray-500 py-8"
                    colSpan={selectMode ? 8 : 7}
                  >
                    No tasks found for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      );
    } else {
      // --- SECOND VIEW: Status & Details ---
      return (
        <div className="table-responsive">
          <table className="tbl">
            <thead>
              <tr>
                <th className="text-center">No</th>
                <th className="text-center">Revision No.</th>
                <th className="text-center">Status</th>
                <th className="text-center">Methodology</th>
                <th className="text-center">Project Phase</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length ? (
                filtered.map((t, i) => {
                  const frozen = isMissed(t);
                  const statusColor = getStatusColor(t.status);
 
                  return (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="text-center">{i + 1}.</td>
 
                      {/* Revision No. with old UI styling */}
                      <td className="text-center">
                        {frozen ? (
                          <span className="inline-flex items-center gap-1" style={{ color: ACCENT }}>
                            {t.revision_no || "No Revision"}
                          </span>
                        ) : (
                          <div className="dropdown-control-wrapper" style={{ minWidth: "100px" }}>
                            <select
                              value={t.revision_no || "No Revision"}
                              onChange={(e) => handleRevisionChange(t.id, e.target.value)}
                              className="revision-select"
                            >
                              {REV_OPTS.map((label) => (
                                <option key={label} value={label}>{label}</option>
                              ))}
                            </select>
                            <FaChevronDown className="dropdown-icon-chevron" style={{ color: ACCENT }} />
                          </div>
                        )}
                      </td>
 
                      {/* Status with old UI styling and color indicators */}
                      <td className="text-center">
                        {frozen ? (
                          <div className="status-container" style={{ backgroundColor: statusColor }}>
                            <span style={{ padding: "4px 6px", color: "white", fontWeight: "500", fontSize: "0.85rem", minWidth: "90px" }}>
                              Missed
                            </span>
                          </div>
                        ) : (
                          <div className="dropdown-control-wrapper" style={{ backgroundColor: statusColor, borderRadius: "4px", boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>
                            <select
                              value={t.status || "To Do"}
                              onChange={(e) => handleStatusChange(t.id, e.target.value)}
                              className="status-select"
                              style={{ backgroundColor: statusColor }}
                            >
                              {STATUS_OPTS.filter(s => s !== "Missed").map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                            <FaChevronDown className="dropdown-icon-chevron" style={{ color: "white" }} />
                          </div>
                        )}
                      </td>
 
                      <td className="text-center">{t.methodology || "-"}</td>
                      <td className="text-center">{t.project_phase || "-"}</td>
 
                      <td className="text-center">
                        <button
                          ref={(el) => (kebabRefs.current[t.id] = el)}
                          className="kebab"
                          onClick={() => setMenuFor(menuFor === t.id ? null : t.id)}
                          title="More actions"
                        >
                          <FaEllipsisV />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    className="text-center italic text-gray-500 py-8"
                    colSpan="6"
                  >
                    No tasks found for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      );
    }
  };
 
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <style>{`
        .section-title{font-weight:600;color:${ACCENT};display:flex;align-items:center}
        .divider{height:1.5px;background:${ACCENT};border:none;border-radius:50px}
        .primary-button{font-size:.85rem;padding:6px 12px;border-radius:6px;border:1.5px solid ${ACCENT};background:#fff;color:${ACCENT};font-weight:500;cursor:pointer;display:flex;align-items:center;gap:6px}
        .primary-button:hover{background:#f0f0f0}
        .delete-selected-button-white{background-color:white !important;color:${ACCENT} !important;border-color:${ACCENT} !important}
        .delete-selected-button-white:hover{background-color:#f0f0f0 !important}
        .kebab{border:none;background:transparent;padding:.25rem;border-radius:.375rem}
        .kebab:hover{background:#f3f3f3}
        .kmenu{position:fixed; background:#fff; border:1px solid #ddd; border-radius:.5rem; box-shadow:0 2px 10px rgba(0,0,0,.12); padding:.25rem 0; z-index:9999; min-width:140px}
        .kitem{display:flex;align-items:center;gap:.5rem; padding:.5rem .75rem; width:100%; background:transparent; border:none; text-align:left}
        .kitem:hover{background:#f7f7f7}
        .tbl{width:100%; border-collapse:collapse}
        .tbl th{background:#fafafa; color:${ACCENT}; font-weight:600; text-transform:uppercase; font-size:.75rem; padding:.75rem .5rem; border-bottom:1px solid #e6e6e6}
        .tbl td{padding:.5rem; border-bottom:1px solid #eee; font-size:.9rem; vertical-align:middle}
 
        /* Search Bar Styles */
        .search-input-container{position:relative;width:100%}
        .search-input{width:100%;padding:7px 12px 7px 35px;border:1px solid #B2B2B2;border-radius:6px;background-color:white;color:${ACCENT};font-size:0.85rem;box-shadow:none;transition:border-color 0.2s;height:34px}
        .search-input:focus{outline:none;border-color:${ACCENT}}
        .search-icon{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#B2B2B2;font-size:0.85rem}
 
        /* Filter Styles */
        .filter-wrapper{position:relative;display:flex;align-items:center;border:1px solid #B2B2B2;border-radius:6px;background-color:white;color:${ACCENT};font-size:0.85rem;font-weight:500;padding:6px 8px;gap:6px;cursor:pointer;transition:border-color 0.2s,background-color 0.2s}
        .filter-wrapper:hover{background-color:#f0f0f0;border-color:${ACCENT}}
        .filter-select{position:absolute;top:0;left:0;width:100%;height:100%;opacity:0;cursor:pointer;z-index:10}
        .filter-content{display:flex;align-items:center;gap:6px;pointer-events:none}
 
        /* Dropdown Styles */
        .dropdown-control-wrapper{position:relative;display:inline-flex;align-items:center;vertical-align:middle;min-width:90px}
        .dropdown-icon-chevron{position:absolute;right:6px;pointer-events:none;font-size:0.75rem;z-index:2}
        .revision-select{border:1px solid #ccc !important;background-color:white !important;color:${ACCENT} !important;border-radius:4px !important;padding:4px 20px 4px 6px !important;font-size:0.85rem !important;appearance:none !important;cursor:pointer;width:100%}
        .revision-select:focus{outline:1px solid ${ACCENT}}
        .status-select{min-width:90px;padding:4px 20px 4px 6px !important;border-radius:4px;font-weight:500;color:white;border:none;appearance:none;cursor:pointer;font-size:0.85rem;text-align:center;width:100%}
        .status-select option{color:black !important;background-color:white !important;padding:4px 8px}
        .status-container{display:inline-flex;border-radius:4px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,0.1);min-width:90px}
 
        /* Navigation Controls */
        .navigation-controls{background:#f8f9fa;border-top:1px solid #dee2e6;padding:12px 16px;display:flex;align-items:center;justify-content:flex-end}
        .nav-buttons{display:flex;gap:8px}
        .nav-button{padding:8px 16px;border:1px solid ${ACCENT};background:white;color:${ACCENT};border-radius:4px;display:flex;align-items:center;gap:8px;cursor:pointer;transition:all 0.2s;font-size:0.85rem;font-weight:500}
        .nav-button:hover{background:${ACCENT};color:white}
        .nav-button:disabled{border-color:#ccc;color:#ccc;cursor:not-allowed}
        .nav-button:disabled:hover{background:white;color:#ccc}
 
        /* Responsive Design */
        .table-responsive{overflow-x:auto;overflow-y:auto;max-height:500px;width:100%}
        .table-container{background:white;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);overflow:hidden;margin-bottom:20px}
 
        /* Mobile Responsive */
        @media (max-width: 768px) {
          .tbl th, .tbl td {
            padding: 0.5rem 0.25rem;
            font-size: 0.8rem;
          }
          .primary-button {
            font-size: 0.75rem !important;
            padding: 4px 8px !important;
          }
          .search-input-container {
            max-width: 150px;
          }
          .nav-button {
            padding: 6px 12px;
            font-size: 0.75rem;
          }
        }
 
        @media (max-width: 576px) {
          .tbl {
            font-size: 0.75rem;
          }
          .tbl th, .tbl td {
            padding: 0.375rem 0.125rem;
            font-size: 0.75rem;
          }
          .search-input-container {
            max-width: 120px;
          }
          .primary-button span {
            display: none;
          }
          .primary-button {
            padding: 6px !important;
          }
          .filter-content span {
            display: none;
          }
        }
      `}</style>
 
      <div className="flex-1">
        <div className="px-3 sm:px-4 lg:px-6 py-4">
          <div className="flex items-center gap-2 mb-2">
            <button className="primary-button" onClick={backToTasks} title="Back to Tasks">
              <FaChevronLeft /> <span className="hidden sm:inline">Back</span>
            </button>
            <h2 className="section-title gap-2">
              <FaTasks /> <span className="hidden sm:inline">Oral Defense</span>
            </h2>
          </div>
          <hr className="my-3 divider" />
 
          {/* Top Control Buttons */}
          <div className="flex items-center gap-2 mb-3">
            <button className="primary-button" onClick={() => handleCreateTask(setTasks)}>
              <FaPlus size={14}/> <span className="hidden sm:inline">Create Task</span>
            </button>
          </div>
 
          {/* Search, Delete Selected, and Filter - Repositioned like old version */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
            <div className="search-input-container" style={{ maxWidth: '200px' }}>
                <FaSearch className="search-icon" />
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search Team"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
 
            <div className="flex items-center gap-2 flex-wrap">
                {selectMode && (
                    <button
                        className="primary-button"
                        onClick={() => { setSelectMode(false); setSelectedIds([]); }}
                    >
                        <span className="hidden sm:inline">Cancel</span>
                    </button>
                )}
 
                <button
                    className={`primary-button ${selectMode ? 'delete-selected-button-white' : ''}`}
                    onClick={() => (selectMode ? deleteSelected() : setSelectMode(true))}
                    disabled={selectMode && selectedIds.length === 0}
                >
                    <FaTrash size={14}/> 
                    <span className="hidden sm:inline">{selectMode ? `Delete Selected` : 'Delete'}</span>
                </button>
 
                <div className="filter-wrapper">
                    <span className="filter-content">
                        <FaFilter size={14}/> <span className="hidden sm:inline">Filter: {filter}</span>
                    </span>
                    <select
                        className="filter-select"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        style={{ color: 'black', backgroundColor: 'white' }}
                    >
                        {FILTER_OPTS.map((option) => (
                            <option key={option} value={option} style={{ color: 'black', backgroundColor: 'white' }}>{option}</option>
                        ))}
                    </select>
                </div>
            </div>
          </div>
 
          {/* TABLE CONTAINER WITH NAVIGATION */}
          <div className="table-container">
            <div className="table-content">
              {renderTable()}
            </div>
 
            {/* NAVIGATION CONTROLS - RIGHT SIDE ONLY */}
            <div className="navigation-controls">
              <div className="nav-buttons">
                <button 
                  className="nav-button"
                  onClick={handlePrevView}
                  disabled={currentView === 0}
                >
                  <FaChevronLeft size={12} /> <span>Previous</span>
                </button>
                <button 
                  className="nav-button"
                  onClick={handleNextView}
                  disabled={currentView === 1}
                >
                  <span>Next</span> <FaChevronRight size={12} />
                </button>
              </div>
            </div>
          </div>
 
          {menuFor && (
            <div className="kmenu" style={menuPos(menuFor)}>
              <button className="kitem" onClick={() => openUpdate(menuFor)}>
                <FaEdit size={12}/> Update
              </button>
              <button className="kitem" onClick={() => openView(menuFor)}>
                <FaEye size={12}/> View
              </button>
              <button
                className="kitem"
                onClick={() => {
                  const t = tasks.find(x => x.id === menuFor);
                  setMenuFor(null);
                  Swal.fire({
                    icon: "warning",
                    title: "Delete task?",
                    text: clean(t?.task || ""),
                    showCancelButton: true,
                    confirmButtonColor: "#d60606"
                  }).then(res => {
                    if (res.isConfirmed) setTasks(prev => prev.filter(x => x.id !== menuFor));
                  });
                }}
              >
                <FaTrash size={12}/> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
 
export default AdviserOralDef;