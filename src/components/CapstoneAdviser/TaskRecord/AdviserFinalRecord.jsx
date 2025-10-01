import React, { useState, useEffect, useRef } from "react";
import taskIcon from "../../../assets/tasks-icon.png";
import searchIcon from "../../../assets/search-icon.png";
import filterIcon from "../../../assets/filter-icon.png";
import exitIcon from "../../../assets/exit-icon.png";
import dueDateIcon from "../../../assets/due-date-icon.png";
import timeIcon from "../../../assets/time-icon.png";
import redDropdownIcon from "../../../assets/red-dropdown-icon.png";
import dropdownIconWhite from "../../../assets/dropdown-icon-white.png";

const AdviserFinalRecord = () => {
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

  // Sample data array for demonstration
  const tasks = [
    {
      id: 1,
      assigned: "John Doe",
      task: "Final Defense Task Example",
      subtask: "Prepare Slides",
      elements: "Conclusion, Demo",
      dateCreated: "Sep 10, 2025",
      dueDate: "Sep 15, 2025",
      time: "3:00 PM",
      dateCompleted: "Sep 16, 2025",
      revision: "1st Revision",
      status: "Completed",
      methodology: "Quantitative",
      projectPhase: "Deployment",
    },
    {
      id: 2,
      assigned: "Jane Smith",
      task: "Literature Review",
      subtask: "Find 10 sources",
      elements: "Sources, Notes",
      dateCreated: "Sep 1, 2025",
      dueDate: "Sep 5, 2025",
      time: "10:00 AM",
      dateCompleted: null,
      revision: "1st Revision",
      status: "To Do",
      methodology: "Qualitative",
      projectPhase: "Planning",
    },
    {
      id: 3,
      assigned: "John Doe",
      task: "Data Analysis",
      subtask: "Run statistical tests",
      elements: "Charts, Tables",
      dateCreated: "Sep 12, 2025",
      dueDate: "Sep 20, 2025",
      time: "2:00 PM",
      dateCompleted: "Sep 22, 2025",
      revision: "2nd Revision",
      status: "Completed",
      methodology: "Quantitative",
      projectPhase: "Development",
    },
    {
      id: 4,
      assigned: "Jane Smith",
      task: "Prototype Development",
      subtask: "Build frontend UI",
      elements: "UI Components, APIs",
      dateCreated: "Oct 1, 2025",
      dueDate: "Oct 15, 2025",
      time: "9:00 AM",
      dateCompleted: null,
      revision: "1st Revision",
      status: "In Progress",
      methodology: "Agile",
      projectPhase: "Development",
    },
  ];

  // Filter the tasks to only show those with a status of "Completed"
  const completedTasks = tasks.filter(task => task.status === "Completed");

  return (
    <div className="page-wrapper">
      <h2 className="section-title">
        <img src={taskIcon} alt="Tasks Icon" className="icon-image" />
        Final Defense
      </h2>
      <hr className="divider" />

      <div className="header-wrapper">
        <div className="tasks-container">
          <div className="search-filter-wrapper">
            <div className="search-bar">
              <img src={searchIcon} alt="Search" className="search-icon" />
              <input
                type="text"
                placeholder="Search"
                className="search-input"
              />
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
              {completedTasks.map((task, index) => (
                <tr key={task.id}>
                  <td className="center-text">{index + 1}.</td>
                  <td className="center-text">{task.assigned}</td>
                  <td className="center-text">{task.task}</td>
                  <td className="center-text">{task.subtask}</td>
                  <td className="center-text">{task.elements}</td>
                  <td className="center-text">{task.dateCreated}</td>
                  <td className="center-text">
                    <img src={dueDateIcon} alt="Due Date" className="inline-icon" />
                    {task.dueDate}
                  </td>
                  <td className="center-text">
                    <img src={timeIcon} alt="Time" className="inline-icon" />
                    {task.time}
                  </td>
                  <td className="center-text">{task.dateCompleted}</td>
                  <td className="center-text revision-cell" ref={revisionRef}>
                    <div
                      className="dropdown-wrapper"
                      onClick={() => setShowRevisionDropdown(!showRevisionDropdown)}
                    >
                      <div className="revision-badge">
                        {task.revision}
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
                        style={{ backgroundColor: getStatusColor(task.status) }}
                        onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                      >
                        {task.status}
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
                  <td className="center-text">{task.projectPhase}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        * {
          box-sizing: border-box;
        }
        .page-wrapper {
          width: 100%;
          padding: 40px 20px;
        }
        .section-title {
          font-size: 20px;
          font-weight: bold;
          color: #3B0304;
          margin-bottom: 5px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .icon-image {
          width: 24px;
          height: 24px;
        }
        .divider {
          border: none;
          border-top: 2px solid #3B0304;
          margin-bottom: 20px;
        }
        .header-wrapper {
          display: flex;
          gap: 20px;
          align-items: flex-start;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .tasks-container {
          background: #fff;
          border-radius: 20px;
          width: 100%;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          padding: 20px;
          border: 1px solid #B2B2B2;
          min-width: 320px;
          flex-grow: 1;
        }
        .search-filter-wrapper {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          gap: 12px;
        }
        .search-bar {
          display: flex;
          align-items: center;
          background: #fff;
          border: 1px solid #3B0304;
          border-radius: 12px;
          padding: 6px 12px;
          width: 200px;
          height: 34px;
        }
        .search-icon {
          width: 18px;
          height: 18px;
          margin-right: 6px;
        }
        .search-input {
          border: none;
          outline: none;
          width: 100%;
          font-size: 14px;
          height: 20px;
        }
        .filter-wrapper {
          position: relative;
          width: 160px;
          user-select: none;
          height: 34px;
        }
        .filter-button {
          display: flex;
          align-items: center;
          gap: 6px;
          border: 1px solid #3B0304;
          border-radius: 12px;
          padding: 6px 12px;
          width: 100%;
          background: #fff;
          font-size: 14px;
          color: #3B0304;
          font-weight: normal;
          justify-content: flex-start;
          height: 100%;
          cursor: pointer;
        }
        .filter-icon {
          width: 18px;
          height: 18px;
        }
        .clear-icon {
          margin-left: auto;
          width: 16px;
          height: 16px;
          cursor: pointer;
        }
        .dropdown-menu {
          position: absolute;
          top: calc(100% + 12px);
          left: 0;
          width: 100%;
          background: #fff;
          border: 1px solid #B2B2B2;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          z-index: 10;
          padding: 4px 0;
        }
        .filter-dropdown-menu {
          width: 160px;
        }
        .dropdown-title {
          font-weight: bold;
          padding: 8px 12px;
          font-size: 14px;
        }
        .dropdown-item {
          padding: 10px 12px;
          cursor: pointer;
          font-size: 14px;
        }
        .dropdown-item:hover {
          background-color: #f0f0f0;
        }
        .tasks-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        .tasks-table th,
        .tasks-table td {
          padding: 12px 10px;
          text-align: center;
          white-space: nowrap;
        }
        .tasks-table th {
          background-color: #fafafa;
          font-weight: bold;
          color: #000;
        }
        .tasks-table tbody tr:nth-child(even) {
          background-color: #fafafa;
        }
        .center-text {
          text-align: center;
        }
        .inline-icon {
          width: 16px;
          height: 16px;
          margin-right: 4px;
        }
        .revision-cell .revision-badge {
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 12px;
          border: 1px solid #3B0304;
          border-radius: 12px;
          font-weight: bold;
          color: #3B0304;
          cursor: pointer;
          width: 120px;
        }
        .revision-dropdown-icon {
          width: 12px;
          height: 12px;
          margin-left: 6px;
        }
        .dropdown-wrapper {
          position: relative;
          display: inline-block;
          width: 120px;
        }
        .status-badge {
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 12px;
          border-radius: 12px;
          color: #fff;
          cursor: pointer;
          font-weight: bold;
          width: 100%;
        }
        .status-dropdown-icon {
          width: 12px;
          height: 12px;
          margin-left: 6px;
        }
      `}</style>
    </div>
  );
};

export default AdviserFinalRecord;