import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import taskIcon from "../../../assets/tasks-icon.png";
import createTasksIcon from "../../../assets/create-tasks-icon.png";
import searchIcon from "../../../assets/search-icon.png";
import "../../Style/Adviser/Task/AdviserOralDef.css";
import Swal from "sweetalert2";

// Import logic functions
import {
  fetchTasksFromDB,
  handleCreateTask,
  handleUpdateStatus,
} from "../../../services/Adviser/AdCapsTask";

import {
  FaCalendarAlt,
  FaClock,
  FaChevronDown,
  FaEllipsisV,
  FaEdit,
  FaEye,
  FaTrash,
  FaSave,
  FaTimesCircle,
  FaSearch,
  FaFilter,
  FaPlus,
  FaTasks,
  FaChevronLeft,
  FaChevronRight,
  FaCheck
} from "react-icons/fa";

const AdviserOralDef = () => {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [openKebabMenu, setOpenKebabMenu] = useState(null);

  const kebabRefs = useRef({});

  const STATUS_OPTIONS = ["To Do", "In Progress", "To Review", "Completed"];
  const FILTER_OPTIONS = [
    "All",
    "To Do",
    "In Progress",
    "To Review",
    "Completed",
  ];
  const REVISION_OPTIONS = [
    "No Revision",
    ...Array.from({ length: 10 }, (_, i) => {
      const num = i + 1;
      if (num === 1) return "1st Revision";
      if (num === 2) return "2nd Revision";
      if (num === 3) return "3rd Revision";
      return `${num}th Revision`;
    }),
  ];

  const METHODOLOGY_OPTIONS = [
    "Agile",
    "Extreme Programming", 
    "Prototyping",
    "Scrum",
    "Waterfall"
  ];

  const PROJECT_PHASE_OPTIONS = [
    "Planning",
    "Design",
    "Development",
    "Testing",
    "Deployment"
  ];

  const formatTime = (timeString) => {
    if (!timeString) return "8:00 AM"; // Default time as per screenshot
    try {
      // Handle different time formats from database
      const timePart = timeString.split('+')[0]; // Remove timezone if present
      const [hour, minute] = timePart.split(':');
      let h = parseInt(hour, 10);
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12; // Convert to 12-hour format
      return `${h}:${minute} ${ampm}`;
    } catch (error) {
      return "8:00 AM";
    }
  };

  // ✅ Function to get the correct color code for status
  const getStatusColor = (value) => {
    switch (value) {
      case "To Do":
        return "#FABC3F"; // Yellow
      case "In Progress":
        return "#809D3C"; // Green
      case "To Review":
        return "#578FCA"; // Blue
      case "Completed":
        return "#AA60C8"; // Purple
      case "Missed":
        return "#D60606"; // Red
      default:
        return "#FABC3F"; // Default to yellow
    }
  };

  // ✅ Function to check if revision has checkmark
  const hasRevisionCheck = (revisionText) => {
    return revisionText !== "No Revision";
  };

  // ✅ Function to check if status has checkmark
  const hasStatusCheck = (status) => {
    return status !== "To Do"; // All statuses except "To Do" have checkmarks in screenshot
  };

  // ✅ fetch tasks from Supabase - Your service already filters by adviser_id
  useEffect(() => {
    fetchTasksFromDB(setTasks);
  }, []);

  // Close kebab menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !event.target.closest(".kebab-menu-container") &&
        !event.target.closest(".kebab-menu")
      ) {
        setOpenKebabMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Function to remove numbers from task names
  const cleanTaskName = (taskName) => {
    if (!taskName) return "";
    // Remove numbers and dots at the beginning of the task name
    return taskName.replace(/^\d+\.\s*/, "");
  };

  // --- Selection and Deletion Handlers ---
  const handleSelectTask = (taskId, isChecked) => {
    setSelectedTaskIds((prev) =>
      isChecked ? [...prev, taskId] : prev.filter((id) => id !== taskId)
    );
  };

  const handleSelectAllTasks = (isChecked) => {
    if (isChecked) {
      const allTaskIds = filteredAndSearchedTasks.map((task) => task.id);
      setSelectedTaskIds(allTaskIds);
    } else {
      setSelectedTaskIds([]);
    }
  };

  const handleToggleSelectionMode = (enable) => {
    setIsSelectionMode(enable);
    if (!enable) {
      setSelectedTaskIds([]);
    }
  };

  const handleDeleteSelectedTasks = async () => {
    if (selectedTaskIds.length === 0) return;

    // Show confirmation alert for multiple tasks
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
      // Add your delete logic here
      console.log("Delete tasks:", selectedTaskIds);
      setTasks((prev) => prev.filter((t) => !selectedTaskIds.includes(t.id)));
      setIsSelectionMode(false);
      setSelectedTaskIds([]);

      Swal.fire({
        title: "Deleted!",
        text: `${selectedTaskIds.length} task(s) have been deleted.`,
        icon: "success",
        confirmButtonColor: "#3B0304",
      });
    }
  };

  const handleSingleTaskDelete = async (taskId, taskName) => {
    // Show confirmation alert for single task
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
      // Add your single delete logic here
      console.log("Delete task:", taskId, taskName);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setSelectedTaskIds((prev) => prev.filter((id) => id !== taskId));

      Swal.fire({
        title: "Deleted!",
        text: `"${taskName}" has been deleted.`,
        icon: "success",
        confirmButtonColor: "#3B0304",
      });
    }
  };

  // Kebab menu handlers
  const toggleKebabMenu = (taskId) => {
    setOpenKebabMenu(openKebabMenu === taskId ? null : taskId);
  };

  // Update task handler with SweetAlert2 modal - Updated to match screenshot requirements
  const handleUpdateTask = (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      Swal.fire({
        title: `<div style="color: #3B0304; font-size: 1.5rem; font-weight: 600;">Update Task Details</div>`,
        html: `
          <div style="text-align: left;">
            <div style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Revision No.</label>
              <select 
                id="revision-no"
                style="width: 100%; padding: 10px; border: 1.5px solid #ddd; border-radius: 6px; font-size: 14px; color: #333; background: white;"
              >
                ${REVISION_OPTIONS.map(option => 
                  `<option value="${option}" ${task.revision_no === option ? 'selected' : ''}>${option}</option>`
                ).join('')}
              </select>
            </div>
            <div style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Status</label>
              <select 
                id="status"
                style="width: 100%; padding: 10px; border: 1.5px solid #ddd; border-radius: 6px; font-size: 14px; color: #333; background: white;"
              >
                ${STATUS_OPTIONS.map(option => 
                  `<option value="${option}" ${task.status === option ? 'selected' : ''}>${option}</option>`
                ).join('')}
              </select>
            </div>
            <div style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Methodology</label>
              <select 
                id="methodology"
                style="width: 100%; padding: 10px; border: 1.5px solid #ddd; border-radius: 6px; font-size: 14px; color: #333; background: white;"
              >
                ${METHODOLOGY_OPTIONS.map(option => 
                  `<option value="${option}" ${task.methodology === option ? 'selected' : ''}>${option}</option>`
                ).join('')}
              </select>
            </div>
            <div style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Project Phase</label>
              <select 
                id="project-phase"
                style="width: 100%; padding: 10px; border: 1.5px solid #ddd; border-radius: 6px; font-size: 14px; color: #333; background: white;"
              >
                ${PROJECT_PHASE_OPTIONS.map(option => 
                  `<option value="${option}" ${task.project_phase === option ? 'selected' : ''}>${option}</option>`
                ).join('')}
              </select>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: "Save Changes",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#3B0304",
        cancelButtonColor: "#6c757d",
        focusConfirm: false,
        width: "500px",
        customClass: {
          popup: "custom-swal-popup",
        },
        preConfirm: () => {
          const revisionNoInput = document.getElementById("revision-no");
          const statusInput = document.getElementById("status");
          const methodologyInput = document.getElementById("methodology");
          const projectPhaseInput = document.getElementById("project-phase");

          return {
            revision_no: revisionNoInput.value,
            status: statusInput.value,
            methodology: methodologyInput.value,
            project_phase: projectPhaseInput.value,
          };
        },
      }).then((result) => {
        if (result.isConfirmed) {
          const { revision_no, status, methodology, project_phase } = result.value;

          // Update the task in the state
          setTasks((prev) =>
            prev.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    revision_no: revision_no,
                    status: status,
                    methodology: methodology,
                    project_phase: project_phase,
                  }
                : t
            )
          );

          Swal.fire({
            title: "Success!",
            text: `Task details updated successfully`,
            icon: "success",
            confirmButtonColor: "#3B0304",
          });
        }
      });
    }
    setOpenKebabMenu(null);
  };

  const handleViewTask = (taskId) => {
    setOpenKebabMenu(null);
    console.log("View task:", taskId);
  };

  const handleDeleteTask = (taskId, taskName) => {
    setOpenKebabMenu(null);
    handleSingleTaskDelete(taskId, taskName);
  };

  // Get menu position
  const getMenuPosition = (taskId) => {
    const button = kebabRefs.current[taskId];
    if (!button) return { top: 0, left: 0 };

    const rect = button.getBoundingClientRect();
    return {
      top: rect.bottom + window.scrollY,
      left: rect.right + window.scrollX - 120,
    };
  };

  // --- Update Handlers ---
  const handleRevisionChange = async (taskId, revisionText) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, revision_no: revisionText } : t))
    );
  };

  // ✅ Updated handleStatusChange to set date_completed when status is "Completed"
  const handleStatusChange = async (taskId, newStatus) => {
    const task = tasks.find((t) => t.id === taskId);

    if (newStatus === "Completed") {
      // Ask for confirmation first
      const result = await Swal.fire({
        title: "Mark as Completed?",
        text: `Are you sure you want to mark "${cleanTaskName(task.task)}" as completed?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, Complete It",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#3B0304",
        cancelButtonColor: "#6c757d",
        reverseButtons: true,
        customClass: {
          popup: "custom-swal-popup-center",
        },
      });

      if (!result.isConfirmed) return; // Stop if user cancels

      const currentDate = new Date().toISOString().split("T")[0];

      // Update state after confirmation
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: newStatus,
                date_completed: currentDate,
              }
            : t
        )
      );

      // Show centered success message
      await Swal.fire({
        title: "Task Completed!",
        text: "The task has been marked as completed and moved to records.",
        icon: "success",
        confirmButtonColor: "#3B0304",
        position: "center", // ✅ Centered success popup
        customClass: {
          popup: "custom-swal-popup-center",
        },
      });
    } else {
      // Update other statuses normally
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
    }

    // Update the database (call your service)
    handleUpdateStatus(taskId, newStatus, setTasks);
  };

  // ✅ filtered tasks - Your service already filters by adviser_id, so we just need search and status filters
  const filteredAndSearchedTasks = (tasks || [])
    .filter((t) => t.group_name && t.group_name.trim() !== "")
    .filter((t) => (t.group_name || "").toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((t) => {
      if (selectedFilter === "All") return true;
      return t.status === selectedFilter;
    });

  const allTasksSelected =
    filteredAndSearchedTasks.length > 0 &&
    selectedTaskIds.length === filteredAndSearchedTasks.length;

  return (
    <div className="flex flex-col min-h-screen bg-white relative">
      {/* Inline styles + classes preserved from your original file */}
      <style>{`
        /* --- General Styles --- */
        .table-scroll-area::-webkit-scrollbar {
          display: none;
        }
        .section-title {
          font-weight: 600;
          color: #3B0304;
          display: flex;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .divider {
          height: 1.5px;
          background-color: #3B0304;
          width: calc(100% + 50px);
          margin-left: -16px;
          border-radius: 50px;
          margin-bottom: 1.5rem;
          border: none;
        }

        /* --- Button Styles --- */
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

        /* --- Search Bar Styles --- */
        .search-input-container {
            position: relative;
            width: 100%; 
            max-width: 200px; 
        }
        .search-input {
            width: 100%;
            padding: 7px 12px 7px 35px; 
            border: 1px solid #B2B2B2;
            border-radius: 6px;
            background-color: white;
            color: #3B0304;
            font-size: 0.85rem;
            box-shadow: none;
            transition: border-color 0.2s;
            height: 34px; 
        }
        .search-input:focus {
            outline: none;
            border-color: #3B0304;
        }
        .search-icon {
            position: absolute;
            left: 10px;
            top: 50%;
            transform: translateY(-50%);
            color: #B2B2B2;
            font-size: 0.85rem;
        }

        /* --- Filter Styles --- */
        .filter-wrapper {
            position: relative;
            display: flex;
            align-items: center;
            border: 1px solid #B2B2B2; 
            border-radius: 6px;
            background-color: white;
            color: #3B0304;
            font-size: 0.85rem;
            font-weight: 500;
            padding: 6px 8px; 
            gap: 6px;
            cursor: pointer;
            transition: border-color 0.2s, background-color 0.2s;
        }
        .filter-wrapper:hover {
            background-color: #f0f0f0;
            border-color: #3B0304; 
        }
        .filter-select {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0; 
            cursor: pointer;
            z-index: 10;
        }
        .filter-select option {
            background-color: white !important; 
            color: black !important; 
        }
        .filter-content {
            display: flex;
            align-items: center;
            gap: 6px;
            pointer-events: none;
        }

        /* --- Table/Dropdown Styles --- */
        .tasks-table {
          width: 100%;
          border-collapse: collapse;
        }
        .tasks-table th {
          background-color: #f8f9fa !important;
          font-weight: 600 !important;
          color: #3B0304 !important;
          text-transform: uppercase;
          font-size: 0.75rem;
          padding: 12px 6px !important;
          white-space: nowrap;
          border-bottom: 1px solid #dee2e6;
        }
        .tasks-table td {
          padding: 8px 6px !important;
          font-size: 0.875rem;
          color: #495057;
          border-bottom: 1px solid #dee2e6;
          vertical-align: middle; 
        }
        .tasks-table tbody tr:hover {
          background-color: #f8f9fa;
        }

        .center-text {
          text-align: center;
        }

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

        .status-select {
          min-width: 90px;
          padding: 4px 20px 4px 6px !important; 
          border-radius: 4px;
          font-weight: 500;
          color: white;
          border: none;
          appearance: none; 
          cursor: pointer;
          font-size: 0.85rem;
          text-align: center;
          width: 100%;
        }

        .status-select option {
            color: black !important; 
            background-color: white !important; 
            padding: 4px 8px;
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
            gap: 4px;
            height: 100%;
        }

        /* Revision and Status display styles */
        .revision-display {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 0.85rem;
        }

        .status-display {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 0.85rem;
          font-weight: 500;
          padding: 4px 8px;
          border-radius: 4px;
          color: white;
        }

        .checkmark {
          color: #3B0304;
          font-size: 0.75rem;
        }

        /* Kebab Menu Styles - Fixed outside table */
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
            min-width: 120px;
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

        .kebab-menu-item.update {
            color: #3B0304;
        }

        .kebab-menu-item.view {
            color: #578FCA;
        }

        .kebab-menu-item.delete {
            color: "#D60606";
        }

        /* Table Container */
        .table-container {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          overflow: hidden;
          margin-bottom: 20px;
        }

        .table-content {
          overflow-x: auto;
          overflow-y: auto;
          max-height: 500px;
          width: 100%;
        }

        /* SweetAlert2 Custom Styles */
        .custom-swal-popup {
          border-radius: 12px;
        }

        .custom-swal-popup-center {
          border-radius: 12px;
        }

        /* Back button + Footer spacing to avoid overlap with fixed footer */
        .page-top-controls {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 8px;
          margin-bottom: 12px;
        }

        .back-btn {
          background-color: white;
          color: #3B0304;
          border: 1.5px solid #3B0304;
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .back-btn:hover {
          background-color: #3B0304;
          color: white;
        }

        /* Header search area */
        .header-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

      `}</style>

      {/* Main content wrapper with padding-bottom so content won't be hidden by footer */}
      <div className="px-4 py-3 pb-20">
        <div className="page-top-controls">
          <button
            className="back-btn"
            onClick={() => {
              navigate("/AdviserTask");
            }}
            title="Back to Tasks"
          >
            ← Back
          </button>

          <h2 className="section-title">
            <FaTasks className="me-2" size={18} />
            Oral Defense
          </h2>
        </div>

        <hr className="divider" />

        {/* Header Controls - Search and Create Task */}
        <div className="header-controls">
          <div className="header-left">
            <div className="search-input-container">
              <FaSearch className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="header-right">
            <button
              type="button"
              className="primary-button"
              onClick={() => handleCreateTask(setTasks)}
            >
              <FaPlus size={14} /> Create Task
            </button>
          </div>
        </div>

        {/* Filter and Delete Controls */}
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
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
              onClick={() => {
                if (isSelectionMode) {
                  handleDeleteSelectedTasks();
                } else {
                  handleToggleSelectionMode(true);
                }
              }}
              disabled={isSelectionMode && selectedTaskIds.length === 0}
            >
              <FaTrash size={14} />
              {isSelectionMode ? `Delete Selected` : "Delete"}
            </button>
          </div>

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
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TABLE - Matching the screenshot design */}
        <div className="table-container">
          <div className="table-content">
            <table className="tasks-table">
              <thead className="bg-gray-50">
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
                  <th className="center-text">Time</th>
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
                    const hasRevCheck = hasRevisionCheck(task.revision_no);
                    const hasStatCheck = hasStatusCheck(task.status);

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

                        {/* Time */}
                        <td className="center-text">
                          <div className="center-content-flex">
                            <FaClock size={14} style={{ color: "#3B0304" }} />
                            {formatTime(task.time)}
                          </div>
                        </td>

                        {/* Revision */}
                        <td className="center-text">
                          <div className="revision-display">
                            {task.revision_no || "No Revision"}
                            {hasRevCheck && <FaCheck className="checkmark" />}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="center-text">
                          <div 
                            className="status-display"
                            style={{ backgroundColor: statusColor }}
                          >
                            {task.status || "To Do"}
                            {hasStatCheck && <FaCheck className="checkmark" />}
                          </div>
                        </td>

                        {/* Methodology */}
                        <td className="center-text">{task.methodology || "Extreme Programming"}</td>

                        {/* Project Phase */}
                        <td className="center-text">{task.project_phase || "Planning"}</td>

                        {/* Kebab Menu */}
                        <td className="center-text">
                          <div className="kebab-menu-container">
                            <button
                              ref={(el) => (kebabRefs.current[task.id] = el)}
                              className="kebab-button"
                              onClick={() => toggleKebabMenu(task.id)}
                              title="More options"
                            >
                              <FaEllipsisV size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={isSelectionMode ? 8 : 7}
                      className="center-text"
                      style={{
                        color: "#6c757d",
                        padding: "20px",
                        fontStyle: "italic",
                      }}
                    >
                      No tasks found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kebab Menu Portal - Rendered outside the table */}
        {openKebabMenu && (
          <div
            className="kebab-menu"
            style={{
              top: getMenuPosition(openKebabMenu).top,
              left: getMenuPosition(openKebabMenu).left,
            }}
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
                handleDeleteTask(openKebabMenu, tasks.find((t) => t.id === openKebabMenu)?.task)
              }
            >
              <FaTrash size={12} /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdviserOralDef;