import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { supabase } from "../../supabaseClient";
import { oralDefenseData } from "./OralDefenseData";

const MySwal = withReactContent(Swal);

// Helper
const buildOptions = (arr) =>
  [`<option value="" disabled selected hidden></option>`, ...arr.map((m) => `<option value="${m}">${m}</option>`)].join("");

// 🟢 Main Function
// 🟢 Main Function
export const openCreateOralDefTask = async () => {
  // Step 1: Kunin ang uuid ng kasalukuyang naka-login na user mula sa localStorage
  const customUser = JSON.parse(localStorage.getItem("customUser"));
const managerUUID = customUser?.uuid || customUser?.id;

if (!managerUUID) {
  Swal.fire("Error", "No signed-in user found.", "error");
  return;
}

  // Step 2: Kunin ang group_number ng manager mula sa user_credentials gamit uuid
  const { data: managerData, error: mgrErr } = await supabase
    .from("user_credentials")
    .select("group_number")
    .eq("id", managerUUID)   // 🔹 base sa uuid na naka-save
    .single();

  if (mgrErr || !managerData) {
    Swal.fire("Error", "Manager not found!", "error");
    return;
  }
  const groupNumber = managerData.group_number;


  // Step 3: Check kung may methodology record
  const { data: rows, error: methErr } = await supabase
    .from("manager_methodology")
    .select("title_def")
    .eq("manager_id", managerUUID);

  if (methErr) {
    console.error(methErr);
    Swal.fire("Error", "Failed to check methodology.", "error");
    return;
  }

  if (!rows || rows.length === 0) {
    Swal.fire("Please Select Methodology on your Title Defense Page!!", "", "warning");
    return;
  }

  // Step 4: Kunin methodology type
  const selectedMethodology = rows[0].title_def;

  // Step 5: Kunin lahat ng members na nasa parehong group_number
  const { data: members, error: memErr } = await supabase
    .from("user_credentials")
    .select("id, first_name, last_name")
    .eq("group_number", groupNumber)
    .neq("id", managerUUID); // exclude si manager mismo

  if (memErr) {
    console.error(memErr);
    Swal.fire("Error", "Failed to fetch members!", "error");
    return;
  }

  const memberOptions = members
    .map((m) => `<option value="${m.id}">${m.last_name}, ${m.first_name}</option>`)
    .join("");

  // Step 6: Open Create Task Form
  const { value: formData } = await MySwal.fire({
    title: `<div style="color:#3B0304; font-weight:600; display:flex; align-items:center; gap:8px;">
      <i class="bi bi-list-check"></i> Create Oral Defense Task</div>`,
    width: "900px",
    confirmButtonText: "Create Task",
    showCancelButton: true,
    cancelButtonText: "Cancel",
    focusConfirm: false,
    html: `
      <div style="display:grid; grid-template-columns: repeat(3,1fr); gap:12px; width:100%;">
        <div>
          <label style="font-weight:600;">Methodology</label>
          <select id="methodology" class="form-select" disabled>
            ${Object.keys(oralDefenseData)
              .map(
                (m) =>
                  `<option value="${m}" ${m === selectedMethodology ? "selected" : ""}>${m}</option>`
              )
              .join("")}
          </select>
        </div>

        <div>
          <label style="font-weight:600;">Project Phase</label>
          <input id="projectPhase" type="text" class="form-control" disabled />
        </div>

        <div>
          <label style="font-weight:600;">Task Type</label>
          <select id="taskType" class="form-select" disabled>
            <option value="" disabled selected hidden></option>
            <option value="Documentation">Documentation</option>
            <option value="Discussion & Review">Discussion & Review</option>
          </select>
        </div>

        <div>
          <label style="font-weight:600;">Task</label>
          <select id="task" class="form-select" disabled></select>
        </div>

        <div>
          <label style="font-weight:600;">Subtask</label>
          <select id="subtask" class="form-select" disabled></select>
        </div>

        <div>
          <label style="font-weight:600;">Element</label>
          <select id="element" class="form-select" disabled></select>
        </div>

        <div>
          <label style="font-weight:600;">Due Date *</label>
          <input id="dueDate" type="date" class="form-control"/>
        </div>

        <div>
          <label style="font-weight:600;">Time</label>
          <input id="time" type="time" class="form-control"/>
        </div>

        <!-- Assign Members -->
        <div style="grid-column: 1 / span 3;">
          <label style="font-weight:600;">Assign Member/s *</label>
          <select id="assignedMembers" class="form-select">
            <option value="" disabled selected hidden>Select member</option>
            ${memberOptions}
          </select>
        </div>

        <!-- Members List -->
        <div style="grid-column: 1 / span 3; margin-top:10px;">
          <label style="font-weight:600;">Member List</label>
          <div id="membersList" style="border:1px solid #ccc; border-radius:6px; padding:8px; min-height:40px;">
            <small style="color:#888;">No members assigned</small>
          </div>
        </div>
      </div>

      <div style="margin-top:10px;">
        <label style="font-weight:600;">Leave Comment</label>
        <textarea id="comment" rows="3" class="form-control"></textarea>
      </div>
    `,
    didOpen: () => {
      const methodology = document.getElementById("methodology");
      const projectPhase = document.getElementById("projectPhase");
      const taskType = document.getElementById("taskType");
      const task = document.getElementById("task");
      const subtask = document.getElementById("subtask");
      const element = document.getElementById("element");

      // Methodology auto load
      methodology.addEventListener("change", () => {
        const selected = oralDefenseData[methodology.value];
        projectPhase.value = selected.projectPhase || "";
        taskType.disabled = false;
        taskType.value = "";
        task.innerHTML = `<option value="" disabled selected hidden></option>`;
        subtask.innerHTML = `<option value="" disabled selected hidden></option>`;
        element.innerHTML = `<option value="" disabled selected hidden></option>`;
        task.disabled = true;
        subtask.disabled = true;
        element.disabled = true;
      });

      // TaskType selection
      taskType.addEventListener("change", () => {
        const selected = oralDefenseData[methodology.value];
        const data = selected[taskType.value] || {};
        task.innerHTML = buildOptions(Object.keys(data));
        task.disabled = true;
        subtask.disabled = true;
        element.disabled = true;

        if (Object.keys(data).length > 0) {
          task.disabled = false;
        }
      });

      // Task selection
      task.addEventListener("change", () => {
        const selected =
          oralDefenseData[methodology.value][taskType.value][task.value];
        subtask.innerHTML = buildOptions(Object.keys(selected));
        subtask.disabled = true;
        element.disabled = true;

        if (Object.keys(selected).length > 0) {
          subtask.disabled = false;
        }
      });

      // Subtask selection
      subtask.addEventListener("change", () => {
        const elements =
          oralDefenseData[methodology.value][taskType.value][task.value][subtask.value];
        element.innerHTML = buildOptions(elements || []);
        element.disabled = true;

        if (elements && elements.length > 0) {
          element.disabled = false;
        }
      });

      // Auto trigger
      if (methodology.value) {
        methodology.dispatchEvent(new Event("change"));
      }

      // 🔽 Members Assign Logic
      const assignedDropdown = document.getElementById("assignedMembers");
      const membersListDiv = document.getElementById("membersList");

      let selectedMembers = [];

      const renderMembersList = () => {
        if (selectedMembers.length === 0) {
          membersListDiv.innerHTML = `<small style="color:#888;">No members assigned</small>`;
          return;
        }

        membersListDiv.innerHTML = selectedMembers
          .map(
            (m) => `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:4px 8px; border:1px solid #ddd; border-radius:16px; margin-bottom:6px; background:#f9f9f9;">
              <span>${m.name}</span>
              <button type="button" class="btn btn-sm btn-danger removeMemberBtn" data-id="${m.id}">x</button>
            </div>`
          )
          .join("");

        membersListDiv.querySelectorAll(".removeMemberBtn").forEach((btn) => {
          btn.addEventListener("click", () => {
            const idToRemove = btn.getAttribute("data-id");
            const removed = selectedMembers.find((m) => m.id === idToRemove);
            selectedMembers = selectedMembers.filter((m) => m.id !== idToRemove);

            assignedDropdown.innerHTML += `<option value="${removed.id}">${removed.name}</option>`;
            renderMembersList();
          });
        });
      };

      assignedDropdown.addEventListener("change", () => {
        const selectedId = assignedDropdown.value;
        const selectedText = assignedDropdown.options[assignedDropdown.selectedIndex]?.text;

        if (!selectedId) return;

        selectedMembers.push({ id: selectedId, name: selectedText });

        assignedDropdown.querySelector(`option[value="${selectedId}"]`).remove();
        assignedDropdown.value = "";

        renderMembersList();
      });

      window.__oralDefSelectedMembers = selectedMembers;
    },
    preConfirm: () => {
      const methodology = document.getElementById("methodology").value;
      const projectPhase = document.getElementById("projectPhase").value;
      const taskType = document.getElementById("taskType").value;
      const task = document.getElementById("task").value;
      const subtask = document.getElementById("subtask").value;
      const element = document.getElementById("element").value;
      const dueDate = document.getElementById("dueDate").value;
      const time = document.getElementById("time").value;
      const assignedMembers = (window.__oralDefSelectedMembers || []).map((m) => m.id);
      const comment = document.getElementById("comment").value;

      if (!methodology || !projectPhase || !taskType || !task || !dueDate || assignedMembers.length === 0) {
        Swal.showValidationMessage("⚠ Please complete all required fields!");
        return false;
      }
      return {
        methodology,
        projectPhase,
        taskType,
        task,
        subtask,
        element,
        dueDate,
        time,
        assignedMembers,
        comment,
      };
    },
  });

 if (formData) {
  console.log("✅ New Oral Defense Task Created:", formData);

  // insert per member
  const tasksToInsert = formData.assignedMembers.map((memberId) => ({
    manager_id: managerUUID,
    member_id: memberId,
    methodology: formData.methodology,
    project_phase: formData.projectPhase,
    task_type: formData.taskType,
    task: formData.task,
    subtask: formData.subtask,
    element: formData.element,
    due_date: formData.dueDate,
    time: formData.time,
    comment: formData.comment,
  }));

const { data, error } = await supabase
  .from("manager_oral_task")
  .insert(tasksToInsert)
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
  `); // <-- include member relation

if (error) {
  console.error(error);
  Swal.fire("Error", "Failed to create oral defense task.", "error");
  return;
}

Swal.fire("Success", "Oral Defense Task Created!", "success");

// Return inserted rows to the component
return data;
 }
};
