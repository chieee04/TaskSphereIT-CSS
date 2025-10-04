// ManagerCreateTitleTask.js
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import {
  projectPhaseMap,
  taskTypeList,
  documentationTasks,
  discussionTasks,
} from "./ManagerTitleTaskData";
import { supabase } from "../../supabaseClient"; // ✅ para maka-fetch sa DB


const MySwal = withReactContent(Swal);

// Helper para gumawa ng dropdown options
const buildOptions = (arr) =>
  [`<option value="" disabled selected hidden></option>`, ...arr.map((m) => `<option value="${m}">${m}</option>`)].join("");

// 🟢 Main Function
export const openCreateTask = async () => {
  // 🔹 1. Kunin ang kasalukuyang naka-login na user mula sa localStorage
  const customUser = JSON.parse(localStorage.getItem("customUser"));
  const managerUUID = customUser?.uuid || customUser?.id;

  if (!managerUUID) {
    Swal.fire("Error", "No signed-in user found.", "error");
    return;
  }

  console.log("👉 Current Manager UUID:", managerUUID);

  // 🔹 2. Kunin ang group_number ng manager
  const { data: manager, error: mErr } = await supabase
    .from("user_credentials")
    .select("group_number")
    .eq("id", managerUUID)
    .single();

  if (mErr || !manager) {
    console.error("❌ Manager fetch error:", mErr);
    Swal.fire("Error", "Manager not found!", "error");
    return;
  }

  // 🔹 3. Kunin methodology ng manager
  const { data: methodologyData, error: methErr } = await supabase
    .from("manager_methodology")
    .select("title_def")
    .eq("manager_id", managerUUID)
    .maybeSingle();

  if (methErr) {
    console.error("❌ Methodology fetch error:", methErr);
    Swal.fire("Error", "Failed to fetch methodology!", "error");
    return;
  }

  if (!methodologyData) {
    Swal.fire("Please Select Methodology on your Title Defense Page!!", "", "warning");
    return; // ✅ stop execution
  }

  const managerMethodology = methodologyData.title_def;
  console.log("📌 Manager Methodology:", managerMethodology);

  // 🔹 4. Kunin lahat ng members ng group (role = 2)
  const { data: members, error: memErr } = await supabase
    .from("user_credentials")
    .select("id, first_name, last_name")
    .eq("user_roles", 2)
    .eq("group_number", manager.group_number);

  if (memErr) {
    console.error("❌ Members fetch error:", memErr);
    Swal.fire("Error", "Failed to fetch members!", "error");
    return;
  }

  const memberOptions = members
    .map((m) => `<option value="${m.id}">${m.last_name}, ${m.first_name}</option>`)
    .join("");

  // 🔹 5. Swal Modal (same as dati, pero methodology fixed per login)
  const { value: formData } = await MySwal.fire({
    title: `<div style="color:#3B0304; font-weight:600; display:flex; align-items:center; gap:8px;">
      <i class="bi bi-list-check"></i> Create Title Task</div>`,
    width: "800px",
    confirmButtonText: "Create Task",
    showCancelButton: true,
    cancelButtonText: "Cancel",
    focusConfirm: false,
    html: `
      <div style="display:grid; grid-template-columns: repeat(3,1fr); gap:12px; width:100%;">
        <div>
          <label style="font-weight:600;">Methodology</label>
          <input id="methodology" class="form-control" value="${managerMethodology}" disabled />
        </div>
        <div>
          <label style="font-weight:600;">Project Phase</label>
          <input id="projectPhase" class="form-control" disabled />
        </div>
        <div>
          <label style="font-weight:600;">Task Type</label>
          <select id="task_type" class="form-select">
            ${buildOptions(taskTypeList)}
          </select>
        </div>
        <div>
          <label style="font-weight:600;">Tasks</label>
          <select id="task" class="form-select" disabled>
            <option value="" disabled selected hidden></option>
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
          <label style="font-weight:600;">Assign Members *</label>
          <select id="assignedMembers" class="form-select">
            <option value="" disabled selected hidden>Select member</option>
            ${memberOptions}
          </select>
        </div>
        <div style="grid-column: 1 / span 3; margin-top:10px;">
          <label style="font-weight:600;">Members List</label>
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
  const methodology = managerMethodology;
  const projectPhase = document.getElementById("projectPhase");
  const taskType = document.getElementById("task_type");
  const task = document.getElementById("task");
  const memberSelect = document.getElementById("assignedMembers");
  const membersList = document.getElementById("membersList");

  // Para ma-store yung napili
  window.__selectedMembers = [];

  projectPhase.value = projectPhaseMap[methodology] || "";

  taskType.addEventListener("change", () => {
    if (taskType.value === "Documentation") {
      task.innerHTML = buildOptions(documentationTasks[methodology] || []);
    } else if (taskType.value === "Discussion & Review") {
      task.innerHTML = buildOptions(discussionTasks[methodology] || discussionTasks.default);
    } else {
      task.innerHTML = `<option value="" disabled selected hidden></option>`;
    }
    
    task.disabled = false;

  });

  // 🟢 Members assign logic
  memberSelect.addEventListener("change", () => {
    const selectedId = memberSelect.value;
    const selectedText = memberSelect.options[memberSelect.selectedIndex].text;

    if (!selectedId) return;

    // ✅ Add to __selectedMembers
    window.__selectedMembers.push({ id: selectedId, name: selectedText });

    // ✅ Update Members List
    membersList.innerHTML = window.__selectedMembers
      .map(
        (m) => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:4px 0;">
            <span>${m.name}</span>
            <button type="button" data-id="${m.id}" class="removeMember btn btn-sm btn-danger">Remove</button>
          </div>
        `
      )
      .join("");

    // ✅ Remove from select choices
    memberSelect.querySelector(`option[value="${selectedId}"]`).remove();
    memberSelect.value = "";
  });

  // 🟢 Listener para sa "Remove"
  membersList.addEventListener("click", (e) => {
    if (e.target.classList.contains("removeMember")) {
      const memberId = e.target.dataset.id;

      // tanggalin sa __selectedMembers
      window.__selectedMembers = window.__selectedMembers.filter((m) => m.id !== memberId);

      // ibalik ulit sa select choices
      const removedName = e.target.previousElementSibling.textContent;
      const option = document.createElement("option");
      option.value = memberId;
      option.textContent = removedName;
      memberSelect.appendChild(option);

      // update Members List ulit
      membersList.innerHTML = window.__selectedMembers.length
        ? window.__selectedMembers
            .map(
              (m) => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:4px 0;">
                  <span>${m.name}</span>
                  <button type="button" data-id="${m.id}" class="removeMember btn btn-sm btn-danger">Remove</button>
                </div>
              `
            )
            .join("")
        : `<small style="color:#888;">No members assigned</small>`;
    }
  });
},
    preConfirm: () => {
      const methodology = managerMethodology;
      const projectPhase = document.getElementById("projectPhase").value;
      const taskType = document.getElementById("task_type").value;
      const task = document.getElementById("task").value;
      const dueDate = document.getElementById("dueDate").value;
      const time = document.getElementById("time").value;
      const assignedMembers = (window.__selectedMembers || []).map((m) => m.id);
      const comment = document.getElementById("comment").value;

      if (!methodology || !projectPhase || !taskType || !task || !dueDate || assignedMembers.length === 0) {
        Swal.showValidationMessage("⚠ Please complete all required fields!");
        return false;
      }
      return { methodology, projectPhase, taskType, task, dueDate, time, assignedMembers, comment };
    },
  });

  if (formData) {
    console.log("✅ New Title Task Created:", formData);

    const now = new Date();
    const createdDate = now.toISOString().split("T")[0];
    const createdTime = now.toTimeString().split(" ")[0];

    let duplicateMember = null;

    for (const memberId of formData.assignedMembers) {
      const { data: existingTask, error: checkError } = await supabase
        .from("manager_title_task")
        .select(
          `id, task_name, member:user_credentials!manager_title_task_member_id_fkey(first_name, last_name)`
        )
        .eq("member_id", memberId)
        .eq("methodology", formData.methodology)
        .eq("project_phase", formData.projectPhase)
        .eq("task_type", formData.taskType)
        .eq("task_name", formData.task)
        .maybeSingle();

      if (checkError) {
        console.error("❌ Check error:", checkError);
        Swal.fire("Error", "Failed to check existing tasks!", "error");
        return null;
      }

      if (existingTask) {
        duplicateMember = existingTask.member;
        break;
      }
    }

    if (duplicateMember) {
      const fullName = `${duplicateMember.first_name} ${duplicateMember.last_name}`;
      await Swal.fire(
        "⚠ Duplicate Task",
        `${fullName} already has a task on "${formData.task}".`,
        "warning"
      );
      return null;
    }

    let insertedTasks = [];

    for (const memberId of formData.assignedMembers) {
      const { data: inserted, error } = await supabase
        .from("manager_title_task")
        .insert([
          {
            manager_id: managerUUID,
            methodology: formData.methodology,
            project_phase: formData.projectPhase,
            task_type: formData.taskType,
            task_name: formData.task,
            due_date: formData.dueDate,
            due_time: formData.time || null,
            member_id: memberId,
            created_date: createdDate,
            created_time: createdTime,
            revision: 1,
            status: "To Do",
          },
        ])
        .select(
          `id, task_name, due_date, due_time, created_date, created_time, methodology, project_phase, revision, status, member:user_credentials!manager_title_task_member_id_fkey(first_name, last_name)`
        )
        .single();

      if (error) {
        console.error("❌ Insert error:", error);
        Swal.fire("Error", "Failed to save task!", "error");
        return null;
      }

      insertedTasks.push(inserted);
    }

    if (insertedTasks.length > 0) {
      Swal.fire("✅ Success", "Task(s) created successfully!", "success");
    }

    return insertedTasks;
  }
};

export const openMethodology = async (managerId) => {
  const { value: selectedMethodology } = await MySwal.fire({
    title: "Select Methodology",
    input: "select",
    inputOptions: {
      Agile: "Agile",
      "Extreme Programming": "Extreme Programming",
      RAD: "RAD",
      Prototyping: "Prototyping",
      Spiral: "Spiral",
    },
    inputPlaceholder: "Choose methodology",
    showCancelButton: true,
    confirmButtonText: "Confirm",
    cancelButtonText: "Cancel",
  });

  if (selectedMethodology) {
    // 🟢 Save or update sa Supabase
    const { error } = await supabase
      .from("manager_methodology")
      .upsert(
        { manager_id: managerId, title_def: selectedMethodology, updated_at: new Date() },
        { onConflict: "manager_id" } // unique manager_id rule
      );

    if (error) {
      console.error("❌ Error saving methodology:", error.message);
      MySwal.fire("Error", "Failed to save methodology", "error");
      return null;
    }

    await MySwal.fire({
      icon: "success",
      title: "Methodology Saved",
      text: `You chose: ${selectedMethodology}`,
    });

    return selectedMethodology;
  }

  return null;
};

