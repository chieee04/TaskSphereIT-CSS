// src/components/member-task.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import "../Style/Member/MemberTask.css";

const MemberTask = () => {
  const [tasks, setTasks] = useState([]);

  const STATUS_OPTIONS = ["To Do", "In Progress", "To Review"];
  const REVISION_OPTIONS = Array.from({ length: 10 }, (_, i) => {
    const num = i + 1;
    if (num === 1) return "1st Revision";
    if (num === 2) return "2nd Revision";
    if (num === 3) return "3rd Revision";
    return `${num}th Revision`;
  });

  // ✅ Fetch from all 4 tables
  const fetchTasks = async () => {
  const storedUser = localStorage.getItem("customUser");
  if (!storedUser) {
    console.error("❌ No customUser found in localStorage");
    return;
  }

  const currentUser = JSON.parse(storedUser);

  // 1️⃣ Get member info (with group_number)
  const { data: memberData, error: memberError } = await supabase
    .from("user_credentials")
    .select("id, group_number")
    .eq("id", currentUser.id)
    .single();

  if (memberError || !memberData) {
    console.error("❌ Failed to get member info:", memberError);
    return;
  }

  // 2️⃣ Get manager for that group
  const { data: managerData, error: managerError } = await supabase
    .from("user_credentials")
    .select("id, first_name, last_name")
    .eq("group_number", memberData.group_number)
    .eq("user_roles", 1) // 1 = manager
    .single();

  if (managerError || !managerData) {
    console.error("❌ Failed to get manager info:", managerError);
    return;
  }

  const managerId = managerData.id;

  // 3️⃣ Fetch tasks from all manager tables
  const taskTables = [
    "manager_title_task",
    "manager_final_task",
    "manager_final_redef",
    "manager_oral_task",
  ];

  let allTasks = [];

  for (const table of taskTables) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("manager_id", managerId)
      .eq("member_id", memberData.id)
      .neq("status", "Completed");

    if (error) {
      console.error(`❌ Error fetching from ${table}:`, error);
    } else if (data) {
      const normalized = data.map((t) => ({
        id: t.id,
        table,
        manager: managerData,
        task_name: t.task_name || t.task || "Untitled Task",
        due_date: t.due_date,
        due_time: t.due_time || t.time,
        created_date: t.created_date || t.created_at,
        methodology: t.methodology,
        project_phase: t.project_phase,
        revision: t.revision || 0,
        status: t.status,
      }));
      allTasks.push(...normalized);
    }
  }

  // 4️⃣ Sort by created_date descending
  allTasks.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  // 5️⃣ Update missed tasks (optional)
  const now = new Date();
  const currentDate = now.toISOString().split("T")[0];
  const currentTime = now.toTimeString().split(" ")[0].slice(0, 5);

  const updatedTasks = await Promise.all(
    allTasks.map(async (task) => {
      if (
        task.status !== "Completed" &&
        (task.due_date < currentDate ||
          (task.due_date === currentDate && task.due_time <= currentTime))
      ) {
        const { error } = await supabase
          .from(task.table)
          .update({ status: "Missed" })
          .eq("id", task.id);

        if (!error) task.status = "Missed";
      }
      return task;
    })
  );

  setTasks(updatedTasks);
};


  useEffect(() => {
    fetchTasks();
  }, []);

  // ✅ Update revision
  const handleRevisionChange = async (taskId, revisionText, table) => {
    const revisionInt = parseInt(revisionText);
    const { error } = await supabase
      .from(table)
      .update({ revision: revisionInt })
      .eq("id", taskId);

    if (error) {
      console.error("❌ Update revision error:", error);
    } else {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId && t.table === table
            ? { ...t, revision: revisionInt }
            : t
        )
      );
    }
  };

  // ✅ Update status
  const handleStatusChange = async (taskId, newStatus, table) => {
    const { error } = await supabase
      .from(table)
      .update({ status: newStatus })
      .eq("id", taskId);

    if (error) {
      console.error("❌ Update status error:", error);
    } else {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId && t.table === table
            ? { ...t, status: newStatus }
            : t
        )
      );
    }
  };

  return (
    <div className="member-task-page">
      <h2 className="member-task-title">📋 My Tasks</h2>

      <div className="table-wrapper">
        <table className="member-task-table">
          <thead>
            <tr>
              <th>NO</th>
              <th>Manager</th>
              <th>Task</th>
              <th>Date Created</th>
              <th>Due Date</th>
              <th>Time</th>
              <th>Revision No.</th>
              <th>Status</th>
              <th>Methodology</th>
              <th>Project Phase</th>
              <th>From Table</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length > 0 ? (
              tasks.map((t, index) => (
                <tr key={`${t.table}-${t.id}`}>
                  <td>{index + 1}</td>
                  <td>{t.manager?.first_name} {t.manager?.last_name}</td>
                  <td>{t.task_name}</td>
                  <td>{t.created_date ? new Date(t.created_date).toLocaleString() : "—"}</td>
                  <td>{t.due_date}</td>
                  <td>{t.due_time}</td>
                  <td>
                    <select
                      value={t.revision || 1}
                      onChange={(e) =>
                        handleRevisionChange(t.id, e.target.value, t.table)
                      }
                    >
                      {REVISION_OPTIONS.map((label, i) => (
                        <option key={i + 1} value={i + 1}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {t.status === "Missed" ? (
                      <span style={{ color: "red", fontWeight: "bold" }}>
                        Missed
                      </span>
                    ) : (
                      <select
                        value={t.status}
                        onChange={(e) =>
                          handleStatusChange(t.id, e.target.value, t.table)
                        }
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td>{t.methodology}</td>
                  <td>{t.project_phase}</td>
                  <td>{t.table}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="11" style={{ textAlign: "center", padding: "1rem" }}>
                  No tasks found for you.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MemberTask;
