// src/components/Manager/ManagerTaskBoard.jsx
import React, { useState, useEffect } from "react";
import boardIcon from "../../../assets/tasks-board-icon.png";
import searchIcon from "../../../assets/search-icon.png";
import viewTaskIcon from "../../../assets/view-task-icon.png";
import { supabase } from "../../../supabaseClient";
import "bootstrap/dist/css/bootstrap.min.css";

const statusColors = {
  "To Do": "#FABC3F",
  "In Progress": "#809D3C",
  "To Review": "#578FCA",
  "Missed": "#D32F2F",
};

const ManagerTaskBoard = () => {
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
    const fetchTasks = async () => {
      const storedUser = localStorage.getItem("customUser");
      if (!storedUser) {
        console.warn("⚠️ No logged-in user found in localStorage");
        return;
      }

      const currentUser = JSON.parse(storedUser);

      // ✅ Kunin ang buong user record para makuha yung `id`
      const { data: userData, error: userError } = await supabase
        .from("user_credentials")
        .select("id, user_id")
        .eq("user_id", currentUser.user_id)
        .single();

      if (userError) {
        console.error("❌ Error fetching user:", userError);
        return;
      }

      if (!userData?.id) {
        console.error("❌ User ID not found in user_credentials");
        return;
      }

      const managerId = userData.id;
      console.log("👤 Logged-in Manager ID:", managerId);

      let allData = [];
      const tables = [
        "manager_title_task",
        "manager_oral_task",
        "manager_final_task",
        "manager_final_redef"
      ];

      for (const table of tables) {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("manager_id", managerId);

  if (error) {
    console.error(`❌ Error fetching tasks from ${table}:`, error);
    continue;
  }

  // 🔑 Normalize field names
  const normalized = data.map((t) => ({
    ...t,
    task: t.task || t.task_name || "Untitled Task", // ✅ unify field
    subtask: t.subtask || null,
  }));

  console.log(`✅ Normalized tasks from ${table}:`, normalized);

  allData = [...allData, ...normalized];
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
      "Missed": [],
    };

    tasks.forEach((task) => {
      if (task.status === "Completed") return; // ✅ skip completed tasks

      let status = (task.status || "To Do").trim();
      if (!grouped[status]) status = "Missed"; // fallback
      grouped[status].push(task);
    });

    setTasksByStatus(grouped);
  };

  useEffect(() => {
    const filtered = allTasks.filter((task) =>
      task.task?.toLowerCase().includes(searchTerm.toLowerCase())
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
            <h2 className="m-0 fs-5 fw-bold">Manager Task Board</h2>
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
                      const borderColor = statusColors[status];

                      return (
                        <div
                          className="position-relative bg-white mb-3 p-3 rounded shadow-sm"
                          key={index}
                          style={{ borderLeft: `6px solid ${borderColor}` }}
                        >
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
                          <p className="mb-1">
                            {task.subtask || "No Subtask"}
                          </p>
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
                              {task.due_time ? task.due_time : ""}
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
        </div>
      )}
    </div>
  );
};

export default ManagerTaskBoard;
