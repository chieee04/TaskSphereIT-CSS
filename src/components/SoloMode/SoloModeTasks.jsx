import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../supabaseClient";
import { FaPlus, FaCalendarAlt, FaClock, FaCogs, FaTasks, FaTrash, FaSearch, FaTimes, FaFilter, FaChevronDown, FaEllipsisV, FaEdit, FaEye, FaSave, FaTimesCircle } from 'react-icons/fa';
import "../Style/ProjectManager/ManagerOralDefense.css";
import { openCreateSoloTask } from "../../services/solomode/SolomodeTasksCreate";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

// --- Global Constants ---
const customUser = JSON.parse(localStorage.getItem("customUser"));
const soloId = customUser?.id;

const SolomodeTasks = () => {
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

    const fetchTasks = async () => {
        const customUser = JSON.parse(localStorage.getItem("customUser"));
        const soloUUID = customUser?.uuid || customUser?.id;

        if (!soloUUID) {
            console.warn("⚠️ No solo user ID found.");
            return;
        }

        try {
            const { data, error } = await supabase
                .from("solo_mode_task")
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
                    user_id
                `)
                .eq("user_id", soloUUID) // Correctly filter by the user's UUID
                .neq("status", "Completed")
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Supabase fetch error:", error.message);
                return;
            }

            setTasks(data);
        } catch (err) {
            console.error("An unexpected error occurred:", err);
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
            .from("solo_mode_task")   // ✅ correct table
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
            .from("solo_mode_task")   // ✅ correct table
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

        const newDueDateTime = new Date(`${editForm.due_date}T${editForm.time}`);
        const now = new Date();
        const isFuture = newDueDateTime > now;
        let newStatus = "To Do";
        const currentTask = tasks.find(t => t.id === taskId);
        if (currentTask && currentTask.status !== "Missed" && !isFuture) {
            newStatus = currentTask.status;
        }

        const { error } = await supabase
            .from("solo_task")
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
            .from("solo_task")
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
                .from("solo_task")
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
                .from("solo_task")
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

    const filteredAndSearchedTasks = tasks
        .filter((task) => {
            if (selectedFilter !== "All" && task.status !== selectedFilter) {
                return false;
            }
            if (!searchTerm) return true;
            const lowerSearchTerm = searchTerm.toLowerCase();
            return (
                task.task.toLowerCase().includes(lowerSearchTerm) ||
                task.methodology.toLowerCase().includes(lowerSearchTerm) ||
                task.project_phase.toLowerCase().includes(lowerSearchTerm)
            );
        });

    const allTasksSelected = filteredAndSearchedTasks.length > 0 && selectedTaskIds.length === filteredAndSearchedTasks.length;

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
          min-width: 1200px;
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }
        .tasks-table th, .tasks-table td {
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
        .word-wrap-cell {
          white-space: normal !important;
          word-wrap: break-word !important;
          max-width: 250px;
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
          border-radius: 6px !important;
          width: 100% !important;
          height: 30px !important;
          font-size: 0.85rem !important;
          padding: 0 4px !important;
        }
        .status-select {
          font-size: 0.8rem;
          padding: 4px;
          border-radius: 4px;
          width: 100%;
          border: none;
          color: white;
          font-weight: 500;
          cursor: pointer;
          background-color: var(--status-color, #ccc);
        }
        .due-date-cell, .time-cell {
          white-space: nowrap;
          text-align: center;
        }
        .action-buttons {
          white-space: nowrap;
        }
        .icon-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          font-size: 0.9rem;
          color: #3B0304;
          transition: color 0.2s;
        }
        .icon-button:hover {
          color: #D60606;
        }
        .kebab-menu-container {
          position: relative;
          display: inline-block;
        }
        .kebab-menu {
          position: absolute;
          right: 0;
          background-color: white;
          border: 1px solid #ddd;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          z-index: 100;
          min-width: 120px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .kebab-menu-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: none;
          border: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
          font-size: 0.9rem;
          color: #3B0304;
          transition: background-color 0.2s, color 0.2s;
        }
        .kebab-menu-item:hover {
          background-color: #f5f5f5;
        }
        .kebab-menu-item.delete:hover {
          background-color: #ffcccc;
          color: #D60606;
        }
        .kebab-menu-item.update:hover {
          color: #809D3C;
        }
        .kebab-menu-item.view:hover {
          color: #578FCA;
        }
        .modal-form-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 12px;
        }
        .modal-form-label {
          font-weight: 600;
          margin-bottom: 4px;
        }
        .modal-form-control {
          width: 100%;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        .modal-buttons {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
          margin-top: 20px;
        }
        .update-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 15px;
          border: 1px solid #ccc;
          border-radius: 8px;
          background-color: #f9f9f9;
        }
        .update-form-row {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .update-form-label {
          font-weight: 600;
          min-width: 80px;
        }
        .update-form-input {
          flex: 1;
          padding: 6px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        .update-form-buttons {
          display: flex;
          gap: 8px;
          margin-top: 10px;
        }
        .update-form-buttons .save {
          background-color: #4CAF50;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
        }
        .update-form-buttons .cancel {
          background-color: #f44336;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
        }
        .table-responsive {
          overflow-x: auto;
        }
        .button-group-top {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .tasks-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            margin-bottom: 16px;
        }
        .search-and-filter {
            display: flex;
            gap: 10px;
            align-items: center;
            flex-wrap: wrap;
        }
        .header-controls {
            display: flex;
            gap: 10px;
            align-items: center;
            flex-wrap: wrap;
        }
        .checkbox-cell {
            text-align: center;
        }
      `}</style>

            <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-2">
                    <h5 className="section-title">
                        <FaTasks /> Solomode Tasks
                    </h5>
                    <hr className="divider" />
                </div>
            </div>

            <div className="tasks-container">
                <div className="tasks-header">
                    <div className="header-controls">
                        <button
                            className="primary-button create-task-button"
                            onClick={openCreateSoloTask}
                        >
                            <FaPlus /> Create Task
                        </button>
                        {isSelectionMode && (
                            <button
                                className="primary-button delete-selected-button-white"
                                onClick={() => handleToggleSelectionMode(false)}
                            >
                                <FaTimes /> Cancel
                            </button>
                        )}
                        <button
                            className="primary-button delete-selected-button-white"
                            onClick={handleDeleteSelectedTasks}
                            disabled={selectedTaskIds.length === 0}
                        >
                            <FaTrash /> Delete Selected
                        </button>
                    </div>

                    <div className="search-and-filter">
                        <div className="search-input-container">
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                className="form-control search-input"
                                placeholder="Search tasks..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="filter-wrapper">
                            <select
                                className="filter-select"
                                value={selectedFilter}
                                onChange={(e) => setSelectedFilter(e.target.value)}
                            >
                                {FILTER_OPTIONS.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                            <div className="filter-content">
                                <FaFilter /> Filter: {selectedFilter} <FaChevronDown size={12} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="tasks-table">
                        <thead>
                            <tr>
                                <th className="checkbox-cell">
                                    <input
                                        type="checkbox"
                                        onChange={(e) => {
                                            handleToggleSelectionMode(e.target.checked);
                                            handleSelectAllTasks(e.target.checked);
                                        }}
                                        checked={allTasksSelected}
                                    />
                                </th>
                                <th>Task</th>
                                <th>Methodology</th>
                                <th>Project Phase</th>
                                <th>Task Type</th>
                                <th>Due Date</th>
                                <th>Time</th>
                                <th>Revision</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSearchedTasks.length > 0 ? (
                                filteredAndSearchedTasks.map((task) => (
                                    <tr key={task.id}>
                                        <td className="checkbox-cell">
                                            <input
                                                type="checkbox"
                                                checked={selectedTaskIds.includes(task.id)}
                                                onChange={(e) => handleSelectTask(task.id, e.target.checked)}
                                            />
                                        </td>
                                        <td className="word-wrap-cell">{task.task}</td>
                                        <td className="word-wrap-cell">{task.methodology}</td>
                                        <td className="word-wrap-cell">{task.project_phase}</td>
                                        <td className="word-wrap-cell">{task.task_type}</td>
                                        <td className="due-date-cell">{formatDate(task.due_date)}</td>
                                        <td className="time-cell">{task.time}</td>
                                        <td>
                                            <select
                                                className="revision-select"
                                                value={task.revision || 0}
                                                onChange={(e) => handleRevisionChange(task.id, e.target.value)}
                                            >
                                                {REVISION_OPTIONS.map((rev, index) => (
                                                    <option key={index} value={index + 1}>{rev}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            <select
                                                className="status-select"
                                                style={{ backgroundColor: getStatusColor(task.status) }}
                                                value={task.status}
                                                onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                            >
                                                {STATUS_OPTIONS.map(option => (
                                                    <option
                                                        key={option}
                                                        value={option}
                                                        style={{ backgroundColor: getStatusColor(option), color: 'white' }}
                                                    >
                                                        {option}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="action-buttons">
                                            <div className="kebab-menu-container">
                                                <button
                                                    className="icon-button"
                                                    onClick={() => toggleKebabMenu(task.id)}
                                                    ref={el => kebabRefs.current[task.id] = el}
                                                >
                                                    <FaEllipsisV />
                                                </button>
                                                {openKebabMenu === task.id && (
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
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="10" className="text-center py-4">
                                        No tasks found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {editingTask && (
                    <div className="update-form">
                        <div className="update-form-row">
                            <label className="update-form-label">Due Date:</label>
                            <input
                                type="date"
                                value={editForm.due_date}
                                onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                                className="update-form-input"
                            />
                        </div>
                        <div className="update-form-row">
                            <label className="update-form-label">Time:</label>
                            <input
                                type="time"
                                value={editForm.time}
                                onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                                className="update-form-input"
                            />
                        </div>
                        <div className="update-form-buttons">
                            <button className="save" onClick={() => handleSaveUpdate(editingTask)}>
                                <FaSave /> Save
                            </button>
                            <button className="cancel" onClick={handleCancelUpdate}>
                                <FaTimesCircle /> Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SolomodeTasks;