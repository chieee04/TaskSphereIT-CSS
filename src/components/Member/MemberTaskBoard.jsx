// src/components/Member/MemberTaskBoard.jsx
import React, { useState, useEffect } from "react";
import boardIcon from "../../assets/tasks-board-icon.png";
import searchIcon from "../../assets/search-icon.png";
import viewTaskIcon from "../../assets/view-task-icon.png";
import { supabase } from "../../supabaseClient";
import "bootstrap/dist/css/bootstrap.min.css";

const statusColors = {
  "To Do": "#FABC3F",
  "In Progress": "#809D3C",
  "To Review": "#578FCA",
  "Missed": "#D32F2F",
  "Completed": "#4CAF50",
};

const MemberTaskBoard = () => {
  const [viewTask, setViewTask] = useState(null);
  const [allTasks, setAllTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [tasksByStatus, setTasksByStatus] = useState({
    "To Do": [],
    "In Progress": [],
    "To Review": [],
    "Missed": [],
  });

  useEffect(() => {
    const fetchTasksForMember = async () => {
      try {
        const storedUser = localStorage.getItem("customUser");
        if (!storedUser) {
          console.warn("⚠️ No logged-in user found in localStorage");
          return;
        }

        const currentUser = JSON.parse(storedUser);

        // 1️⃣ Get member info
        const { data: memberData, error: memberError } = await supabase
          .from("user_credentials")
          .select("id, user_id, group_name")
          .eq("user_id", currentUser.user_id)
          .single();

        if (memberError || !memberData) throw memberError;
        const groupName = memberData.group_name;

        // 2️⃣ Find manager of same group
        const { data: managerData, error: managerError } = await supabase
          .from("user_credentials")
          .select("id, user_id")
          .eq("group_name", groupName)
          .eq("user_roles", 1)
          .single();

        if (managerError || !managerData) throw managerError;
        const managerId = managerData.id;

        let combinedTasks = [];

        // 3️⃣ Fetch MANAGER tasks (4 tables)
        const managerTables = [
          "manager_title_task",
          "manager_oral_task",
          "manager_final_task",
          "manager_final_redef",
        ];

        for (const table of managerTables) {
          const { data, error } = await supabase
            .from(table)
            .select(
              `
              *,
              user_credentials:member_id (
                first_name,
                last_name
              )
            `
            )
            .eq("manager_id", managerId);

          if (error) {
            console.error(`❌ Error fetching ${table}:`, error);
            continue;
          }

          const normalized = data.map((t) => ({
            ...t,
            task: t.task || t.task_name || "Untitled Task",
            subtask: t.subtask || null,
            assigned_to: t.user_credentials
              ? `${t.user_credentials.first_name} ${t.user_credentials.last_name}`
              : "No Member",
            source: "manager",
          }));

          combinedTasks = [...combinedTasks, ...normalized];
        }

        // 4️⃣ Fetch ADVISER tasks (2 tables)
        const adviserTables = ["adviser_final_def", "adviser_oral_def"];

        for (const table of adviserTables) {
          const { data, error } = await supabase
            .from(table)
            .select("*")
            .eq("manager_id", managerId);

          if (error) {
            console.error(`❌ Error fetching ${table}:`, error);
            continue;
          }

          const normalized = data.map((t) => ({
            ...t,
            task: t.task || "Untitled Task",
            subtask: t.subtask || null,
            assigned_to: t.group_name || "Team Task",
            source: "adviser",
          }));

          combinedTasks = [...combinedTasks, ...normalized];
        }

        console.log("✅ Combined Tasks:", combinedTasks);
        setAllTasks(combinedTasks);
        groupTasksByStatus(combinedTasks);
      } catch (err) {
        console.error("❌ Error fetching tasks:", err.message);
      }
    };

    fetchTasksForMember();
  }, []);

  const groupTasksByStatus = (tasks) => {
    const grouped = {
      "To Do": [],
      "In Progress": [],
      "To Review": [],
      "Missed": [],
    };

    tasks.forEach((task) => {
      if (task.status === "Completed") return;
      const status = statusColors[task.status] ? task.status : "Missed";
      grouped[status].push(task);
    });

    // ✅ Adviser tasks first in each column
    Object.keys(grouped).forEach((status) => {
      grouped[status].sort((a, b) => {
        if (a.source === "adviser" && b.source !== "adviser") return -1;
        if (a.source !== "adviser" && b.source === "adviser") return 1;
        return 0;
      });
    });

    setTasksByStatus(grouped);
  };

  // 🔍 Filter by search term
  useEffect(() => {
    const filtered = allTasks.filter(
      (task) =>
        task.task?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.subtask?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.assigned_to?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    groupTasksByStatus(filtered);
  }, [searchTerm, allTasks]);

  return (
    <div className="container mt-4 adviser-board">
      {!viewTask ? (
        <>
          <div className="d-flex align-items-center mb-3">
            <img
              src={boardIcon}
              alt="Board Icon"
              style={{ width: "24px", marginRight: "10px" }}
            />
            <h2 className="m-0 fs-5 fw-bold">Member Task Board</h2>
          </div>
          <hr />

          {/* 🔍 Search Box */}
          <div className="mb-4">
            <div className="input-group" style={{ maxWidth: "300px" }}>
              <span className="input-group-text">
                <img src={searchIcon} alt="Search" style={{ width: "18px" }} />
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

          {/* 🗂️ Task Columns */}
          <div className="d-flex gap-3 overflow-auto">
            {Object.entries(tasksByStatus).map(([status, items]) => (
              <div
                className="flex-shrink-0"
                style={{ width: "280px" }}
                key={status}
              >
                <div
                  className="text-white px-3 py-2 rounded-top fs-6 fw-bold"
                  style={{ backgroundColor: statusColors[status] }}
                >
                  {status}
                </div>

                <div className="bg-light p-2 rounded-bottom">
                  {items.length === 0 ? (
                    <p className="fst-italic text-muted small">No tasks</p>
                  ) : (
                    items.map((task, index) => {
                      const borderColor =
                        statusColors[task.status] || statusColors["Missed"];

                      return (
                        <div
                          className="position-relative bg-white mb-3 p-3 rounded shadow-sm"
                          key={index}
                          style={{ borderLeft: `6px solid ${borderColor}` }}
                        >
                          {/* 👁️ View Button */}
                          <button
                            onClick={() => setViewTask(task)}
                            title="View Task"
                            className="position-absolute top-0 end-0 m-2 btn btn-sm btn-light p-1 border-0"
                          >
                            <img
                              src={viewTaskIcon}
                              alt="View Task"
                              style={{ width: "18px" }}
                            />
                          </button>

                          {/* 🟦 Adviser badge */}
                          {task.source === "adviser" && (
                            <span
                              className="badge text-bg-primary position-absolute top-0 start-0 m-2"
                              style={{ fontSize: "0.7rem" }}
                            >
                              Adviser
                            </span>
                          )}

                          <strong className="fs-6">
                            {task.assigned_to || "No Member"}
                          </strong>
                          <hr
                            style={{
                              margin: "7px 0",
                              borderColor: "maroon",
                              borderWidth: "2px",
                            }}
                          />
                          <p className="mb-1">{task.task}</p>
                          <p className="mb-1">{task.subtask || "No Subtask"}</p>
                          <hr
                            style={{
                              margin: "4px 0",
                              borderColor: "maroon",
                              borderWidth: "2px",
                            }}
                          />
                          <div className="d-flex align-items-center gap-2 small">
                            <span
                              style={{
                                display: "inline-block",
                                width: "12px",
                                height: "12px",
                                backgroundColor: "red",
                                borderRadius: "50%",
                              }}
                            ></span>
                            <strong>
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
        // 🔹 View Task Modal
        <div>
          <button
            onClick={() => setViewTask(null)}
            className="btn btn-secondary mb-3"
          >
            ← Back
          </button>
          <h4>{viewTask.task}</h4>
          <p>Assigned to: {viewTask.assigned_to || "No Member"}</p>
          <p>Due: {viewTask.due_date || "No Due Date"}</p>
          <p>Status: {viewTask.status}</p>
          {viewTask.source === "adviser" && (
            <span className="badge text-bg-primary">Adviser Task</span>
          )}
        </div>
      )}
    </div>
  );
};

export default MemberTaskBoard;
