// src/components/tasks/pm-adviser-tasks.jsx
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../supabaseClient";

import adviserTasksIcon from "../../assets/adviser-tasks-icon.png";
import searchIcon from "../../assets/search-icon.png";
import filterIcon from "../../assets/filter-icon.png";
import exitIcon from "../../assets/exit-icon.png";
import dropdownIconWhite from "../../assets/dropdown-icon-white.png";

import "../Style/ProjectManager/ManagerAdviserTask.css";

const ManagerAdviserTask = () => {
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

  const STATUS_OPTIONS = ["To Do", "In Progress", "To Review"];
  const FILTER_STATUS_OPTIONS = ["To Do", "In Progress", "To Review", "Completed", "Missed"];
  const PROJECT_PHASES = ["Planning", "Design", "Development", "Testing", "Deployment", "Review"];

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

  // fetch tasks for logged-in manager
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        // ✅ use "customUser" para match sa Signin.jsx
        const storedUser = JSON.parse(localStorage.getItem("customUser"));
        console.log("📌 Loaded customUser:", storedUser);

        if (!storedUser?.id) {
          console.warn("⚠️ No manager ID found in localStorage.");
          return;
        }

        const managerUuid = storedUser.id; // 🔑 primary key from user_credentials
        console.log("👤 Manager UUID used for filter:", managerUuid);

        // fetch from final_def
        const { data: finalDef, error: finalErr } = await supabase
          .from("adviser_final_def")
          .select("*")
          .eq("manager_id", managerUuid);

        if (finalErr) throw finalErr;

        // fetch from oral_def
        const { data: oralDef, error: oralErr } = await supabase
          .from("adviser_oral_def")
          .select("*")
          .eq("manager_id", managerUuid);

        if (oralErr) throw oralErr;

        console.log("📌 adviser_final_def:", finalDef);
        console.log("📌 adviser_oral_def:", oralDef);

        // merge results
        const merged = [...(finalDef || []), ...(oralDef || [])];
        setTasks(merged);
      } catch (err) {
        console.error("❌ Error fetching tasks:", err.message);
      }
    };

    fetchTasks();
  }, []);

  // dropdown close on outside click
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleClearFilter = (e) => {
    e.stopPropagation();
    setSelectedFilterValue("");
    setFilterLabel("Filter");
    setShowFilterDropdown(false);
    setActiveFilterCategory(null);
  };

  // filter + search
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
                    {(activeFilterCategory === "Status"
                      ? FILTER_STATUS_OPTIONS
                      : PROJECT_PHASES
                    ).map((opt) => (
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
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <table className="tasks-table">
          <thead>
            <tr>
              <th className="center-text">NO</th>
              <th className="center-text">Team</th>
              <th className="center-text">Tasks</th>
              <th className="center-text">Subtasks</th>
              <th className="center-text">Elements</th>
              <th className="center-text">Date Created</th>
              <th className="center-text">Due Date</th>
              <th className="center-text">Time</th>
              <th className="center-text">Status</th>
              <th className="center-text">Methodology</th>
              <th className="center-text">Project Phase</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task, index) => (
                <tr key={task.id}>
                  <td className="center-text">{index + 1}.</td>
                  <td className="center-text">{task.group_name}</td>
                  <td className="center-text">{task.task}</td>
                  <td className="center-text">{task.subtask || "EMPTY"}</td>
                  <td className="center-text">{task.elements || "EMPTY"}</td>
                  <td className="center-text">{task.date_created}</td>
                  <td className="center-text">{task.due_date}</td>
                  <td className="center-text">{task.time}</td>
                  <td className="center-text status-cell">
                    <div className="dropdown-wrapper" ref={statusDropdownRef}>
                      <div
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(task.status) }}
                        onClick={() => setShowStatusDropdown(!showStatusDropdown)}
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
                  <td className="center-text">{task.methodology}</td>
                  <td className="center-text">{task.project_phase}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="11" className="center-text">
                  No tasks found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManagerAdviserTask;
