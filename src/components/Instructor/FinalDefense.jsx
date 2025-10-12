// FinalDefense.jsx
import { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import {
  FaCalendarAlt,
  FaEllipsisV,
  FaSearch,
  FaTrash,
  FaFileExport,
  FaPen,
  FaPlus,
} from "react-icons/fa";
import { supabase } from "../../supabaseClient";
import jsPDF from "jspdf";

const MySwal = withReactContent(Swal);

const FinalDefense = () => {
  const [accounts, setAccounts] = useState([]);
  const [advisersOnly, setAdvisersOnly] = useState([]); // role 3 only, for Adviser select
  const [schedules, setSchedules] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [search, setSearch] = useState("");
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedSchedules, setSelectedSchedules] = useState([]);
  const dropdownRef = useRef(null);

  // 1: Pending, 2: Accepted, 3: Re-Oral, 4: Not-Accepted
  const verdictMap = {
    1: "Pending",
    2: "Accepted",
    3: "Re-Oral",
    4: "Not-Accepted",
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setOpenDropdown(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const { data: accData, error: accError } = await supabase
        .from("user_credentials")
        .select("*");
      if (accError) {
        console.error("Error fetching accounts:", accError);
        return;
      }
      setAccounts(accData || []);
      setAdvisersOnly((accData || []).filter((a) => a.user_roles === 3));

      const { data: schedData, error: schedError } = await supabase
        .from("user_final_sched")
        .select(`*, manager:manager_id ( group_name )`);
      if (schedError) {
        console.error("Error fetching schedules:", schedError);
        return;
      }
      setSchedules(schedData || []);
    };
    fetchData();
  }, []);

  const sortedSchedules = [...schedules].sort((a, b) => {
    const priorityOrder = { 1: 1, 3: 2, 4: 3, 2: 4 }; // Pending -> Re-Oral -> Not-Accepted -> Accepted
    return (priorityOrder[a.verdict] || 99) - (priorityOrder[b.verdict] || 99);
  });

  const filteredSchedules = sortedSchedules.filter((s) =>
    s.manager?.group_name?.toLowerCase().includes(search.toLowerCase())
  );

  const isTeamAlreadyScheduled = (teamName) =>
    schedules.some((schedule) => schedule.manager?.group_name === teamName);

  const getScheduledTeams = () =>
    schedules.map((s) => s.manager?.group_name).filter(Boolean);

  const hasTimeConflict = (
    selectedDate,
    selectedTime,
    excludeScheduleId = null
  ) => {
    if (!selectedDate || !selectedTime) return false;
    const selectedDateTime = new Date(`${selectedDate}T${selectedTime}`);
    return schedules.some((schedule) => {
      if (schedule.id === excludeScheduleId) return false;
      if (schedule.date !== selectedDate) return false;
      const scheduleDateTime = new Date(`${schedule.date}T${schedule.time}`);
      const timeDiff =
        Math.abs(selectedDateTime - scheduleDateTime) / (1000 * 60 * 60);
      return timeDiff < 1;
    });
  };

  const getConflictingTimes = (
    selectedDate,
    selectedTime,
    excludeScheduleId = null
  ) => {
    if (!selectedDate || !selectedTime) return [];
    const selectedDateTime = new Date(`${selectedDate}T${selectedTime}`);
    return schedules
      .filter((schedule) => {
        if (schedule.id === excludeScheduleId) return false;
        if (schedule.date !== selectedDate) return false;
        const scheduleDateTime = new Date(`${schedule.date}T${schedule.time}`);
        const timeDiff =
          Math.abs(selectedDateTime - scheduleDateTime) / (1000 * 60 * 60);
        return timeDiff < 1;
      })
      .map((schedule) => ({
        team: schedule.manager?.group_name || "Unknown Team",
        time: schedule.time,
      }));
  };

  const exportFinalDefenseAsPDF = (data) => {
    const today = new Date().toLocaleDateString();
    const fileName = `final-defense-schedule-${today.replace(/\//g, "-")}.pdf`;
    const doc = new jsPDF();

    doc.setFillColor(59, 3, 4);
    doc.rect(0, 0, 210, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Final Defense Schedule Report", 105, 15, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${today}`, 105, 22, { align: "center" });

    doc.setTextColor(255, 255, 255);
    doc.setFillColor(59, 3, 4);
    doc.rect(10, 35, 190, 10, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);

    const headers = [
      "NO",
      "TEAM",
      "TITLE",
      "DATE",
      "TIME",
      "ADVISER",
      "PANELISTS",
      "VERDICT",
    ];
    const columnWidths = [10, 30, 35, 20, 15, 25, 40, 20];
    let x = 10;
    headers.forEach((h, idx) => {
      doc.text(h, x + 2, 42);
      x += columnWidths[idx];
    });

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);

    let y = 50;
    data.forEach((row, idx) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      if (idx % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(10, y - 4, 190, 6, "F");
      }
      x = 10;
      const rowData = [
        String(row.no),
        row.team,
        row.title,
        row.date,
        row.time,
        row.adviser,
        row.panelists,
        row.verdict,
      ];
      rowData.forEach((cell, ci) => {
        if (ci === 2 || ci === 6) {
          const lines = doc.splitTextToSize(cell, columnWidths[ci] - 2);
          doc.text(lines, x + 1, y);
        } else {
          doc.text(cell, x + 1, y);
        }
        x += columnWidths[ci];
      });
      y += 6;
    });

    doc.setFontSize(8);
    doc.text(`Total Records: ${data.length}`, 14, 285);
    doc.save(fileName);
  };

  // -------- CREATE: panelists pulled from Oral Defense (locked) --------
  const handleCreateSchedule = () => {
    let selectedPanelists = []; // filled from oral defense
    let selectedAdviser = null;

    MySwal.fire({
      title: `<div style="color:#3B0304;font-weight:600;display:flex;align-items:center;gap:8px;"><i class="bi bi-calendar-plus"></i> Create Schedule</div>`,
      html: `
        <style>
          .pill { background:#e5e7eb; color:#1f2937; border-radius:999px; padding:2px 8px; font-size:12px; display:inline-flex; align-items:center; gap:6px; }
          .time-conflict-warning { color:#d63384; font-size:12px; margin-top:5px; font-weight:500; }
          .muted { color:#6b7280; font-size:12px; }
          .disabled-option { color:#999; background:#f5f5f5; }
        </style>
        <div class="mb-3">
          <label style="font-weight:600;">Select Adviser</label>
          <select id="adviserSelect" class="form-select" style="border-radius:8px;height:42px;">
            <option disabled selected value="">Select</option>
            ${advisersOnly
              .map(
                (a) =>
                  `<option value="${a.id}">${a.last_name}, ${a.first_name}</option>`
              )
              .join("")}
          </select>
        </div>
        <div class="mb-3">
          <label style="font-weight:600;">Assign Team</label>
          <select id="teamSelect" class="form-select" style="border-radius:8px;height:42px;" disabled>
            <option disabled selected value="">Select</option>
          </select>
          <div id="oralNote" class="muted" style="display:none;margin-top:6px;"></div>
        </div>

        <!-- PANELISTS ARE LOCKED: mirrored from ORAL DEFENSE -->
        <div class="mb-2">
          <label style="font-weight:600;">Panelists (from Oral Defense)</label>
          <div id="panelList" class="form-control d-flex flex-wrap gap-2" style="border-radius:8px;min-height:40px;align-items:center;padding:12px;">
            <span class="text-muted">Select a team to load panelists from Oral Defense…</span>
          </div>
        </div>

        <div class="mb-3">
          <label style="font-weight:600;">Date</label>
          <input type="date" id="scheduleDate" class="form-control" style="border-radius:8px;height:42px;"/>
        </div>
        <div class="mb-3">
          <label style="font-weight:600;">Time</label>
          <input type="time" id="scheduleTime" class="form-control" style="border-radius:8px;height:42px;"/>
          <div id="timeConflictWarning" class="time-conflict-warning" style="display:none;"></div>
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
        const panelList = document.getElementById("panelList");
        const oralNote = document.getElementById("oralNote");
        const scheduleDate = document.getElementById("scheduleDate");
        const scheduleTime = document.getElementById("scheduleTime");
        const timeConflictWarning = document.getElementById(
          "timeConflictWarning"
        );

        // date/time guards like your other pages
        if (scheduleDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          scheduleDate.min = today.toISOString().slice(0, 10);
          const openPicker = () =>
            scheduleDate.showPicker && scheduleDate.showPicker();
          scheduleDate.addEventListener("click", openPicker);
          scheduleDate.addEventListener("focus", openPicker);
        }
        if (scheduleTime) {
          const openTP = () =>
            scheduleTime.showPicker && scheduleTime.showPicker();
          scheduleTime.addEventListener("click", openTP);
          scheduleTime.addEventListener("focus", openTP);
          const getNowHHMM = () => {
            const n = new Date();
            return `${String(n.getHours()).padStart(2, "0")}:${String(
              n.getMinutes()
            ).padStart(2, "0")}`;
          };
          const setMinIfToday = () => {
            const d = scheduleDate.value;
            if (!d) {
              scheduleTime.removeAttribute("min");
              return;
            }
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const picked = new Date(d);
            picked.setHours(0, 0, 0, 0);
            if (picked.getTime() === today.getTime()) {
              const min = getNowHHMM();
              scheduleTime.min = min;
              if (scheduleTime.value && scheduleTime.value < min)
                scheduleTime.value = min;
            } else scheduleTime.removeAttribute("min");
          };
          scheduleDate.addEventListener("change", setMinIfToday);
          scheduleTime.addEventListener("input", () => {
            const min = scheduleTime.getAttribute("min");
            if (min && scheduleTime.value && scheduleTime.value < min)
              scheduleTime.value = min;
          });
          setMinIfToday();
        }
        const checkTimeConflict = () => {
          const d = scheduleDate.value,
            t = scheduleTime.value;
          if (d && t) {
            if (hasTimeConflict(d, t)) {
              const conflicts = getConflictingTimes(d, t);
              timeConflictWarning.style.display = "block";
              timeConflictWarning.innerHTML = `⚠️ Time conflict with: ${conflicts
                .map((c) => `${c.team} at ${c.time}`)
                .join(
                  ", "
                )}. Please choose a different time with at least 1 hour gap.`;
            } else timeConflictWarning.style.display = "none";
          } else timeConflictWarning.style.display = "none";
        };
        scheduleDate.addEventListener("change", checkTimeConflict);
        scheduleTime.addEventListener("change", checkTimeConflict);

        // Enable team list after adviser is picked; show teams in same adviser_group and not already final-scheduled
        adviserSelect.addEventListener("change", () => {
          teamSelect.disabled = false;
          const adviser = accounts.find((a) => a.id === adviserSelect.value);
          const scheduledTeams = getScheduledTeams();
          teamSelect.innerHTML =
            '<option disabled selected value="">Select</option>';
          if (adviser) {
            const teams = accounts.filter(
              (a) =>
                a.adviser_group === adviser.adviser_group && a.user_roles === 1
            );
            teams.forEach((m) => {
              if (!m.group_name) return;
              const already = scheduledTeams.includes(m.group_name);
              const opt = document.createElement("option");
              opt.value = m.group_name;
              opt.textContent =
                m.group_name + (already ? " (Already Scheduled)" : "");
              if (already) {
                opt.disabled = true;
                opt.className = "disabled-option";
              }
              teamSelect.appendChild(opt);
            });
          }
          // reset panel display
          selectedPanelists = [];
          panelList.innerHTML = `<span class="text-muted">Select a team to load panelists from Oral Defense…</span>`;
          oralNote.style.display = "none";
          oralNote.innerHTML = "";
        });

        // When team changes, fetch ORAL DEFENSE panelists (latest for that manager)
        teamSelect.addEventListener("change", async () => {
          const teamName = teamSelect.value;
          selectedPanelists = [];
          panelList.innerHTML = `<span class="text-muted">Loading Oral Defense panelists…</span>`;
          oralNote.style.display = "none";
          oralNote.innerHTML = "";

          // find team manager id
          const manager = accounts.find(
            (a) => a.user_roles === 1 && a.group_name === teamName
          );
          if (!manager) {
            panelList.innerHTML = `<span class="text-danger">No manager found for this team.</span>`;
            return;
          }

          // get latest oraldef of this manager
          const { data: oralList, error } = await supabase
            .from("user_oraldef")
            .select("*")
            .eq("manager_id", manager.id)
            .order("date", { ascending: false })
            .order("time", { ascending: false })
            .limit(1);

          if (error) {
            panelList.innerHTML = `<span class="text-danger">Failed to fetch Oral Defense.</span>`;
            return;
          }
          const oral = oralList?.[0];
          if (!oral) {
            panelList.innerHTML = `<span class="text-danger">No Oral Defense found for this team. You must schedule Oral Defense first.</span>`;
            return;
          }

          const ids = [
            oral.panelist1_id,
            oral.panelist2_id,
            oral.panelist3_id,
          ].filter(Boolean);
          if (ids.length === 0) {
            panelList.innerHTML = `<span class="text-danger">Oral Defense has no panelists set for this team.</span>`;
            return;
          }

          selectedPanelists = ids.map(String);

          // render locked chips
          const pills = ids
            .map((id) => {
              const p = accounts.find((a) => a.id === id);
              if (!p) return null;
              const isGuest = p.user_roles === 5;
              return `<span class="pill">${p.last_name}, ${p.first_name}${
                isGuest ? " • Guest" : ""
              }</span>`;
            })
            .filter(Boolean)
            .join(" ");

          panelList.innerHTML = pills;
          oralNote.style.display = "block";
          oralNote.innerHTML =
            "Panelists are locked to match the team's Oral Defense.";
        });
      },
      preConfirm: () => {
        const teamSel = document.getElementById("teamSelect");
        const team = teamSel?.value;
        const opt = teamSel?.options[teamSel.selectedIndex];
        const date = document.getElementById("scheduleDate").value;
        const time = document.getElementById("scheduleTime").value;
        const adviser = document.getElementById("adviserSelect").value;

        if (opt && opt.disabled) {
          MySwal.showValidationMessage(
            "This team already has a Final Defense schedule."
          );
          return false;
        }

        if (!adviser || !team || !date || !time) {
          MySwal.showValidationMessage(
            "Please complete Adviser, Team, Date, and Time."
          );
          return false;
        }

        if (hasTimeConflict(date, time)) {
          const conflicts = getConflictingTimes(date, time);
          MySwal.showValidationMessage(
            `Time conflict detected with: ${conflicts
              .map((c) => `${c.team} at ${c.time}`)
              .join(", ")}.`
          );
          return false;
        }

        // must have panelists from oral
        if (
          !Array.isArray(selectedPanelists) ||
          selectedPanelists.length === 0
        ) {
          MySwal.showValidationMessage(
            "This team has no Oral Defense panelists to copy."
          );
          return false;
        }

        return { adviser, team, date, time, panelists: selectedPanelists };
      },
    }).then(async (res) => {
      if (!res.isConfirmed) return;
      const { adviser, team, date, time, panelists } = res.value;

      if (isTeamAlreadyScheduled(team)) {
        MySwal.fire(
          "Error",
          "This team already has a Final Defense schedule.",
          "error"
        );
        return;
      }
      if (hasTimeConflict(date, time)) {
        const conflicts = getConflictingTimes(date, time);
        MySwal.fire(
          "Error",
          `Time conflict detected with: ${conflicts
            .map((c) => `${c.team} at ${c.time}`)
            .join(", ")}.`,
          "error"
        );
        return;
      }

      const manager = accounts.find(
        (a) => a.user_roles === 1 && a.group_name === team
      );
      const [p1, p2, p3] = panelists;

      const { error, data } = await supabase
        .from("user_final_sched")
        .insert([
          {
            manager_id: manager?.id ?? null,
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
        .select(`*, manager:manager_id ( group_name )`);

      if (error) {
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
    });
  };

  // -------- UPDATE: panelists locked to Oral Defense (no edits) --------
  const handleUpdate = (id) => {
    setOpenDropdown(null);
    const schedule = schedules.find((s) => s.id === id);
    if (!schedule) return;

    let lockedPanelists = [
      schedule.panelist1_id,
      schedule.panelist2_id,
      schedule.panelist3_id,
    ].filter(Boolean);

    const currentAdviser = accounts.find((a) => a.id === schedule.adviser_id);
    const currentTeam = schedule.manager?.group_name;

    MySwal.fire({
      title: `<div style="color:#3B0304;font-weight:600;display:flex;align-items:center;gap:8px;"><i class="bi bi-pencil-square"></i> Update Schedule</div>`,
      html: `
        <style>
          .pill { background:#e5e7eb; color:#1f2937; border-radius:999px; padding:2px 8px; font-size:12px; display:inline-flex; align-items:center; gap:6px; }
          .time-conflict-warning { color:#d63384; font-size:12px; margin-top:5px; font-weight:500; }
          .muted { color:#6b7280; font-size:12px; }
        </style>
        <div class="mb-2" style="background:#f8f9fa;padding:10px;border-radius:8px;border-left:4px solid #3B0304;">
          <div style="font-weight:600;color:#3B0304;">Current Selection</div>
          <div><strong>Adviser:</strong> ${
            currentAdviser
              ? `${currentAdviser.last_name}, ${currentAdviser.first_name}`
              : "N/A"
          }</div>
          <div><strong>Team:</strong> ${currentTeam || "N/A"}</div>
        </div>

        <div class="mb-2">
          <label style="font-weight:600;">Panelists (locked from Oral Defense)</label>
          <div id="panelList" class="form-control d-flex flex-wrap gap-2" style="border-radius:8px;min-height:40px;align-items:center;padding:12px;">
            ${
              lockedPanelists.length
                ? lockedPanelists
                    .map((pid) => {
                      const p = accounts.find((a) => a.id === pid);
                      if (!p) return "";
                      const isGuest = p.user_roles === 5;
                      return `<span class="pill">${p.last_name}, ${
                        p.first_name
                      }${isGuest ? " • Guest" : ""}</span>`;
                    })
                    .join(" ")
                : '<span class="text-muted">No panelists</span>'
            }
          </div>
          <div class="muted" style="margin-top:6px;">Panelist assignments can’t be changed in Final Defense.</div>
        </div>

        <div class="mb-3">
          <label style="font-weight:600;">Date</label>
          <input type="date" id="scheduleDate" class="form-control" style="border-radius:8px;height:42px;" value="${
            schedule.date
          }"/>
        </div>
        <div class="mb-3">
          <label style="font-weight:600;">Time</label>
          <input type="time" id="scheduleTime" class="form-control" style="border-radius:8px;height:42px;" value="${
            schedule.time
          }"/>
          <div id="timeConflictWarning" class="time-conflict-warning" style="display:none;"></div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Update",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#3B0304",
      cancelButtonColor: "#999",
      width: "600px",
      didOpen: () => {
        const scheduleDate = document.getElementById("scheduleDate");
        const scheduleTime = document.getElementById("scheduleTime");
        const timeConflictWarning = document.getElementById(
          "timeConflictWarning"
        );

        if (scheduleDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          scheduleDate.min = today.toISOString().slice(0, 10);
          const open = () =>
            scheduleDate.showPicker && scheduleDate.showPicker();
          scheduleDate.addEventListener("click", open);
          scheduleDate.addEventListener("focus", open);
        }
        if (scheduleTime) {
          const openTP = () =>
            scheduleTime.showPicker && scheduleTime.showPicker();
          scheduleTime.addEventListener("click", openTP);
          scheduleTime.addEventListener("focus", openTP);
          const getNowHHMM = () => {
            const n = new Date();
            return `${String(n.getHours()).padStart(2, "0")}:${String(
              n.getMinutes()
            ).padStart(2, "0")}`;
          };
          const setMinIfToday = () => {
            const d = scheduleDate.value;
            if (!d) {
              scheduleTime.removeAttribute("min");
              return;
            }
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const picked = new Date(d);
            picked.setHours(0, 0, 0, 0);
            if (picked.getTime() === today.getTime()) {
              const min = getNowHHMM();
              scheduleTime.min = min;
              if (scheduleTime.value && scheduleTime.value < min)
                scheduleTime.value = min;
            } else scheduleTime.removeAttribute("min");
          };
          scheduleDate.addEventListener("change", setMinIfToday);
          scheduleTime.addEventListener("input", () => {
            const min = scheduleTime.getAttribute("min");
            if (min && scheduleTime.value && scheduleTime.value < min)
              scheduleTime.value = min;
          });
          setMinIfToday();
        }

        const checkTimeConflict = () => {
          const d = scheduleDate.value,
            t = scheduleTime.value;
          if (d && t) {
            if (hasTimeConflict(d, t, schedule.id)) {
              const conflicts = getConflictingTimes(d, t, schedule.id);
              timeConflictWarning.style.display = "block";
              timeConflictWarning.innerHTML = `⚠️ Time conflict with: ${conflicts
                .map((c) => `${c.team} at ${c.time}`)
                .join(
                  ", "
                )}. Please choose a different time with at least 1 hour gap.`;
            } else timeConflictWarning.style.display = "none";
          } else timeConflictWarning.style.display = "none";
        };
        scheduleDate.addEventListener("change", checkTimeConflict);
        scheduleTime.addEventListener("change", checkTimeConflict);
      },
      preConfirm: () => {
        const date = document.getElementById("scheduleDate").value;
        const time = document.getElementById("scheduleTime").value;

        if (!date || !time) {
          MySwal.showValidationMessage("Please set Date and Time.");
          return false;
        }
        if (hasTimeConflict(date, time, schedule.id)) {
          const conflicts = getConflictingTimes(date, time, schedule.id);
          MySwal.showValidationMessage(
            `Time conflict detected with: ${conflicts
              .map((c) => `${c.team} at ${c.time}`)
              .join(", ")}.`
          );
          return false;
        }

        // keep the same panelists (locked)
        return { date, time, panelists: lockedPanelists };
      },
    }).then(async (res) => {
      if (!res.isConfirmed) return;
      const { date, time, panelists } = res.value;
      const [p1, p2, p3] = panelists;

      const { error } = await supabase
        .from("user_final_sched")
        .update({
          date,
          time,
          panelist1_id: p1 || null,
          panelist2_id: p2 || null,
          panelist3_id: p3 || null,
        })
        .eq("id", id);

      if (error) {
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
    });
  };

  const handleExport = () => {
    MySwal.fire({
      title: "Export Final Defense Data",
      html: `
        <div style="text-align:left;">
          <p style="margin-bottom:15px;font-weight:500;">Select which schedules to export:</p>
          <select id="exportFilter" class="form-select" style="border-radius:8px;height:42px;width:100%;">
            <option value="all">All Schedules</option>
            <option value="1">Pending Only</option>
            <option value="3">Re-Oral Only</option>
            <option value="4">Not-Accepted Only</option>
            <option value="2">Accepted Only</option>
          </select>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3B0304",
      cancelButtonColor: "#999",
      confirmButtonText: "Export",
      cancelButtonText: "Cancel",
      preConfirm: () => ({
        exportFilter: document.getElementById("exportFilter").value,
      }),
    }).then((result) => {
      if (!result.isConfirmed) return;
      const { exportFilter } = result.value;

      let filteredExportData;
      if (exportFilter === "all") filteredExportData = filteredSchedules;
      else {
        const verdictValue = parseInt(exportFilter, 10);
        filteredExportData = filteredSchedules.filter(
          (sched) => sched.verdict === verdictValue
        );
      }

      const exportData = filteredExportData.map((sched, index) => {
        const panelists = [
          sched.panelist1_id,
          sched.panelist2_id,
          sched.panelist3_id,
        ]
          .map((pid) => {
            const account = accounts.find((a) => a.id === pid);
            return account ? `${account.last_name}, ${account.first_name}` : "";
          })
          .filter(Boolean)
          .join("; ");

        const adviser = accounts.find((a) => a.id === sched.adviser_id);
        const adviserName = adviser
          ? `${adviser.last_name}, ${adviser.first_name}`
          : "N/A";

        return {
          no: index + 1,
          team: sched.manager?.group_name || "-",
          title: sched.title || "-",
          date: sched.date,
          time: sched.time,
          adviser: adviserName,
          panelists,
          verdict: verdictMap[sched.verdict] || "PENDING",
        };
      });

      if (exportData.length === 0) {
        const filterText =
          exportFilter === "all"
            ? "schedules"
            : exportFilter === "1"
            ? "PENDING schedules"
            : exportFilter === "3"
            ? "Re-Oral schedules"
            : exportFilter === "4"
            ? "Not-Accepted schedules"
            : "Accepted schedules";

        MySwal.fire({
          title: "No Data to Export",
          text: `There are no ${filterText} to export.`,
          icon: "warning",
          confirmButtonColor: "#3B0304",
        });
        return;
      }

      exportFinalDefenseAsPDF(exportData);
      const filterText =
        exportFilter === "all"
          ? "data"
          : exportFilter === "1"
          ? "PENDING schedules"
          : exportFilter === "3"
          ? "Re-Oral schedules"
          : exportFilter === "4"
          ? "Not-Accepted schedules"
          : "Accepted schedules";

      MySwal.fire({
        title: "Export Successful!",
        text: `Final defense ${filterText} has been downloaded as PDF.`,
        icon: "success",
        confirmButtonColor: "#3B0304",
        timer: 2000,
        showConfirmButton: false,
      });
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
    if (!confirm.isConfirmed) return;

    const { error } = await supabase
      .from("user_final_sched")
      .delete()
      .eq("id", id);
    if (error) MySwal.fire("Error", "Failed to delete schedule.", "error");
    else {
      setSchedules((prev) => prev.filter((s) => s.id !== id));
      MySwal.fire("Deleted!", "Schedule has been deleted.", "success");
    }
  };

  const handleCheckboxChange = (id, isChecked) => {
    setSelectedSchedules((prev) =>
      isChecked ? [...prev, id] : prev.filter((sid) => sid !== id)
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedSchedules.length === 0) {
      MySwal.fire(
        "No schedules selected",
        "Please select one or more schedules to delete.",
        "warning"
      );
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
    if (!confirm.isConfirmed) return;

    const { error } = await supabase
      .from("user_final_sched")
      .delete()
      .in("id", selectedSchedules);
    if (error)
      MySwal.fire("Error", "Failed to delete selected schedules.", "error");
    else {
      setSchedules((prev) =>
        prev.filter((s) => !selectedSchedules.includes(s.id))
      );
      setSelectedSchedules([]);
      setIsDeleteMode(false);
      MySwal.fire(
        "Deleted!",
        "Selected schedules have been deleted.",
        "success"
      );
    }
  };

  const handleVerdictChange = async (id, newVerdict) => {
    const { error } = await supabase
      .from("user_final_sched")
      .update({ verdict: newVerdict })
      .eq("id", id);
    if (error) {
      MySwal.fire("Error", "Failed to update verdict.", "error");
      return;
    }
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, verdict: newVerdict } : s))
    );
    if (newVerdict === 3) {
      MySwal.fire({
        icon: "success",
        title: "Marked as Re-Oral",
        text: "The schedule has been marked for re-oral and will remain in the list.",
        showConfirmButton: false,
        timer: 2000,
      });
    }
  };

  const getAdviserName = (adviserId) => {
    const adviser = accounts.find((a) => a.id === adviserId);
    return adviser ? `${adviser.last_name}, ${adviser.first_name}` : "N/A";
  };

  const getSelectStyle = (verdict) => {
    switch (verdict) {
      case 1:
        return "text-gray-700 bg-white border-gray-300";
      case 2:
        return "text-white bg-[#809D3C] border-[#809D3C] font-semibold";
      case 3:
        return "text-white bg-[#3B0304] border-[#3B0304] font-semibold";
      case 4:
        return "text-white bg-gray-600 border-gray-600 font-semibold";
      default:
        return "text-gray-700 bg-white border-gray-300";
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold flex items-center gap-2 text-[#3B0304] mb-1">
        <FaCalendarAlt /> Final Defense » Scheduled Teams
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
          <div className="relative w-full" style={{ maxWidth: "250px" }}>
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
              onClick={() =>
                isDeleteMode ? handleDeleteSelected() : setIsDeleteMode(true)
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 bg-white border-[#3B0304] text-[#3B0304] rounded transition duration-150 ease-in-out cursor-pointer focus:ring-0 focus:ring-offset-0"
                    onChange={(e) =>
                      setSelectedSchedules(
                        e.target.checked
                          ? filteredSchedules.map((s) => s.id)
                          : []
                      )
                    }
                    checked={
                      selectedSchedules.length === filteredSchedules.length &&
                      filteredSchedules.length > 0
                    }
                  />
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                NO
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                TEAM
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                TITLE
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                DATE
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                TIME
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ADVISER
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                PANELISTS
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                VERDICT
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                ACTION
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSchedules.map((s, index) => (
              <tr key={s.id} className="relative">
                {isDeleteMode && (
                  <td className="px-4 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 bg-white border-[#3B0304] text-[#3B0304] rounded transition duration-150 ease-in-out cursor-pointer focus:ring-0 focus:ring-offset-0"
                      checked={selectedSchedules.includes(s.id)}
                      onChange={(e) =>
                        handleCheckboxChange(s.id, e.target.checked)
                      }
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
                      return account
                        ? `${account.last_name}, ${account.first_name}`
                        : "";
                    })
                    .filter(Boolean)
                    .join(", ")}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                  <select
                    className={`w-36 p-1 border rounded-lg text-xs transition-colors ${getSelectStyle(
                      s.verdict
                    )}`}
                    value={s.verdict}
                    onChange={(e) =>
                      handleVerdictChange(s.id, parseInt(e.target.value, 10))
                    }
                  >
                    {Object.entries(verdictMap).map(([key, value]) => (
                      <option
                        key={key}
                        value={key}
                        className="bg-white text-gray-700"
                      >
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

                  {openDropdown === index && (
                    <div
                      ref={dropdownRef}
                      className="absolute right-4 z-50 mt-1 w-32 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5"
                      style={{ top: "calc(100% - 10px)" }}
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
                <td
                  colSpan={isDeleteMode ? "10" : "9"}
                  className="text-center py-4 text-gray-500"
                >
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

export default FinalDefense;
