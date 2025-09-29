import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../../supabaseClient";
import { FaPlus, FaCalendarAlt, FaClock, FaCogs, FaTasks, FaTrash, FaSearch, FaTimes, FaFilter, FaChevronDown } from 'react-icons/fa';
import "../../Style/ProjectManager/ManagerOralDefense.css";
import { openCreateOralDefTask } from "../../../services/Manager/ManagerCreateOralDef";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
 
const MySwal = withReactContent(Swal);
// --- Global Constants ---
const customUser = JSON.parse(localStorage.getItem("customUser"));
const managerId = customUser?.id;
 
const ManagerOralRecord = () => {
    const [tasks, setTasks] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedTaskIds, setSelectedTaskIds] = useState([]);
    const REVISION_OPTIONS = Array.from({ length: 10 }, (_, i) => {
        const num = i + 1;
        if (num === 1) return "1st Revision";
        if (num === 2) return "2nd Revision";
        if (num === 3) return "3rd Revision";
        return `${num}th Revision`;
    });
    // ✅ Function to get the correct color code
    const getStatusColor = (value) => {
        switch (value) {
            case "Completed": return "#AA60C8";
            default: return "#ccc";
        }
    };
 
    // ✅ Fetch Oral Defense Tasks from Supabase
    const fetchTasks = async () => {
        const customUser = JSON.parse(localStorage.getItem("customUser"));
        const managerId = customUser?.id;
 
        if (!managerId) {
            console.warn("⚠️ Walang managerId sa customUser:", customUser);
            return;
        }
 
        try {
            const { data, error } = await supabase
                .from("manager_oral_task")
                .select(`
                    id,
                    task,
                    subtask,
                    element,
                    due_date,
                    time,
                    created_at,
                    methodology,
                    project_phase,
                    revision,
                    status,
                    task_type,
                    comment,
                    manager_id,
                    member:user_credentials!manager_oral_task_member_id_fkey(first_name,last_name)
                `)
                .eq("manager_id", managerId)
                .eq("status", "Completed")
                .order("created_at", { ascending: false });
            if (error) {
                console.error("❌ Supabase fetch error:", error.message || error);
                return;
            }
 
            if (!data || data.length === 0) {
                console.warn("⚠️ Walang tasks nakuha para sa manager:", managerId);
            }
 
            setTasks(data || []);
        } catch (err) {
            console.error("❌ Unexpected fetch error:", err);
        }
    };
 
    useEffect(() => {
        fetchTasks();
        const interval = setInterval(() => {
            fetchTasks();
        }, 60000);
 
        return () => clearInterval(interval);
    }, []);
    // --- Selection and Deletion Handlers ---
 
    const handleSelectTask = (taskId, isChecked) => {
        setSelectedTaskIds(prev =>
            isChecked ? [...prev, taskId] : prev.filter(id => id !== taskId)
        );
    };
 
    const handleSelectAllTasks = (isChecked) => {
        if (isChecked) {
            const allTaskIds = filteredAndSearchedTasks.map(task => task.id);
            setSelectedTaskIds(allTaskIds);
        } else {
            setSelectedTaskIds([]);
        }
    };
 
    const handleToggleSelectionMode = (enable) => {
        setIsSelectionMode(enable);
        if (!enable) {
            setSelectedTaskIds([]);
            // Clear selections on cancel
        }
    };
    const handleDeleteSelectedTasks = async () => {
        if (selectedTaskIds.length === 0) {
            MySwal.fire("No Selection", "Please select at least one task to delete.", "warning");
            return;
        }
 
        const result = await MySwal.fire({
            title: `Delete ${selectedTaskIds.length} Task(s)?`,
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete them",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#3B0304",
        });
        if (!result.isConfirmed) return;
 
        const { error } = await supabase
            .from("manager_oral_task")
            .delete()
            .in("id", selectedTaskIds);
        if (error) {
            console.error("❌ Delete selected tasks error:", error);
            MySwal.fire("Error", "Failed to delete selected tasks.", "error");
        } else {
            setTasks(prev => prev.filter(t => !selectedTaskIds.includes(t.id)));
            setIsSelectionMode(false); // Exit selection mode
            setSelectedTaskIds([]);
            MySwal.fire("Deleted!", `${selectedTaskIds.length} task(s) have been deleted.`, "success");
        }
    };
    const handleSingleTaskDelete = async (taskId) => {
        const result = await MySwal.fire({
            title: `Delete Task?`,
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete it",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#3B0304",
        });
        if (!result.isConfirmed) return;
 
        const { error } = await supabase
            .from("manager_oral_task")
            .delete()
            .eq("id", taskId);
        if (error) {
            console.error("❌ Single task delete error:", error);
            MySwal.fire("Error", "Failed to delete the task.", "error");
        } else {
            setTasks(prev => prev.filter(t => t.id !== taskId));
            setSelectedTaskIds(prev => prev.filter(id => id !== taskId));
            MySwal.fire("Deleted!", `Task has been deleted.`, "success");
        }
    };
    // --- Update Handlers ---
 
    const handleRevisionChange = async (taskId, revisionText) => {
        const revisionInt = parseInt(revisionText);
        const { error } = await supabase
            .from("manager_oral_task")
            .update({ revision: revisionInt })
            .eq("id", taskId);
        if (error) {
            console.error("❌ Update revision error:", error);
            MySwal.fire("Error", "Failed to update revision.", "error");
        } else {
            setTasks((prev) =>
                prev.map((t) =>
                    t.id === taskId ? { ...t, revision: revisionInt } : t
                )
            );
        }
    };
 
    const handleStatusChange = async (taskId, newStatus) => {
        if (newStatus === "Completed") {
            const result = await MySwal.fire({
                title: "Mark as Completed?",
                text: "Do you want to mark this task as completed?",
                icon: "question",
                showCancelButton: true,
                confirmButtonText: "Yes, complete it",
                cancelButtonText: "Cancel",
                confirmButtonColor: "#3B0304",
            });
            if (!result.isConfirmed) return;
 
            const today = new Date().toISOString().split("T")[0];
 
            const { error } = await supabase
                .from("manager_oral_task")
                .update({ status: newStatus, date_completed: today })
                .eq("id", taskId);
            if (error) {
                console.error("❌ Update status error:", error);
                MySwal.fire("Error", "Failed to update status.", "error");
            } else {
                setTasks((prev) => prev.filter((t) => t.id !== taskId));
                MySwal.fire("✅ Completed!", "Task has been marked as completed.", "success");
            }
        } else {
            const { error } = await supabase
                .from("manager_oral_task")
                .update({ status: newStatus })
                .eq("id", taskId);
            if (error) {
                console.error("❌ Update status error:", error);
                MySwal.fire("Error", "Failed to update status.", "error");
            } else {
                setTasks((prev) =>
                    prev.map((t) =>
                        t.id === taskId ? { ...t, status: newStatus } : t
                    )
                );
            }
        }
    };
    // --- Filtering and Search Logic ---
    const filteredAndSearchedTasks = tasks
        .filter((task) => {
            // 1. Filter by Search Term
            if (!searchTerm) return true;
 
            const lowerSearchTerm = searchTerm.toLowerCase();
 
            return (
                task.task.toLowerCase().includes(lowerSearchTerm) ||
                `${task.member?.first_name} ${task.member?.last_name}`.toLowerCase().includes(lowerSearchTerm) ||
                task.methodology.toLowerCase().includes(lowerSearchTerm) ||
                task.project_phase.toLowerCase().includes(lowerSearchTerm)
            );
        });
    const allTasksSelected = filteredAndSearchedTasks.length > 0 && selectedTaskIds.length === filteredAndSearchedTasks.length;
    // Function to format the date
    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        if (isNaN(date)) return "Invalid Date";
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${month}-${day}-${year}`;
    };
    return (
        <div className="container-fluid px-4 py-3">
 
            <style>{`
        /* --- General Styles --- */
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
 
        /* --- Button Styles (Create, Methodology, Cancel, Delete Selected) --- */
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
        /* Delete Selected is styled as a standard primary button (white background) */
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
 
        /* --- Table/Dropdown Styles --- */
        .tasks-table {
            min-width: 1200px;
            /* Forces horizontal scrollbar */
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
        }
        .tasks-table th,
        .tasks-table td {
          padding: 8px 6px !important;
          font-size: 0.875rem;
          color: #495057;
          border-bottom: 1px solid #dee2e6;
          vertical-align: middle;
        }
        .tasks-table th {
          background-color: #f8f9fa !important;
          font-weight: 600 !important;
          color: #3B0304 !important;
          text-transform: uppercase;
          font-size: 0.75rem;
          padding: 12px 6px !important;
          white-space: nowrap;
        }
        .tasks-table tbody tr:hover {
          background-color: #f8f9fa;
        }
 
        /* ✅ CSS to allow text to wrap */
        .word-wrap-cell {
            white-space: normal !important;
            word-wrap: break-word !important;
            max-width: 250px; /* Adjust this value as needed */
            text-align: center;
        }
 
        /* Custom Dropdown Container and Icon Positioning */
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
 
        /* Custom Dropdown Styling for Revision */
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
 
        /* Status Dropdown Styling (The selected value area) */
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
 
        /* Status Dropdown Option Styles */
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
 
        /* Helper class for Date/Time centering */
        .center-content-flex {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            height: 100%;
        }
 
        /* This is the key change to contain the scrollbar */
        .table-scroll-container {
            overflow-x: auto;
            overflow-y: hidden;
            -webkit-overflow-scrolling: touch;
        }
        .table-scroll-container::-webkit-scrollbar {
            height: 8px;
        }
        .table-scroll-container::-webkit-scrollbar-thumb {
            background-color: #ccc;
            border-radius: 4px;
        }
 
        /* CSS to make the first few columns sticky */
        .sticky-col {
            position: sticky;
            left: 0;
            background-color: white; /* Match container background */
            z-index: 1;
            /* Ensure it stays on top of other cells */
        }
        /* The header needs a separate sticky style with thead background */
        .tasks-table th.sticky-col {
            background-color: #f8f9fa !important;
            z-index: 2; /* Higher z-index to stay on top of body cells */
        }
      `}</style>
 
            <div className="row">
                <div className="col-12">
                    {/* Header */}
                    <h2 className="section-title">
                        <FaTasks className="me-2" size={18} />
                        Oral Defense (Completed Tasks)
                    </h2>
                    <hr className="divider" />
                </div>
 
                <div className="col-12 col-md-12 col-lg-12">
 
                    {/* Top Control Buttons (Row 1) */}
                    <div className="d-flex align-items-center gap-2 mb-3">
                        {/* Create Task Button */}
                        <button
                            type="button"
                            className="primary-button"
                            onClick={async () => {
                                const newTasks = await openCreateOralDefTask(managerId);
                                if (newTasks && Array.isArray(newTasks)) {
                                    setTasks((prev) => [...newTasks, ...prev]);
                                }
                            }}
                        >
                            <FaPlus size={14} /> Create Task
                        </button>
                    </div>
 
                    {/* Search, Delete Selected, and Filter (Row 2) */}
                    <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
                        {/* Search Input (Placeholder Fixed) */}
                        <div className="search-input-container">
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search member"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
 
                        {/* Right Side Group: Delete and Filter */}
                        <div className="d-flex align-items-center gap-2">
 
                            {/* Cancel Button (Visible in selection mode, NO ICON) */}
                            {isSelectionMode && (
                                <button
                                    type="button"
                                    className="primary-button"
                                    onClick={() => handleToggleSelectionMode(false)}
                                >
                                    Cancel
                                </button>
                            )}
 
                            {/* Delete Button (Now always white/border style) */}
                            <button
                                type="button"
                                className={`primary-button ${isSelectionMode ?
                                    'delete-selected-button-white' : ''}`}
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
                                {isSelectionMode ?
                                    `Delete Selected` : 'Delete'}
                            </button>
                        </div>
                    </div>
 
 
                    {/* Table Section */}
                    <div className="bg-white rounded-lg shadow-md relative table-scroll-container">
                        <table className="tasks-table min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                    {/* Checkbox for Select All (Only show in selection mode) */}
                                    {isSelectionMode && (
                                        <th className="center-text sticky-col" style={{ width: '40px' }}>
                                            <input
                                                type="checkbox"
                                                checked={allTasksSelected}
                                                onChange={(e) => handleSelectAllTasks(e.target.checked)}
                                                disabled={filteredAndSearchedTasks.length === 0}
                                            />
                                        </th>
                                    )}
                                    <th className="center-text">NO</th>
                                    <th className="center-text">Assigned</th>
                                    <th className="center-text">Tasks</th>
                                    <th className="center-text">Subtasks</th>
                                    <th className="center-text">Elements</th>
                                    <th className="center-text">Due Date</th>
                                    <th className="center-text">Time</th>
                                    <th className="center-text">Revision No.</th>
                                    <th className="center-text" style={{ minWidth: '130px' }}>Status</th>
                                    <th className="center-text">Methodology</th>
                                    <th className="center-text">Project Phase</th>
                                    <th className="center-text" style={{ width: '50px' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredAndSearchedTasks.map((task, idx) => {
                                    const statusColor = getStatusColor(task.status);
 
                                    return (
                                        <tr key={task.id} className="hover:bg-gray-50 transition duration-150">
                                            {/* Checkbox for Single Task Selection (Only show in selection mode) */}
                                            {isSelectionMode && (
                                                <td className="center-text sticky-col">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedTaskIds.includes(task.id)}
                                                        onChange={(e) => handleSelectTask(task.id, e.target.checked)}
                                                    />
                                                </td>
                                            )}
                                            <td className="center-text">{idx + 1}.</td>
                                            <td className="center-text">
                                                {task.member?.first_name} {task.member?.last_name}
                                            </td>
                                            {/* ✅ Apply the new CSS class for text wrapping */}
                                            <td className="center-text word-wrap-cell">{task.task}</td>
                                            <td className="center-text word-wrap-cell">{task.subtask}</td>
                                            <td className="center-text word-wrap-cell">{task.element}</td>
                                            {/* End of new CSS class application */}
                                            {/* Due Date Cell */}
                                            <td className="center-text">
                                                <div className="center-content-flex">
                                                    <FaCalendarAlt size={14} style={{ color: '#3B0304' }} />
                                                    {task.due_date}
                                                </div>
                                            </td>
 
                                            {/* Time Cell */}
                                            <td className="center-text">
                                                <div className="center-content-flex">
                                                    <FaClock size={14} style={{ color: '#3B0304' }} />
                                                    {task.time}
                                                </div>
                                            </td>
 
                                            {/* Revision Dropdown */}
                                            <td className="center-text">
                                                <div className="dropdown-control-wrapper" style={{ minWidth: '100px' }}>
                                                    <select
                                                        value={task.revision}
                                                        onChange={(e) => handleRevisionChange(task.id, e.target.value)}
                                                        className="revision-select"
                                                    >
                                                        {REVISION_OPTIONS.map((label, i) => (
                                                            <option key={i + 1} value={i + 1}>
                                                                {label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <FaChevronDown className="dropdown-icon-chevron" style={{ color: '#3B0304' }} />
                                                </div>
                                            </td>
 
                                            {/* Status Dropdown / Missed Indicator */}
                                            <td className="center-text">
                                                <div
                                                    className="status-container"
                                                    style={{ backgroundColor: statusColor }}
                                                >
                                                    <span style={{
                                                        padding: '4px 6px',
                                                        color: 'white',
                                                        fontWeight: '500',
                                                        fontSize: '0.85rem',
                                                        minWidth: '90px'
                                                    }}>
                                                        Completed
                                                    </span>
                                                </div>
                                            </td>
 
                                            <td className="center-text">{task.methodology}</td>
                                            <td className="center-text">{task.project_phase}</td>
 
                                            {/* Action Column (Single Delete Button) */}
                                            <td className="center-text">
                                                <button
                                                    onClick={() => handleSingleTaskDelete(task.id)}
                                                    style={{
                                                        border: 'none',
                                                        background: 'none',
                                                        color: '#3B0304',
                                                        cursor: 'pointer',
                                                        padding: '4px',
                                                        transition: 'color 0.15s'
                                                    }}
                                                    title="Delete Task"
                                                >
                                                    <FaTrash size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredAndSearchedTasks.length === 0 && (
                                    <tr>
                                        <td colSpan={isSelectionMode ? "14" : "13"} className="text-center py-4 text-gray-500">
                                            No active tasks found matching the current search or filter criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
 
export default ManagerOralRecord;