import React, { useState, useEffect, useRef } from "react";
import taskIcon from "../../../assets/tasks-icon.png";
import searchIcon from "../../../assets/search-icon.png";
import filterIcon from "../../../assets/filter-icon.png";
import exitIcon from "../../../assets/exit-icon.png";
import dueDateIcon from "../../../assets/due-date-icon.png";
import timeIcon from "../../../assets/time-icon.png";
import redDropdownIcon from "../../../assets/red-dropdown-icon.png";
import dropdownIconWhite from "../../../assets/dropdown-icon-white.png";
import { supabase } from "../../../supabaseClient";

export default function AdviserOralRecord() {
  const [tasks, setTasks] = useState([]);
  const [status, setStatus] = useState("To Review");
  const [revision, setRevision] = useState("1st Revision");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showRevisionDropdown, setShowRevisionDropdown] = useState(false);
  const [filterCategory, setFilterCategory] = useState("Filter");
  const [filterValue, setFilterValue] = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [activeSubFilter, setActiveSubFilter] = useState(null);

  const revisionRef = useRef(null);
  const statusRef = useRef(null);
  const filterRef = useRef(null);

  const STATUS_OPTIONS = ["To Do", "In Progress", "To Review", "Completed"];
  const REVISION_OPTIONS = [
    "1st Revision",
    "2nd Revision",
    "3rd Revision",
    "4th Revision",
    "5th Revision",
  ];
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
        return "#AA60C8";
      default:
        return "#ccc";
    }
  };

  // ✅ Fetch tasks
  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("adviser_oral_def")
      .select("*");
    if (error) {
      console.error("Error fetching tasks:", error);
    } else {
      setTasks(data || []);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // ✅ Update status
  const handleUpdateStatus = async (taskId, newStatus) => {
    const { error } = await supabase
      .from("adviser_oral_def")
      .update({ status: newStatus })
      .eq("id", taskId);

    if (error) {
      console.error("Error updating status:", error);
    } else {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
      setShowStatusDropdown(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (revisionRef.current && !revisionRef.current.contains(e.target)) {
        setShowRevisionDropdown(false);
      }
      if (statusRef.current && !statusRef.current.contains(e.target)) {
        setShowStatusDropdown(false);
      }
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilterDropdown(false);
        setActiveSubFilter(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClearFilter = (e) => {
    e.stopPropagation();
    setFilterCategory("Filter");
    setFilterValue("");
    setShowFilterDropdown(false);
    setActiveSubFilter(null);
  };

  return (
    <div className="page-wrapper">
      <h2 className="section-title">
        <img src={taskIcon} alt="Tasks Icon" className="icon-image" />
        Oral Defense
      </h2>
      <hr className="divider" />

      <div className="header-wrapper">
        <div className="tasks-container">
          <div className="search-filter-wrapper">
            <div className="search-bar">
              <img src={searchIcon} alt="Search" className="search-icon" />
              <input type="text" placeholder="Search" className="search-input" />
            </div>

            <div className="filter-wrapper" ref={filterRef}>
              <button
                type="button"
                className="filter-button"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              >
                <img src={filterIcon} alt="Filter" className="filter-icon" />
                {filterValue || filterCategory}
                {filterValue && (
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
                  {!activeSubFilter ? (
                    <div
                      className="dropdown-item"
                      onClick={() => setActiveSubFilter("Project Phase")}
                    >
                      Project Phase
                    </div>
                  ) : (
                    <>
                      <div className="dropdown-title">{activeSubFilter}</div>
                      <hr />
                      {PROJECT_PHASES.map((opt) => (
                        <div
                          key={opt}
                          className="dropdown-item"
                          onClick={() => {
                            setFilterValue(opt);
                            setFilterCategory(activeSubFilter);
                            setShowFilterDropdown(false);
                            setActiveSubFilter(null);
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
                <th className="center-text">Assigned</th>
                <th className="center-text">Tasks</th>
                <th className="center-text">Subtasks</th>
                <th className="center-text">Elements</th>
                <th className="center-text">Date Created</th>
                <th className="center-text">Due Date</th>
                <th className="center-text">Time</th>
                <th className="center-text">Date Completed</th>
                <th className="center-text">Revision No.</th>
                <th className="center-text">Status</th>
                <th className="center-text">Methodology</th>
                <th className="center-text">Project Phase</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t, index) => (
                <tr key={t.id}>
                  <td className="center-text">{index + 1}.</td>
                  <td className="center-text">{t.manager_id}</td>
                  <td className="center-text">{t.task}</td>
                  <td className="center-text">{t.subtask}</td>
                  <td className="center-text">{t.elements}</td>
                  <td className="center-text">{t.date_created}</td>
                  <td className="center-text">
                    <img src={dueDateIcon} alt="Due Date" className="inline-icon" />
                    {t.due_date}
                  </td>
                  <td className="center-text">
                    <img src={timeIcon} alt="Time" className="inline-icon" />
                    {t.time}
                  </td>
                  <td className="center-text">
                    {t.status === "Completed" ? new Date().toLocaleDateString() : ""}
                  </td>
                  <td className="center-text revision-cell" ref={revisionRef}>
                    <div
                      className="dropdown-wrapper"
                      onClick={() => setShowRevisionDropdown(!showRevisionDropdown)}
                    >
                      <div className="revision-badge">
                        {revision}
                        <img
                          src={redDropdownIcon}
                          alt="▼"
                          className="revision-dropdown-icon"
                        />
                      </div>
                      {showRevisionDropdown && (
                        <div className="dropdown-menu">
                          {REVISION_OPTIONS.map((opt) => (
                            <div
                              key={opt}
                              className="dropdown-item"
                              onClick={() => {
                                setRevision(opt);
                                setShowRevisionDropdown(false);
                              }}
                            >
                              {opt}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="center-text status-cell" ref={statusRef}>
                    <div className="dropdown-wrapper">
                      <div
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(t.status) }}
                        onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                      >
                        {t.status}
                        <img
                          src={dropdownIconWhite}
                          alt="▼"
                          className="status-dropdown-icon"
                        />
                      </div>
                      {showStatusDropdown && (
                        <div className="dropdown-menu">
                          {STATUS_OPTIONS.map((opt) => (
                            <div
                              key={opt}
                              className="dropdown-item"
                              onClick={() => handleUpdateStatus(t.id, opt)}
                            >
                              {opt}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="center-text">{t.methodology}</td>
                  <td className="center-text">{t.project_phase}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✅ CSS */}
      <style>{`
        * { box-sizing: border-box; }
        .page-wrapper { width: 100%; padding: 40px 20px; }
        .section-title { font-size: 20px; font-weight: bold; color: #3B0304; margin-bottom: 5px; display: flex; align-items: center; gap: 8px; }
        .icon-image { width: 24px; height: 24px; }
        .divider { border: none; border-top: 2px solid #3B0304; margin-bottom: 20px; }
        .header-wrapper { display: flex; gap: 20px; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap; }
        .tasks-container { background: #fff; border-radius: 20px; width: 100%; box-shadow: 0 2px 10px rgba(0,0,0,0.1); padding: 20px; border: 1px solid #B2B2B2; min-width: 320px; flex-grow: 1; }
        .search-filter-wrapper { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 12px; }
        .search-bar { display: flex; align-items: center; background: #fff; border: 1px solid #3B0304; border-radius: 12px; padding: 6px 12px; width: 200px; height: 34px; }
        .search-icon { width: 18px; height: 18px; margin-right: 6px; }
        .search-input { border: none; outline: none; width: 100%; font-size: 14px; height: 20px; }
        .filter-wrapper { position: relative; width: 160px; user-select: none; height: 34px; }
        .filter-button { display: flex; align-items: center; gap: 6px; border: 1px solid #3B0304; border-radius: 12px; padding: 6px 12px; width: 100%; background: #fff; font-size: 14px; color: #3B0304; justify-content: flex-start; height: 100%; cursor: pointer; }
        .filter-icon { width: 18px; height: 18px; }
        .clear-icon { margin-left: auto; width: 16px; height: 16px; cursor: pointer; }
        .dropdown-menu { position: absolute; top: calc(100% + 12px); left: 0; width: 100%; background: #fff; border: 1px solid #B2B2B2; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 10; padding: 4px 0; }
        .filter-dropdown-menu { width: 160px; }
        .dropdown-title { font-weight: bold; padding: 8px 12px; font-size: 14px; }
        .dropdown-item { padding: 10px 12px; cursor: pointer; font-size: 14px; }
        .dropdown-item:hover { background-color: #f0f0f0; }
        .tasks-table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .tasks-table th, .tasks-table td { padding: 12px 10px; text-align: center; white-space: nowrap; }
        .tasks-table th { background-color: #fafafa; font-weight: bold; color: #000; }
        .tasks-table tbody tr:nth-child(even) { background-color: #fafafa; }
        .center-text { text-align: center; }
        .inline-icon { width: 16px; height: 16px; margin-right: 4px; }
        .revision-cell .revision-badge { display: inline-flex; align-items: center; justify-content: space-between; padding: 6px 12px; border: 1px solid #3B0304; border-radius: 12px; font-weight: bold; color: #3B0304; cursor: pointer; width: 120px; }
        .revision-dropdown-icon { width: 12px; height: 12px; margin-left: 6px; }
        .dropdown-wrapper { position: relative; display: inline-block; width: 120px; }
        .status-badge { display: inline-flex; align-items: center; justify-content: space-between; padding: 6px 12px; border-radius: 12px; color: #fff; cursor: pointer; font-weight: bold; width: 100%; }
        .status-dropdown-icon { width: 12px; height: 12px; margin-left: 6px; }
      `}</style>
    </div>
  );
}
