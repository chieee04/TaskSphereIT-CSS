import React, { useState, useEffect } from "react";
import boardIcon from "../../../assets/tasks-board-icon.png";
import searchIcon from "../../../assets/search-icon.png";
import viewTaskIcon from "../../../assets/view-task-icon.png";
import { supabase } from "../../../supabaseClient";
import AdviserViewBoard from "./AdviserViewBoard";
 
// ✅ Bootstrap imported once globally (not injected inside component)
import "bootstrap/dist/css/bootstrap.min.css";
 
const statusColors = {
  "To Do": "#FABC3F",
  "In Progress": "#809D3C",
  "To Review": "#578FCA",
  "Missed Task": "#D32F2F",
};
 
const AdviserTeamBoard = () => {
  const [viewTask, setViewTask] = useState(null);
  const [allTasks, setAllTasks] = useState([]); // store all fetched tasks
  const [searchTerm, setSearchTerm] = useState("");
 
  const [tasksByStatus, setTasksByStatus] = useState({
    "To Do": [],
    "In Progress": [],
    "To Review": [],
    "Missed Task": [],
  });
 
  // ✅ Fetch tasks once
  useEffect(() => {
    const fetchTasks = async () => {
      const storedUser = localStorage.getItem("customUser");
      if (!storedUser) return;
 
      const adviser = JSON.parse(storedUser);
      if (parseInt(adviser.user_roles) !== 3) return;
 
      const { data, error } = await supabase
        .from("adviser_oral_def")
        .select("*")
        .eq("adviser_id", adviser.id);
 
      if (error) {
        console.error("Error fetching tasks:", error);
        return;
      }
 
      setAllTasks(data); // Save full list for filtering
      groupTasksByStatus(data); // Initialize group
    };
 
    fetchTasks();
  }, []);
 
  // ✅ Filter and group tasks by status
  const groupTasksByStatus = (tasks) => {
    const grouped = {
      "To Do": [],
      "In Progress": [],
      "To Review": [],
      "Missed Task": [],
    };
 
    tasks.forEach((task) => {
      let status = (task.status || "To Do").trim();
      if (!grouped[status]) status = "Missed Task";
 
      grouped[status].push(task);
    });
 
    setTasksByStatus(grouped);
  };
 
  // ✅ Apply search filter on change
  useEffect(() => {
    const filtered = allTasks.filter((task) =>
      task.group_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    groupTasksByStatus(filtered);
  }, [searchTerm, allTasks]);
 
  return (
    <div className="container mt-4 adviser-board">
      {!viewTask ? (
        <>
          {/* Header */}
          <div className="d-flex align-items-center mb-3">
            <img
              src={boardIcon}
              alt="Board Icon"
              style={{ width: "24px", marginRight: "10px" }}
            />
            <h2 className="m-0 fs-5 fw-bold">Teams Board</h2>
          </div>
          <hr />
 
          {/* Search Bar */}
          <div className="mb-4">
            <div className="input-group" style={{ maxWidth: "300px" }}>
              <span className="input-group-text">
                <img src={searchIcon} alt="Search" style={{ width: "18px" }} />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search team name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
 
          {/* Task Columns */}
          {/* Task Columns */}
<div className="d-flex gap-3 overflow-auto">
  {Object.entries(tasksByStatus).map(([status, items]) => (
    <div className="flex-shrink-0" style={{ width: "280px" }} key={status}>
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
            const taskLines = (task.task || "").split(" - ");
            const borderColor = statusColors[status];
 
            return (
              <div
                className="position-relative bg-white mb-3 p-3 rounded shadow-sm"
                key={index}
                style={{ borderLeft: `6px solid ${borderColor}` }}
              >
                {/* View Button */}
                <button
                  onClick={() => setViewTask(task)}
                  title="View Task"
                  className="position-absolute top-0 end-0 m-2 btn btn-sm btn-light p-1 border-0"
                >
                  <img src={viewTaskIcon} alt="View Task" style={{ width: "18px" }} />
                </button>
 
                <strong className="fs-6">{task.group_name}</strong>
                <hr
                  style={{
                    margin: "7px 0",
                    borderColor: "maroon",
                    borderWidth: "2px",
                  }}
                />
                <div className="mb-2 small">
                  {taskLines.map((line, idx) => (
                    <p key={idx} className="mb-1">
                      {line}
                    </p>
                  ))}
                  <p className="mb-1">{task.subtask || "No Subtask"}</p>
                </div>
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
                      : "No Due Date"}
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
        <AdviserViewBoard task={viewTask} onBack={() => setViewTask(null)} />
      )}
    </div>
  );
};
 
export default AdviserTeamBoard;