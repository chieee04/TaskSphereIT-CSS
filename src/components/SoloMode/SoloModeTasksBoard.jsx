// src/components/Member/SoloModeTasksBoard.jsx
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
};

export default function SoloModeTasksBoard() {
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
    const fetchSoloModeTasks = async () => {
      const storedUser = localStorage.getItem("customUser");
      if (!storedUser) return;
      const currentUser = JSON.parse(storedUser);

      const { data, error } = await supabase
        .from("solo_mode_task")
        .select("*")
        .eq("user_id", currentUser.id);

      if (error) {
        console.error("Error fetching solo mode tasks:", error);
        return;
      }
      setAllTasks(data || []);
      groupTasksByStatus(data || []);
    };

    fetchSoloModeTasks();
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
      let status = (task.status || "To Do").trim();
      if (!grouped[status]) status = "Missed";
      grouped[status].push(task);
    });

    setTasksByStatus(grouped);
  };

  useEffect(() => {
    const filtered = allTasks.filter((t) =>
      (t.task || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    groupTasksByStatus(filtered);
  }, [searchTerm, allTasks]);

  return (
    // Page shell mirrors AdviserTask: min-h-screen + flex-col so the footer sits at the bottom
    <div className="min-h-screen flex flex-col bg-white">
      {/* Content grows to fill the space; footer (from layout) will sit after this and stick to bottom */}
      <div className="flex-1">
        <div className="container mx-auto px-6 py-6">
          {!viewTask ? (
            <>
              {/* Header */}
              <div className="d-flex align-items-center mb-3">
                <img
                  src={boardIcon}
                  alt="Board Icon"
                  style={{ width: 24, marginRight: 10 }}
                />
                <h2 className="m-0 fs-6 fw-bold" style={{ color: "#5a0d0e" }}>
                  Solo Mode Task Board
                </h2>
              </div>
              <hr className="mb-4" style={{ borderColor: "#5a0d0e" }} />

              {/* Search */}
              <div className="mb-4">
                <div className="input-group" style={{ maxWidth: 320 }}>
                  <span className="input-group-text bg-white">
                    <img src={searchIcon} alt="Search" style={{ width: 18 }} />
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

              {/* Kanban columns */}
              <div className="d-flex gap-3 overflow-auto pb-2">
                {Object.entries(tasksByStatus).map(([status, items]) => (
                  <div
                    className="flex-shrink-0"
                    style={{ width: 300, maxWidth: "90vw" }}
                    key={status}
                  >
                    <div
                      className="text-white px-3 py-2 rounded-top fw-semibold"
                      style={{ backgroundColor: statusColors[status] }}
                    >
                      {status}
                    </div>

                    <div className="bg-light p-2 rounded-bottom border border-light-subtle">
                      {items.length === 0 ? (
                        <p className="fst-italic text-muted small m-2">No tasks</p>
                      ) : (
                        items.map((task, idx) => {
                          const borderColor = statusColors[status];
                          return (
                            <div
                              key={`${task.id || idx}`}
                              className="position-relative bg-white mb-3 p-3 rounded shadow-sm"
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
                                  style={{ width: 18 }}
                                />
                              </button>

                              <strong className="fs-6">
                                {task.methodology || "No Methodology"}
                              </strong>

                              <hr
                                style={{
                                  margin: "7px 0",
                                  borderColor: "#5a0d0e",
                                  borderWidth: 2,
                                  opacity: 1,
                                }}
                              />

                              <p className="mb-1">{task.task}</p>
                              <p className="mb-1">{task.subtask || "No Subtask"}</p>

                              <hr
                                style={{
                                  margin: "6px 0",
                                  borderColor: "#5a0d0e",
                                  borderWidth: 2,
                                  opacity: 1,
                                }}
                              />

                              <div className="d-flex align-items-center gap-2 small">
                                <span
                                  style={{
                                    display: "inline-block",
                                    width: 10,
                                    height: 10,
                                    backgroundColor: "red",
                                    borderRadius: "50%",
                                  }}
                                />
                                <strong>
                                  {task.due_date
                                    ? new Date(task.due_date).toLocaleDateString()
                                    : "No Due Date"}{" "}
                                  {task.time ? task.time : ""}
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
            <>
              <button
                onClick={() => setViewTask(null)}
                className="btn btn-outline-secondary mb-3"
              >
                ← Back
              </button>

              <div className="bg-white rounded shadow-sm p-3 border">
                <h4 className="mb-2">{viewTask.task}</h4>
                <div className="row gy-2">
                  <div className="col-12 col-md-6">
                    <strong>Methodology:</strong> {viewTask.methodology || "None"}
                  </div>
                  <div className="col-12 col-md-6">
                    <strong>Phase:</strong> {viewTask.project_phase || "N/A"}
                  </div>
                  <div className="col-12 col-md-6">
                    <strong>Task Type:</strong> {viewTask.task_type || "N/A"}
                  </div>
                  <div className="col-12 col-md-6">
                    <strong>Subtask:</strong> {viewTask.subtask || "No Subtask"}
                  </div>
                  <div className="col-12 col-md-6">
                    <strong>Due:</strong> {viewTask.due_date || "No Due Date"}{" "}
                    {viewTask.time || ""}
                  </div>
                  <div className="col-12 col-md-6">
                    <strong>Status:</strong> {viewTask.status || "N/A"}
                  </div>
                  <div className="col-12">
                    <strong>Comment:</strong> {viewTask.comment || "No Comment"}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
