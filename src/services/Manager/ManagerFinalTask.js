import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { supabase } from "../../supabaseClient";
import { finalDefenseData } from "./ManagerFinalData";

const MySwal = withReactContent(Swal);

export const openCreateFinalTask = async () => {
  const customUser = JSON.parse(localStorage.getItem("customUser"));
  const managerUUID = customUser?.uuid || customUser?.id;

  if (!managerUUID) {
    Swal.fire("Error", "No signed-in user found.", "error");
    return;
  }

  // 🔹 Step 1: Check kung may methodology record
  const { data: methRows, error: methErr } = await supabase
    .from("manager_methodology")
    .select("title_def")
    .eq("manager_id", managerUUID);

  if (methErr) {
    console.error(methErr);
    Swal.fire("Error", "Failed to check methodology.", "error");
    return;
  }

  if (!methRows || methRows.length === 0) {
    Swal.fire(
      "A methodology has not yet been selected.",
      "Please proceed to the Title Defense section to choose a methodology before continuing.",
      "warning"
    );
    return;
  }

  // 🔹 Step 2: Get selected methodology
  const selectedMethodology = methRows[0].title_def;

  // 🔹 Step 3: Kunin group_number
  const { data: managerData, error: mgrErr } = await supabase
    .from("user_credentials")
    .select("group_number")
    .eq("id", managerUUID)
    .single();

  if (mgrErr || !managerData) {
    Swal.fire("Error", "Manager not found!", "error");
    return;
  }
  const groupNumber = managerData.group_number;

  // 🔹 Step 4: Fetch members (excluding manager)
  const { data: members, error: memErr } = await supabase
    .from("user_credentials")
    .select("id, first_name, last_name")
    .eq("group_number", groupNumber)
    .neq("id", managerUUID);

  if (memErr) {
    Swal.fire("Error", "Failed to fetch members!", "error");
    return;
  }

  const memberOptions = members
    .map((m) => `<option value="${m.id}">${m.last_name}, ${m.first_name}</option>`)
    .join("");

  // 🔹 Step 5: Open SweetAlert Form
  const { value: formData } = await MySwal.fire({
    title: `<div style="color:#3B0304; font-weight:600; display:flex; align-items:center; gap:8px;">
      <i class="bi bi-list-check"></i> Create Final Defense Task</div>`,
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
            ${Object.keys(finalDefenseData)
              .map(
                (m) =>
                  `<option value="${m}" ${m === selectedMethodology ? "selected" : ""}>${m}</option>`
              )
              .join("")}
          </select>
        </div>

        <div>
          <label style="font-weight:600;">Project Phase</label>
          <select id="projectPhase" class="form-select" disabled>
            <option value=""></option>
          </select>
        </div>

        <div>
          <label style="font-weight:600;">Task Type</label>
          <select id="taskType" class="form-select" disabled>
            <option value=""></option>
          </select>
        </div>

        <div>
          <label style="font-weight:600;">Task</label>
          <select id="task" class="form-select" disabled>
            <option value=""></option>
          </select>
        </div>

        <div>
          <label style="font-weight:600;">Subtask</label>
          <select id="subtask" class="form-select" disabled>
            <option value=""></option>
          </select>
        </div>

        <div>
          <label style="font-weight:600;">Element</label>
          <select id="element" class="form-select" disabled>
            <option value=""></option>
          </select>
        </div>

        <div>
          <label style="font-weight:600;">Due Date *</label>
          <input id="dueDate" type="date" class="form-control"/>
        </div>

        <div>
          <label style="font-weight:600;">Time</label>
          <input id="time" type="time" class="form-control"/>
        </div>

        <div style="grid-column: 1 / span 3;">
          <label style="font-weight:600;">Assign Member/s *</label>
          <select id="assignedMembers" class="form-select">
            <option value="" disabled selected hidden>Select member</option>
            ${memberOptions}
          </select>
        </div>

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
      // Dropdowns
      const methodologySelect = document.getElementById("methodology");
      const projectPhaseSelect = document.getElementById("projectPhase");
      const taskTypeSelect = document.getElementById("taskType");
      const taskSelect = document.getElementById("task");
      const subtaskSelect = document.getElementById("subtask");
      const elementSelect = document.getElementById("element");

      // Members handling
      const assignedDropdown = document.getElementById("assignedMembers");
      const membersListDiv = document.getElementById("membersList");
      let selectedMembers = [];

      // ✅ Helper functions
      const resetSelect = (select, placeholder = "") => {
        select.innerHTML = placeholder
          ? `<option value="" disabled selected hidden>${placeholder}</option>`
          : `<option value=""></option>`;
        select.disabled = true;
        select.value = "";
      };

      const populateOptions = (select, items, placeholder = "") => {
        resetSelect(select, items.length > 0 ? placeholder : "");
        items.forEach((i) => {
          select.innerHTML += `<option value="${i}">${i}</option>`;
        });
        select.disabled = items.length === 0;
      };

      // Chain loading
      methodologySelect.addEventListener("change", () => {
        const selected = methodologySelect.value;
        resetSelect(projectPhaseSelect, "");
        resetSelect(taskTypeSelect, "");
        resetSelect(taskSelect, "");
        resetSelect(subtaskSelect, "");
        resetSelect(elementSelect, "");
        if (finalDefenseData[selected]) {
          populateOptions(projectPhaseSelect, finalDefenseData[selected].phases, "Select Project Phase");
        }
      });

      projectPhaseSelect.addEventListener("change", () => {
        const m = methodologySelect.value;
        const p = projectPhaseSelect.value;
        resetSelect(taskTypeSelect, "");
        resetSelect(taskSelect, "");
        resetSelect(subtaskSelect, "");
        resetSelect(elementSelect, "");
        if (finalDefenseData[m]?.taskTypes[p]) {
          populateOptions(taskTypeSelect, finalDefenseData[m].taskTypes[p], "Select Task Type");
        }
      });

      taskTypeSelect.addEventListener("change", () => {
        const m = methodologySelect.value;
        const tt = taskTypeSelect.value;
        resetSelect(taskSelect, "");
        resetSelect(subtaskSelect, "");
        resetSelect(elementSelect, "");
        if (finalDefenseData[m]?.tasks[tt]) {
          populateOptions(taskSelect, finalDefenseData[m].tasks[tt], "Select Task");
        }
      });

      taskSelect.addEventListener("change", () => {
        const m = methodologySelect.value;
        const t = taskSelect.value;
        resetSelect(subtaskSelect, "");
        resetSelect(elementSelect, "");
        if (finalDefenseData[m]?.subtasks[t]) {
          populateOptions(subtaskSelect, finalDefenseData[m].subtasks[t], "Select Subtask");
        }
      });

      subtaskSelect.addEventListener("change", () => {
        const m = methodologySelect.value;
        const st = subtaskSelect.value;
        resetSelect(elementSelect, "");
        if (finalDefenseData[m]?.elements[st]) {
          populateOptions(elementSelect, finalDefenseData[m].elements[st], "Select Element");
        }
      });

      // Members list rendering
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
            selectedMembers = selectedMembers.filter((m) => m.id !== idToRemove);
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

      window.__finalDefSelectedMembers = selectedMembers;

      // Auto trigger methodology
      if (methodologySelect.value) {
        methodologySelect.dispatchEvent(new Event("change"));
      }
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
      const assignedMembers = (window.__finalDefSelectedMembers || []).map((m) => m.id);
      const comment = document.getElementById("comment").value;

      if (!methodology || !projectPhase || !taskType || !task || !dueDate || assignedMembers.length === 0) {
        Swal.showValidationMessage("⚠ Please complete all required fields!");
        return false;
      }
      return { methodology, projectPhase, taskType, task, subtask, element, dueDate, time, assignedMembers, comment };
    },
  });

  // 🔹 Step 6: Insert to DB
  if (formData) {
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
      .from("manager_final_task")
      .insert(tasksToInsert)
      .select();

    if (error) {
      console.error(error);
      Swal.fire("Error", "Failed to create final defense task.", "error");
      return;
    }

    Swal.fire("Success", "Final Defense Task Created!", "success");
    return data;
  }
};
