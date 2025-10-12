// src/components/Manager/ManagerTaskBoard.jsx
import React, { useState, useEffect } from "react";
import boardIcon from "../../../assets/tasks-board-icon.png";
import searchIcon from "../../../assets/search-icon.png";
import viewTaskIcon from "../../../assets/view-task-icon.png";
import { supabase } from "../../../supabaseClient";

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
      for (const table of ["adviser_final_def", "adviser_oral_def"]) {
        const { data } = await supabase.from(table).select("*").eq("manager_id", managerId);
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
    const grouped = { "To Do": [], "In Progress": [], "To Review": [], "Missed": [] };
    tasks.forEach((task) => {
      if (task.status === "Completed") return;
      let status = (task.status || "To Do").trim();
      if (!grouped[status]) status = "Missed";
      if (task.source === "adviser") grouped[status].unshift(task);
      else grouped[status].push(task);
    });
    setTasksByStatus(grouped);
  };

  useEffect(() => {
    const filtered = allTasks.filter((t) => (t.task || "").toLowerCase().includes(searchTerm.toLowerCase()));
    groupTasksByStatus(filtered);
  }, [searchTerm, allTasks]);

  return (
    <div className="w-full px-3 py-4 overflow-x-hidden">
      {/* Header */}
      {!viewTask ? (
        <>
          <div className="flex items-center gap-3 mb-3">
            <img src={boardIcon} alt="Board Icon" className="w-6 h-6" />
            <h2 className="text-lg font-semibold">Manager Task Board</h2>
          </div>

          <div className="h-px bg-gray-200 mb-4" />

          {/* Search (white) */}
          <div className="mb-4">
            <div
              className="max-w-[720px] w-full flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm"
              role="search"
              aria-label="Search tasks"
            >
              <div className="px-3 flex items-center justify-center bg-white">
                <img src={searchIcon} alt="Search" className="w-4 h-4 opacity-80" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search task"
                className="flex-1 px-3 py-2 text-sm placeholder-gray-400 bg-white outline-none"
                aria-label="Search tasks"
              />
            </div>
          </div>

          {/* Board grid (Tailwind responsive) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(tasksByStatus).map(([status, items]) => (
              <div key={status} className="flex flex-col min-w-0">
                {/* Column header */}
                <div
                  className="text-white px-3 py-2 font-semibold rounded-t-md"
                  style={{ backgroundColor: statusColors[status] || "#999" }}
                >
                  {status}
                </div>

                {/* Column body */}
                <div className="bg-white p-3 rounded-b-md shadow-sm flex flex-col gap-3 min-h-[80px]">
                  {items.length === 0 ? (
                    <p className="italic text-gray-400 text-sm m-0">No tasks</p>
                  ) : (
                    items.map((task, index) => {
                      const borderColor = statusColors[status];
                      const isAdviser = task.source === "adviser";

                      return (
                        <article
                          key={`${status}-${index}`}
                          className="relative bg-white rounded-md p-3 shadow-sm"
                          style={{ borderLeft: `6px solid ${borderColor}`, borderRight: "1px solid rgba(0,0,0,0.04)" }}
                        >
                          {/* view button */}
                          <button
                            onClick={() => setViewTask(task)}
                            title="View Task"
                            className="absolute top-2 right-2 bg-gray-100 hover:bg-gray-200 rounded-full p-1"
                            aria-label={`View ${task.task}`}
                          >
                            <img src={viewTaskIcon} alt="View" className="w-4 h-4" />
                          </button>

                          <strong className="block text-sm font-medium break-words">{task.assigned_to || "No Member"}</strong>
                          {isAdviser && <span className="inline-block ml-2 px-2 py-0.5 text-xs font-medium bg-blue-600 text-white rounded">Adviser</span>}

                          <div className="my-2 border-t-2" style={{ borderColor: "rgba(128,0,0,0.12)" }} />

                          <p className="text-sm text-gray-700 mb-1 break-words">{task.task}</p>
                          <p className="text-sm text-gray-500 mb-2 break-words">{task.subtask || "No Subtask"}</p>

                          <div className="my-1 border-t" style={{ borderColor: "rgba(128,0,0,0.06)" }} />

                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="inline-block w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
                            <div className="text-sm">
                              <strong className="text-gray-800">
                                {task.due_date ? new Date(task.due_date).toLocaleDateString() : "No Due Date"}
                              </strong>
                              <span className="text-gray-500 ml-1">{task.due_time || ""}</span>
                            </div>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="max-w-3xl">
          <button
            onClick={() => setViewTask(null)}
            className="mb-3 inline-flex items-center gap-2 text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
          >
            ← Back
          </button>

          <h3 className="text-lg font-semibold mb-2 break-words">{viewTask.task}</h3>
          <p className="text-sm text-gray-700 mb-1"><strong>Assigned to:</strong> {viewTask.assigned_to || "No Member"}</p>
          <p className="text-sm text-gray-700 mb-1"><strong>Due:</strong> {viewTask.due_date || "No Due Date"} {viewTask.due_time || ""}</p>
          <p className="text-sm text-gray-700"><strong>Status:</strong> {viewTask.status}</p>
        </div>
      )}
    </div>
  );
};

export default ManagerTaskBoard;
