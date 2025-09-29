import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { FaCalendarAlt, FaEllipsisV, FaSearch, FaTrash, FaRedo, FaPen } from "react-icons/fa";
import { supabase } from "../../supabaseClient";
 
const MySwal = withReactContent(Swal);
 
const TitleDefense = () => {
    const [teams, setTeams] = useState([]);
    const [advisers, setAdvisers] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [search, setSearch] = useState("");
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [selectedSchedules, setSelectedSchedules] = useState([]);
 
    const verdictMap = {
        1: "Pending",
        2: "Re-defense",
        3: "Approved",
    };
 
    useEffect(() => {
        const fetchData = async () => {
            const { data: accData, error: accError } = await supabase
                .from("user_credentials")
                .select("*");
 
            if (accError) {
                console.error("Error fetching accounts:", accError);
                return;
            }
 
            if (accData) {
                setAccounts(accData);
                const uniqueTeams = [
                    ...new Set(
                        accData
                            .filter((d) => d.group_number !== null && d.group_name !== null)
                            .map((t) => t.group_name)
                    ),
                ];
                setTeams(uniqueTeams);
                setAdvisers(accData.filter((a) => a.user_roles === 3));
            }
 
            const { data: schedData, error: schedError } = await supabase
                .from("user_titledef")
                .select("*");
 
            if (schedError) {
                console.error("Error fetching schedules:", schedError);
                return;
            }
 
            if (schedData) setSchedules(schedData);
        };
 
        fetchData();
    }, []);
 
    const handleCreateSchedule = () => {
        let selectedPanelists = [];
 
        MySwal.fire({
            title: `<div style="color: #3B0304; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                <i class="bi bi-calendar-plus"></i> Create Schedule</div>`,
            html: `
                <style>
                    .remove-panelist-btn {
                        border: 1px solid #3B0304;
                        border-radius: 50%;
                        width: 16px;
                        height: 16px;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        background-color: transparent;
                        color: #3B0304;
                        font-weight: bold;
                        font-size: 10px;
                        cursor: pointer;
                        line-height: 1;
                        padding: 0;
                    }
                </style>
                <div style="display: flex; gap: 20px; margin-bottom: 15px;">
                    <div style="flex: 1;">
                        <label style="font-weight: 600;">Assign Team</label>
                        <select id="teamSelect" class="form-select" style="border-radius: 8px; height: 42px;">
                            <option disabled selected value="">Select</option>
                            ${teams
                                .filter(
                                    (t) =>
                                        !schedules.some(
                                            (s) =>
                                                accounts.find((a) => a.id === s.manager_id)?.group_name === t
                                        )
                                )
                                .map((t) => `<option value="${t}">${t}</option>`)
                                .join("")}
                        </select>
                    </div>
                    <div style="flex: 1;">
                        <label style="font-weight: 600;">Assign Panelists</label>
                        <select id="panelSelect" class="form-select" style="border-radius: 8px; height: 42px;">
                            <option disabled selected value="">Select</option>
                            ${advisers
                                .map((a) =>
                                    `<option value="${a.id}">${a.last_name}, ${a.first_name}</option>`
                                )
                                .join("")}
                        </select>
                    </div>
                </div>
 
                <div class="mb-3">
                    <label style="font-weight: 600;">Date</label>
                    <input type="date" id="scheduleDate" class="form-control" style="border-radius: 8px; height: 42px;"/>
                </div>
                <div class="mb-3">
                    <label style="font-weight: 600;">Time</label>
                    <input type="time" id="scheduleTime" class="form-control" style="border-radius: 8px; height: 42px;"/>
                </div>
 
                <div class="mb-2">
                    <label style="font-weight: 600;">Selected Panelists</label>
                    <div id="panelList" class="form-control d-flex flex-wrap gap-2" 
                        style="border-radius: 8px; min-height:40px; align-items:center; padding: 12px;">
                        <span class="text-muted">No panelist selected</span>
                    </div>
                </div>`,
            showCancelButton: true,
            confirmButtonText: "Create",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#3B0304",
            cancelButtonColor: "#999",
            width: "600px",
            didOpen: () => {
                const teamSelect = document.getElementById("teamSelect");
                const panelSelect = document.getElementById("panelSelect");
                const panelList = document.getElementById("panelList");
 
                const updatePanelSelectOptions = (adviserGroup) => {
                    panelSelect.innerHTML = `<option disabled selected value="">Select</option>`;
                    advisers.forEach((a) => {
                        const opt = document.createElement("option");
                        opt.value = a.id;
                        opt.textContent = `${a.last_name}, ${a.first_name}`;
                        if (adviserGroup && a.adviser_group === adviserGroup) {
                            opt.disabled = true;
                            opt.textContent += " (Team Adviser)";
                        }
                        panelSelect.appendChild(opt);
                    });
                };
 
                teamSelect.addEventListener("change", () => {
                    const teamName = teamSelect.value;
                    const teamMembers = accounts.filter((a) => a.group_name === teamName);
                    const teamAdviserGroup = teamMembers[0]?.adviser_group || null;
 
                    selectedPanelists = [];
                    panelList.innerHTML = '<span class="text-muted">No panelist selected</span>';
                    updatePanelSelectOptions(teamAdviserGroup);
                });
 
                panelSelect.addEventListener("change", () => {
                    const selectedId = panelSelect.value;
                    if (selectedId && !selectedPanelists.includes(selectedId)) {
                        if (selectedPanelists.length < 3) {
                            selectedPanelists.push(selectedId);
                            const person = advisers.find((a) => a.id === selectedId);
                            if (panelList.querySelector(".text-muted")) {
                                panelList.innerHTML = "";
                            }
                            const tag = document.createElement("span");
                            tag.className = "bg-gray-200 text-gray-800 rounded-full px-2 py-1 text-sm flex items-center gap-1";
                            tag.innerHTML = `${person.last_name}, ${person.first_name} <button type="button" class="remove-panelist-btn ml-1" data-id="${selectedId}">-</button>`;
                            panelList.appendChild(tag);
                        } else {
                            MySwal.showValidationMessage('Maximum of 3 panelists can be selected.');
                        }
                    }
                    panelSelect.value = "";
                });
 
                panelList.addEventListener("click", (e) => {
                    if (e.target.classList.contains("remove-panelist-btn")) {
                        const idToRemove = e.target.dataset.id;
                        selectedPanelists = selectedPanelists.filter(id => id !== idToRemove);
                        e.target.parentElement.remove();
                        if (selectedPanelists.length === 0) {
                            panelList.innerHTML = '<span class="text-muted">No panelist selected</span>';
                        }
                    }
                });
            },
            preConfirm: () => {
                const team = document.getElementById("teamSelect").value;
                const date = document.getElementById("scheduleDate").value;
                const time = document.getElementById("scheduleTime").value;
 
                if (!team || !date || !time || selectedPanelists.length === 0) {
                    MySwal.showValidationMessage("Please fill all fields and select at least one panelist.");
                    return false;
                }
                if (selectedPanelists.length > 3) {
                    MySwal.showValidationMessage("Maximum of 3 panelists can be selected.");
                    return false;
                }
 
                return { team, date, time, panelists: selectedPanelists };
            },
        }).then(async (result) => {
            if (result.isConfirmed) {
                const { team, date, time, panelists } = result.value;
 
                const teamManager = accounts.find((a) => a.group_name === team && a.user_roles === 1);
 
                if (!teamManager) {
                    MySwal.fire("Error", "No manager found for this team.", "error");
                    return;
                }
 
                const [p1, p2, p3] = panelists;
 
                const { error, data } = await supabase
                    .from("user_titledef")
                    .insert([
                        {
                            manager_id: teamManager.id,
                            date,
                            time,
                            panelist1_id: p1 || null,
                            panelist2_id: p2 || null,
                            panelist3_id: p3 || null,
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
 
    const handleReDefense = () => {
        MySwal.fire({
            title: "Title Re-Defense",
            text: "This feature will be implemented soon.",
            icon: "info",
        });
    };
 
    const handleUpdate = (id) => {
        setOpenDropdown(null);
        const schedToUpdate = schedules.find(s => s.id === id);
        if (!schedToUpdate) {
            MySwal.fire("Error", "Schedule not found.", "error");
            return;
        }
 
        const teamName = accounts.find(a => a.id === schedToUpdate.manager_id)?.group_name;
        const teamMembers = accounts.filter(a => a.group_name === teamName);
        const teamAdviserGroup = teamMembers[0]?.adviser_group || null;
 
        let selectedPanelists = [
            schedToUpdate.panelist1_id,
            schedToUpdate.panelist2_id,
            schedToUpdate.panelist3_id,
        ].filter(Boolean);
 
        MySwal.fire({
            title: `<div style="color: #3B0304; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                <i class="bi bi-pencil-square"></i> Update Schedule</div>`,
            html: `
                <style>
                    .remove-panelist-btn {
                        border: 1px solid #3B0304;
                        border-radius: 50%;
                        width: 16px;
                        height: 16px;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        background-color: transparent;
                        color: #3B0304;
                        font-weight: bold;
                        font-size: 10px;
                        cursor: pointer;
                        line-height: 1;
                        padding: 0;
                    }
                </style>
                <div style="display: flex; gap: 20px; margin-bottom: 15px;">
                    <div style="flex: 1;">
                        <label style="font-weight: 600;">Team</label>
                        <input type="text" id="teamName" class="form-control" value="${teamName}" disabled style="border-radius: 8px; height: 42px; background-color: #f0f0f0;"/>
                    </div>
                    <div style="flex: 1;">
                        <label style="font-weight: 600;">Assign Panelists</label>
                        <select id="panelSelect" class="form-select" style="border-radius: 8px; height: 42px;">
                            <option disabled selected value="">Select</option>
                            ${advisers.map((a) => {
                                const isDisabled = teamAdviserGroup && a.adviser_group === teamAdviserGroup;
                                return `<option value="${a.id}" ${isDisabled ? 'disabled' : ''}>
                                    ${a.last_name}, ${a.first_name}${isDisabled ? " (Team Adviser)" : ""}
                                </option>`;
                            }).join("")}
                        </select>
                    </div>
                </div>
                <div class="mb-3">
                    <label style="font-weight: 600;">Date</label>
                    <input type="date" id="scheduleDate" class="form-control" value="${schedToUpdate.date}" style="border-radius: 8px; height: 42px;"/>
                </div>
                <div class="mb-3">
                    <label style="font-weight: 600;">Time</label>
                    <input type="time" id="scheduleTime" class="form-control" value="${schedToUpdate.time}" style="border-radius: 8px; height: 42px;"/>
                </div>
                <div class="mb-2">
                    <label style="font-weight: 600;">Selected Panelists</label>
                    <div id="panelList" class="form-control d-flex flex-wrap gap-2" 
                        style="border-radius: 8px; min-height:40px; align-items:center; padding: 12px;">
                        ${selectedPanelists.length > 0
                            ? selectedPanelists.map((id) => {
                                const person = advisers.find((a) => a.id === id);
                                if (!person) return ''; // defensive check
                                return `<span class="bg-gray-200 text-gray-800 rounded-full px-2 py-1 text-sm flex items-center gap-1">
                                    ${person.last_name}, ${person.first_name}
                                    <button type="button" class="remove-panelist-btn ml-1" data-id="${id}">
                                        -
                                    </button>
                                </span>`;
                            }).join("")
                            : '<span class="text-muted">No panelist selected</span>'
                        }
                    </div>
                </div>`,
            showCancelButton: true,
            confirmButtonText: "Update",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#3B0304",
            cancelButtonColor: "#999",
            width: "600px",
            didOpen: () => {
                const panelSelect = document.getElementById("panelSelect");
                const panelList = document.getElementById("panelList");
 
                panelSelect.addEventListener("change", () => {
                    const selectedId = panelSelect.value;
                    if (selectedId && !selectedPanelists.includes(selectedId)) {
                        if (selectedPanelists.length < 3) {
                            selectedPanelists.push(selectedId);
                            const person = advisers.find((a) => a.id === selectedId);
                            if (panelList.querySelector(".text-muted")) {
                                panelList.innerHTML = "";
                            }
                            const tag = document.createElement("span");
                            tag.className = "bg-gray-200 text-gray-800 rounded-full px-2 py-1 text-sm flex items-center gap-1";
                            tag.innerHTML = `${person.last_name}, ${person.first_name} <button type="button" class="remove-panelist-btn ml-1" data-id="${selectedId}">-</button>`;
                            panelList.appendChild(tag);
                        } else {
                            MySwal.showValidationMessage('Maximum of 3 panelists can be selected.');
                        }
                    }
                    panelSelect.value = "";
                });
 
                panelList.addEventListener("click", (e) => {
                    if (e.target.classList.contains("remove-panelist-btn")) {
                        const idToRemove = e.target.dataset.id;
                        selectedPanelists = selectedPanelists.filter(id => id !== idToRemove);
                        e.target.parentElement.remove();
                        if (selectedPanelists.length === 0) {
                            panelList.innerHTML = '<span class="text-muted">No panelist selected</span>';
                        }
                    }
                });
            },
            preConfirm: () => {
                const date = document.getElementById("scheduleDate").value;
                const time = document.getElementById("scheduleTime").value;
 
                if (!date || !time || selectedPanelists.length === 0) {
                    MySwal.showValidationMessage("Please fill all fields and select at least one panelist.");
                    return false;
                }
                if (selectedPanelists.length > 3) {
                    MySwal.showValidationMessage("Maximum of 3 panelists can be selected.");
                    return false;
                }
 
                return { date, time, panelists: selectedPanelists };
            },
        }).then(async (result) => {
            if (result.isConfirmed) {
                const { date, time, panelists } = result.value;
 
                const [p1, p2, p3] = panelists;
 
                const { error } = await supabase
                    .from("user_titledef")
                    .update({
                        date,
                        time,
                        panelist1_id: p1 || null,
                        panelist2_id: p2 || null,
                        panelist3_id: p3 || null,
                    })
                    .eq("id", id);
 
                if (error) {
                    console.error("Update error:", error);
                    MySwal.fire("Error", "Failed to update schedule", "error");
                } else {
                    setSchedules((prev) =>
                        prev.map((s) =>
                            s.id === id
                                ? {
                                    ...s,
                                    date,
                                    time,
                                    panelist1_id: p1 || null,
                                    panelist2_id: p2 || null,
                                    panelist3_id: p3 || null,
                                }
                                : s
                        )
                    );
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
                .from("user_titledef")
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
 
    const handleCheckboxChange = (id, isChecked) => {
        setSelectedSchedules(prev => {
            if (isChecked) {
                return [...prev, id];
            } else {
                return prev.filter(scheduleId => scheduleId !== id);
            }
        });
    };
 
    const handleDeleteSelected = async () => {
        if (selectedSchedules.length === 0) {
            MySwal.fire("No schedules selected", "Please select one or more schedules to delete.", "warning");
            return;
        }
 
        const confirm = await MySwal.fire({
            title: "Delete Selected Schedules?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3B0304",
            cancelButtonColor: "#999",
            confirmButtonText: "Yes, delete them!",
        });
 
        if (confirm.isConfirmed) {
            const { error } = await supabase
                .from("user_titledef")
                .delete()
                .in("id", selectedSchedules);
 
            if (!error) {
                setSchedules(prev => prev.filter(s => !selectedSchedules.includes(s.id)));
                setSelectedSchedules([]);
                setIsDeleteMode(false);
                MySwal.fire("Deleted!", "Selected schedules have been deleted.", "success");
            } else {
                MySwal.fire("Error", "Failed to delete selected schedules.", "error");
            }
        }
    };
 
    const filteredSchedules = schedules.filter((sched) => {
        const teamName = accounts.find((a) => a.id === sched.manager_id)?.group_name || "";
        const panelists = [sched.panelist1_id, sched.panelist2_id, sched.panelist3_id]
            .filter(Boolean)
            .map((id) => {
                const person = accounts.find((a) => a.id === id);
                return person ? `${person.last_name}, ${person.first_name}` : "Unknown";
            })
            .join("; ");
 
        const verdict = verdictMap[sched.verdict] || "Pending";
        const searchText = search.toLowerCase();
 
        return (
            teamName.toLowerCase().includes(searchText) ||
            (sched.date || "").toLowerCase().includes(searchText) ||
            (sched.time || "").toLowerCase().includes(searchText) ||
            panelists.toLowerCase().includes(searchText) ||
            verdict.toLowerCase().includes(searchText)
        );
    });
 
    return (
        <div className="p-6">
            <h1 className="text-xl font-bold flex items-center gap-2 text-[#3B0304] mb-1">
                <FaCalendarAlt /> Title Defense » Scheduled Teams
            </h1>
            <div className="w-[calc(100%-1rem)] border-b border-[#3B0304] mt-2 mb-4"></div>
 
            <div className="flex flex-col mb-6">
                <div className="flex gap-4 mb-4">
                    <button
                        className="px-4 py-2 bg-white text-black rounded-lg shadow-sm border border-[#B2B2B2] flex items-center gap-2 transition hover:bg-gray-100"
                        onClick={handleCreateSchedule}
                    >
                        ➕ Create Schedule
                    </button>
                    <button
                        className="px-4 py-2 bg-white text-black rounded-lg shadow-sm border border-[#B2B2B2] flex items-center gap-2 transition hover:bg-gray-100"
                        onClick={handleReDefense}
                    >
                        <FaRedo /> Title Re-Defense
                    </button>
                </div>
                <div className="flex items-center justify-between">
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
                    <div className="flex gap-2 items-center">
                        {isDeleteMode && (
                            <button
                                className="px-4 py-2 bg-white text-black rounded-lg shadow-sm border border-[#B2B2B2] flex items-center gap-2"
                                onClick={() => {
                                    setIsDeleteMode(false);
                                    setSelectedSchedules([]);
                                }}
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            className="px-4 py-2 bg-white text-black rounded-lg shadow-sm border border-[#B2B2B2] flex items-center gap-2 transition hover:bg-white"
                            onClick={() => {
                                if (isDeleteMode) {
                                    handleDeleteSelected();
                                } else {
                                    setIsDeleteMode(true);
                                }
                            }}
                        >
                            <FaTrash /> {isDeleteMode ? "Delete Selected" : "Delete"}
                        </button>
                    </div>
                </div>
            </div>
 
            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {isDeleteMode && (
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <input
                                        type="checkbox"
                                        className="form-checkbox h-4 w-4 bg-white border-[#3B0304] text-[#3B0304] rounded transition duration-150 ease-in-out cursor-pointer focus:ring-0 focus:ring-offset-0"
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedSchedules(filteredSchedules.map(s => s.id));
                                            } else {
                                                setSelectedSchedules([]);
                                            }
                                        }}
                                        checked={selectedSchedules.length === filteredSchedules.length && filteredSchedules.length > 0}
                                    />
                                </th>
                            )}
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                NO
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                TEAM
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                DATE
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                TIME
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                PANELISTS
                            </th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                VERDICT
                            </th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ACTION
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredSchedules.map((sched, index) => {
                            const teamName = accounts.find((a) => a.id === sched.manager_id)?.group_name || "Unknown";
 
                            const panelists = [sched.panelist1_id, sched.panelist2_id, sched.panelist3_id]
                                .filter(Boolean)
                                .map((id) => {
                                    const person = accounts.find((a) => a.id === id);
                                    return person ? `${person.last_name}, ${person.first_name}` : "Unknown";
                                })
                                .join("; ");
 
                            return (
                                <tr key={sched.id}>
                                    {isDeleteMode && (
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                className="form-checkbox h-4 w-4 bg-white border-[#3B0304] text-[#3B0304] rounded transition duration-150 ease-in-out cursor-pointer focus:ring-0 focus:ring-offset-0"
                                                checked={selectedSchedules.includes(sched.id)}
                                                onChange={(e) => handleCheckboxChange(sched.id, e.target.checked)}
                                            />
                                        </td>
                                    )}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {index + 1}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {teamName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(sched.date).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                        })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {sched.time}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {panelists}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                        <select
                                            className="form-select form-select-sm p-2 border border-[#B2B2B2] rounded-lg bg-white text-[#3B0304] font-semibold"
                                            value={sched.verdict || 1}
                                            onChange={async (e) => {
                                                const newVerdict = parseInt(e.target.value, 10);
                                                if (newVerdict === 2) {
                                                    const confirm = await MySwal.fire({
                                                        title: "Move to Re-Defense?",
                                                        text: "This team will be removed from the scheduled teams list.",
                                                        icon: "warning",
                                                        showCancelButton: true,
                                                        confirmButtonColor: "#3B0304",
                                                        cancelButtonColor: "#999",
                                                        confirmButtonText: "Yes, move them!",
                                                    });
 
                                                    if (confirm.isConfirmed) {
                                                        const { error } = await supabase
                                                            .from("user_titledef")
                                                            .delete()
                                                            .eq("id", sched.id);
 
                                                        if (!error) {
                                                            setSchedules((prev) => prev.filter((s) => s.id !== sched.id));
                                                            MySwal.fire("Success!", "Team moved to Re-Defense.", "success");
                                                        } else {
                                                            MySwal.fire("Error", "Failed to move team to re-defense.", "error");
                                                        }
                                                    } else {
                                                        e.target.value = sched.verdict;
                                                    }
                                                } else {
                                                    const { error } = await supabase
                                                        .from("user_titledef")
                                                        .update({ verdict: newVerdict })
                                                        .eq("id", sched.id);
 
                                                    if (!error) {
                                                        setSchedules((prev) =>
                                                            prev.map((s) =>
                                                                s.id === sched.id
                                                                    ? { ...s, verdict: newVerdict }
                                                                    : s
                                                            )
                                                        );
                                                    }
                                                }
                                            }}
                                        >
                                            <option value={1}>Pending</option>
                                            <option value={2}>Re-defense</option>
                                            <option value={3}>Approved</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium relative text-center">
                                        <button
                                            onClick={() =>
                                                setOpenDropdown(openDropdown === index ? null : index)
                                            }
                                            className="bg-white border-none focus:outline-none"
                                        >
                                            <FaEllipsisV className="text-[#3B0304] text-sm" />
                                        </button>
                                        {openDropdown === index && (
                                            <div className="absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                                                <div className="py-1">
                                                    <button
                                                        onClick={() => handleUpdate(sched.id)}
                                                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 bg-white hover:bg-white"
                                                    >
                                                        <FaPen className="mr-2" /> Update
                                                    </button> 
                                                    <button
                                                        onClick={() => {
                                                            handleDelete(sched.id);
                                                            setOpenDropdown(null);
                                                        }}
                                                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 bg-white hover:bg-white"
                                                    >
                                                        <FaTrash className="mr-2" /> Delete
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredSchedules.length === 0 && (
                            <tr>
                                <td colSpan={isDeleteMode ? "8" : "7"} className="text-center py-4 text-gray-500">
                                    No schedules found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
 
export default TitleDefense;