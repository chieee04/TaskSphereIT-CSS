// src/components/member-task.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import "../Style/Member/MemberTask.css";

const MemberTask = () => {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All"); // All | To Do | In Progress | To Review

  const STATUS_OPTIONS = ["To Do", "In Progress", "To Review"];
  const REVISION_OPTIONS = Array.from({ length: 10 }, (_, i) => {
    const num = i + 1;
    if (num === 1) return "1st Revision";
    if (num === 2) return "2nd Revision";
    if (num === 3) return "3rd Revision";
    return `${num}th Revision`;
  });

  const fetchTasks = async () => {
    const storedUser = localStorage.getItem("customUser");
    if (!storedUser) return;

    const currentUser = JSON.parse(storedUser);

    const { data: memberData, error: memberError } = await supabase
      .from("user_credentials")
      .select("id, group_number")
      .eq("id", currentUser.id)
      .single();
    if (memberError || !memberData) return;

    const { data: managerData, error: managerError } = await supabase
      .from("user_credentials")
      .select("id, first_name, last_name")
      .eq("group_number", memberData.group_number)
      .eq("user_roles", 1)
      .single();
    if (managerError || !managerData) return;

    const managerId = managerData.id;
    const taskTables = [
      "manager_title_task",
      "manager_final_task",
      "manager_final_redef",
      "manager_oral_task",
    ];

    let all = [];
    for (const table of taskTables) {
      const { data } = await supabase
        .from(table)
        .select("*")
        .eq("manager_id", managerId)
        .eq("member_id", memberData.id)
        .neq("status", "Completed");

      if (data) {
        all.push(
          ...data.map((t) => ({
            id: t.id,
            table,
            manager: managerData,
            task_name: t.task_name || t.task || "Untitled Task",
            due_date: t.due_date,
            due_time: t.due_time || t.time,
            created_date: t.created_date || t.created_at,
            methodology: t.methodology,
            project_phase: t.project_phase,
            revision: t.revision || 1,
            status: t.status,
          }))
        );
      }
    }

    all.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

    const now = new Date();
    const currentDate = now.toISOString().split("T")[0];
    const currentTime = now.toTimeString().split(" ")[0].slice(0, 5);

    const updated = await Promise.all(
      all.map(async (task) => {
        if (
          task.status !== "Completed" &&
          (task.due_date < currentDate ||
            (task.due_date === currentDate &&
              (task.due_time || "00:00") <= currentTime))
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

    setTasks(updated);
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRevisionChange = async (taskId, revisionText, table) => {
    const revisionInt = parseInt(revisionText, 10);
    const { error } = await supabase
      .from(table)
      .update({ revision: revisionInt })
      .eq("id", taskId);
    if (!error) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId && t.table === table
            ? { ...t, revision: revisionInt }
            : t
        )
      );
    }
  };

  const handleStatusChange = async (taskId, newStatus, table) => {
    const { error } = await supabase
      .from(table)
      .update({ status: newStatus })
      .eq("id", taskId);
    if (!error) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId && t.table === table ? { ...t, status: newStatus } : t
        )
      );
    }
  };

  // --- Derived list with search + status filtering ---
  const filteredTasks = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return tasks.filter((t) => {
      const matchesStatus =
        statusFilter === "All"
          ? true
          : (t.status || "").toLowerCase() === statusFilter.toLowerCase();

      if (!q) return matchesStatus;

      const fields = [
        t.task_name,
        `${t.manager?.first_name || ""} ${t.manager?.last_name || ""}`,
        t.methodology,
        t.project_phase,
        t.table,
        t.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && fields.includes(q);
    });
  }, [tasks, searchTerm, statusFilter]);

  return (
    <div className="content-shell">
      <div className="member-task-page">
        <h2 className="member-task-title">📋 My Tasks</h2>

        {/* Toolbar: search (left) + filter (right) */}
        <div className="table-toolbar">
          <input
            className="toolbar-input"
            type="text"
            placeholder="Search task, manager, methodology…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="toolbar-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All</option>
            {["To Do", "In Progress", "To Review"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Outer: vertical scroll; Inner .hscroll: horizontal scroll */}
        <div
          className="table-scroll-container"
          style={{ height: "calc(100vh - 220px)" }}
        >
          <div className="hscroll">
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
                  <th>Action</th> {/* NEW */}
                </tr>
              </thead>
              <tbody>
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((t, index) => (
                    <tr key={`${t.table}-${t.id}`}>
                      <td>{index + 1}</td>
                      <td>
                        {t.manager?.first_name} {t.manager?.last_name}
                      </td>
                      <td>{t.task_name}</td>
                      <td>
                        {t.created_date
                          ? new Date(t.created_date).toLocaleString()
                          : "—"}
                      </td>
                      <td>{t.due_date || "—"}</td>
                      <td>{t.due_time || "—"}</td>
                      <td>
                        <select
                          value={t.revision || 1}
                          onChange={(e) =>
                            handleRevisionChange(t.id, e.target.value, t.table)
                          }
                        >
                          {Array.from({ length: 10 }, (_, i) => {
                            const num = i + 1;
                            const label =
                              num === 1
                                ? "1st Revision"
                                : num === 2
                                ? "2nd Revision"
                                : num === 3
                                ? "3rd Revision"
                                : `${num}th Revision`;
                            return (
                              <option key={num} value={num}>
                                {label}
                              </option>
                            );
                          })}
                        </select>
                      </td>
                      <td>
                        {t.status === "Missed" ? (
                          <span className="status-badge status-pending">
                            Missed
                          </span>
                        ) : (
                          <select
                            value={t.status}
                            onChange={(e) =>
                              handleStatusChange(t.id, e.target.value, t.table)
                            }
                          >
                            {["To Do", "In Progress", "To Review"].map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td>{t.methodology || "—"}</td>
                      <td>{t.project_phase || "—"}</td>
                      <td>{t.table}</td>
                      <td>
                        <button
                          className="action-btn"
                          title="View task"
                          onClick={() => navigate("/Member/TasksBoard")} // ✅ correct route
                        >
                          👁️ View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="12"
                      style={{ textAlign: "center", padding: "2rem" }}
                    >
                      No matching tasks.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberTask;
