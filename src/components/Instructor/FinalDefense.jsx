import { FaPlus, FaCalendarAlt, FaPen } from "react-icons/fa";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { supabase } from "../../supabaseClient";
 
const MySwal = withReactContent(Swal);
 
const FinalDefense = () => {
  const [advisers, setAdvisers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [search, setSearch] = useState("");
 
  const verdictMap = {
    1: "Pending",
    2: "Re-Defense",
    3: "Disapproved",
    4: "Approved",
  };
 
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
        .from("user_final_sched")
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
 
  // create schedule
  const handleCreateSchedule = () => {
    let selectedPanelists = [];
    let selectedAdviser = null;
 
    MySwal.fire({
      title: `<div style="color:#3B0304;font-weight:600;">➕ Create Schedule</div>`,
      html: `
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
                teamSelect.innerHTML += `<option value="${t.group_name}">${t.group_name}</option>`;
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
 
        if (!selectedAdviser || !team || !date || !time || selectedPanelists.length === 0) {
          MySwal.showValidationMessage("Please fill all fields and select panelists.");
          return false;
        }
 
        return { adviser: selectedAdviser, team, date, time, panelists: selectedPanelists };
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        const { adviser, team, date, time, panelists } = result.value;
 
        const manager = accounts.find((a) => a.user_roles === 1 && a.group_name === team);
        const [p1, p2, p3] = panelists;
 
        const { error, data } = await supabase
          .from("user_final_sched")
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
 
  // change verdict
  const handleVerdictChange = async (id, newVerdict) => {
    const { error } = await supabase
      .from("user_final_sched")
      .update({ verdict: newVerdict })
      .eq("id", id);
 
    if (!error) {
      setSchedules((prev) =>
        prev.map((s) => (s.id === id ? { ...s, verdict: newVerdict } : s))
      );
    }
  };
 
  // update schedule date & time
  const handleUpdateSchedule = async (schedule) => {
    let date = prompt("Enter new date:", schedule.date);
    if (!date) return;
    let time = prompt("Enter new time:", schedule.time);
    if (!time) return;
 
    const { error } = await supabase
      .from("user_final_sched")
      .update({ date, time })
      .eq("id", schedule.id);
 
    if (!error) {
      setSchedules((prev) =>
        prev.map((s) => (s.id === schedule.id ? { ...s, date, time } : s))
      );
      MySwal.fire({
        icon: "success",
        title: "Schedule updated",
        showConfirmButton: false,
        timer: 1200,
      });
    }
  };
 
  // search by team
  const filteredSchedules = schedules.filter((s) =>
    s.manager?.group_name?.toLowerCase().includes(search.toLowerCase())
  );
 
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold flex items-center gap-2 text-[#3B0304] mb-1">
        <FaCalendarAlt /> Final Defense » Scheduled Teams
      </h1>
      <div className="w-[calc(100%-1rem)] border-b border-[#3B0304] mt-2 mb-4"></div>
 
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={handleCreateSchedule}
          className="px-4 py-2 bg-[#3B0304] text-white rounded-lg flex items-center gap-1"
        >
          <FaPlus /> Create Schedule
        </button>
        <input
          type="text"
          placeholder="Search Team..."
          className="border px-2 py-1 rounded-lg"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
 
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">NO</th>
              <th className="border px-2 py-1">TEAM</th>
              <th className="border px-2 py-1">TITLE</th>
              <th className="border px-2 py-1">DATE</th>
              <th className="border px-2 py-1">TIME</th>
              <th className="border px-2 py-1">PANELISTS</th>
              <th className="border px-2 py-1">VERDICT</th>
              <th className="border px-2 py-1">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filteredSchedules.map((s, idx) => (
              <tr key={s.id}>
                <td className="border px-2 py-1">{idx + 1}</td>
                <td className="border px-2 py-1">{s.manager?.group_name || "-"}</td>
                <td className="border px-2 py-1">{s.title || "-"}</td>
                <td className="border px-2 py-1">{s.date}</td>
                <td className="border px-2 py-1">{s.time}</td>
                <td className="border px-2 py-1">
                  {[s.panelist1_id, s.panelist2_id, s.panelist3_id]
                    .map((pid) => accounts.find((a) => a.id === pid)?.last_name || "")
                    .filter(Boolean)
                    .join(", ")}
                </td>
                <td className="border px-2 py-1">
                  <select
                    value={s.verdict}
                    onChange={(e) => handleVerdictChange(s.id, parseInt(e.target.value))}
                    className="border px-1 py-0.5 rounded"
                  >
                    {Object.entries(verdictMap).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="border px-2 py-1">
                  <button
                    onClick={() => handleUpdateSchedule(s)}
                    className="px-2 py-1 bg-yellow-400 text-white rounded text-sm flex items-center gap-1"
                  >
                    <FaPen /> Update
                  </button>
                </td>
              </tr>
            ))}
            {filteredSchedules.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-4 text-gray-500">
                  No schedules found
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