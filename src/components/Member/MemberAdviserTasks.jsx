// src/components/MemberAdviserTasks.jsx
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../supabaseClient";

import adviserTasksIcon from "../../assets/adviser-tasks-icon.png"; 
import searchIcon from "../../assets/search-icon.png";
import filterIcon from "../../assets/filter-icon.png";
import exitIcon from "../../assets/exit-icon.png";
import dropdownIconWhite from "../../assets/dropdown-icon-white.png";

import "../Style/Member/MemberAdviserTasks.css"; // hiwalay na CSS

const MemberAdviserTasks = () => {
  const [status, setStatus] = useState("To Review");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [filterLabel, setFilterLabel] = useState("Filter");
  const [selectedFilterValue, setSelectedFilterValue] = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [activeFilterCategory, setActiveFilterCategory] = useState(null);

  const [tasks, setTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const statusDropdownRef = useRef(null);
  const filterDropdownRef = useRef(null);

  const STATUS_OPTIONS = ["To Do", "In Progress", "To Review", "Completed", "Missed"];
  const PROJECT_PHASES = ["Planning", "Design", "Development", "Testing", "Deployment", "Review"];

  const getStatusColor = (value) => {
    switch (value) {
      case "To Do": return "#FABC3F";
      case "In Progress": return "#809D3C";
      case "To Review": return "#578FCA";
      case "Completed": return "#4CAF50";
      case "Missed": return "#D32F2F";
      default: return "#ccc";
    }
  };

  // ✅ Load tasks for manager of the signed-in member
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("customUser"));
        console.log("👤 Logged-in Member:", storedUser);

        if (!storedUser?.group_name) {
          console.warn("⚠️ No group_name found for member.");
          return;
        }

        // Step 1: find all users with same group_name
        const { data: groupUsers, error: groupErr } = await supabase
          .from("user_credentials")
          .select("*")
          .eq("group_name", storedUser.group_name);

        if (groupErr) throw groupErr;

        console.log("📌 Group users:", groupUsers);

        // Step 2: identify manager (user_roles = 1)
        const manager = groupUsers.find((u) => u.user_roles === 1);
        if (!manager) {
          console.warn("⚠️ No manager found for group:", storedUser.group_name);
          return;
        }

        console.log("✅ Found Manager:", manager);

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

        console.log("📌 adviser_final_def:", finalDef);
        console.log("📌 adviser_oral_def:", oralDef);

        setTasks([...(finalDef || []), ...(oralDef || [])]);
      } catch (err) {
        console.error("❌ Error fetching tasks:", err.message);
      }
    };

    fetchTasks();
  }, []);

  // ✅ Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setShowStatusDropdown(false);
      }
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
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

  // ✅ Apply search and filter
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.group_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.task?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilterValue
      ? task.status === selectedFilterValue || task.project_phase === selectedFilterValue
      : true;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="page-wrapper">
      <h2 className="section-title">
        <img src={adviserTasksIcon} alt="Adviser Tasks Icon" className="icon-image" />
        Adviser Tasks
      </h2>
      <hr className="divider" />

      <div className="tasks-container">
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

          <div className="filter-wrapper" ref={filterDropdownRef}>
            <button
              type="button"
              className="filter-button"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            >
              <img src={filterIcon} alt="Filter Icon" className="filter-icon" />
              {selectedFilterValue || filterLabel}
              {selectedFilterValue && (
                <img
                  src={exitIcon}
                  alt="Clear Filter"
                  className="clear-icon"
                  onClick={handleClearFilter}
                />
              )}
            </button>
            {showFilterDropdown && (
              <div className="dropdown-menu filter-dropdown-menu">
                {!activeFilterCategory ? (
                  <>
                    <div
                      className="dropdown-item"
                      onClick={() => setActiveFilterCategory("Status")}
                    >
                      Status
                    </div>
                    <div
                      className="dropdown-item"
                      onClick={() => setActiveFilterCategory("Project Phase")}
                    >
                      Project Phase
                    </div>
                  </>
                ) : (
                  <>
                    <div className="dropdown-title">{activeFilterCategory}</div>
                    <hr />
                    {(activeFilterCategory === "Status" ? STATUS_OPTIONS : PROJECT_PHASES).map(
                      (opt) => (
                        <div
                          key={opt}
                          className="dropdown-item"
                          onClick={() => {
                            setSelectedFilterValue(opt);
                            setFilterLabel(activeFilterCategory);
                            setShowFilterDropdown(false);
                            setActiveFilterCategory(null);
                          }}
                        >
                          {opt}
                        </div>
                      )
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="tasks-table-wrapper">
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
                      <div className="dropdown-wrapper" ref={statusDropdownRef}>
                        <div
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(task.status) }}
                          onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                        >
                          <span className="status-text">{task.status}</span>
                          <img src={dropdownIconWhite} alt="Dropdown Icon" className="status-dropdown-icon" />
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
