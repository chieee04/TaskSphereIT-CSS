
import { supabase } from "../../supabaseClient";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { finalredefdata } from "./AdviserFinalRedefData";
const MySwal = withReactContent(Swal);
 
// Helper: build <option>
const buildOptions = (items) => {
  if (!items || items.length === 0)
    return `<option value="" disabled selected hidden></option>`;
  return (
    `<option value="" disabled selected hidden></option>` +
    items.map((i) => `<option value="${i}">${i}</option>`).join("")
  );
};
 
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
    Swal.fire({
      icon: "error",
      title: "Update failed",
      text: "Please try again.",
    });
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
            ${Object.keys(finalredefdata)
              .map((m) => `<option value="${m}">${m}</option>`)
              .join("")}
          </select>
        </div>
 
        <div>
          <label style="font-weight:600;">Project Phase</label>
          <select id="projectPhase" class="form-select" disabled></select>
        </div>
 
        <div>
          <label style="font-weight:600;">Task Type</label>
          <select id="taskType" class="form-select" disabled></select>
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
 
      // 🔹 Methodology Change
      methodology.addEventListener("change", () => {
        const selected = finalredefdata[methodology.value];
 
        projectPhase.innerHTML = buildOptions(selected?.phases || []);
        projectPhase.disabled = (selected?.phases?.length || 0) === 0;
 
        taskType.innerHTML = buildOptions(Object.keys(selected?.tasks || {}));
        taskType.disabled = Object.keys(selected?.tasks || {}).length === 0;
 
        task.innerHTML = buildOptions([]);
        subtask.innerHTML = buildOptions([]);
        element.innerHTML = buildOptions([]);
      });
 
      // 🔹 TaskType Change
      taskType.addEventListener("change", () => {
        const selected = finalredefdata[methodology.value];
        const data = selected?.tasks?.[taskType.value] || [];
 
        task.innerHTML = buildOptions(data);
        task.disabled = data.length === 0;
 
        subtask.innerHTML = buildOptions([]);
        element.innerHTML = buildOptions([]);
      });
 
      // 🔹 Task Change
      task.addEventListener("change", () => {
        const subtasks =
          finalredefdata[methodology.value]?.subtasks?.[task.value] || [];
 
        subtask.innerHTML = buildOptions(subtasks);
        subtask.disabled = subtasks.length === 0;
 
        element.innerHTML = buildOptions([]);
      });
 
      // 🔹 Subtask Change
      subtask.addEventListener("change", () => {
        const elements =
          finalredefdata[methodology.value]?.elements?.[subtask.value] || [];
 
        element.innerHTML = buildOptions(elements);
        element.disabled = elements.length === 0;
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