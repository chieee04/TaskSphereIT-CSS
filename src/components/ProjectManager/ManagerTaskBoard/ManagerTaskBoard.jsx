import React, { useState, useEffect } from "react";
import boardIcon from "../../../assets/tasks-board-icon.png";
import searchIcon from "../../../assets/search-icon.png";
import viewTaskIcon from "../../../assets/view-task-icon.png";
import { supabase } from "../../../supabaseClient";
import ManagerTaskView from "./ManagerTaskBoardView";
//import ManagerTaskView from "../../CapstoneAdviser/AdviserBoard/AdviserViewBoard";

const statusColors = {
  "To Do": "#FABC3F",
  "In Progress": "#809D3C",
  "To Review": "#578FCA",
  "Missed": "#D32F2F",
};

export default function ManagerTaskBoard() {
  const [viewTask, setViewTask] = useState(null);
  const [allTasks, setAllTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [tasksByStatus, setTasksByStatus] = useState({
    "To Do": [],
    "In Progress": [],
    "To Review": [],
    "Missed": [],
  });

  // ✅ Original backend logic (unchanged)
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

  // ✅ Original grouping
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

  // ✅ Search
  useEffect(() => {
    const filtered = allTasks.filter((t) =>
      (t.task || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    groupTasksByStatus(filtered);
  }, [searchTerm, allTasks]);

  // ✅ UI
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 overflow-hidden">
      <div className="flex-grow container mx-auto px-6 py-6">
        {!viewTask ? (
          <>
            {/* Header */}
            <div className="flex items-center mb-4">
              <img src={boardIcon} alt="Board Icon" className="w-6 h-6 mr-2" />
              <h2 className="text-lg font-bold text-gray-800">Manager Task Board</h2>
            </div>
            <hr className="border-t-2 border-gray-300 mb-4" />

            {/* Search */}
            <div className="mb-6">
              <div className="flex items-center bg-white border border-gray-300 rounded-lg shadow-sm w-full max-w-sm">
                <span className="px-3">
                  <img src={searchIcon} alt="Search" className="w-5 opacity-70" />
                </span>
                <input
                  type="text"
                  placeholder="Search task..."
                  className="w-full p-2 bg-white text-gray-800 placeholder-gray-400 rounded-r-lg focus:ring-2 focus:ring-maroon-600 focus:outline-none text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Board Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(tasksByStatus).map(([status, items]) => (
                <div key={status} className="flex flex-col w-full">
                  {/* Column Header */}
                  <div
                    className="text-white text-sm font-semibold px-4 py-2 rounded-t-md"
                    style={{ backgroundColor: statusColors[status] || "#999" }}
                  >
                    {status}
                  </div>

                  {/* Column Body */}
                  <div className="bg-white p-3 rounded-b-md shadow-md border border-gray-200 flex-grow">
                    {items.length === 0 ? (
                      <p className="italic text-gray-400 text-sm">No tasks</p>
                    ) : (
                      items.map((task, index) => {
                        const borderColor = statusColors[status];
                        const isAdviser = task.source === "adviser";
                        return (
                          <div
                            key={index}
                            className="relative bg-white mb-3 p-3 rounded-lg shadow-sm border-l-4"
                            style={{ borderColor }}
                          >
                            {/* View Button */}
                            <button
                              onClick={() => setViewTask(task)}
                              title="View Task"
                              className="absolute top-1 right-1 bg-gray-100 hover:bg-gray-200 rounded-full p-1"
                            >
                              <img src={viewTaskIcon} alt="View" className="w-4" />
                            </button>

                            <h3 className="font-semibold text-sm text-gray-800">
                              {task.assigned_to}
                              {isAdviser && (
                                <span className="ml-2 px-2 py-0.5 text-xs bg-blue-600 text-white rounded">
                                  Adviser
                                </span>
                              )}
                            </h3>

                            <hr className="my-2 border-t-2 border-maroon-700" />

                            <p className="text-sm text-gray-700 mb-1">{task.task}</p>
                            <p className="text-sm text-gray-500 mb-2">
                              {task.subtask || "No Subtask"}
                            </p>

                            <div className="flex items-center gap-2 text-xs text-gray-700 mt-1">
                              <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: "red" }}
                              ></span>
                              <strong>
                                {task.due_date
                                  ? new Date(task.due_date).toLocaleDateString()
                                  : "No Due Date"}
                              </strong>
                              <span className="text-gray-500 ml-1">{task.due_time || ""}</span>
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
          <ManagerTaskView task={viewTask} onBack={() => setViewTask(null)} />
        )}
      </div>
    </div>
  );
}
