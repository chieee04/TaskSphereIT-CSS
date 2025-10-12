// src/components/Member/SoloModeTasksRecord.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import {
  FaTasks,
  FaCalendarAlt,
  FaClock,
  FaChevronDown,
  FaTrash,
  FaFilter,
  FaSearch,
} from "react-icons/fa";

const ACCENT = "#5a0d0e";

const STATUS_OPTIONS = ["To Do", "In Progress", "To Review", "Completed", "Missed"];
const REVISION_OPTIONS = Array.from({ length: 10 }, (_, i) => {
  const num = i + 1;
  if (num === 1) return "1st Revision";
  if (num === 2) return "2nd Revision";
  if (num === 3) return "3rd Revision";
  return `${num}th Revision`;
});

const getStatusColor = (value) => {
  switch (value) {
    case "To Do":
      return "#FABC3F";
    case "In Progress":
      return "#809D3C";
    case "To Review":
      return "#578FCA";
    case "Completed":
      return "#AA60C8";
    case "Missed":
      return "#D60606";
    default:
      return "#ccc";
  }
};

const fmtDate = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return d;
  }
};
const fmtTime = (t) => (t ? t : "—");

export default function SoloModeTasksRecord() {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchTasks = async () => {
      const storedUser = localStorage.getItem("customUser");
      if (!storedUser) return;
      const currentUser = JSON.parse(storedUser);

      const { data, error } = await supabase
        .from("solo_mode_task")
        .select(
          `
          id,
          task,
          subtask,
          due_date,
          time,
          created_at,
          date_completed,
          methodology,
          project_phase,
          revision,
          status
        `
        )
        .eq("user_id", currentUser.id)
        .eq("status", "Completed");

      if (!error) setTasks(data || []);
      else console.error("Error fetching solo records:", error);
    };

    fetchTasks();
  }, []);

  const handleStatusChange = async (taskId, newStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
  };

  const handleRevisionChange = async (taskId, revisionInt) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, revision: revisionInt } : t)));
  };

  const filtered = tasks.filter(
    (t) =>
      (t.task || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.subtask || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.methodology || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.project_phase || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="flex-1">
        <div className="container mx-auto px-6 py-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: ACCENT }}>
            <FaTasks size={16} />
            Solo Mode Task Records
          </h2>
          <hr className="mb-4" style={{ borderColor: ACCENT }} />

          {/* Controls */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div className="relative w-full md:max-w-xs">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search task, subtask, method, phase"
                className="w-full border rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 bg-white text-gray-900 placeholder-gray-400"
                style={{
                  borderColor: "#B2B2B2",
                  backgroundColor: "#FFFFFF", // <-- force white background
                  boxShadow: "0 0 0 0 rgba(0,0,0,0)",
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="text-sm px-3 py-2 rounded-md border flex items-center gap-2 bg-white"
                style={{ borderColor: ACCENT, color: ACCENT }}
                onClick={() => {}}
              >
                <FaTrash />
                Delete
              </button>
              <div
                className="text-sm px-3 py-2 rounded-md border flex items-center gap-2 bg-white"
                style={{ borderColor: ACCENT, color: ACCENT }}
                title="Filter is fixed to Completed"
              >
                <FaFilter />
                Filter: Completed
              </div>
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-lg border" style={{ borderColor: "#B2B2B2" }}>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 text-[12px]" style={{ color: ACCENT }}>
                    <th className="px-3 py-2 text-center uppercase">NO</th>
                    <th className="px-3 py-2 text-center uppercase">Task</th>
                    <th className="px-3 py-2 text-center uppercase">Subtask</th>
                    <th className="px-3 py-2 text-center uppercase">Date Created</th>
                    <th className="px-3 py-2 text-center uppercase">Due Date</th>
                    <th className="px-3 py-2 text-center uppercase">Time</th>
                    <th className="px-3 py-2 text-center uppercase">Date Completed</th>
                    <th className="px-3 py-2 text-center uppercase">Revision No.</th>
                    <th className="px-3 py-2 text-center uppercase">Status</th>
                    <th className="px-3 py-2 text-center uppercase">Methodology</th>
                    <th className="px-3 py-2 text-center uppercase">Project Phase</th>
                    <th className="px-3 py-2 text-center uppercase">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="px-3 py-6 text-center text-gray-500">
                        No completed tasks yet.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((task, idx) => (
                      <tr key={task.id} className="border-t">
                        <td className="px-3 py-2 text-center">{idx + 1}.</td>
                        <td className="px-3 py-2 text-center">{task.task}</td>
                        <td className="px-3 py-2 text-center">{task.subtask || "—"}</td>
                        <td className="px-3 py-2 text-center">{fmtDate(task.created_at)}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-2">
                            <FaCalendarAlt size={14} style={{ color: ACCENT }} />
                            {fmtDate(task.due_date)}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-2">
                            <FaClock size={14} style={{ color: ACCENT }} />
                            {fmtTime(task.time)}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">{fmtDate(task.date_completed)}</td>

                        <td className="px-3 py-2">
                          <div className="relative inline-flex items-center min-w-[110px]">
                            <select
                              value={task.revision || 1}
                              onChange={(e) =>
                                handleRevisionChange(task.id, parseInt(e.target.value, 10))
                              }
                              className="border rounded px-2 pr-6 py-1 w-full appearance-none"
                              style={{ borderColor: "#ccc", color: ACCENT }}
                            >
                              {REVISION_OPTIONS.map((label, i) => (
                                <option key={i + 1} value={i + 1}>
                                  {label}
                                </option>
                              ))}
                            </select>
                            <FaChevronDown
                              className="absolute right-2 pointer-events-none"
                              size={12}
                              style={{ color: ACCENT }}
                            />
                          </div>
                        </td>

                        <td className="px-3 py-2">
                          <div
                            className="relative inline-flex items-center rounded min-w-[110px]"
                            style={{
                              backgroundColor: getStatusColor(task.status),
                              boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                            }}
                          >
                            <select
                              value={task.status}
                              onChange={(e) => handleStatusChange(task.id, e.target.value)}
                              className="rounded px-2 pr-6 py-1 w-full appearance-none text-white"
                              style={{
                                backgroundColor: getStatusColor(task.status),
                              }}
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                            <FaChevronDown className="absolute right-2 pointer-events-none text-white" size={12} />
                          </div>
                        </td>

                        <td className="px-3 py-2 text-center">{task.methodology || "—"}</td>
                        <td className="px-3 py-2 text-center">{task.project_phase || "—"}</td>

                        <td className="px-3 py-2 text-center">
                          <button
                            className="inline-flex items-center justify-center rounded border px-2 py-1 text-[12px] bg-white"
                            style={{ borderColor: ACCENT, color: ACCENT }}
                            onClick={() => {}}
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
