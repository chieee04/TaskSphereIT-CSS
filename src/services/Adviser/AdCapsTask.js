// AdCapsTask.js
import { supabase } from "../../supabaseClient";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { adCapsTaskData } from "./adcapsdata";

const MySwal = withReactContent(Swal);

const buildOptions = (arr) =>
  [`<option value="" disabled selected hidden></option>`, ...arr.map((m) => `<option value="${m}">${m}</option>`)].join("");

// 🔹 Fetch Tasks
export const fetchTasksFromDB = async (setTasks) => {
  const storedUser = localStorage.getItem("customUser");
  if (!storedUser) return;

  const adviser = JSON.parse(storedUser);

  const { data, error } = await supabase
    .from("adviser_oral_def")
    .select("*")
    .eq("adviser_id", adviser.id)
    .order("date_created", { ascending: false });

  if (error) {
    console.error("Error fetching tasks:", error);
    return;
  }

  setTasks(data || []);
};

// 🔹 Update Task Status
export const handleUpdateStatus = async (taskId, newStatus, setTasks) => {
  const { error } = await supabase
    .from("adviser_oral_def")
    .update({ status: newStatus })
    .eq("id", taskId);

  if (error) {
    console.error("Error updating status:", error);
    Swal.fire({ icon: "error", title: "Update failed", text: "Please try again." });
    return;
  }

  setTasks((prev) =>
    prev.map((task) =>
      task.id === taskId ? { ...task, status: newStatus } : task
    )
  );

  Swal.fire({
    toast: true,
    icon: "success",
    title: "Task status updated!",
    position: "top-end",
    showConfirmButton: false,
    timer: 1500,
  });
};

// 🔹 Create Task
export const handleCreateTask = async (setTasks) => {
  const { value: formData } = await MySwal.fire({
    title: `<div style="color:#3B0304; font-weight:600; display:flex; align-items:center; gap:8px;">
      <i class="bi bi-list-check"></i> Create Capstone Task</div>`,
    width: "900px",
    confirmButtonText: "Create Task",
    showCancelButton: true,
    cancelButtonText: "Cancel",
    html: `
      <div style="display:grid; grid-template-columns: repeat(3,1fr); gap:12px;">
        <div>
          <label style="font-weight:600;">Methodology</label>
          <select id="methodology" class="form-select">
            ${Object.keys(adCapsTaskData)
              .map((m) => `<option value="${m}">${m}</option>`)
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
          <label style="font-weight:600;">Due Date</label>
          <input id="dueDate" type="date" class="form-control"/>
        </div>

        <div>
          <label style="font-weight:600;">Time</label>
          <input id="time" type="time" class="form-control"/>
        </div>

        <div style="grid-column: 1 / span 3;">
          <label style="font-weight:600;">Leave Comment</label>
          <textarea id="comment" rows="2" class="form-control"></textarea>
        </div>
      </div>
    `,
    didOpen: () => {
      const methodology = document.getElementById("methodology");
      const projectPhase = document.getElementById("projectPhase");
      const taskType = document.getElementById("taskType");
      const task = document.getElementById("task");
      const subtask = document.getElementById("subtask");
      const element = document.getElementById("element");

      methodology.addEventListener("change", () => {
        const selected = adCapsTaskData[methodology.value];
        projectPhase.value = selected.projectPhase || "";
        taskType.disabled = false;
        taskType.value = "";
        task.innerHTML = buildOptions([]);
        subtask.innerHTML = buildOptions([]);
        element.innerHTML = buildOptions([]);
      });

      taskType.addEventListener("change", () => {
        const selected = adCapsTaskData[methodology.value];
        const data = selected[taskType.value] || {};
        task.innerHTML = buildOptions(Object.keys(data));
        task.disabled = Object.keys(data).length === 0;
        subtask.innerHTML = buildOptions([]);
        element.innerHTML = buildOptions([]);
      });

      task.addEventListener("change", () => {
        const selected = adCapsTaskData[methodology.value][taskType.value][task.value];
        subtask.innerHTML = buildOptions(Object.keys(selected));
        subtask.disabled = Object.keys(selected).length === 0;
        element.innerHTML = buildOptions([]);
      });

      subtask.addEventListener("change", () => {
        const elements = adCapsTaskData[methodology.value][taskType.value][task.value][subtask.value];
        element.innerHTML = buildOptions(elements || []);
        element.disabled = !elements || elements.length === 0;
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

      if (!methodology || !projectPhase || !taskType || !task || !dueDate) {
        Swal.showValidationMessage("⚠ Please complete all required fields!");
        return false;
      }

      return {
        methodology,
        project_phase: projectPhase,
        task_type: taskType,
        task,
        subtask,
        elements: element,
        due_date: dueDate,
        time,
        comment,
      };
    },
  });

  if (formData) {
    const storedUser = JSON.parse(localStorage.getItem("customUser"));
    const adviserId = storedUser?.id;

    const { data, error } = await supabase
      .from("adviser_oral_def")
      .insert([{ ...formData, adviser_id: adviserId, status: "To Do" }])
      .select("*");

    if (error) {
      console.error(error);
      Swal.fire("Error", "Failed to create task.", "error");
      return;
    }

    Swal.fire("Success", "Task Created!", "success");

    setTasks((prev) => [...prev, ...data]);
  }
};
