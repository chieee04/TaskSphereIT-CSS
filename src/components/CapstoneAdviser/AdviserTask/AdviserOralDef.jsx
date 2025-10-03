import React, { useState, useEffect, useRef } from "react";
import taskIcon from "../../../assets/tasks-icon.png";
import createTasksIcon from "../../../assets/create-tasks-icon.png";
import searchIcon from "../../../assets/search-icon.png";
import "../../Style/Adviser/Task/AdviserOralDef.css";
import Swal from 'sweetalert2';

// Import logic functions
import { fetchTasksFromDB, handleCreateTask, handleUpdateStatus } from "../../../services/Adviser/AdCapsTask";
import { FaCalendarAlt, FaClock, FaChevronDown, FaEllipsisV, FaEdit, FaEye, FaTrash, FaSave, FaTimesCircle, FaSearch, FaFilter, FaPlus, FaTasks, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const AdviserOralDef = () => {
  const [tasks, setTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [openKebabMenu, setOpenKebabMenu] = useState(null);
  const [currentView, setCurrentView] = useState(0); // 0 = first view, 1 = second view

  const kebabRefs = useRef({});

  const STATUS_OPTIONS = ["To Do", "In Progress", "To Review", "Completed"];
  const FILTER_OPTIONS = ["All", "To Do", "In Progress", "To Review", "Completed", "Missed"];
  const REVISION_OPTIONS = ["No Revision", ...Array.from({ length: 10 }, (_, i) => {
    const num = i + 1;
    if (num === 1) return "1st Revision";
    if (num === 2) return "2nd Revision";
    if (num === 3) return "3rd Revision";
    return `${num}th Revision`;
  })];

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

  // ✅ fetch tasks
  useEffect(() => {
    fetchTasksFromDB(setTasks);
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

  // Function to remove numbers from task names
  const cleanTaskName = (taskName) => {
    if (!taskName) return "";
    // Remove numbers and dots at the beginning of the task name
    return taskName.replace(/^\d+\.\s*/, "");
  };

  // Navigation handlers
  const handleNextView = () => {
    setCurrentView(1);
  };

  const handlePrevView = () => {
    setCurrentView(0);
  };

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
    if (selectedTaskIds.length === 0) return;
    
    // Show confirmation alert for multiple tasks
    const result = await Swal.fire({
      title: 'Delete Selected Tasks?',
      text: `You are about to delete ${selectedTaskIds.length} task(s). This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete Them',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#D60606',
      cancelButtonColor: '#6c757d',
    });

    if (result.isConfirmed) {
      // Add your delete logic here
      console.log("Delete tasks:", selectedTaskIds);
      setTasks(prev => prev.filter(t => !selectedTaskIds.includes(t.id)));
      setIsSelectionMode(false);
      setSelectedTaskIds([]);
      
      Swal.fire({
        title: 'Deleted!',
        text: `${selectedTaskIds.length} task(s) have been deleted.`,
        icon: 'success',
        confirmButtonColor: '#3B0304'
      });
    }
  };

  const handleSingleTaskDelete = async (taskId, taskName) => {
    // Show confirmation alert for single task
    const result = await Swal.fire({
      title: 'Delete Task?',
      text: `You are about to delete "${taskName}". This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete It',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#D60606',
      cancelButtonColor: '#6c757d',
    });

    if (result.isConfirmed) {
      // Add your single delete logic here
      console.log("Delete task:", taskId, taskName);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setSelectedTaskIds(prev => prev.filter(id => id !== taskId));
      
      Swal.fire({
        title: 'Deleted!',
        text: `"${taskName}" has been deleted.`,
        icon: 'success',
        confirmButtonColor: '#3B0304'
      });
    }
  };

  // Kebab menu handlers
  const toggleKebabMenu = (taskId) => {
    setOpenKebabMenu(openKebabMenu === taskId ? null : taskId);
  };

  // Update task handler with SweetAlert2 modal
  const handleUpdateTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      // Format dates for the input fields
      const dueDate = task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : "2025-10-17";
      const timeValue = task.time ? task.time.split('+')[0] : "03:06:00";
      const teamName = task.group_name || "CS001, Et Al.";
      const taskName = cleanTaskName(task.task) || "Milestone Review Meeting";
      const subtask = task.subtask || "-";
      const elements = task.elements || "-";
      
      Swal.fire({
        title: `<div style="color: #3B0304; font-size: 1.5rem; font-weight: 600;">Update Task Details</div>`,
        html: `
          <div style="text-align: left;">
            <div style="margin-bottom: 15px; padding: 12px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #3B0304;">
              <div style="font-weight: 600; color: #3B0304; margin-bottom: 8px; font-size: 1.1rem;">Team: ${teamName}</div>
              <div style="color: #495057; margin-bottom: 6px; font-size: 0.95rem;">
                <strong>Task:</strong> ${taskName}
              </div>
              <div style="color: #495057; margin-bottom: 6px; font-size: 0.95rem;">
                <strong>SubTask:</strong> ${subtask}
              </div>
              <div style="color: #495057; font-size: 0.95rem;">
                <strong>Elements:</strong> ${elements}
              </div>
            </div>
            <div style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Due Date</label>
              <input 
                type="date" 
                id="due-date" 
                value="${dueDate}"
                style="width: 100%; padding: 10px; border: 1.5px solid #ddd; border-radius: 6px; font-size: 14px; color: #333; background: white; transition: border-color 0.2s;"
                onfocus="this.style.borderColor='#3B0304'"
                onblur="this.style.borderColor='#ddd'"
              >
            </div>
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Time</label>
              <input 
                type="time" 
                id="due-time" 
                value="${timeValue}"
                style="width: 100%; padding: 10px; border: 1.5px solid #ddd; border-radius: 6px; font-size: 14px; color: #333; background: white; transition: border-color 0.2s;"
                onfocus="this.style.borderColor='#3B0304'"
                onblur="this.style.borderColor='#ddd'"
              >
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Save Changes',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#3B0304',
        cancelButtonColor: '#6c757d',
        focusConfirm: false,
        width: '500px',
        customClass: {
          popup: 'custom-swal-popup'
        },
        preConfirm: () => {
          const dueDateInput = document.getElementById('due-date');
          const dueTimeInput = document.getElementById('due-time');
          
          if (!dueDateInput.value || !dueTimeInput.value) {
            Swal.showValidationMessage('Please fill in both date and time');
            return false;
          }
          
          return {
            due_date: dueDateInput.value,
            due_time: dueTimeInput.value
          };
        }
      }).then((result) => {
        if (result.isConfirmed) {
          const { due_date, due_time } = result.value;
          
          // Update the task in the state
          setTasks(prev =>
            prev.map(t =>
              t.id === taskId
                ? {
                    ...t,
                    due_date: due_date,
                    time: due_time
                  }
                : t
            )
          );
          
          Swal.fire({
            title: 'Success!',
            text: `Task details for ${teamName} updated successfully`,
            icon: 'success',
            confirmButtonColor: '#3B0304'
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
      left: rect.right + window.scrollX - 120
    };
  };

  // --- Update Handlers ---
  const handleRevisionChange = async (taskId, revisionText) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, revision_no: revisionText } : t
      )
    );
  };

  // ✅ Updated handleStatusChange to set date_completed when status is "Completed"
  const handleStatusChange = async (taskId, newStatus) => {
    // If status is being changed to "Completed", set the date_completed
    if (newStatus === "Completed") {
      const currentDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
      
      // Update the task with completed status and completion date
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId 
            ? { 
                ...t, 
                status: newStatus,
                date_completed: currentDate // Set the completion date
              } 
            : t
        )
      );
      
      // Show success message
      Swal.fire({
        title: 'Task Completed!',
        text: 'The task has been marked as completed and moved to records.',
        icon: 'success',
        confirmButtonColor: '#3B0304'
      });
    } else {
      // For other status changes, just update the status
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: newStatus } : t
        )
      );
    }
    
    // Call the original handleUpdateStatus function for database update
    handleUpdateStatus(taskId, newStatus, setTasks);
  };

  // ✅ filtered tasks - exclude completed tasks from main view
  const filteredAndSearchedTasks = (tasks || [])
    .filter((t) => t.group_name && t.group_name.trim() !== "")
    .filter((t) => t.status !== "Completed") // Exclude completed tasks from main view
    .filter((t) =>
      (t.group_name || "").toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((t) => {
      if (selectedFilter === "All") return true;
      return t.status === selectedFilter;
    });

  const allTasksSelected = filteredAndSearchedTasks.length > 0 && selectedTaskIds.length === filteredAndSearchedTasks.length;

  // Render table based on current view
  const renderTable = () => {
    if (currentView === 0) {
      // First View: NO, Assigned, Tasks, SubTasks, Elements, Date Created, Due Date
      return (
        <table className="tasks-table">
          <thead className="bg-gray-50">
            <tr>
              {isSelectionMode && (
                <th className="center-text" style={{ width: '40px' }}>
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
              <th className="center-text">SubTasks</th>
              <th className="center-text">Elements</th>
              <th className="center-text">Date Created</th>
              <th className="center-text">Due Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSearchedTasks.length > 0 ? (
              filteredAndSearchedTasks.map((task, idx) => (
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
                  <td className="center-text">{task.group_name || "CS001, Et Al."}</td>
                  <td className="center-text">{cleanTaskName(task.task) || "Milestone Review Meeting"}</td>
                  <td className="center-text">{task.subtask || "-"}</td>
                  <td className="center-text">{task.elements || "-"}</td>
                  <td className="center-text">
                    {task.date_created ? new Date(task.date_created).toLocaleDateString("en-US") : "10/2/2025"}
                  </td>
                  <td className="center-text">
                    <div className="center-content-flex">
                      <FaCalendarAlt size={14} style={{ color: '#3B0304' }} />
                      {task.due_date ? new Date(task.due_date).toLocaleDateString("en-US") : "10/4/2025"}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              // Sample data for first view
              <>
                <tr>
                  <td className="center-text">1.</td>
                  <td className="center-text">CS001, Et Al.</td>
                  <td className="center-text">Milestone Review Meeting</td>
                  <td className="center-text">-</td>
                  <td className="center-text">-</td>
                  <td className="center-text">10/2/2025</td>
                  <td className="center-text">
                    <div className="center-content-flex">
                      <FaCalendarAlt size={14} style={{ color: '#3B0304' }} />
                      10/4/2025
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="center-text">2.</td>
                  <td className="center-text">mulL Et Al.</td>
                  <td className="center-text">Milestone Review Meeting</td>
                  <td className="center-text">-</td>
                  <td className="center-text">-</td>
                  <td className="center-text">10/2/2025</td>
                  <td className="center-text">
                    <div className="center-content-flex">
                      <FaCalendarAlt size={14} style={{ color: '#3B0304' }} />
                      10/4/2025
                    </div>
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      );
    } else {
      // Second View: Time, Revision No., Status, Methodology, Project Phase, Action
      return (
        <table className="tasks-table">
          <thead className="bg-gray-50">
            <tr>
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
                const isMissed = task.status === "Missed";

                return (
                  <tr key={task.id} className="hover:bg-gray-50 transition duration-150">
                    <td className="center-text">{idx + 1}.</td>
                    
                    {/* Time Cell */}
                    <td className="center-text">
                      <div className="center-content-flex">
                        <FaClock size={14} style={{ color: '#3B0304' }} />
                        {task.time || "03:06:00+00"}
                      </div>
                    </td>

                    <td className="center-text">
                      <div className="dropdown-control-wrapper" style={{ minWidth: '100px' }}>
                        <select
                          value={task.revision_no || "No Revision"}
                          onChange={(e) => handleRevisionChange(task.id, e.target.value)}
                          className="revision-select"
                        >
                          {REVISION_OPTIONS.map((label, i) => (
                            <option key={i} value={label}>
                              {label}
                            </option>
                          ))}
                        </select>
                        <FaChevronDown className="dropdown-icon-chevron" style={{ color: '#3B0304' }} />
                      </div>
                    </td>

                    <td className="center-text">
                      {isMissed ? (
                        <div className="status-container" style={{ backgroundColor: statusColor }}>
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
                        <div className="dropdown-control-wrapper" style={{ backgroundColor: statusColor, borderRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                          <select
                            value={task.status || "To Do"}
                            onChange={(e) => handleStatusChange(task.id, e.target.value)}
                            className="status-select"
                            style={{ backgroundColor: statusColor }} 
                          >
                            {STATUS_OPTIONS.filter(s => s !== "Missed").map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                          <FaChevronDown className="dropdown-icon-chevron" style={{ color: 'white' }} />
                        </div>
                      )}
                    </td>

                    <td className="center-text">{task.methodology || "Extreme Programming"}</td>
                    <td className="center-text">{task.project_phase || "Planning"}</td>

                    {/* Action Column (Kebab Menu) */}
                    <td className="center-text">
                      <div className="kebab-menu-container">
                        <button
                          ref={el => kebabRefs.current[task.id] = el}
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
              // Sample data for second view
              <>
                <tr>
                  <td className="center-text">1.</td>
                  <td className="center-text">
                    <div className="center-content-flex">
                      <FaClock size={14} style={{ color: '#3B0304' }} />
                      03:06:00+00
                    </div>
                  </td>
                  <td className="center-text">
                    <div className="dropdown-control-wrapper" style={{ minWidth: '100px' }}>
                      <select value="No Revision" className="revision-select">
                        {REVISION_OPTIONS.map((label, i) => (
                          <option key={i} value={label}>{label}</option>
                        ))}
                      </select>
                      <FaChevronDown className="dropdown-icon-chevron" style={{ color: '#3B0304' }} />
                    </div>
                  </td>
                  <td className="center-text">
                    <div className="dropdown-control-wrapper" style={{ backgroundColor: '#FABC3F', borderRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                      <select value="To Do" className="status-select" style={{ backgroundColor: '#FABC3F' }}>
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="To Review">To Review</option>
                        <option value="Completed">Completed</option>
                      </select>
                      <FaChevronDown className="dropdown-icon-chevron" style={{ color: 'black' }} />
                    </div>
                  </td>
                  <td className="center-text">Extreme Programming</td>
                  <td className="center-text">Planning</td>
                  <td className="center-text">
                    <div className="kebab-menu-container">
                      <button className="kebab-button">
                        <FaEllipsisV size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="center-text">2.</td>
                  <td className="center-text">
                    <div className="center-content-flex">
                      <FaClock size={14} style={{ color: '#3B0304' }} />
                      03:06:00+00
                    </div>
                  </td>
                  <td className="center-text">
                    <div className="dropdown-control-wrapper" style={{ minWidth: '100px' }}>
                      <select value="No Revision" className="revision-select">
                        {REVISION_OPTIONS.map((label, i) => (
                          <option key={i} value={label}>{label}</option>
                        ))}
                      </select>
                      <FaChevronDown className="dropdown-icon-chevron" style={{ color: '#3B0304' }} />
                    </div>
                  </td>
                  <td className="center-text">
                    <div className="dropdown-control-wrapper" style={{ backgroundColor: '#809D3C', borderRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                      <select value="In Progress" className="status-select" style={{ backgroundColor: '#809D3C' }}>
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="To Review">To Review</option>
                        <option value="Completed">Completed</option>
                      </select>
                      <FaChevronDown className="dropdown-icon-chevron" style={{ color: 'white' }} />
                    </div>
                  </td>
                  <td className="center-text">Extreme Programming</td>
                  <td className="center-text">Planning</td>
                  <td className="center-text">
                    <div className="kebab-menu-container">
                      <button className="kebab-button">
                        <FaEllipsisV size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      );
    }
  };

  return (
    <div className="container-fluid px-4 py-3">
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

        /* Navigation Controls */
        .navigation-controls {
          background: #f8f9fa;
          border-top: 1px solid #dee2e6;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }

        .nav-buttons {
          display: flex;
          gap: 8px;
        }

        .nav-button {
          padding: 8px 16px;
          border: 1px solid #3B0304;
          background: white;
          color: #3B0304;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .nav-button:hover {
          background: #3B0304;
          color: white;
        }

        .nav-button:disabled {
          border-color: #ccc;
          color: #ccc;
          cursor: not-allowed;
        }

        .nav-button:disabled:hover {
          background: white;
          color: #ccc;
        }

        /* SweetAlert2 Custom Styles */
        .custom-swal-popup {
          border-radius: 12px;
        }
      `}</style>

      <div className="row">
        <div className="col-12">
          <h2 className="section-title">
            <FaTasks className="me-2" size={18} />
            Oral Defense
          </h2>
          <hr className="divider" />
        </div>

        <div className="col-12 col-md-12 col-lg-12">

          {/* Top Control Buttons */}
          <div className="d-flex align-items-center gap-2 mb-3">
            <button
              type="button"
              className="primary-button"
              onClick={() => handleCreateTask(setTasks)}
            >
              <FaPlus size={14} /> Create Task
            </button>
          </div>

          {/* Search, Delete Selected, and Filter */}
          <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
            <div className="search-input-container">
                <FaSearch className="search-icon" />
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search Team"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

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

          {/* TABLE THAT CHANGES BETWEEN VIEWS */}
          <div className="table-container">
            <div className="table-content">
              {renderTable()}
            </div>

            {/* NAVIGATION CONTROLS - RIGHT SIDE ONLY */}
            <div className="navigation-controls">
              <div className="nav-buttons">
                <button 
                  className="nav-button"
                  onClick={handlePrevView}
                  disabled={currentView === 0}
                >
                  <FaChevronLeft size={12} /> Previous
                </button>
                <button 
                  className="nav-button"
                  onClick={handleNextView}
                  disabled={currentView === 1}
                >
                  Next <FaChevronRight size={12} />
                </button>
              </div>
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
                onClick={() => handleDeleteTask(openKebabMenu, tasks.find(t => t.id === openKebabMenu)?.task_name)}
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

export default AdviserOralDef;