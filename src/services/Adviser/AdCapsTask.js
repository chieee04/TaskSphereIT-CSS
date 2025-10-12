import { supabase } from "../../supabaseClient";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { adCapsTaskData } from "./adcapsdata";

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

// 🔹 Fetch Managers dynamically
export const fetchManagersForAdviser = async () => {
  const storedUser = localStorage.getItem("customUser");
  if (!storedUser) return [];

  const adviser = JSON.parse(storedUser);

  // Step 1: hanapin adviser info
  const { data: adviserData, error: adviserError } = await supabase
    .from("user_credentials")
    .select("adviser_group")
    .eq("id", adviser.id)
    .single();

  if (adviserError || !adviserData) {
    console.error("❌ Adviser not found:", adviserError);
    return [];
  }

  // Step 2: hanapin lahat ng nasa adviser_group na ito
  const { data: managers, error: managersError } = await supabase
    .from("user_credentials")
    .select("group_name, user_roles")
    .eq("adviser_group", adviserData.adviser_group);

  if (managersError) {
    console.error("❌ Error fetching managers:", managersError);
    return [];
  }

  // Step 3: kunin lang yung may role = 1 (manager/leader)
  const filtered = managers
    .filter((m) => m.user_roles === 1 && m.group_name)
    .map((m) => m.group_name);

  return filtered;
};

// 🔹 Create Task
export const handleCreateTask = async (setTasks) => {
  const allManagers = await fetchManagersForAdviser();

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
          <label style="font-weight:600;">Assign Managers *</label>
          <select id="assignManagers" class="form-select">
            ${buildOptions(allManagers)}
          </select>
        </div>
        <div style="grid-column: 1 / span 3;">
          <label style="font-weight:600;">Manager Lists</label>
          <div id="managerList" class="form-control" style="min-height: 40px; padding: 6px 12px; border: 1px solid #ced4da; border-radius: 4px; display:flex; flex-wrap:wrap; gap:8px;">
            </div>
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
  const assignManagers = document.getElementById("assignManagers");
  const managerList = document.getElementById("managerList");

  // Initial state
  projectPhase.disabled = true;
  taskType.disabled = true;
  task.disabled = true;
  subtask.disabled = true;
  element.disabled = true;

  // ---- Manager Logic ----
  const availableManagers = [...allManagers];

  const renderManagerList = () => {
    managerList.innerHTML = "";
    const assignedManagers = allManagers.filter(
      (m) => !availableManagers.includes(m)
    );
    assignedManagers.forEach((manager) => {
      const managerSpan = document.createElement("span");
      managerSpan.className =
        "badge bg-secondary text-white p-2 rounded-pill";
      managerSpan.style.cssText =
        "display: flex; align-items: center; gap: 5px; cursor: pointer;";
      managerSpan.innerHTML = `${manager} <i class="bi bi-x-circle-fill"></i>`;
      managerSpan.addEventListener("click", () => {
        availableManagers.push(manager);
        availableManagers.sort();
        assignManagers.innerHTML = buildOptions(availableManagers);
        managerSpan.remove();
      });
      managerList.appendChild(managerSpan);
    });
  };

  assignManagers.addEventListener("change", (event) => {
    const selectedManager = event.target.value;
    const index = availableManagers.indexOf(selectedManager);
    if (index > -1) {
      availableManagers.splice(index, 1);
      assignManagers.innerHTML = buildOptions(availableManagers);
      renderManagerList();
    }
  });

  // ---- Dropdown Logic ----

  // 🔹 Methodology Change
  methodology.addEventListener("change", () => {
    const selectedMethod = adCapsTaskData[methodology.value];

    // Reset and disable everything below
    projectPhase.innerHTML = buildOptions(selectedMethod?.phases || []);
    taskType.innerHTML = buildOptions([]);
    task.innerHTML = buildOptions([]);
    subtask.innerHTML = buildOptions([]);
    element.innerHTML = buildOptions([]);

    projectPhase.disabled = (selectedMethod?.phases?.length || 0) === 0;
    taskType.disabled = true;
    task.disabled = true;
    subtask.disabled = true;
    element.disabled = true;
  });

  // 🔹 Project Phase Change
  projectPhase.addEventListener("change", () => {
    const selectedMethod = adCapsTaskData[methodology.value];
    const taskTypeOptions = Object.keys(selectedMethod?.tasks || {});

    // Reset lower dropdowns
    task.innerHTML = buildOptions([]);
    subtask.innerHTML = buildOptions([]);
    element.innerHTML = buildOptions([]);

    taskType.innerHTML = buildOptions(taskTypeOptions);
    taskType.disabled = taskTypeOptions.length === 0 ? true : false;
    task.disabled = true;
    subtask.disabled = true;
    element.disabled = true;
  });

  // 🔹 Task Type Change
  taskType.addEventListener("change", () => {
    const selectedMethod = adCapsTaskData[methodology.value];
    const taskOptions = selectedMethod?.tasks?.[taskType.value] || [];

    // Reset lower dropdowns
    subtask.innerHTML = buildOptions([]);
    element.innerHTML = buildOptions([]);

    task.innerHTML = buildOptions(taskOptions);
    task.disabled = taskOptions.length === 0 ? true : false;
    subtask.disabled = true;
    element.disabled = true;
  });

  // 🔹 Task Change
  task.addEventListener("change", () => {
    const subtaskOptions =
      adCapsTaskData[methodology.value]?.subtasks?.[task.value] || [];

    subtask.innerHTML = buildOptions(subtaskOptions);
    subtask.disabled = subtaskOptions.length === 0 ? true : false;

    // Reset element
    element.innerHTML = buildOptions([]);
    element.disabled = true;
  });

  // 🔹 Subtask Change
  subtask.addEventListener("change", () => {
    const elementOptions =
      adCapsTaskData[methodology.value]?.elements?.[subtask.value] || [];

    element.innerHTML = buildOptions(elementOptions);
    element.disabled = elementOptions.length === 0 ? true : false;
    
  });
  const event = new Event("change");
methodology.dispatchEvent(event);
},
    preConfirm: async () => {
      const methodology = document.getElementById("methodology").value;
      const projectPhase = document.getElementById("projectPhase").value;
      const taskType = document.getElementById("taskType").value;
      const task = document.getElementById("task").value;
      const subtask = document.getElementById("subtask").value;
      const element = document.getElementById("element").value;
      const dueDate = document.getElementById("dueDate").value;
      const time = document.getElementById("time").value;
      const comment = document.getElementById("comment").value;

      const assignedManagers = Array.from(document.getElementById("managerList").children).map(child =>
        child.textContent.replace(" ✖", "").trim()
      );

      if (!methodology || !projectPhase || !taskType || !task || !dueDate || assignedManagers.length === 0) {
        Swal.showValidationMessage("⚠ Please complete all required fields!");
        return false;
      }

      // ✅ REVISED LOGIC: Kumuha ng manager IDs para sa bawat unique na group
      const uniqueManagerGroups = [...new Set(assignedManagers)];

      let query = supabase.from("user_credentials").select("id, group_name");
      if (uniqueManagerGroups.length === 1) {
        query = query.eq("group_name", uniqueManagerGroups[0]);
      } else {
        query = query.in("group_name", uniqueManagerGroups);
      }

      const { data: managerData, error: managerError } = await query;

      if (managerError) {
        console.error(managerError);
        Swal.showValidationMessage("Error fetching manager UUIDs.");
        return false;
      }

      // Group managers by group_name and get the first one for each group
      const managersByGroup = {};
      managerData.forEach(manager => {
        if (!managersByGroup[manager.group_name]) {
          managersByGroup[manager.group_name] = manager;
        }
      });

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
        manager_data: Object.values(managersByGroup) // Ibalik ang isang manager object per group
      };
    },
  });

  if (formData) {
    const storedUser = JSON.parse(localStorage.getItem("customUser"));
    const adviserId = storedUser?.id;

    // ✅ REVISED LOGIC: Gamitin ang `manager_data` na mayroon nang isang entry per team
    const rowsToInsert = formData.manager_data.map((mgr) => ({
      adviser_id: adviserId,
      manager_id: mgr.id,
      group_name: mgr.group_name,
      methodology: formData.methodology,
      project_phase: formData.project_phase,
      task_type: formData.task_type,
      task: formData.task,
      subtask: formData.subtask,
      elements: formData.elements,
      due_date: formData.due_date,
      time: formData.time,
      comment: formData.comment,
      status: "To Do",
    }));

    // ✅ Insert multiple tasks in one go
    const { data, error } = await supabase
      .from("adviser_oral_def")
      .insert(rowsToInsert)
      .select("*");

    if (error) {
      console.error(error);
      Swal.fire("Error", "Failed to create tasks.", "error");
      return;
    }

    Swal.fire("Success", `${data.length} Tasks Created!`, "success");
    setTasks((prev) => [...prev, ...data]);
    window.dispatchEvent(new Event("taskCreated"));
  }
};