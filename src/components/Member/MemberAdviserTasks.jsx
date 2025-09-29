// src/components/MemberAdviserTasks.jsx
import React, { useState, useEffect, useRef } from "react";
import adviserTasksIcon from "../../assets/adviser-tasks-icon.png"; 
import searchIcon from "../../assets/search-icon.png";
import filterIcon from "../../assets/filter-icon.png";
import exitIcon from "../../assets/exit-icon.png";
import dropdownIconWhite from "../../assets/dropdown-icon-white.png";
import "../Style/Member/MemberAdviserTasks.css"; // ⬅️ hiwalay na CSS

const MemberAdviserTasks = () => {
  const [status, setStatus] = useState("To Review");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [filterLabel, setFilterLabel] = useState("Filter");
  const [selectedFilterValue, setSelectedFilterValue] = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [activeFilterCategory, setActiveFilterCategory] = useState(null);

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
            <input type="text" placeholder="Search" className="search-input" />
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
                <th>Revision No.</th>
                <th>Status</th>
                <th>Methodology</th>
                <th>Project Phase</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1.</td>
                <td>Team Phoenix</td>
                <td>Prototype Implementation</td>
                <td>API Integration</td>
                <td>Backend Services</td>
                <td>Aug 1, 2025</td>
                <td>Aug 15, 2025</td>
                <td>10:00 AM</td>
                <td className="revision">1st Revision</td>
                <td className="status-cell">
                  <div className="dropdown-wrapper" ref={statusDropdownRef}>
                    <div
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(status) }}
                      onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                    >
                      <span className="status-text">{status}</span>
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
                <td>Agile</td>
                <td>Development</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MemberAdviserTasks;
