import React, { useState, useEffect, useRef } from "react";
import taskRecordIcon from "../../assets/tasks-record-icon.png"; // Updated icon
import searchIcon from "../../assets/search-icon.png";
import filterIcon from "../../assets/filter-icon.png";
import exitIcon from "../../assets/exit-icon.png";
import "../Style/Member/MemberTitleDefense.css"; // <-- Import ng CSS file

const MemberTitleDefense = () => {
  const [filterCategory, setFilterCategory] = useState("Filter");
  const [filterValue, setFilterValue] = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [activeSubFilter, setActiveSubFilter] = useState(null);

  const filterDropdownRef = useRef(null);

  const PROJECT_PHASES = ["Planning", "Design", "Development", "Testing", "Deployment", "Review"];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
        setActiveSubFilter(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
        <img src={taskRecordIcon} alt="Tasks Record Icon" className="icon-image" />
        Tasks Record
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
            <tr>
              <td className="center-text">1.</td>
              <td className="center-text">Harzwel Zhen B Lacson</td>
              <td className="center-text">Title Proposal Writing</td>
              <td className="center-text">Dec 1, 2024</td>
              <td className="center-text">Dec 5, 2024</td>
              <td className="center-text">9:00 AM</td>
              <td className="center-text">Dec 5, 2024</td>
              <td className="center-text revision">No Revision</td>
              <td className="center-text status-cell">
                <span className="status-text">Completed</span>
              </td>
              <td className="center-text">Agile</td>
              <td className="center-text">Planning</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MemberTitleDefense;
