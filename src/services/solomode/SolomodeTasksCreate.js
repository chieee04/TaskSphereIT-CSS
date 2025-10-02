import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { supabase } from "../../supabaseClient";
import { oralDefenseData } from "../Manager/OralDefenseData";

const MySwal = withReactContent(Swal);

const buildOptions = (arr) =>
  [`<option value="" disabled selected hidden></option>`, ...arr.map((m) => `<option value="${m}">${m}</option>`)].join("");

export const openCreateSoloTask = async () => {
  const customUser = JSON.parse(localStorage.getItem("customUser"));
  const soloUUID = customUser?.uuid || customUser?.id;

  if (!soloUUID) {
    Swal.fire("Error", "No signed-in user found.", "error");
    return;
  }

  // Query the database to get the user's selected methodology
  const { data: rows, error: methErr } = await supabase
    .from("solo_methodology")
    .select("title_def")
    .eq("solo_id", soloUUID);

  if (methErr) {
    console.error("Supabase query error for solo_methodology:", methErr);
  }

  const selectedMethodology = (rows && rows.length > 0) ? rows[0].title_def : null;

  const { value: formData } = await MySwal.fire({
    title: `<div style="color:#3B0304; font-weight:600; display:flex; align-items:center; gap:8px;">
      <i class="bi bi-list-check"></i> Create Solo Task</div>`,
    width: "900px",
    confirmButtonText: "Create Task",
    showCancelButton: true,
    cancelButtonText: "Cancel",
    focusConfirm: false,
    html: `
      <div style="display:grid; grid-template-columns: repeat(3,1fr); gap:12px; width:100%;">
        <div>
          <label style="font-weight:600;">Methodology</label>
          <select id="methodology" class="form-select">
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
      </div>
      <div style="margin-top:10px;">
        <label style="font-weight:600;">Comment</label>
        <textarea id="comment" class="form-control" placeholder="Add a comment..."></textarea>
      </div>
      <small style="color:#888; font-size:12px; display:block; text-align:right; margin-top:5px;">
        * Required fields
      </small>
    `,
    didOpen: () => {
      const methodologySelect = document.getElementById("methodology");
      const projectPhaseInput = document.getElementById("projectPhase");
      const taskTypeSelect = document.getElementById("taskType");
      const taskSelect = document.getElementById("task");
      const subtaskSelect = document.getElementById("subtask");
      const elementSelect = document.getElementById("element");

      // Initial values
      const initialMethodology = methodologySelect.value;
      if (initialMethodology) {
        projectPhaseInput.value = oralDefenseData[initialMethodology]?.projectPhase || "";
        taskTypeSelect.removeAttribute("disabled");
      }

      // Cascade changes
      methodologySelect.addEventListener("change", () => {
        const selectedMethodology = methodologySelect.value;
        projectPhaseInput.value = oralDefenseData[selectedMethodology]?.projectPhase || "";
        taskTypeSelect.removeAttribute("disabled");
        taskTypeSelect.selectedIndex = 0;
        taskSelect.innerHTML = buildOptions([]);
        taskSelect.setAttribute("disabled", true);
        subtaskSelect.innerHTML = buildOptions([]);
        subtaskSelect.setAttribute("disabled", true);
        elementSelect.innerHTML = buildOptions([]);
        elementSelect.setAttribute("disabled", true);
      });

      taskTypeSelect.addEventListener("change", () => {
        const taskTypes = oralDefenseData[methodologySelect.value];
        const selectedTaskType = taskTypes[taskTypeSelect.value];
        taskSelect.innerHTML = buildOptions(Object.keys(selectedTaskType || {}));
        taskSelect.removeAttribute("disabled");
        subtaskSelect.innerHTML = buildOptions([]);
        subtaskSelect.setAttribute("disabled", true);
        elementSelect.innerHTML = buildOptions([]);
        elementSelect.setAttribute("disabled", true);
      });

      taskSelect.addEventListener("change", () => {
        const subtasks = oralDefenseData[methodologySelect.value][taskTypeSelect.value][taskSelect.value];
        subtaskSelect.innerHTML = buildOptions(Object.keys(subtasks || {}));
        subtaskSelect.removeAttribute("disabled");
        elementSelect.innerHTML = buildOptions([]);
        elementSelect.setAttribute("disabled", true);
      });

      subtaskSelect.addEventListener("change", () => {
        const elements = oralDefenseData[methodologySelect.value][taskTypeSelect.value][taskSelect.value][subtaskSelect.value];
        elementSelect.innerHTML = buildOptions(elements || []);
        elementSelect.removeAttribute("disabled");
      });
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
      const comment = document.getElementById("comment").value;

      if (!dueDate || !task || !taskType || !methodology) {
        Swal.showValidationMessage("Please fill in all required fields.");
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
        comment,
      };
    },
  });

  if (formData) {
    const taskToInsert = {
      user_id: soloUUID, // ✅ correct FK
      methodology: formData.methodology,
      project_phase: formData.projectPhase,
      task_type: formData.taskType,
      task: formData.task,
      subtask: formData.subtask,
      element: formData.element,
      due_date: formData.dueDate,
      time: formData.time,
      comment: formData.comment,
    };

    const { data, error } = await supabase
      .from("solo_mode_task") // ✅ correct table
      .insert([taskToInsert])
      .select();

    if (error) {
      console.error("❌ Supabase insert error:", error);
      MySwal.fire("Error", "Failed to create task. Please try again.", "error");
    } else {
      console.log("✅ New Solo Task Created:", data);
      MySwal.fire("Success", "New solo task created successfully!", "success");
    }
  }
};
