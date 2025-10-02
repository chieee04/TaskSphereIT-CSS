import { supabase } from "../../supabaseClient";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { finalDefenseTasks } from "./AdviserFinalData"; 

const MySwal = withReactContent(Swal);

// --- UTILS ---
const getUniqueValues = (data, key) => {
  const values = data
    .map((item) => item[key])
    .filter((value) => value !== null && value !== undefined && value !== "");
  return Array.from(new Set(values));
};

const generateOptionsHtml = (values) => {
  let html = `<option value="" disabled selected hidden></option>`;
  values.forEach((value) => {
    const stringValue = String(value);
    html += `<option value="${stringValue}">${stringValue}</option>`;
  });
  return html;
};

const initialMethodologies = getUniqueValues(finalDefenseTasks, "methodology");
const methodologyOptionsHtml = generateOptionsHtml(initialMethodologies);

const emptySelectHtml = `<option value="" disabled selected hidden></option>`;

// --- FILTER FUNCTION ---
const getFilteredData = (methodology, phase, type, task, subtask) => {
  let filtered = finalDefenseTasks;
  if (methodology) filtered = filtered.filter((i) => i.methodology === methodology);
  if (phase) filtered = filtered.filter((i) => i.project_phase === phase);
  if (type) filtered = filtered.filter((i) => i.task_type === type);
  if (task) filtered = filtered.filter((i) => i.task === task);
  if (subtask) filtered = filtered.filter((i) => i.subtask === subtask);
  return filtered;
};

const updateSelectOptions = (selectId, dataToPopulate, property) => {
  const el = document.getElementById(selectId);
  if (!el) return;
  const unique = getUniqueValues(dataToPopulate, property);
  el.innerHTML = generateOptionsHtml(unique);
  if (unique.length > 0) el.removeAttribute("disabled");
  else el.setAttribute("disabled", "true");
  el.value = "";
};

// --- DB FETCH: tasks ---
export const fetchTasksFromDB = async (setTasks) => {
  const storedUser = localStorage.getItem("customUser");
  if (!storedUser) return;

  const adviser = JSON.parse(storedUser);
  const { data, error } = await supabase
    .from("adviser_final_def")
    .select("*")
    .eq("adviser_id", adviser.id)
    .order("date_created", { ascending: false });

  if (error) {
    console.error("Error fetching tasks:", error);
    return;
  }
  setTasks(data || []);
};

// --- DB UPDATE: status ---
export const handleUpdateStatus = async (taskId, newStatus, setTasks) => {
  const { error } = await supabase
    .from("adviser_final_def")
    .update({ status: newStatus })
    .eq("id", taskId);

  if (error) {
    console.error(error);
    Swal.fire("Error", "Update failed!", "error");
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

// --- DB FETCH: managers for adviser ---
export const fetchManagersForAdviser = async () => {
  const storedUser = localStorage.getItem("customUser");
  if (!storedUser) return [];

  const adviser = JSON.parse(storedUser);

  const { data: adviserData, error: adviserError } = await supabase
    .from("user_credentials")
    .select("adviser_group")
    .eq("id", adviser.id)
    .single();

  if (adviserError || !adviserData) {
    console.error("❌ Adviser not found:", adviserError);
    return [];
  }

  const { data: managers, error: managersError } = await supabase
    .from("user_credentials")
    .select("group_name, user_roles")
    .eq("adviser_group", adviserData.adviser_group);

  if (managersError) {
    console.error("❌ Error fetching managers:", managersError);
    return [];
  }

  const filtered = managers
    .filter((m) => m.user_roles === 1 && m.group_name)
    .map((m) => m.group_name);

  return filtered;
};

// --- CREATE TASK ---
export const handleCreateTask = async (setTasks) => {
  const allManagers = await fetchManagersForAdviser();
  const { value: formData } = await MySwal.fire({
    title: `<div style="color:#3B0304; font-weight:600; display:flex; align-items:center; gap:8px;">
      <i class="bi bi-list-check"></i> Create Final Defense Task</div>`,
    width: "900px",
    confirmButtonText: "Create Task",
    showCancelButton: true,
    cancelButtonText: "Cancel",
    html: `
      <div style="display:grid; grid-template-columns: repeat(3,1fr); gap:12px;">
        <div>
          <label style="font-weight:600;">Methodology</label>
          <select id="methodology" class="form-select">
            ${methodologyOptionsHtml}
          </select>
        </div>
        <div>
          <label style="font-weight:600;">Project Phase</label>
          <select id="projectPhase" class="form-select" disabled>${emptySelectHtml}</select>
        </div>
        <div>
          <label style="font-weight:600;">Task Type</label>
          <select id="task_type" class="form-select" disabled>${emptySelectHtml}</select>
        </div>
        <div>
          <label style="font-weight:600;">Task</label>
          <select id="task" class="form-select" disabled>${emptySelectHtml}</select>
        </div>
        <div>
          <label style="font-weight:600;">Subtask</label>
          <select id="subtask" class="form-select" disabled>${emptySelectHtml}</select>
        </div>
        <div>
          <label style="font-weight:600;">Element</label>
          <select id="elements" class="form-select" disabled>${emptySelectHtml}</select>
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
            <option value="" disabled selected hidden></option>
            ${allManagers.map((m) => `<option value="${m}">${m}</option>`).join("")}
          </select>
        </div>
        <div style="grid-column: 1 / span 3;">
          <label style="font-weight:600;">Manager Lists</label>
          <div id="managerList" class="form-control" style="min-height:40px; padding:6px 12px; border:1px solid #ced4da; border-radius:4px; display:flex; flex-wrap:wrap; gap:8px;"></div>
        </div>
        <div style="grid-column: 1 / span 3;">
          <label style="font-weight:600;">Leave Comment</label>
          <textarea id="comment" rows="2" class="form-control"></textarea>
        </div>
      </div>
    `,
    didOpen: () => {
      // cascading dropdown events
      document.getElementById("methodology").addEventListener("change", () => {
        const m = document.getElementById("methodology").value;
        const filtered = getFilteredData(m, null, null, null, null);
        updateSelectOptions("projectPhase", filtered, "project_phase");
        updateSelectOptions("task_type", [], "task_type");
        updateSelectOptions("task", [], "task");
        updateSelectOptions("subtask", [], "subtask");
        updateSelectOptions("elements", [], "elements");
      });

      document.getElementById("projectPhase").addEventListener("change", () => {
        const m = document.getElementById("methodology").value;
        const p = document.getElementById("projectPhase").value;
        const filtered = getFilteredData(m, p, null, null, null);
        updateSelectOptions("task_type", filtered, "task_type");
        updateSelectOptions("task", [], "task");
        updateSelectOptions("subtask", [], "subtask");
        updateSelectOptions("elements", [], "elements");
      });

      document.getElementById("task_type").addEventListener("change", () => {
        const m = document.getElementById("methodology").value;
        const p = document.getElementById("projectPhase").value;
        const t = document.getElementById("task_type").value;
        const filtered = getFilteredData(m, p, t, null, null);
        updateSelectOptions("task", filtered, "task");
        updateSelectOptions("subtask", [], "subtask");
        updateSelectOptions("elements", [], "elements");
      });

      document.getElementById("task").addEventListener("change", () => {
        const m = document.getElementById("methodology").value;
        const p = document.getElementById("projectPhase").value;
        const t = document.getElementById("task_type").value;
        const task = document.getElementById("task").value;
        const filtered = getFilteredData(m, p, t, task, null);
        updateSelectOptions("subtask", filtered, "subtask");
        updateSelectOptions("elements", [], "elements");
      });

      document.getElementById("subtask").addEventListener("change", () => {
        const m = document.getElementById("methodology").value;
        const p = document.getElementById("projectPhase").value;
        const t = document.getElementById("task_type").value;
        const task = document.getElementById("task").value;
        const s = document.getElementById("subtask").value;
        const filtered = getFilteredData(m, p, t, task, s);
        updateSelectOptions("elements", filtered, "elements");
      });

      // --- manager selection with list
      const assignManagers = document.getElementById("assignManagers");
      const managerList = document.getElementById("managerList");
      let availableManagers = [...allManagers];

      const renderManagerList = () => {
        managerList.innerHTML = "";
        const assignedManagers = allManagers.filter(
          (m) => !availableManagers.includes(m)
        );
        assignedManagers.forEach((manager) => {
          const span = document.createElement("span");
          span.className = "badge bg-secondary text-white p-2 rounded-pill";
          span.style.cssText =
            "display:flex; align-items:center; gap:5px; cursor:pointer;";
          span.innerHTML = `${manager} <i class="bi bi-x-circle-fill"></i>`;
          span.addEventListener("click", () => {
            availableManagers.push(manager);
            availableManagers.sort();
            assignManagers.innerHTML = `<option value="" disabled selected hidden></option>` +
              availableManagers.map((m) => `<option value="${m}">${m}</option>`).join("");
            span.remove();
          });
          managerList.appendChild(span);
        });
      };

      assignManagers.addEventListener("change", (e) => {
        const selected = e.target.value;
        const idx = availableManagers.indexOf(selected);
        if (idx > -1) {
          availableManagers.splice(idx, 1);
          assignManagers.innerHTML = `<option value="" disabled selected hidden></option>` +
            availableManagers.map((m) => `<option value="${m}">${m}</option>`).join("");
          renderManagerList();
        }
      });
    },
    preConfirm: async () => {
      const methodology = document.getElementById("methodology").value;
      const projectPhase = document.getElementById("projectPhase").value;
      const taskType = document.getElementById("task_type").value;
      const task = document.getElementById("task").value;
      const subtask = document.getElementById("subtask").value;
      const element = document.getElementById("elements").value;
      const dueDate = document.getElementById("dueDate").value;
      const time = document.getElementById("time").value;
      const comment = document.getElementById("comment").value;

      const assignedGroups = Array.from(
        document.getElementById("managerList").children
      ).map((child) => child.textContent.replace(" ✖", "").trim());

      if (!methodology || !projectPhase || !task || assignedGroups.length === 0) {
        Swal.showValidationMessage("⚠ Please complete all required fields!");
        return false;
      }
      
      // ✅ REVISED LOGIC: Hahanapin ang representative manager ID para sa bawat unique na group.
      let query = supabase.from("user_credentials").select("id, group_name");
      if (assignedGroups.length === 1) {
        query = query.eq("group_name", assignedGroups[0]);
      } else {
        query = query.in("group_name", assignedGroups);
      }
      query = query.eq("user_roles", 1).limit(1); // Kunin lang ang unang manager sa bawat grupo

      const { data: managerData, error: managerError } = await query;
      
      if (managerError || !managerData || managerData.length === 0) {
        console.error(managerError);
        Swal.showValidationMessage("Error fetching manager IDs. Please ensure each selected group has a manager.");
        return false;
      }
      
      // Ibalik ang isang manager object per group
      const managerRows = managerData.filter(mgr => assignedGroups.includes(mgr.group_name));

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
        manager_data: managerRows,
      };
    },
  });

  if (formData) {
    const storedUser = JSON.parse(localStorage.getItem("customUser"));
    const adviserId = storedUser?.id;

    // ✅ REVISED LOGIC: I-loop ang mga representative managers at gumawa ng tasks para sa bawat isa
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

    const { data, error } = await supabase
      .from("adviser_final_def")
      .insert(rowsToInsert)
      .select("*");

    if (error) {
      console.error(error);
      Swal.fire("Error", "Failed to create task.", "error");
      return;
    }

    Swal.fire("Success", `${data.length} Tasks Created!`, "success");
    setTasks((prev) => [...prev, ...data]);
  }
};