import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../../supabaseClient";
import { FaPlus, FaCalendarAlt, FaClock, FaCogs, FaTasks, FaTrash, FaSearch, FaTimes, FaFilter, FaChevronDown, FaEllipsisV, FaEdit, FaEye, FaSave, FaTimesCircle } from 'react-icons/fa';
import "../../Style/ProjectManager/ManagerOralDefense.css";
import { openCreateOralDefTask } from "../../../services/Manager/ManagerCreateOralDef";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
 
const MySwal = withReactContent(Swal);
 
// --- Global Constants ---
const customUser = JSON.parse(localStorage.getItem("customUser"));
const managerId = customUser?.id;
 
const ManagerOralDefense = () => {
    const [tasks, setTasks] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedFilter, setSelectedFilter] = useState("All");
    const [selectedTaskIds, setSelectedTaskIds] = useState([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [openKebabMenu, setOpenKebabMenu] = useState(null);
    const [editingTask, setEditingTask] = useState(null);
    const [editForm, setEditForm] = useState({
        due_date: "",
        time: ""
    });
 
    const kebabRefs = useRef({});
 
    const STATUS_OPTIONS = ["To Do", "In Progress", "To Review", "Completed"];
    const FILTER_OPTIONS = ["All", "To Do", "In Progress", "To Review", "Missed"];
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
            case "To Do": return "#FABC3F";
            case "In Progress": return "#809D3C";
            case "To Review": return "#578FCA";
            case "Completed": return "#AA60C8";
            case "Missed": return "#D60606";
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
                .neq("status", "Completed")
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
 
    // Close kebab menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.kebab-menu-container') && !event.target.closest('.kebab-menu')) {
                setOpenKebabMenu(null);
            }
        };
 
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
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
            setIsSelectionMode(false);
            setSelectedTaskIds([]);
            MySwal.fire("Deleted!", `${selectedTaskIds.length} task(s) have been deleted.`, "success");
        }
    };
 
    const handleSingleTaskDelete = async (taskId, taskName) => {
        const result = await MySwal.fire({
            title: `Delete Task: "${taskName}"?`,
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
            MySwal.fire("Deleted!", `Task "${taskName}" has been deleted.`, "success");
        }
    };
 
    // Kebab menu handlers
    const toggleKebabMenu = (taskId) => {
        setOpenKebabMenu(openKebabMenu === taskId ? null : taskId);
    };
 
    const handleUpdateTask = (taskId) => {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            setEditingTask(taskId);
            setEditForm({
                due_date: task.due_date,
                time: task.time
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
 
    // Update task handler
    const handleSaveUpdate = async (taskId) => {
        if (!editForm.due_date || !editForm.time) {
            MySwal.fire("Error", "Please fill in both date and time.", "error");
            return;
        }
 
        // Check if the new due date/time is in the future
        const newDueDateTime = new Date(`${editForm.due_date}T${editForm.time}`);
        const now = new Date();
        const isFuture = newDueDateTime > now;
 
        // Determine new status
        let newStatus = "To Do";
        const currentTask = tasks.find(t => t.id === taskId);
        if (currentTask && currentTask.status !== "Missed" && !isFuture) {
            newStatus = currentTask.status; // Keep current status if not missed and not future
        }
 
        const { error } = await supabase
            .from("manager_oral_task")
            .update({
                due_date: editForm.due_date,
                time: editForm.time,
                status: newStatus
            })
            .eq("id", taskId);
 
        if (error) {
            console.error("❌ Update task error:", error);
            MySwal.fire("Error", "Failed to update task.", "error");
        } else {
            setTasks(prev =>
                prev.map(t =>
                    t.id === taskId
                        ? {
                            ...t,
                            due_date: editForm.due_date,
                            time: editForm.time,
                            status: newStatus
                        }
                        : t
                )
            );
            setEditingTask(null);
            MySwal.fire("Success", "Task updated successfully!", "success");
        }
    };
 
    const handleCancelUpdate = () => {
        setEditingTask(null);
        setEditForm({
            due_date: "",
            time: ""
        });
    };
 
    // Get menu position
    const getMenuPosition = (taskId) => {
        const button = kebabRefs.current[taskId];
        if (!button) return { top: 0, left: 0 };
 
        const rect = button.getBoundingClientRect();
        return {
            top: rect.bottom + window.scrollY,
            left: rect.right + window.scrollX - 120
        };
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
            // 1. Filter by Status
            if (selectedFilter !== "All" && task.status !== selectedFilter) {
                return false;
            }
 
            // 2. Filter by Search Term
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
 
        /* --- Filter Styles (White background, gray border, tight width) --- */
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
            /* Full transparency over the wrapper to capture clicks */
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            cursor: pointer;
            z-index: 10;
        }
        /* Filter Dropdown Content Styles */
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
            min-width: 1200px; /* Forces horizontal scrollbar */
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
            z-index: 1; /* Ensure it stays on top of other cells */
        }
        /* The header needs a separate sticky style with thead background */
        .tasks-table th.sticky-col {
            background-color: #f8f9fa !important;
            z-index: 2; /* Higher z-index to stay on top of body cells */
        }
 
        /* Edit Form Styles */
        .edit-form-container {
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 8px;
            background: #f8f9fa;
            border-radius: 4px;
            margin: 4px 0;
        }
 
        .edit-input-group {
            display: flex;
            gap: 8px;
            align-items: center;
        }
 
        .edit-input {
            padding: 4px 8px;
            border: 1px solid #ccc;
            border-radius: 4px;
            font-size: 0.85rem;
            flex: 1;
        }
 
        .edit-buttons {
            display: flex;
            gap: 4px;
            justify-content: flex-end;
        }
 
        .edit-button {
            padding: 4px 8px;
            border: none;
            border-radius: 4px;
            font-size: 0.8rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 4px;
            transition: background-color 0.2s;
        }
 
        .save-button {
            background-color: #3B0304;
            color: white;
        }
 
        .save-button:hover {
            background-color: #2a0203;
        }
 
        .cancel-button {
            background-color: #6c757d;
            color: white;
        }
 
        .cancel-button:hover {
            background-color: #5a6268;
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
            color: #D60606;
        }
 
        /* Ensure table container has proper overflow */
        .table-container {
            position: relative;
            overflow: auto;
        }
      `}</style>
 
            <div className="row">
                <div className="col-12">
                    {/* Header */}
                    <h2 className="section-title">
                        <FaTasks className="me-2" size={18} />
                        Oral Defense
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
                                className={`primary-button ${isSelectionMode ? 'delete-selected-button-white' : ''}`}
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
                                {isSelectionMode ? `Delete Selected` : 'Delete'}
                            </button>
 
                            {/* Filter Dropdown (White background, reduced width) */}
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
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
 
 
                    {/* Table Section */}
                    <div className="bg-white rounded-lg shadow-md relative">
                        <div 
                            className="table-scroll-container overflow-x-auto overflow-y-auto"
                            style={{ maxHeight: '600px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        > 
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
                                        <th className="center-text">Date Created</th>
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
                                        const isMissed = task.status === "Missed";
                                        const menuPosition = openKebabMenu === task.id ? getMenuPosition(task.id) : { top: 0, left: 0 };
 
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
                                                <td className="center-text">{formatDate(task.created_at)}</td>
 
                                                {/* Due Date Cell - Show edit form when editing */}
                                                <td className="center-text">
                                                    {editingTask === task.id ? (
                                                        <div className="edit-form-container">
                                                            <div className="edit-input-group">
                                                                <FaCalendarAlt size={14} style={{ color: '#3B0304' }} />
                                                                <input
                                                                    type="date"
                                                                    className="edit-input"
                                                                    value={editForm.due_date}
                                                                    onChange={(e) => setEditForm(prev => ({ ...prev, due_date: e.target.value }))}
                                                                />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="center-content-flex">
                                                            <FaCalendarAlt size={14} style={{ color: '#3B0304' }} />
                                                            {task.due_date}
                                                        </div>
                                                    )}
                                                </td>
 
                                                {/* Time Cell - Show edit form when editing */}
                                                <td className="center-text">
                                                    {editingTask === task.id ? (
                                                        <div className="edit-form-container">
                                                            <div className="edit-input-group">
                                                                <FaClock size={14} style={{ color: '#3B0304' }} />
                                                                <input
                                                                    type="time"
                                                                    className="edit-input"
                                                                    value={editForm.time}
                                                                    onChange={(e) => setEditForm(prev => ({ ...prev, time: e.target.value }))}
                                                                />
                                                            </div>
                                                            <div className="edit-buttons">
                                                                <button
                                                                    className="edit-button save-button"
                                                                    onClick={() => handleSaveUpdate(task.id)}
                                                                >
                                                                    <FaSave size={12} /> Save
                                                                </button>
                                                                <button
                                                                    className="edit-button cancel-button"
                                                                    onClick={handleCancelUpdate}
                                                                >
                                                                    <FaTimesCircle size={12} /> Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="center-content-flex">
                                                            <FaClock size={14} style={{ color: '#3B0304' }} />
                                                            {task.time}
                                                        </div>
                                                    )}
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
                                                    {isMissed ? (
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
                                                                Missed
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className="dropdown-control-wrapper"
                                                            style={{ backgroundColor: statusColor, borderRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
                                                        >
                                                            <select
                                                                value={task.status}
                                                                onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                                                className="status-select"
                                                                style={{ backgroundColor: statusColor }}
                                                            >
                                                                {STATUS_OPTIONS.filter(s => s !== "Missed").map((s) => (
                                                                    <option key={s} value={s} >
                                                                        {s}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <FaChevronDown className="dropdown-icon-chevron" style={{ color: 'white' }} />
                                                        </div>
                                                    )}
                                                </td>
 
                                                <td className="center-text">{task.methodology}</td>
                                                <td className="center-text">{task.project_phase}</td>
 
                                                {/* Action Column (Kebab Menu) */}
                                                <td className="center-text">
                                                    <div className="kebab-menu-container">
                                                        <button
                                                            ref={el => kebabRefs.current[task.id] = el}
                                                            className="kebab-button"
                                                            onClick={() => toggleKebabMenu(task.id)}
                                                            title="More options"
                                                            disabled={editingTask === task.id}
                                                        >
                                                            <FaEllipsisV size={14} />
                                                        </button>
                                                    </div>
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
 
                    {/* Kebab Menu Portal - Rendered outside the table */}
                    {openKebabMenu && (
                        <div 
                            className="kebab-menu"
                            style={{
                                top: getMenuPosition(openKebabMenu).top,
                                left: getMenuPosition(openKebabMenu).left
                            }}
                        >
                            <button
                                className="kebab-menu-item update"
                                onClick={() => handleUpdateTask(openKebabMenu)}
                            >
                                <FaEdit size={12} /> Update
                            </button>
                            <button
                                className="kebab-menu-item view"
                                onClick={() => handleViewTask(openKebabMenu)}
                            >
                                <FaEye size={12} /> View
                            </button>
                            <button
                                className="kebab-menu-item delete"
                                onClick={() => handleDeleteTask(openKebabMenu, tasks.find(t => t.id === openKebabMenu)?.task)}
                            >
                                <FaTrash size={12} /> Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
 
export default ManagerOralDefense;
