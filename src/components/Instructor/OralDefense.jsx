// OralDefense.jsx
import { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { FaCalendarAlt, FaEllipsisV, FaSearch, FaTrash, FaFileExport, FaPen, FaPlus } from "react-icons/fa";
import { supabase } from "../../supabaseClient";
import jsPDF from "jspdf";
 
const MySwal = withReactContent(Swal);
 
const OralDefense = () => {
    const [advisers, setAdvisers] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [search, setSearch] = useState("");
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [selectedSchedules, setSelectedSchedules] = useState([]);
    const dropdownRef = useRef(null);
 
    const verdictMap = {
        1: "Pending",
        2: "Approved",
        3: "Revisions",
        4: "Disapproved",
    };
 
    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpenDropdown(null);
            }
        };
 
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);
 
    // fetch advisers, accounts, schedules
    useEffect(() => {
        const fetchData = async () => {
            const { data: accData, error: accError } = await supabase
                .from("user_credentials")
                .select("*");
            if (accError) return console.error("Error fetching accounts:", accError);
 
            if (accData) {
                setAccounts(accData);
                setAdvisers(accData.filter((a) => a.user_roles === 3)); // advisers
            }
 
            const { data: schedData, error: schedError } = await supabase
                .from("user_oraldef")
                .select(
                    `
                    *,
                    manager:manager_id ( group_name )
                  `
                );
 
            if (schedError) return console.error("Error fetching schedules:", schedError);
            if (schedData) setSchedules(schedData);
        };
        fetchData();
    }, []);
 
    // Sort schedules by verdict priority: Pending -> Revisions -> Approved -> Disapproved
    const sortedSchedules = [...schedules].sort((a, b) => {
        const priorityOrder = {1: 1, 3: 2, 2: 3, 4: 4}; // Pending -> Revisions -> Approved -> Disapproved
        return priorityOrder[a.verdict] - priorityOrder[b.verdict];
    });
 
    // search by team
    const filteredSchedules = sortedSchedules.filter((s) =>
        s.manager?.group_name?.toLowerCase().includes(search.toLowerCase())
    );
 
    // Check if team already has a schedule
    const isTeamAlreadyScheduled = (teamName) => {
        return schedules.some(schedule => 
            schedule.manager?.group_name === teamName
        );
    };
 
    // Get teams that are already scheduled
    const getScheduledTeams = () => {
        return schedules.map(schedule => schedule.manager?.group_name).filter(Boolean);
    };
 
    // Check if time conflict exists (same time or within 1 hour gap)
    const hasTimeConflict = (selectedDate, selectedTime, excludeScheduleId = null) => {
        if (!selectedDate || !selectedTime) return false;
 
        const selectedDateTime = new Date(`${selectedDate}T${selectedTime}`);
 
        return schedules.some(schedule => {
            if (schedule.id === excludeScheduleId) return false; // Exclude current schedule when updating
            if (schedule.date !== selectedDate) return false; // Different dates, no conflict
 
            const scheduleDateTime = new Date(`${schedule.date}T${schedule.time}`);
            const timeDiff = Math.abs(selectedDateTime - scheduleDateTime) / (1000 * 60 * 60); // Difference in hours
 
            return timeDiff < 1; // Conflict if less than 1 hour gap
        });
    };
 
    // Get conflicting times for display
    const getConflictingTimes = (selectedDate, selectedTime, excludeScheduleId = null) => {
        if (!selectedDate || !selectedTime) return [];
 
        const selectedDateTime = new Date(`${selectedDate}T${selectedTime}`);
 
        return schedules
            .filter(schedule => {
                if (schedule.id === excludeScheduleId) return false;
                if (schedule.date !== selectedDate) return false;
 
                const scheduleDateTime = new Date(`${schedule.date}T${schedule.time}`);
                const timeDiff = Math.abs(selectedDateTime - scheduleDateTime) / (1000 * 60 * 60);
                return timeDiff < 1;
            })
            .map(schedule => ({
                team: schedule.manager?.group_name || 'Unknown Team',
                time: schedule.time
            }));
    };
 
    const exportOralDefenseAsPDF = (data) => {
        const today = new Date().toLocaleDateString();
        const fileName = `oral-defense-schedule-${today.replace(/\//g, '-')}.pdf`;
 
        // Create PDF using jsPDF
        const doc = new jsPDF();
 
        // Add header
        doc.setFillColor(59, 3, 4);
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('Oral Defense Schedule Report', 105, 15, { align: 'center' });
 
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated on: ${today}`, 105, 22, { align: 'center' });
 
        // Reset text color for content
        doc.setTextColor(0, 0, 0);
 
        // Add table headers
        doc.setFillColor(59, 3, 4);
        doc.rect(10, 35, 190, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
 
        const headers = ['NO', 'TEAM', 'TITLE', 'DATE', 'TIME', 'ADVISER', 'PANELISTS', 'VERDICT'];
        const columnWidths = [10, 30, 35, 20, 15, 25, 40, 20];
        let xPosition = 10;
 
        headers.forEach((header, index) => {
            doc.text(header, xPosition + 2, 42);
            xPosition += columnWidths[index];
        });
 
        // Add table rows
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
 
        let yPosition = 50;
 
        data.forEach((item, index) => {
            if (yPosition > 270) {
                doc.addPage();
                yPosition = 20;
            }
 
            // Alternate row background
            if (index % 2 === 0) {
                doc.setFillColor(245, 245, 245);
                doc.rect(10, yPosition - 4, 190, 6, 'F');
            }
 
            xPosition = 10;
            const rowData = [
                item.no.toString(),
                item.team,
                item.title,
                item.date,
                item.time,
                item.adviser,
                item.panelists,
                item.verdict
            ];
 
            rowData.forEach((cell, cellIndex) => {
                // Wrap text for panelists and title columns
                if (cellIndex === 2 || cellIndex === 6) {
                    const lines = doc.splitTextToSize(cell, columnWidths[cellIndex] - 2);
                    doc.text(lines, xPosition + 1, yPosition);
                } else {
                    doc.text(cell, xPosition + 1, yPosition);
                }
                xPosition += columnWidths[cellIndex];
            });
 
            yPosition += 6;
        });
 
        // Add footer with total records
        doc.setFontSize(8);
        doc.text(`Total Records: ${data.length}`, 14, 285);
 
        // Save the PDF
        doc.save(fileName);
    };
 
    const handleCreateSchedule = () => {
        let selectedPanelists = [];
        let selectedAdviser = null;
 
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
                    .disabled-option {
                        color: #999;
                        background-color: #f5f5f5;
                    }
                    .time-conflict-warning {
                        color: #d63384;
                        font-size: 12px;
                        margin-top: 5px;
                        font-weight: 500;
                    }
                </style>
                <div class="mb-3">
                    <label style="font-weight:600;">Select Adviser</label>
                    <select id="adviserSelect" class="form-select" style="border-radius:8px;height:42px;">
                        <option disabled selected value="">Select</option>
                        ${advisers
                            .map((a) => `<option value="${a.id}">${a.last_name}, ${a.first_name}</option>`)
                            .join("")}
                    </select>
                </div>
                <div class="mb-3">
                    <label style="font-weight:600;">Assign Team</label>
                    <select id="teamSelect" class="form-select" style="border-radius:8px;height:42px;" disabled>
                        <option disabled selected value="">Select</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label style="font-weight:600;">Assign Panelists</label>
                    <select id="panelSelect" class="form-select" style="border-radius:8px;height:42px;" disabled>
                        <option disabled selected value="">Select</option>
                    </select>
                </div>
                <div class="mb-2">
                    <label style="font-weight:600;">Panelist Lists</label>
                    <div id="panelList" class="form-control d-flex flex-wrap gap-2" style="border-radius:8px;min-height:40px;align-items:center;padding:12px;">
                        <span class="text-muted">No panelist selected</span>
                    </div>
                </div>
                <div class="mb-3">
                    <label style="font-weight:600;">Date</label>
                    <input type="date" id="scheduleDate" class="form-control" style="border-radius:8px;height:42px;"/>
                </div>
                <div class="mb-3">
                    <label style="font-weight:600;">Time</label>
                    <input type="time" id="scheduleTime" class="form-control" style="border-radius:8px;height:42px;"/>
                    <div id="timeConflictWarning" class="time-conflict-warning" style="display: none;"></div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: "Create",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#3B0304",
            cancelButtonColor: "#999",
            width: "600px",
            didOpen: () => {
                const adviserSelect = document.getElementById("adviserSelect");
                const teamSelect = document.getElementById("teamSelect");
                const panelSelect = document.getElementById("panelSelect");
                const panelList = document.getElementById("panelList");
                const scheduleDate = document.getElementById("scheduleDate");
                const scheduleTime = document.getElementById("scheduleTime");
                const timeConflictWarning = document.getElementById("timeConflictWarning");
 
                // Get already scheduled teams
                const scheduledTeams = getScheduledTeams();
 
                // update team options
                const updateTeamOptions = (adviserId) => {
                    const adviser = accounts.find((a) => a.id === adviserId);
                    if (!adviser) return;
 
                    const teams = accounts.filter(
                        (a) => a.adviser_group === adviser.adviser_group && a.user_roles === 1
                    );
 
                    teamSelect.innerHTML = '<option disabled selected value="">Select</option>';
 
                    if (teams.length > 0) {
                        teams.forEach((t) => {
                            if (t.group_name) {
                                const isAlreadyScheduled = scheduledTeams.includes(t.group_name);
                                const disabledAttr = isAlreadyScheduled ? 'disabled class="disabled-option"' : '';
                                const scheduledText = isAlreadyScheduled ? ' (Already Scheduled)' : '';
                                teamSelect.innerHTML += `<option value="${t.group_name}" ${disabledAttr}>${t.group_name}${scheduledText}</option>`;
                            }
                        });
                    } else {
                        const opt = document.createElement("option");
                        opt.value = "";
                        opt.disabled = true;
                        opt.textContent = "No manager available";
                        teamSelect.appendChild(opt);
                    }
                };
 
                // update panel options
                const updatePanelOptions = (adviserId) => {
                    panelSelect.innerHTML = '<option disabled selected value="">Select</option>';
                    advisers.forEach((a) => {
                        if (a.id !== adviserId)
                            panelSelect.innerHTML += `<option value="${a.id}">${a.last_name}, ${a.first_name}</option>`;
                    });
                };
 
                // Check for time conflicts
                const checkTimeConflict = () => {
                    const date = scheduleDate.value;
                    const time = scheduleTime.value;
 
                    if (date && time) {
                        if (hasTimeConflict(date, time)) {
                            const conflicts = getConflictingTimes(date, time);
                            const conflictText = conflicts.map(conflict => 
                                `${conflict.team} at ${conflict.time}`
                            ).join(', ');
 
                            timeConflictWarning.style.display = 'block';
                            timeConflictWarning.innerHTML = `⚠️ Time conflict with: ${conflictText}. Please choose a different time with at least 1 hour gap.`;
                        } else {
                            timeConflictWarning.style.display = 'none';
                        }
                    } else {
                        timeConflictWarning.style.display = 'none';
                    }
                };
 
                // Event listeners for date and time changes
                scheduleDate.addEventListener('change', checkTimeConflict);
                scheduleTime.addEventListener('change', checkTimeConflict);
 
                adviserSelect.addEventListener("change", () => {
                    selectedAdviser = adviserSelect.value;
                    updateTeamOptions(selectedAdviser);
                    updatePanelOptions(selectedAdviser);
                    teamSelect.disabled = false;
                    panelSelect.disabled = false;
                    selectedPanelists = [];
                    panelList.innerHTML = '<span class="text-muted">No panelist selected</span>';
                });
 
                // add panelist
                panelSelect.addEventListener("change", () => {
                    const id = panelSelect.value;
                    if (!selectedPanelists.includes(id)) {
                        if (selectedPanelists.length < 3) {
                            selectedPanelists.push(id);
                            const person = advisers.find((a) => a.id === id);
                            if (panelList.querySelector(".text-muted")) panelList.innerHTML = "";
                            const tag = document.createElement("span");
                            tag.className = "bg-gray-200 text-gray-800 rounded-full px-2 py-1 text-sm flex items-center gap-1";
                            tag.innerHTML = `${person.last_name}, ${person.first_name} <button type="button" class="remove-panelist-btn ml-1" data-id="${id}">-</button>`;
                            panelList.appendChild(tag);
                        } else {
                            MySwal.showValidationMessage("Maximum of 3 panelists.");
                        }
                    }
                    panelSelect.value = "";
                });
 
                // remove panelist
                panelList.addEventListener("click", (e) => {
                    if (e.target.classList.contains("remove-panelist-btn")) {
                        const idToRemove = e.target.dataset.id;
                        selectedPanelists = selectedPanelists.filter((pid) => pid !== idToRemove);
                        e.target.parentElement.remove();
                        if (selectedPanelists.length === 0)
                            panelList.innerHTML = '<span class="text-muted">No panelist selected</span>';
                    }
                });
            },
            preConfirm: () => {
                const team = document.getElementById("teamSelect").value;
                const date = document.getElementById("scheduleDate").value;
                const time = document.getElementById("scheduleTime").value;
                const teamSelect = document.getElementById("teamSelect");
                const selectedOption = teamSelect.options[teamSelect.selectedIndex];
 
                // Check if selected team is already scheduled
                if (selectedOption.disabled) {
                    MySwal.showValidationMessage("This team already has a schedule. Please select a different team.");
                    return false;
                }
 
                // Check for time conflicts
                if (hasTimeConflict(date, time)) {
                    const conflicts = getConflictingTimes(date, time);
                    const conflictText = conflicts.map(conflict => 
                        `${conflict.team} at ${conflict.time}`
                    ).join(', ');
                    MySwal.showValidationMessage(`Time conflict detected with: ${conflictText}. Please choose a different time with at least 1 hour gap.`);
                    return false;
                }
 
                if (!selectedAdviser || !team || !date || !time || selectedPanelists.length === 0) {
                    MySwal.showValidationMessage("Please fill all fields and select panelists.");
                    return false;
                }
 
                return { adviser: selectedAdviser, team, date, time, panelists: selectedPanelists };
            },
        }).then(async (result) => {
            if (result.isConfirmed) {
                const { adviser, team, date, time, panelists } = result.value;
 
                // Double-check if team is already scheduled (in case of race condition)
                if (isTeamAlreadyScheduled(team)) {
                    MySwal.fire("Error", "This team already has a schedule. Please select a different team.", "error");
                    return;
                }
 
                // Double-check for time conflicts
                if (hasTimeConflict(date, time)) {
                    const conflicts = getConflictingTimes(date, time);
                    const conflictText = conflicts.map(conflict => 
                        `${conflict.team} at ${conflict.time}`
                    ).join(', ');
                    MySwal.fire("Error", `Time conflict detected with: ${conflictText}. Please choose a different time with at least 1 hour gap.`, "error");
                    return;
                }
 
                const manager = accounts.find((a) => a.user_roles === 1 && a.group_name === team);
                const [p1, p2, p3] = panelists;
 
                const { error, data } = await supabase
                    .from("user_oraldef")
                    .insert([
                        {
                            manager_id: manager.id,
                            adviser_id: adviser,
                            date,
                            time,
                            panelist1_id: p1 || null,
                            panelist2_id: p2 || null,
                            panelist3_id: p3 || null,
                            verdict: 1,
                            title: null,
                        },
                    ])
                    .select(
                        `
                        *,
                        manager:manager_id ( group_name )
                      `
                    );
 
                if (!error) {
                    setSchedules((prev) => [...prev, data[0]]);
                    MySwal.fire({
                        icon: "success",
                        title: "✓ Schedule Created",
                        showConfirmButton: false,
                        timer: 1500,
                    });
                } else MySwal.fire("Error", "Failed to create schedule", "error");
            }
        });
    };
 
    // Update schedule with SweetAlert2 modal
    const handleUpdate = (id) => {
        setOpenDropdown(null);
        const schedule = schedules.find(s => s.id === id);
        if (!schedule) return;
 
        let selectedPanelists = [
            schedule.panelist1_id,
            schedule.panelist2_id, 
            schedule.panelist3_id
        ].filter(Boolean);
 
        const currentAdviser = accounts.find(a => a.id === schedule.adviser_id);
        const currentTeam = schedule.manager?.group_name;
 
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
                    .current-selection {
                        background-color: #f8f9fa;
                        padding: 10px;
                        border-radius: 8px;
                        margin-bottom: 15px;
                        border-left: 4px solid #3B0304;
                    }
                    .disabled-option {
                        color: #999;
                        background-color: #f5f5f5;
                    }
                    .time-conflict-warning {
                        color: #d63384;
                        font-size: 12px;
                        margin-top: 5px;
                        font-weight: 500;
                    }
                </style>
                <div class="current-selection">
                    <div style="font-weight: 600; color: #3B0304;">Current Selection</div>
                    <div><strong>Adviser:</strong> ${currentAdviser ? `${currentAdviser.last_name}, ${currentAdviser.first_name}` : 'N/A'}</div>
                    <div><strong>Team:</strong> ${currentTeam || 'N/A'}</div>
                </div>
                <div class="mb-3">
                    <label style="font-weight:600;">Assign Panelists</label>
                    <select id="panelSelect" class="form-select" style="border-radius:8px;height:42px;">
                        <option disabled selected value="">Select Panelist</option>
                        ${advisers
                            .map((a) => {
                                // Disable the current adviser and already selected panelists
                                const isCurrentAdviser = a.id === schedule.adviser_id;
                                const isAlreadyPanelist = selectedPanelists.includes(a.id);
                                const isDisabled = isCurrentAdviser || isAlreadyPanelist;
 
                                let disabledReason = '';
                                if (isCurrentAdviser) disabledReason = ' (Current Adviser)';
                                if (isAlreadyPanelist) disabledReason = ' (Already Selected)';
 
                                return `<option value="${a.id}" ${isDisabled ? 'disabled class="disabled-option"' : ''}>${a.last_name}, ${a.first_name}${disabledReason}</option>`;
                            })
                            .join("")}
                    </select>
                </div>
                <div class="mb-2">
                    <label style="font-weight:600;">Panelist Lists</label>
                    <div id="panelList" class="form-control d-flex flex-wrap gap-2" style="border-radius:8px;min-height:40px;align-items:center;padding:12px;">
                        ${selectedPanelists.length > 0 ? 
                            selectedPanelists.map(pid => {
                                const person = advisers.find(a => a.id === pid);
                                return person ? 
                                    `<span class="bg-gray-200 text-gray-800 rounded-full px-2 py-1 text-sm flex items-center gap-1">
                                        ${person.last_name}, ${person.first_name} 
                                        <button type="button" class="remove-panelist-btn ml-1" data-id="${pid}">-</button>
                                    </span>` : '';
                            }).join('') 
                            : '<span class="text-muted">No panelist selected</span>'
                        }
                    </div>
                </div>
                <div class="mb-3">
                    <label style="font-weight:600;">Date</label>
                    <input type="date" id="scheduleDate" class="form-control" style="border-radius:8px;height:42px;" value="${schedule.date}"/>
                </div>
                <div class="mb-3">
                    <label style="font-weight:600;">Time</label>
                    <input type="time" id="scheduleTime" class="form-control" style="border-radius:8px;height:42px;" value="${schedule.time}"/>
                    <div id="timeConflictWarning" class="time-conflict-warning" style="display: none;"></div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: "Update",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#3B0304",
            cancelButtonColor: "#999",
            width: "600px",
            didOpen: () => {
                const panelSelect = document.getElementById("panelSelect");
                const panelList = document.getElementById("panelList");
                const scheduleDate = document.getElementById("scheduleDate");
                const scheduleTime = document.getElementById("scheduleTime");
                const timeConflictWarning = document.getElementById("timeConflictWarning");
 
                // Function to update panelist dropdown options
                const updatePanelistDropdown = () => {
                    panelSelect.innerHTML = '<option disabled selected value="">Select Panelist</option>';
 
                    advisers.forEach((a) => {
                        const isCurrentAdviser = a.id === schedule.adviser_id;
                        const isAlreadyPanelist = selectedPanelists.includes(a.id);
                        const isDisabled = isCurrentAdviser || isAlreadyPanelist;
 
                        let disabledReason = '';
                        if (isCurrentAdviser) disabledReason = ' (Current Adviser)';
                        if (isAlreadyPanelist) disabledReason = ' (Already Selected)';
 
                        const option = document.createElement("option");
                        option.value = a.id;
                        option.textContent = `${a.last_name}, ${a.first_name}${disabledReason}`;
 
                        if (isDisabled) {
                            option.disabled = true;
                            option.className = 'disabled-option';
                        }
 
                        panelSelect.appendChild(option);
                    });
                };
 
                // Check for time conflicts (excluding current schedule)
                const checkTimeConflict = () => {
                    const date = scheduleDate.value;
                    const time = scheduleTime.value;
 
                    if (date && time) {
                        if (hasTimeConflict(date, time, schedule.id)) {
                            const conflicts = getConflictingTimes(date, time, schedule.id);
                            const conflictText = conflicts.map(conflict => 
                                `${conflict.team} at ${conflict.time}`
                            ).join(', ');
 
                            timeConflictWarning.style.display = 'block';
                            timeConflictWarning.innerHTML = `⚠️ Time conflict with: ${conflictText}. Please choose a different time with at least 1 hour gap.`;
                        } else {
                            timeConflictWarning.style.display = 'none';
                        }
                    } else {
                        timeConflictWarning.style.display = 'none';
                    }
                };
 
                // Event listeners for date and time changes
                scheduleDate.addEventListener('change', checkTimeConflict);
                scheduleTime.addEventListener('change', checkTimeConflict);
 
                // add panelist
                panelSelect.addEventListener("change", () => {
                    const id = panelSelect.value;
                    const selectedOption = panelSelect.options[panelSelect.selectedIndex];
 
                    // Check if the selected option is disabled
                    if (selectedOption.disabled) {
                        MySwal.showValidationMessage("This adviser cannot be selected as a panelist.");
                        panelSelect.value = "";
                        return;
                    }
 
                    if (!selectedPanelists.includes(id)) {
                        if (selectedPanelists.length < 3) {
                            selectedPanelists.push(id);
                            const person = advisers.find((a) => a.id === id);
                            if (panelList.querySelector(".text-muted")) panelList.innerHTML = "";
                            const tag = document.createElement("span");
                            tag.className = "bg-gray-200 text-gray-800 rounded-full px-2 py-1 text-sm flex items-center gap-1";
                            tag.innerHTML = `${person.last_name}, ${person.first_name} <button type="button" class="remove-panelist-btn ml-1" data-id="${id}">-</button>`;
                            panelList.appendChild(tag);
 
                            // Update dropdown to disable the newly selected panelist
                            updatePanelistDropdown();
                        } else {
                            MySwal.showValidationMessage("Maximum of 3 panelists.");
                        }
                    }
                    panelSelect.value = "";
                });
 
                // remove panelist
                panelList.addEventListener("click", (e) => {
                    if (e.target.classList.contains("remove-panelist-btn")) {
                        const idToRemove = e.target.dataset.id;
                        selectedPanelists = selectedPanelists.filter((pid) => pid !== idToRemove);
                        e.target.parentElement.remove();
 
                        // Update dropdown to re-enable the removed panelist
                        updatePanelistDropdown();
 
                        if (selectedPanelists.length === 0)
                            panelList.innerHTML = '<span class="text-muted">No panelist selected</span>';
                    }
                });
            },
            preConfirm: () => {
                const date = document.getElementById("scheduleDate").value;
                const time = document.getElementById("scheduleTime").value;
 
                // Check for time conflicts (excluding current schedule)
                if (hasTimeConflict(date, time, schedule.id)) {
                    const conflicts = getConflictingTimes(date, time, schedule.id);
                    const conflictText = conflicts.map(conflict => 
                        `${conflict.team} at ${conflict.time}`
                    ).join(', ');
                    MySwal.showValidationMessage(`Time conflict detected with: ${conflictText}. Please choose a different time with at least 1 hour gap.`);
                    return false;
                }
 
                if (!date || !time || selectedPanelists.length === 0) {
                    MySwal.showValidationMessage("Please fill all fields and select panelists.");
                    return false;
                }
 
                return { date, time, panelists: selectedPanelists };
            },
        }).then(async (result) => {
            if (result.isConfirmed) {
                const { date, time, panelists } = result.value;
                const [p1, p2, p3] = panelists;
 
                const { error } = await supabase
                    .from("user_oraldef")
                    .update({ 
                        date, 
                        time,
                        panelist1_id: p1 || null,
                        panelist2_id: p2 || null,
                        panelist3_id: p3 || null
                    })
                    .eq("id", id);
 
                if (!error) {
                    setSchedules((prev) =>
                        prev.map((s) => (s.id === id ? { 
                            ...s, 
                            date, 
                            time,
                            panelist1_id: p1 || null,
                            panelist2_id: p2 || null,
                            panelist3_id: p3 || null
                        } : s))
                    );
                    MySwal.fire({
                        icon: "success",
                        title: "✓ Schedule Updated",
                        showConfirmButton: false,
                        timer: 1500,
                    });
                } else {
                    MySwal.fire("Error", "Failed to update schedule", "error");
                }
            }
        });
    };
 
    // Export functionality with filter options
    const handleExport = () => {
        MySwal.fire({
            title: "Export Oral Defense Data",
            html: `
                <div style="text-align: left;">
                    <p style="margin-bottom: 15px; font-weight: 500;">Select which schedules to export:</p>
                    <select id="exportFilter" class="form-select" style="border-radius: 8px; height: 42px; width: 100%;">
                        <option value="all">All Schedules</option>
                        <option value="1">Pending Only</option>
                        <option value="3">Revisions Only</option>
                        <option value="2">Approved Only</option>
                        <option value="4">Disapproved Only</option>
                    </select>
                </div>
            `,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#3B0304",
            cancelButtonColor: "#999",
            confirmButtonText: "Export",
            cancelButtonText: "Cancel",
            preConfirm: () => {
                const exportFilter = document.getElementById('exportFilter').value;
                return { exportFilter };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const { exportFilter } = result.value;
 
                // Filter data based on selected option
                let filteredExportData;
 
                if (exportFilter === 'all') {
                    filteredExportData = filteredSchedules;
                } else {
                    const verdictValue = parseInt(exportFilter);
                    filteredExportData = filteredSchedules.filter(sched => sched.verdict === verdictValue);
                }
 
                // Prepare data for export
                const exportData = filteredExportData.map((sched, index) => {
                    const panelists = [sched.panelist1_id, sched.panelist2_id, sched.panelist3_id]
                        .map((pid) => {
                            const account = accounts.find((a) => a.id === pid);
                            return account ? `${account.last_name}, ${account.first_name}` : "";
                        })
                        .filter(Boolean)
                        .join("; ");
 
                    const adviser = accounts.find((a) => a.id === sched.adviser_id);
                    const adviserName = adviser ? `${adviser.last_name}, ${adviser.first_name}` : "N/A";
 
                    return {
                        no: index + 1,
                        team: sched.manager?.group_name || "-",
                        title: sched.title || "-",
                        date: sched.date,
                        time: sched.time,
                        adviser: adviserName,
                        panelists: panelists,
                        verdict: verdictMap[sched.verdict] || "PENDING"
                    };
                });
 
                if (exportData.length === 0) {
                    const filterText = exportFilter === 'all' ? 'schedules' : 
                                    exportFilter === '1' ? 'PENDING schedules' : 
                                    exportFilter === '3' ? 'REVISIONS schedules' : 
                                    exportFilter === '2' ? 'APPROVED schedules' : 'DISAPPROVED schedules';
 
                    MySwal.fire({
                        title: "No Data to Export",
                        text: `There are no ${filterText} to export.`,
                        icon: "warning",
                        confirmButtonColor: "#3B0304"
                    });
                    return;
                }
 
                // Export as PDF
                exportOralDefenseAsPDF(exportData);
 
                const filterText = exportFilter === 'all' ? 'data' : 
                                exportFilter === '1' ? 'PENDING schedules' : 
                                exportFilter === '3' ? 'REVISIONS schedules' : 
                                exportFilter === '2' ? 'APPROVED schedules' : 'DISAPPROVED schedules';
 
                MySwal.fire({
                    title: "Export Successful!",
                    text: `Oral defense ${filterText} has been downloaded as PDF.`,
                    icon: "success",
                    confirmButtonColor: "#3B0304",
                    timer: 2000,
                    showConfirmButton: false
                });
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
                .from("user_oraldef")
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
                .from("user_oraldef")
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
 
    // change verdict
    const handleVerdictChange = async (id, newVerdict) => {
        const { error } = await supabase
            .from("user_oraldef")
            .update({ verdict: newVerdict })
            .eq("id", id);
 
        if (!error) {
            setSchedules((prev) =>
                prev.map((s) => (s.id === id ? { ...s, verdict: newVerdict } : s))
            );
 
            // Show success message for REVISIONS
            if (newVerdict === 3) {
                MySwal.fire({
                    icon: "success",
                    title: "Marked as REVISIONS",
                    text: "The schedule has been marked for revisions and will remain in the list.",
                    showConfirmButton: false,
                    timer: 2000,
                });
            }
        } else {
            MySwal.fire("Error", "Failed to update verdict.", "error");
        }
    };
 
    // Get adviser name for display
    const getAdviserName = (adviserId) => {
        const adviser = accounts.find(a => a.id === adviserId);
        return adviser ? `${adviser.last_name}, ${adviser.first_name}` : "N/A";
    };
 
    // Get select styling based on verdict - Only style the selected value
    const getSelectStyle = (verdict) => {
        switch (verdict) {
            case 1: // Pending - Default styling
                return 'text-gray-700 bg-white border-gray-300';
            case 2: // Approved - Green
                return 'text-white bg-[#809D3C] border-[#809D3C] font-semibold';
            case 3: // Revisions - Red
                return 'text-white bg-[#3B0304] border-[#3B0304] font-semibold';
            case 4: // Disapproved - Gray
                return 'text-white bg-gray-600 border-gray-600 font-semibold';
            default: // Default
                return 'text-gray-700 bg-white border-gray-300';
        }
    };
 
    return (
        <div className="p-6">
            <h1 className="text-xl font-bold flex items-center gap-2 text-[#3B0304] mb-1">
                <FaCalendarAlt /> Oral Defense » Scheduled Teams
            </h1>
            <div className="w-[calc(100%-1rem)] border-b border-[#3B0304] mt-2 mb-4"></div>
 
            <div className="flex flex-col mb-6">
                <div className="flex gap-4 mb-4">
                    <button
                        className="px-4 py-2 bg-white text-black rounded-lg shadow-sm border border-[#B2B2B2] flex items-center gap-2 transition hover:bg-gray-100"
                        onClick={handleCreateSchedule}
                    >
                        <FaPlus /> Create Schedule
                    </button>
                    <button
                        className="px-4 py-2 bg-white text-black rounded-lg shadow-sm border border-[#B2B2B2] flex items-center gap-2 transition hover:bg-gray-100"
                        onClick={handleExport}
                    >
                        <FaFileExport /> Export
                    </button>
                </div>
                <div className="flex items-center justify-between">
                    <div className="relative w-full" style={{ maxWidth: '250px' }}>
                        <input
                            type="text"
                            className="w-full px-4 py-2 pl-10 bg-white border border-[#B2B2B2] rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                            placeholder="Search Team..."
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
                                }}
                            }
                        >
                            <FaTrash /> {isDeleteMode ? "Delete Selected" : "Delete"}
                        </button>
                    </div>
                </div>
            </div>
 
            <div className="bg-white rounded-lg shadow-md">
                <table className="w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {isDeleteMode && (
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                NO
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                TEAM
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                TITLE
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                DATE
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                TIME
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ADVISER
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                PANELISTS
                            </th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                VERDICT
                            </th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ACTION
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredSchedules.map((s, index) => (
                            <tr 
                                key={s.id} 
                                className="relative"
                            >
                                {isDeleteMode && (
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            className="form-checkbox h-4 w-4 bg-white border-[#3B0304] text-[#3B0304] rounded transition duration-150 ease-in-out cursor-pointer focus:ring-0 focus:ring-offset-0"
                                            checked={selectedSchedules.includes(s.id)}
                                            onChange={(e) => handleCheckboxChange(s.id, e.target.checked)}
                                        />
                                    </td>
                                )}
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                                    {index + 1}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {s.manager?.group_name || "-"}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {s.title || "-"}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {s.date}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {s.time}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {getAdviserName(s.adviser_id)}
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-600">
                                    {[s.panelist1_id, s.panelist2_id, s.panelist3_id]
                                        .map((pid) => {
                                            const account = accounts.find((a) => a.id === pid);
                                            return account ? `${account.last_name}, ${account.first_name}` : "";
                                        })
                                        .filter(Boolean)
                                        .join(", ")}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                                    <select
                                        className={`w-32 p-1 border rounded-lg text-xs transition-colors ${getSelectStyle(s.verdict)}`}
                                        value={s.verdict}
                                        onChange={(e) => handleVerdictChange(s.id, parseInt(e.target.value))}
                                    >
                                        {Object.entries(verdictMap).map(([key, value]) => (
                                            <option key={key} value={key} className="bg-white text-gray-700">
                                                {value}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-center">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenDropdown(openDropdown === index ? null : index);
                                        }}
                                        className="bg-transparent border-none focus:outline-none"
                                    >
                                        <FaEllipsisV className="text-[#3B0304] text-sm" />
                                    </button>
 
                                    {/* Dropdown positioned close to the button */}
                                    {openDropdown === index && (
                                        <div 
                                            ref={dropdownRef}
                                            className="absolute right-4 z-50 mt-1 w-32 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5"
                                            style={{ top: 'calc(100% - 10px)' }}
                                        >
                                            <div className="py-1">
                                                <button
                                                    onClick={() => {
                                                        handleUpdate(s.id);
                                                        setOpenDropdown(null);
                                                    }}
                                                    className="w-full flex items-center px-3 py-2 text-sm text-gray-700 bg-white hover:bg-gray-100 border-none"
                                                >
                                                    <FaPen className="mr-2" /> Update
                                                </button> 
                                                <button
                                                    onClick={() => {
                                                        handleDelete(s.id);
                                                        setOpenDropdown(null);
                                                    }}
                                                    className="w-full flex items-center px-3 py-2 text-sm text-gray-700 bg-white hover:bg-gray-100 border-none"
                                                >
                                                    <FaTrash className="mr-2" /> Delete
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {filteredSchedules.length === 0 && (
                            <tr>
                                <td colSpan={isDeleteMode ? "10" : "9"} className="text-center py-4 text-gray-500">
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
 
export default OralDefense;