// src/components/MemberAdviserTasks.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "../../supabaseClient";

import adviserTasksIcon from "../../assets/adviser-tasks-icon.png";
import searchIcon from "../../assets/search-icon.png";
import filterIcon from "../../assets/filter-icon.png";
import exitIcon from "../../assets/exit-icon.png";
import dropdownIconWhite from "../../assets/dropdown-icon-white.png";

import "../Style/Member/MemberAdviserTasks.css"; // hiwalay na CSS

const MemberAdviserTasks = () => {
  // NEW: simple status filter like MemberTask
  const [statusFilter, setStatusFilter] = useState("All"); // All | To Do | In Progress | To Review | Completed

  // kept (used by per-row status badge)
  const [status, setStatus] = useState("To Review");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // kept search
  const [searchTerm, setSearchTerm] = useState("");

  // (These are now unused for the simple toolbar filter, but left intact if you still want the old popup filter)
  const [filterLabel, setFilterLabel] = useState("Filter");
  const [selectedFilterValue, setSelectedFilterValue] = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [activeFilterCategory, setActiveFilterCategory] = useState(null);

  const [tasks, setTasks] = useState([]);

  const statusDropdownRef = useRef(null);
  const filterDropdownRef = useRef(null);

  const STATUS_OPTIONS = [
    "To Do",
    "In Progress",
    "To Review",
    "Completed",
    "Missed",
  ]; // full list (table might show Missed)
  const TOOLBAR_STATUS_OPTIONS = [
    "To Do",
    "In Progress",
    "To Review",
    "Completed",
  ]; // toolbar filter (4 only)
  const PROJECT_PHASES = [
    "Planning",
    "Design",
    "Development",
    "Testing",
    "Deployment",
    "Review",
  ];

  const getStatusColor = (value) => {
    switch (value) {
      case "To Do":
        return "#FABC3F";
      case "In Progress":
        return "#809D3C";
      case "To Review":
        return "#578FCA";
      case "Completed":
        return "#4CAF50";
      case "Missed":
        return "#D32F2F";
      default:
        return "#ccc";
    }
  };

  // ✅ Load tasks for manager of the signed-in member
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("customUser"));
        if (!storedUser?.group_name) return;

        // Step 1: all users with same group_name
        const { data: groupUsers, error: groupErr } = await supabase
          .from("user_credentials")
          .select("*")
          .eq("group_name", storedUser.group_name);
        if (groupErr) throw groupErr;

        // Step 2: manager (user_roles = 1)
        const manager = (groupUsers || []).find((u) => u.user_roles === 1);
        if (!manager) return;

        // Step 3: fetch tasks for that manager
        const { data: finalDef, error: finalErr } = await supabase
          .from("adviser_final_def")
          .select("*")
          .eq("manager_id", manager.id);
        if (finalErr) throw finalErr;

        const { data: oralDef, error: oralErr } = await supabase
          .from("adviser_oral_def")
          .select("*")
          .eq("manager_id", manager.id);
        if (oralErr) throw oralErr;

        setTasks([...(finalDef || []), ...(oralDef || [])]);
      } catch (err) {
        console.error("❌ Error fetching tasks:", err.message);
      }
    };

    fetchTasks();
  }, []);

  // ✅ Close dropdowns on outside click (kept for per-row status & legacy popup)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target)
      ) {
        setShowStatusDropdown(false);
      }
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target)
      ) {
        setShowFilterDropdown(false);
        setActiveFilterCategory(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClearFilter = (e) => {
    e.stopPropagation();
    setSelectedFilterValue("");
    setFilterLabel("Filter");
    setShowFilterDropdown(false);
    setActiveFilterCategory(null);
  };

  // ✅ Derived list with search + simple 4-status filter (like MemberTask)
  const filteredTasks = useMemo(() => {
    const q = (searchTerm || "").trim().toLowerCase();

    return (tasks || []).filter((task) => {
      const matchesStatus =
        statusFilter === "All"
          ? true
          : (task.status || "").toLowerCase() === statusFilter.toLowerCase();

      if (!q) return matchesStatus;

      const haystack = [
        task.group_name,
        task.task,
        task.subtask,
        task.elements,
        task.methodology,
        task.project_phase,
        task.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && haystack.includes(q);
    });
  }, [tasks, searchTerm, statusFilter]);

  return (
    <div className="page-wrapper">
      <h2 className="section-title">
        <img
          src={adviserTasksIcon}
          alt="Adviser Tasks Icon"
          className="icon-image"
        />
        Adviser Tasks
      </h2>
      <hr className="divider" />

      <div className="tasks-container">
        {/* Toolbar: search (left) + simple status filter (right) */}
        <div className="search-filter-wrapper">
          <div className="search-bar">
            <img src={searchIcon} alt="Search Icon" className="search-icon" />
            <input
              type="text"
              placeholder="Search"
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Simple filter select like MemberTask (4 options) */}
          <select
            className="toolbar-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All</option>
            {TOOLBAR_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="tasks-table-wrapper min-h-screen flex flex-col bg-white pt-5">
          <table className="tasks-table">
            <thead>
              <tr>
                <th>NO</th>
                <th>Team</th>
                <th>Tasks</th>
                <th>Subtasks</th>
                <th>Elements</th>
                <th>Date Created</th>
                <th>Due Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Methodology</th>
                <th>Project Phase</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task, index) => (
                  <tr key={task.id}>
                    <td>{index + 1}.</td>
                    <td>{task.group_name}</td>
                    <td>{task.task}</td>
                    <td>{task.subtask || "EMPTY"}</td>
                    <td>{task.elements || "EMPTY"}</td>
                    <td>{task.date_created}</td>
                    <td>{task.due_date}</td>
                    <td>{task.time}</td>
                    <td className="status-cell">
                      {/* Per-row status badge/dropdown (unchanged) */}
                      <div className="dropdown-wrapper" ref={statusDropdownRef}>
                        <div
                          className="status-badge"
                          style={{
                            backgroundColor: getStatusColor(task.status),
                          }}
                          onClick={() =>
                            setShowStatusDropdown(!showStatusDropdown)
                          }
                        >
                          <span className="status-text">{task.status}</span>
                          <img
                            src={dropdownIconWhite}
                            alt="Dropdown Icon"
                            className="status-dropdown-icon"
                          />
                        </div>
                        {showStatusDropdown && (
                          <div className="dropdown-menu">
                            {STATUS_OPTIONS.map((opt) => (
                              <div
                                key={opt}
                                className="dropdown-item"
                                onClick={() => {
                                  setStatus(opt);
                                  setShowStatusDropdown(false);
                                }}
                              >
                                {opt}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{task.methodology}</td>
                    <td>{task.project_phase}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11">No tasks found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MemberAdviserTasks;
