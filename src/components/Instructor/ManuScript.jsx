import React, { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { FaFileAlt, FaEllipsisV, FaSearch, FaTrash, FaEdit } from "react-icons/fa";
import { supabase } from "../../supabaseClient";
 
const MySwal = withReactContent(Swal);
 
// --- Component Start ---
 
const ManuScript = () => {
  const [accounts, setAccounts] = useState([]);
  const [schedules, setSchedules] = useState([]);
  // openDropdown stores the calculated position and ID of the active menu
  const [openDropdown, setOpenDropdown] = useState(null); 
  const [search, setSearch] = useState("");
  const [advisers, setAdvisers] = useState([]);
 
  // STATE for row selection/deletion
  const [selectedSchedules, setSelectedSchedules] = useState([]); 
  const [isSelectionMode, setIsSelectionMode] = useState(false); 
 
  // Ref for the outer table container (must be position: relative)
  const tableWrapperRef = useRef(null); 
  // Ref to store button references for coordinate calculation
  const dropdownButtonRefs = useRef({}); 
 
  // Verdict mapping 
  const verdictMap = {
    1: "Pending",
    2: "Re-Def",
    3: "Completed",
  };
 
  // --- Dropdown/Utility Functions ---
 
  const handleToggleDropdown = (e, index, schedId) => {
      e.stopPropagation();
 
      if (openDropdown && openDropdown.index === index) {
          setOpenDropdown(null);
      } else {
          // Use a timeout to ensure React has flushed any layout changes before measuring
          setTimeout(() => {
              const buttonRef = dropdownButtonRefs.current[index];
              const wrapperRef = tableWrapperRef.current;
 
              if (!buttonRef || !wrapperRef) return;
 
              // Get the coordinates of the button and the wrapper relative to the viewport
              const buttonRect = buttonRef.getBoundingClientRect();
              const wrapperRect = wrapperRef.getBoundingClientRect();
 
              // Calculate position relative to the wrapper's current scroll/viewport offset.
              const top = buttonRect.top - wrapperRect.top + buttonRect.height + 5; 
 
              // Align the dropdown's right edge with the button's right edge.
              const dropdownWidth = 160; 
              const left = buttonRect.right - wrapperRect.left - dropdownWidth; 
 
              setOpenDropdown({
                  index: index,
                  schedId: schedId,
                  top: top,
                  left: left,
              });
          }, 0);
      }
  };
 
  // Click handler to close the detached menu when clicking anywhere else
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown) {
        const buttonRef = dropdownButtonRefs.current[openDropdown.index];
        const dropdownElement = document.querySelector('.dropdown-menu-detached'); 
 
        if (
            (buttonRef && !buttonRef.contains(event.target)) &&
            (dropdownElement && !dropdownElement.contains(event.target))
        ) {
          setOpenDropdown(null);
        }
      }
    };
 
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdown]);
 
  // --- Data Fetching Hooks ---
  useEffect(() => {
    const fetchAdvisers = async () => {
      const { data, error } = await supabase
        .from("user_credentials")
        .select("*")
        .eq("user_roles", 3)
        .not("adviser_group", "is", null);
 
      if (!error) {
        setAdvisers(data);
      }
    };
    fetchAdvisers();
 
    const fetchData = async () => {
        const { data: accData } = await supabase
            .from("user_credentials")
            .select("*");
        if (accData) setAccounts(accData);
 
        const { data: schedData } = await supabase
            .from("user_manuscript_sched")
            .select("*");
        if (schedData) setSchedules(schedData);
    };
    fetchData();
  }, []);
 
 
  // --- Selection Functions ---
  const handleToggleSelect = (id) => {
    setSelectedSchedules((prev) => 
      prev.includes(id) 
        ? prev.filter((schedId) => schedId !== id) 
        : [...prev, id]
    );
  };
 
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = filteredSchedules.map((sched) => sched.id);
      setSelectedSchedules(allIds);
    } else {
      setSelectedSchedules([]);
    }
  };
 
  const handleCancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedSchedules([]); 
  };
 
  // --- CRUD/Action Functions ---
 
  const handleCreateSchedule = () => { 
    MySwal.fire({
      title: `<div style="color:#3B0304; font-weight:600; display:flex; align-items:center; gap:8px;">
        <i class="bi bi-journal-text"></i> Create Manuscript Schedule</div>`,
      html: `
    <div class="mb-3">
      <label style="font-weight:600;">Assign Adviser</label>
      <select id="adviserSelect" class="form-select">
        <option disabled selected value="">Select Adviser</option>
        ${advisers
          .map(
            (a) => `
              <option value="${a.id}">
                ${a.last_name}, ${a.first_name} (Group ${a.adviser_group})
              </option>`
          )
          .join("")}
      </select>
    </div>
 
    <div class="mb-3">
      <label style="font-weight:600;">Assign Team</label>
      <select id="teamSelect" class="form-select" disabled>
        <option disabled selected value="">Select Team</option>
      </select>
    </div>
 
    <div class="mb-3">
      <label style="font-weight:600;">Date</label>
      <input type="date" id="scheduleDate" class="form-control"/>
    </div>
    <div class="mb-3">
      <label style="font-weight:600;">Time</label>
      <input type="time" id="scheduleTime" class="form-control"/>
    </div>`,
      showCancelButton: true,
      confirmButtonText: "Create",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#8B0000",
      width: "500px",
      didOpen: () => {
        const adviserSelect = document.getElementById("adviserSelect");
        const teamSelect = document.getElementById("teamSelect");
 
        adviserSelect.addEventListener("change", async (e) => {
          const adviserId = e.target.value;
 
          const { data: adviser } = await supabase
            .from("user_credentials")
            .select("adviser_group")
            .eq("id", adviserId)
            .single();
 
          if (adviser?.adviser_group) {
            const { data: managerTeams } = await supabase
              .from("user_credentials")
              .select("id, group_name")
              .eq("user_roles", 1)
              .eq("adviser_group", adviser.adviser_group);
 
            teamSelect.innerHTML = `<option disabled selected value="">Select Team</option>`;
            managerTeams?.forEach((t) => {
              const opt = document.createElement("option");
              opt.value = t.id;
              opt.textContent = t.group_name;
              teamSelect.appendChild(opt);
            });
            teamSelect.disabled = false;
          }
        });
      },
      preConfirm: () => {
        const adviser = document.getElementById("adviserSelect").value;
        const managerId = document.getElementById("teamSelect").value;
        const date = document.getElementById("scheduleDate").value;
        const time = document.getElementById("scheduleTime").value;
 
        if (!adviser || !managerId || !date || !time) {
          MySwal.showValidationMessage("Please fill all fields");
          return false;
        }
        return { adviser, managerId, date, time };
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        const { adviser, managerId, date, time } = result.value;
 
        const { error, data } = await supabase
          .from("user_manuscript_sched")
          .insert([
            {
              manager_id: managerId,
              adviser_id: adviser,
              date,
              time,
              plagiarism: 0,
              ai: 0,
              file_uploaded: null,
              verdict: 1, 
            },
          ])
          .select();
 
        if (error) {
          console.error("Insert error:", error);
          MySwal.fire("Error", "Failed to create schedule", "error");
        } else {
          setSchedules((prev) => [...prev, data[0]]);
          MySwal.fire({
            icon: "success",
            title: "✓ Schedule Created",
            showConfirmButton: false,
            timer: 1500,
          });
        }
      }
    });
  };
 
  const handleUpdate = async (schedId) => { 
    setOpenDropdown(null); 
 
    // 1. Find the schedule to be updated
    const scheduleToUpdate = schedules.find(s => s.id === schedId);
 
    if (!scheduleToUpdate) {
        MySwal.fire("Error", "Schedule not found.", "error");
        return;
    }
 
    // Get the team name for display purposes in the modal
    const teamName = accounts.find((a) => a.id === scheduleToUpdate.manager_id)?.group_name || "Unknown Team";
 
 
    MySwal.fire({
      title: `<div style="color:#3B0304; font-weight:600; display:flex; align-items:center; gap:8px;">
        <i class="bi bi-journal-text"></i> Update Schedule for ${teamName}</div>`,
      html: `
    <div class="mb-3">
      <label style="font-weight:600;">Team</label>
      <div class="form-control" style="background-color: #f8f9fa; border-color: #dee2e6; color: #495057;">${teamName}</div>
    </div>
 
    <div class="mb-3">
      <label style="font-weight:600;">Date</label>
      <input type="date" id="scheduleDate" class="form-control" value="${scheduleToUpdate.date}"/>
    </div>
    <div class="mb-3">
      <label style="font-weight:600;">Time</label>
      <input type="time" id="scheduleTime" class="form-control" value="${scheduleToUpdate.time}"/>
    </div>`,
      showCancelButton: true,
      confirmButtonText: "Update",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#3B0304", 
      width: "500px",
      preConfirm: () => {
        const newDate = document.getElementById("scheduleDate").value;
        const newTime = document.getElementById("scheduleTime").value;
 
        if (!newDate || !newTime) {
          MySwal.showValidationMessage("Please fill both Date and Time fields");
          return false;
        }
        return { newDate, newTime };
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        const { newDate, newTime } = result.value;
 
        const { error, data } = await supabase
          .from("user_manuscript_sched")
          .update({
            date: newDate,
            time: newTime,
          })
          .eq("id", schedId)
          .select();
 
        if (error) {
          console.error("Update error:", error);
          MySwal.fire("Error", "Failed to update schedule", "error");
        } else {
            // Update local state with the new data
            if (data && data.length > 0) {
                setSchedules(prev => prev.map(s => 
                    s.id === schedId ? data[0] : s
                ));
            }
 
          MySwal.fire({
            icon: "success",
            title: "✓ Schedule Updated",
            showConfirmButton: false,
            timer: 1500,
          });
        }
      }
    });
  };
 
  const handleDelete = async (id) => {
    setOpenDropdown(null); 
    const confirm = await MySwal.fire({
      title: "Delete Schedule?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3B0304", 
      cancelButtonColor: "#999", 
      confirmButtonText: "Yes, delete it!",
    });
 
    if (confirm.isConfirmed) {
      const { error } = await supabase
        .from("user_manuscript_sched")
        .delete()
        .eq("id", id);
 
      if (!error) {
        setSchedules((prev) => prev.filter((s) => s.id !== id));
        MySwal.fire("Deleted!", "Schedule has been deleted.", "success");
      } else {
        MySwal.fire("Error", "Failed to delete schedule.", "error");
      }
    }
  };
 
  const handleDeleteSelected = async () => {
    if (selectedSchedules.length === 0) {
      MySwal.fire({
        title: "No Items Selected",
        icon: "info",
        confirmButtonColor: "#3B0304",
      });
      return;
    }
 
    const confirm = await MySwal.fire({
      title: `Delete ${selectedSchedules.length} Schedules?`,
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3B0304",
      cancelButtonColor: "#999",
      confirmButtonText: "Yes, delete them!",
    });
 
    if (confirm.isConfirmed) {
      const { error } = await supabase
        .from("user_manuscript_sched")
        .delete()
        .in("id", selectedSchedules); 
 
      if (!error) {
        setSchedules((prev) => prev.filter((s) => !selectedSchedules.includes(s.id)));
        setSelectedSchedules([]);
        setIsSelectionMode(false);
        MySwal.fire("Deleted!", `${selectedSchedules.length} schedules have been deleted.`, "success");
      } else {
        MySwal.fire("Error", "Failed to delete selected schedules.", "error");
      }
    }
  };
 
  // --- Filtering and State Calculation ---
 
  const filteredSchedules = schedules.filter((sched) => {
    const teamName = accounts.find((a) => a.id === sched.manager_id)?.group_name || "";
    const verdict = verdictMap[sched.verdict] || "Pending"; 
    const fileName = sched.file_uploaded || "No File";
 
    const searchText = search.toLowerCase();
    return (
      teamName.toLowerCase().includes(searchText) ||
      (sched.date || "").toLowerCase().includes(searchText) ||
      (sched.time || "").toLowerCase().includes(searchText) ||
      verdict.toLowerCase().includes(searchText) ||
      fileName.toLowerCase().includes(searchText)
    );
  });
 
  const isAllSelected = filteredSchedules.length > 0 && 
                        filteredSchedules.every(sched => selectedSchedules.includes(sched.id));
 
  // --- Render ---
 
  return (
    <div className="p-6">
 
      {/* Scrollbar Fix for Webkit (Chrome/Safari) must be in a style tag */}
      <style>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .table-scroll-area::-webkit-scrollbar {
          display: none;
        }
      `}</style>
 
      {/* Header */}
      <h1 className="text-xl font-bold flex items-center gap-2 text-[#3B0304] mb-1">
        <FaFileAlt /> Manuscript &raquo; Scheduled Teams
      </h1>
      <div className="w-[calc(100%-1rem)] border-b border-[#3B0304] mt-2 mb-4"></div>
 
      {/* Control Block */}
      <div className="flex justify-between items-start mb-6 gap-4">
        <div className="flex flex-col items-start gap-4">
            <button
              className="px-4 py-2 bg-white text-black rounded-lg shadow-sm border border-[#B2B2B2] flex items-center gap-2 transition hover:bg-gray-100"
              onClick={handleCreateSchedule} 
            >
              ➕ Create Schedule
            </button>
            <div className="relative w-full" style={{ maxWidth: '250px' }}>
              <input
                type="text"
                className="w-full px-4 py-2 pl-10 bg-white border border-[#B2B2B2] rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
        </div>
        <div className="self-end flex items-center gap-2"> 
            {!isSelectionMode ? (
                <button
                    className="px-4 py-2 bg-white text-black rounded-lg shadow-sm border border-[#B2B2B2] flex items-center gap-2 transition hover:bg-white hover:border-[#B2B2B2]"
                    onClick={() => setIsSelectionMode(true)}
                >
                    <FaTrash /> Delete
                </button>
            ) : (
                <>
                    <button
                        className="px-4 py-2 bg-white text-black rounded-lg shadow-sm border border-[#B2B2B2] flex items-center gap-2 transition hover:bg-gray-100"
                        onClick={handleCancelSelection}
                    >
                        Cancel
                    </button>
                    <button
                        className={`px-4 py-2 rounded-lg shadow-sm border flex items-center gap-2 transition 
                            ${selectedSchedules.length > 0 
                                ? 'bg-white text-black border-[#B2B2B2] hover:bg-gray-50' 
                                : 'bg-white text-gray-400 border-[#B2B2B2] cursor-not-allowed'
                            }`}
                        onClick={handleDeleteSelected} 
                        disabled={selectedSchedules.length === 0}
                    >
                        <FaTrash /> Delete Selected
                    </button>
                </>
            )}
        </div>
      </div>
 
      {/* Table Container - THE RELATIVE PARENT FOR THE DETACHED DROPDOWN */}
      <div 
          ref={tableWrapperRef}
          className="bg-white rounded-lg shadow-md relative"
      >
 
        {/* Inner div with Conditional Scrolling and Scrollbar Hiding */}
        <div 
          className="table-scroll-area overflow-x-auto overflow-y-auto max-h-96"
          style={{ 
            'scrollbarWidth': 'none', /* For Firefox */
            'msOverflowStyle': 'none', /* For IE and Edge */
          }}
        > 
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                {isSelectionMode && (
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                            type="checkbox"
                            className="form-checkbox h-4 w-4 bg-white text-[#3B0304] border-[#B2B2B2] rounded focus:ring-[#3B0304]"
                            checked={isAllSelected}
                            onChange={handleSelectAll}
                        />
                    </th>
                )}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NO</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Plagiarism</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">AI</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Uploaded</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Verdict</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {filteredSchedules.map((sched, index) => {
                const teamName =
                    accounts.find((a) => a.id === sched.manager_id)?.group_name ||
                    "Unknown";
 
                const isSelected = selectedSchedules.includes(sched.id);
 
                return (
                    <tr 
                        key={sched.id} 
                        className={`transition duration-150 ease-in-out ${isSelected && isSelectionMode ? 'bg-gray-50' : ''}`}
                    >
                    {isSelectionMode && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <input
                                type="checkbox"
                                className="form-checkbox h-4 w-4 bg-white text-[#3B0304] border-[#B2B2B2] rounded focus:ring-[#3B0304]"
                                checked={isSelected}
                                onChange={() => handleToggleSelect(sched.id)}
                            />
                        </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teamName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(sched.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                        })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sched.time}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{sched.plagiarism}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{sched.ai}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sched.file_uploaded || "No File"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        Pending
                    </td>
 
                    {/* Action Column - Just the button here */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                        {!isSelectionMode && (
                            <button
                                ref={el => dropdownButtonRefs.current[index] = el}
                                onClick={(e) => handleToggleDropdown(e, index, sched.id)}
                                className="bg-white border-none focus:outline-none p-1 rounded hover:bg-gray-100"
                            >
                                <FaEllipsisV className="text-[#3B0304] text-sm" />
                            </button>
                        )}
                    </td>
                    </tr>
                );
                })}
                {filteredSchedules.length === 0 && (
                <tr>
                    <td colSpan={isSelectionMode ? "11" : "10"} className="text-center py-4 text-gray-500">
                    No schedules found.
                    </td>
                </tr>
                )}
            </tbody>
            </table>
        </div>
 
        {/* RENDER DETACHED DROPDOWN MENU HERE - ABSOLUTE POSITIONED RELATIVE TO THE WRAPPER */}
        {openDropdown && !isSelectionMode && (
            <div 
                // Container styles: White background, subtle gray ring, shadow
                className="dropdown-menu-detached w-40 rounded-md shadow-lg ring-1 ring-gray-200 bg-white overflow-hidden z-50" 
                style={{
                    position: 'absolute',
                    top: `${openDropdown.top}px`,
                    left: `${openDropdown.left}px`,
                }}
                onClick={(e) => e.stopPropagation()} 
            >
                <div className="py-1">
                    {/* Update Button - Locked to white background and black text on hover */}
                    <button
                        onClick={() => handleUpdate(openDropdown.schedId)}
                        className="w-full flex items-center px-4 py-3 text-sm text-black bg-white hover:bg-white hover:text-black transition-none duration-0 text-left"
                    >
                        <FaEdit className="mr-3 text-black text-sm" /> Update
                    </button>
                    {/* Delete Button - Locked to white background and black text on hover */}
                    <button
                        onClick={() => handleDelete(openDropdown.schedId)}
                        className="w-full flex items-center px-4 py-3 text-sm text-black bg-white hover:bg-white hover:text-black transition-none duration-0 text-left"
                    >
                        <FaTrash className="mr-3 text-black text-sm" /> Delete
                    </button>
                </div>
            </div>
        )}
 
      </div>
    </div>
  );
};
 
export default ManuScript;