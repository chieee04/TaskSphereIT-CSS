import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
 
// 1. IMPORT ANG DATA MULA SA KATABING FILE
import { finalReDefenseTasks } from "./AdviserFinalRedefData"; // Gumamit ng relative path
 
const MySwal = withReactContent(Swal);
 
// --- UTILITY FUNCTIONS PARA MAG-PROCESS NG DATA ---
 
// Function para kumuha ng unique, non-null/non-empty values para sa isang key
const getUniqueValues = (data, key) => {
  const values = data
    .map((item) => item[key])
    .filter((value) => value !== null && value !== undefined && value !== "");
  return Array.from(new Set(values));
};
 
// Function para mag-generate ng <option> HTML string
const generateOptionsHtml = (values) => {
  // Pinanatili ang original hidden/disabled option ng user
  let html = `<option value="" disabled selected hidden></option>`;
  values.forEach((value) => {
    const stringValue = String(value);
    html += `<option value="${stringValue}">${stringValue}</option>`;
  });
  return html;
};
 
// --- DYNAMICALLY GENERATED INITIAL OPTIONS ---
const initialMethodologies = getUniqueValues(finalReDefenseTasks, "methodology");
const methodologyOptionsHtml = generateOptionsHtml(initialMethodologies);
 
// Ang iba ay walang laman (empty) sa una
const emptySelectHtml = `
  <option value="" disabled selected hidden></option>
`;
 
// Pinanatili ang Team Options
const teamOptions = `
  <option value="Team A">Team A</option>
  <option value="Team B">Team B</option>
`;
 
 
const updateSelectOptions = (selectId, dataToPopulate, propertyToPopulate) => {
  const selectElement = document.getElementById(selectId);
  if (!selectElement) return;
 
  const uniqueValues = getUniqueValues(dataToPopulate, propertyToPopulate);
 
  selectElement.innerHTML = generateOptionsHtml(uniqueValues);
 
  // I-disable ang select kung walang unique values
  if (uniqueValues.length > 0) {
    selectElement.removeAttribute('disabled');
  } else {
    selectElement.setAttribute('disabled', 'true');
  }
 
  // I-reset ang value para sa bagong filtering
  selectElement.value = "";
};
 
 
// --- EVENT HANDLERS PARA SA CASCADING LOGIC ---
 
// Helper function para mag-filter ng data base sa kasalukuyang pinili
const getFilteredData = (methodology, phase, type, task, subtask) => {
  let filtered = finalReDefenseTasks;
 
  if (methodology) {
      filtered = filtered.filter(item => item.methodology === methodology);
  }
  if (phase) {
      filtered = filtered.filter(item => item.project_phase === phase);
  }
  if (type) {
      filtered = filtered.filter(item => item.task_type === type);
  }
  if (task) {
      filtered = filtered.filter(item => item.task === task);
  }
  if (subtask) {
      filtered = filtered.filter(item => item.subtask === subtask);
  }
  return filtered;
};
 
// Step 1: Handle Methodology Change
const handleMethodologyChange = () => {
    const methodology = document.getElementById('methodology').value;
 
    // Update Project Phase (Filtered only by Methodology)
    const filteredByMethodology = getFilteredData(methodology, null, null, null, null);
    updateSelectOptions('projectPhase', filteredByMethodology, 'project_phase');
 
    // I-reset at i-disable ang mga kasunod
    updateSelectOptions('task_type', [], 'task_type');
    updateSelectOptions('task', [], 'task');
    updateSelectOptions('subtask', [], 'subtask');
    updateSelectOptions('elements', [], 'elements');
};
 
// Step 2: Handle Project Phase Change
const handleProjectPhaseChange = () => {
    const methodology = document.getElementById('methodology').value;
    const projectPhase = document.getElementById('projectPhase').value;
 
    // Update Task Type (Filtered by Methodology and Project Phase)
    const filteredByPhase = getFilteredData(methodology, projectPhase, null, null, null);
    updateSelectOptions('task_type', filteredByPhase, 'task_type');
 
    // I-reset at i-disable ang mga kasunod
    updateSelectOptions('task', [], 'task');
    updateSelectOptions('subtask', [], 'subtask');
    updateSelectOptions('elements', [], 'elements');
};
 
// Step 3: Handle Task Type Change
const handleTaskTypeChange = () => {
    const methodology = document.getElementById('methodology').value;
    const projectPhase = document.getElementById('projectPhase').value;
    const taskType = document.getElementById('task_type').value;
 
    // Update Task (Filtered by Phase and Type)
    const filteredByType = getFilteredData(methodology, projectPhase, taskType, null, null);
    updateSelectOptions('task', filteredByType, 'task');
 
    // I-reset at i-disable ang mga kasunod
    updateSelectOptions('subtask', [], 'subtask');
    updateSelectOptions('elements', [], 'elements');
};
 
// Step 4: Handle Task Change
const handleTaskChange = () => {
    const methodology = document.getElementById('methodology').value;
    const projectPhase = document.getElementById('projectPhase').value;
    const taskType = document.getElementById('task_type').value;
    const task = document.getElementById('task').value;
 
    // Update Subtask (Filtered by Task)
    const filteredByTask = getFilteredData(methodology, projectPhase, taskType, task, null);
    updateSelectOptions('subtask', filteredByTask, 'subtask');
 
    // I-reset at i-disable ang Elements
    updateSelectOptions('elements', [], 'elements');
};
 
// Step 5: Handle Subtask Change
const handleSubtaskChange = () => {
    const methodology = document.getElementById('methodology').value;
    const projectPhase = document.getElementById('projectPhase').value;
    const taskType = document.getElementById('task_type').value;
    const task = document.getElementById('task').value;
    const subtask = document.getElementById('subtask').value;
 
    // Update Elements (Filtered by Subtask)
    const filteredBySubtask = getFilteredData(methodology, projectPhase, taskType, task, subtask);
    updateSelectOptions('elements', filteredBySubtask, 'elements');
};
 
 
// --- EXPORTED FUNCTIONS ---
 
/**
 * Nagpapakita ng SweetAlert form para mag-create ng bagong task.
 * Ginawa ang function name na handleCreateTask para ayusin ang import error.
 */
export const handleCreateTask = async (setTasks) => {
  let formValues = null;
 
  const { value: resultValues } = await MySwal.fire({
    title: `<div style="color:#3B0304; font-weight:600; display:flex; align-items:center; gap:8px;">
      <i class="bi bi-list-check"></i> Create Task</div>`,
    // Ang HTML structure ay pinanatili ayon sa iyong gusto
    html: `
      <div style="display:grid; grid-template-columns: repeat(3,1fr); gap:12px; width:100%;">
        <div>
          <label style="font-weight:600;">Methodology</label>
          <select id="methodology" class="form-select">
            ${methodologyOptionsHtml}
          </select>
        </div>
 
        <div>
          <label style="font-weight:600;">Project Phase</label>
          <select id="projectPhase" class="form-select" disabled>
            ${emptySelectHtml}
          </select>
        </div>
 
        <div>
          <label style="font-weight:600;">Task Type</label>
          <select id="task_type" class="form-select" disabled>
            ${emptySelectHtml}
          </select>
        </div>
 
        <div>
          <label style="font-weight:600;">Tasks</label>
          <select id="task" class="form-select" disabled>
            ${emptySelectHtml}
          </select>
        </div>
 
        <div>
          <label style="font-weight:600;">Subtasks</label>
          <select id="subtask" class="form-select" disabled>
            ${emptySelectHtml}
          </select>
        </div>
 
        <div>
          <label style="font-weight:600;">Elements</label>
          <select id="elements" class="form-select" disabled>
            ${emptySelectHtml}
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
          <label style="font-weight:600;">Assign Team/s *</label>
          <select id="assigned" class="form-select">
            <option value="" disabled selected hidden></option>
            ${teamOptions}
          </select>
 
          <div id="teamsList" style="margin-top:8px; display:flex; flex-wrap:wrap; gap:6px;"></div>
        </div>
      </div>
 
      <div style="margin-top:10px;">
        <label style="font-weight:600;">Leave Comment</label>
        <textarea id="comment" rows="3" class="form-control"></textarea>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Save Task",
    focusConfirm: false,
 
    // DIDOPEN: Dito tinawag ang mga event listeners
    didOpen: () => {
        document.getElementById('methodology').addEventListener('change', handleMethodologyChange);
        document.getElementById('projectPhase').addEventListener('change', handleProjectPhaseChange);
        document.getElementById('task_type').addEventListener('change', handleTaskTypeChange);
        document.getElementById('task').addEventListener('change', handleTaskChange);
        document.getElementById('subtask').addEventListener('change', handleSubtaskChange);
        // Walang listener sa Elements
    },
 
    preConfirm: () => {
        const methodology = document.getElementById("methodology").value;
        const projectPhase = document.getElementById("projectPhase").value;
        const task = document.getElementById("task").value;
        const assigned = document.getElementById("assigned").value;
 
        if (!methodology || !projectPhase || !task || !assigned) {
            Swal.showValidationMessage('Please select Methodology, Project Phase, Task, and Assign Team/s.');
            return false;
        }
 
        formValues = {
            id: Date.now(), // Generate unique ID
            group_name: "N/A", // Assume group name is not mandatory or is the same as the assigned team
            methodology: methodology,
            project_phase: projectPhase,
            task_type: document.getElementById("task_type").value || null,
            task: task,
            subtask: document.getElementById("subtask").value || null,
            elements: document.getElementById("elements").value || null,
            dueDate: document.getElementById("dueDate").value,
            time: document.getElementById("time").value,
            assigned: assigned,
            comment: document.getElementById("comment").value,
            status: "To Do", // Set initial status
            date_created: new Date().toISOString(),
        };
        return formValues;
    },
  });
 
  if (resultValues && resultValues.isConfirmed && formValues) {
      setTasks((prev) => [...prev, formValues]);
      MySwal.fire("Task Created!", "Your task has been saved.", "success");
  }
};
 
 
/**
 * Placeholder function for fetching tasks. I-export ito para ayusin ang import error.
 */
export const fetchTasksFromDB = async (setTasks) => {
  // Mock data/logic to match the expected export structure
  const mockTasks = [
    {
      id: 1,
      group_name: "Team A",
      methodology: "Agile",
      project_phase: "Develop",
      task: "Polish: Chapter 1",
      task_type: "Documentation",
      subtask: "Introduction",
      elements: "Project Context",
      status: "To Do",
      date_created: new Date().toISOString(),
      due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], 
      time: "09:30",
      assigned: "Documentation Head",
      comment: "Initial draft",
    },
    // ... Dagdagan mo pa ng iba pang tasks dito
  ];
  setTasks(mockTasks);
};
 
/**
 * Placeholder function for updating task status. I-export ito para ayusin ang import error.
 */
export const handleUpdateStatus = (taskId, newStatus, setTasks) => {
  setTasks(prevTasks => 
    prevTasks.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    )
  );
  MySwal.fire("Status Updated!", `Task ${taskId} is now ${newStatus}.`, "info");
};