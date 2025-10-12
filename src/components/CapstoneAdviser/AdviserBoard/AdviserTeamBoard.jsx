import React, { useState, useEffect } from "react";
import boardIcon from "../../../assets/tasks-board-icon.png";
import searchIcon from "../../../assets/search-icon.png";
import viewTaskIcon from "../../../assets/view-task-icon.png";
import { supabase } from "../../../supabaseClient";
import AdviserViewBoard from "./AdviserViewBoard";

const statusColors = {
  "To Do": "#FABC3F",
  "In Progress": "#809D3C",
  "To Review": "#578FCA",
  "Missed Task": "#D32F2F",
};

export default function AdviserTeamBoard() {
  const [viewTask, setViewTask] = useState(null);
  const [allTasks, setAllTasks] = useState([]);
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

      setAllTasks(data);
      groupTasksByStatus(data);
    };

    fetchTasks();
  }, []);

  // ✅ Group tasks by status
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

  // ✅ Filter tasks on search
  useEffect(() => {
    const filtered = allTasks.filter((task) =>
      task.group_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    groupTasksByStatus(filtered);
  }, [searchTerm, allTasks]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 overflow-hidden">
      {/* Main Content */}
      <div className="flex-grow container mx-auto px-6 py-6">
        {!viewTask ? (
          <>
            {/* Header */}
            <div className="flex items-center mb-4">
              <img src={boardIcon} alt="Board Icon" className="w-6 h-6 mr-2" />
              <h2 className="text-lg font-bold text-gray-800">Teams Board</h2>
            </div>
            <hr className="border-t-2 border-gray-300 mb-4" />

            {/* 🔍 Search Bar */}
            <div className="mb-6">
              <div className="flex items-center bg-white border border-gray-300 rounded-lg shadow-sm w-full max-w-sm">
                <span className="px-3">
                  <img src={searchIcon} alt="Search" className="w-5 opacity-70" />
                </span>
                <input
                  type="text"
                  placeholder="Search team name..."
                  className="w-full p-2 bg-white text-gray-800 placeholder-gray-400 rounded-r-lg focus:ring-2 focus:ring-maroon-600 focus:outline-none text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Task Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(tasksByStatus).map(([status, items]) => (
                <div key={status} className="flex flex-col w-full">
                  <div
                    className="text-white text-sm font-semibold px-4 py-2 rounded-t-md"
                    style={{ backgroundColor: statusColors[status] }}
                  >
                    {status}
                  </div>

                  <div className="bg-white p-3 rounded-b-md shadow-md border border-gray-200 flex-grow">
                    {items.length === 0 ? (
                      <p className="italic text-gray-400 text-sm">No tasks</p>
                    ) : (
                      items.map((task, index) => {
                        const taskLines = (task.task || "").split(" - ");
                        const borderColor = statusColors[status];

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
                              <img src={viewTaskIcon} alt="View Task" className="w-4" />
                            </button>

                            <h3 className="font-semibold text-sm text-gray-800">
                              {task.group_name}
                            </h3>
                            <hr className="my-2 border-t-2 border-maroon-700" />

                            <div className="text-sm text-gray-600">
                              {taskLines.map((line, idx) => (
                                <p key={idx} className="mb-1">
                                  {line}
                                </p>
                              ))}
                              <p className="text-gray-500 text-xs">
                                {task.subtask || "No Subtask"}
                              </p>
                            </div>

                            <hr className="my-2 border-t-2 border-maroon-700" />

                            <div className="flex items-center gap-2 text-xs text-gray-700">
                              <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: "red" }}
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
    </div>
  );
}
