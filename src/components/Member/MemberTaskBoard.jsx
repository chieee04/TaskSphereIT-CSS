// src/components/Member/MemberTaskBoard.jsx
import React, { useState, useEffect } from "react";
import boardIcon from "../../assets/tasks-board-icon.png";
import searchIcon from "../../assets/search-icon.png";
import viewTaskIcon from "../../assets/view-task-icon.png";
import { supabase } from "../../supabaseClient";
import Footer from "../Footer";
import "bootstrap/dist/css/bootstrap.min.css";

const statusColors = {
  "To Do": "#FABC3F",
  "In Progress": "#809D3C",
  "To Review": "#578FCA",
  Missed: "#D32F2F",
};

const MemberTaskBoard = () => {
  const [viewTask, setViewTask] = useState(null);
  const [allTasks, setAllTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [tasksByStatus, setTasksByStatus] = useState({
    "To Do": [],
    "In Progress": [],
    "To Review": [],
    Missed: [],
  });

  useEffect(() => {
    const fetchTasks = async () => {
      const storedUser = localStorage.getItem("customUser");
      if (!storedUser) return;
      const currentUser = JSON.parse(storedUser);

      const { data: userData, error: userError } = await supabase
        .from("user_credentials")
        .select("id, user_id")
        .eq("user_id", currentUser.user_id)
        .single();
      if (userError) return;

      const managerId = userData?.id;
      if (!managerId) return;

      let allData = [];

      // Manager tables
      for (const table of [
        "manager_title_task",
        "manager_oral_task",
        "manager_final_task",
        "manager_final_redef",
      ]) {
        const { data } = await supabase
          .from(table)
          .select(`*, user_credentials:member_id(first_name,last_name)`)
          .eq("manager_id", managerId);

        if (data) {
          allData = allData.concat(
            data.map((t) => ({
              ...t,
              task: t.task || t.task_name || "Untitled Task",
              subtask: t.subtask || null,
              assigned_to: t.user_credentials
                ? `${t.user_credentials.first_name} ${t.user_credentials.last_name}`
                : "No Member",
              source: "manager",
            }))
          );
        }
      }

      // Adviser tables
      for (const table of ["adviser_final_def", "adviser_oral_def"]) {
        const { data } = await supabase
          .from(table)
          .select("*")
          .eq("manager_id", managerId);
        if (data) {
          allData = allData.concat(
            data.map((t) => ({
              ...t,
              task: t.task || t.task_name || "Untitled Task",
              subtask: t.subtask || t.subtasks || null,
              assigned_to: t.group_name || "Adviser Task",
              status: (t.status || "To Review").trim(),
              due_date: t.due_date || null,
              due_time: t.time || null,
              source: "adviser",
            }))
          );
        }
      }

      setAllTasks(allData);
      groupTasksByStatus(allData);
    };

    fetchTasks();
  }, []);

  const groupTasksByStatus = (tasks) => {
    const grouped = {
      "To Do": [],
      "In Progress": [],
      "To Review": [],
      Missed: [],
    };
    tasks.forEach((task) => {
      if (task.status === "Completed") return; // match manager board behavior
      let status = (task.status || "To Do").trim();
      if (!grouped[status]) status = "Missed";
      if (task.source === "adviser") grouped[status].unshift(task);
      else grouped[status].push(task);
    });
    setTasksByStatus(grouped);
  };

  useEffect(() => {
    const q = searchTerm.toLowerCase();
    const filtered = allTasks.filter(
      (t) =>
        (t.task || "").toLowerCase().includes(q) ||
        (t.subtask || "").toLowerCase().includes(q) ||
        (t.assigned_to || "").toLowerCase().includes(q)
    );
    groupTasksByStatus(filtered);
  }, [searchTerm, allTasks]);

  return (
    // Page shell: full height, no horizontal scroll, footer at bottom
    <div className="min-vh-100 d-flex flex-column" style={{ overflowX: "hidden" }}>
      {/* Scoped styles to keep layout tidy & responsive */}
      <style>{`
        .adviser-board * { min-width: 0; }
        .board-wrap {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 12px;
          width: 100%;
        }
        .board-col { min-width: 0; }
        .board-col-header { border-top-left-radius: .5rem; border-top-right-radius: .5rem; }
        .board-col-body { background: #f8f9fa; padding: 8px; border-bottom-left-radius: .5rem; border-bottom-right-radius: .5rem; }
        .task-card p { word-break: break-word; margin-bottom: .25rem; }
        .task-card hr { margin: .35rem 0; }
        @media (max-width: 576px) {
          .board-wrap { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Main content */}
      <div className="container py-4 adviser-board flex-grow-1">
        {!viewTask ? (
          <>
            <div className="d-flex align-items-center mb-3">
              <img
                src={boardIcon}
                alt="Board Icon"
                style={{ width: 24, height: 24, objectFit: "contain", marginRight: 10 }}
              />
              <h2 className="m-0 fs-5 fw-bold">Member Task Board</h2>
            </div>
            <hr className="mt-2 mb-4" />

            {/* Search */}
            <div className="mb-4">
              <div className="input-group" style={{ maxWidth: 480, width: "100%" }}>
                <span className="input-group-text">
                  <img src={searchIcon} alt="Search" style={{ width: 18, height: 18 }} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search task"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Columns (auto-wrap, no horizontal scroll) */}
            <div className="board-wrap">
              {Object.entries(tasksByStatus).map(([status, items]) => (
                <div className="board-col" key={status}>
                  <div
                    className="board-col-header text-white px-3 py-2 fs-6 fw-bold"
                    style={{ backgroundColor: statusColors[status] }}
                  >
                    {status}
                  </div>

                  <div className="board-col-body">
                    {items.length === 0 ? (
                      <p className="fst-italic text-muted small m-2">No tasks</p>
                    ) : (
                      items.map((task, index) => {
                        const borderColor = statusColors[status];
                        const isAdviser = task.source === "adviser";

                        return (
                          <div
                            key={`${status}-${index}`}
                            className="task-card position-relative bg-white mb-3 p-3 rounded shadow-sm w-100"
                            style={{
                              borderLeft: `6px solid ${borderColor}`,
                              border: "none",
                            }}
                          >
                            {/* View button */}
                            <button
                              onClick={() => setViewTask(task)}
                              title="View Task"
                              className="position-absolute top-0 end-0 m-2 btn btn-sm btn-light p-1 border-0"
                              aria-label="View task"
                            >
                              <img
                                src={viewTaskIcon}
                                alt="View Task"
                                style={{ width: 18, height: 18 }}
                              />
                            </button>

                            <strong className="fs-6 text-truncate d-block">
                              {task.assigned_to || "No Member"}
                            </strong>
                            {isAdviser && <span className="badge bg-primary ms-2">Adviser</span>}

                            <hr style={{ borderColor: "maroon", borderWidth: 2 }} />
                            <p className="mb-1 fw-semibold">{task.task}</p>
                            <p className="mb-1 text-muted">{task.subtask || "No Subtask"}</p>
                            <hr style={{ borderColor: "maroon", borderWidth: 2 }} />

                            <div className="d-flex align-items-center gap-2 small">
                              <span
                                style={{
                                  display: "inline-block",
                                  width: 12,
                                  height: 12,
                                  backgroundColor: "red",
                                  borderRadius: "50%",
                                }}
                              />
                              <strong className="text-nowrap">
                                {task.due_date
                                  ? new Date(task.due_date).toLocaleDateString()
                                  : "No Due Date"}{" "}
                                {task.due_time || ""}
                              </strong>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div>
            <button onClick={() => setViewTask(null)} className="btn btn-secondary mb-3">
              ← Back
            </button>
            <h4 className="fw-bold">{viewTask.task}</h4>
            <p>Assigned to: {viewTask.assigned_to || "No Member"}</p>
            <p>Due: {viewTask.due_date || "No Due Date"} {viewTask.due_time || ""}</p>
            <p>Status: {viewTask.status}</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default MemberTaskBoard;
