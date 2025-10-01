// src/components/tasks/ManagerFinalDefense.jsx
import { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import {
  FaPlus,
  FaSearch,
  FaCalendarAlt,
  FaClock,
  FaTrash,
} from "react-icons/fa";
import { openCreateFinalRedefTask } from "../../../services/Manager/ManagerFinalRedefTask";

const MySwal = withReactContent(Swal);

const REVISION_OPTIONS = Array.from({ length: 10 }, (_, i) => {
  const num = i + 1;
  if (num === 1) return "1st Revision";
  if (num === 2) return "2nd Revision";
  if (num === 3) return "3rd Revision";
  return `${num}th Revision`;
});

const STATUS_OPTIONS = ["To Do", "In Progress", "To Review"];

export default function ManagerFinalRedefTask() {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState([]);

  const statusColors = {
    "To Do": "#FABC3F",
    "In Progress": "#809D3C",
    "To Review": "#578FCA",
    Completed: "#AA60C8",
    Missed: "#D60606",
  };

  const fetchTasks = async () => {
  try {
    const { data, error } = await supabase
      .from("manager_final_task")
      .select(
        `*, member:user_credentials!manager_final_task_member_id_fkey(first_name, last_name)`
      )
      .neq("status", "Completed") // 🚫 exclude Completed
      .order("due_date", { ascending: true });

    if (error) throw error;
    setTasks(data || []);
    setFilteredTasks(data || []);
  } catch (err) {
    console.error("Error fetching tasks:", err.message);
    MySwal.fire("Error", "Failed to fetch Final Defense tasks", "error");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 60000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Search + Filter (lahat ng columns + nested member)
  useEffect(() => {
    let data = tasks;

    if (search) {
      const lowerSearch = search.toLowerCase();
      data = data.filter((t) =>
        [
          t.task,
          t.subtask,
          t.element,
          t.status,
          t.methodology,
          t.project_phase,
          t.revision,
          t.due_date,
          t.time,
          t.member?.first_name,
          t.member?.last_name,
        ].some((val) =>
          val ? String(val).toLowerCase().includes(lowerSearch) : false
        )
      );
    }

    if (filter !== "All") {
      data = data.filter((t) => t.status === filter);
    }

    setFilteredTasks(data);
  }, [search, filter, tasks]);

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selected.length === 0) return;

    const confirm = await MySwal.fire({
      title: `Delete ${selected.length} tasks?`,
      text: "This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3B0304",
      cancelButtonColor: "#aaa",
      confirmButtonText: "Yes, delete",
    });
    if (!confirm.isConfirmed) return;

    try {
      const { error } = await supabase
        .from("manager_final_task")
        .delete()
        .in("id", selected);

      if (error) throw error;
      setTasks((prev) => prev.filter((t) => !selected.includes(t.id)));
      setSelected([]);
    } catch (err) {
      console.error("Error bulk deleting:", err.message);
    }
  };

  const handleRevisionChange = async (id, value) => {
    try {
      const { error } = await supabase
        .from("manager_final_task")
        .update({ revision: value })
        .eq("id", id);
      if (error) throw error;

      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, revision: value } : t))
      );
    } catch (err) {
      console.error("Error updating revision:", err.message);
    }
  };

  const handleStatusChange = async (id, value) => {
  try {
    const { error } = await supabase
      .from("manager_final_task")
      .update({ status: value })
      .eq("id", id);
    if (error) throw error;

    if (value === "Completed") {
      // ✅ remove from active table
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } else {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: value } : t))
      );
    }
  } catch (err) {
    console.error("Error updating status:", err.message);
  }
};

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    try {
      const [hour, minute] = timeStr.split(":");
      let h = parseInt(hour, 10);
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      return `${h}:${minute} ${ampm}`;
    } catch {
      return "";
    }
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[#3B0304] font-semibold flex items-center gap-2">
          Final Defense
        </h2>
      </div>

      {/* Create Task Button */}
      <div className="mb-3">
        <button
          onClick={openCreateFinalRedefTask}
          className="px-3 py-2 border border-[#3B0304] rounded bg-white text-[#3B0304] flex items-center gap-2 hover:bg-gray-100"
        >
          <FaPlus /> Create Task
        </button>
      </div>

      {/* Search + Delete + Filter */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center border rounded px-2 w-52 bg-white">
          <FaSearch className="text-gray-400 mr-1" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full text-sm p-1 outline-none"
          />
        </div>

        <div className="flex gap-2">
          {selected.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-3 py-2 border border-[#3B0304] rounded bg-white text-[#3B0304] flex items-center gap-2 hover:bg-gray-100"
            >
              <FaTrash /> Delete
            </button>
          )}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option>All</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s}>{s}</option>
            ))}
            <option>Missed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[1100px] text-center">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">
                <input
                  type="checkbox"
                  onChange={(e) =>
                    setSelected(
                      e.target.checked ? tasks.map((t) => t.id) : []
                    )
                  }
                  checked={selected.length === tasks.length && tasks.length > 0}
                />
              </th>
              <th className="p-2">No</th>
              <th className="p-2">Assigned</th>
              <th className="p-2">Tasks</th>
              <th className="p-2">Subtasks</th>
              <th className="p-2">Elements</th>
              <th className="p-2 w-32 text-center">Due Date</th>
              <th className="p-2 w-32 text-center">Time</th>
              <th className="p-2">Revision</th>
              <th className="p-2">Status</th>
              <th className="p-2">Methodology</th>
              <th className="p-2">Project Phase</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="13" className="text-center p-4">
                  Loading tasks...
                </td>
              </tr>
            ) : filteredTasks.length === 0 ? (
              <tr>
                <td colSpan="13" className="text-center p-4">
                  No Task
                </td>
              </tr>
            ) : (
              filteredTasks.map((task, index) => (
                <tr key={task.id} className="border-t hover:bg-gray-50">
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selected.includes(task.id)}
                      onChange={() => toggleSelect(task.id)}
                    />
                  </td>
                  <td className="p-2">{index + 1}</td>
                  <td className="p-2">
                    {task.member?.first_name} {task.member?.last_name}
                  </td>
                  <td className="p-2">{task.task}</td>
                  <td className="p-2">{task.subtask}</td>
                  <td className="p-2">{task.element}</td>
                  <td className="p-2 text-center w-32">
                    <span className="inline-flex items-center gap-1">
                      <FaCalendarAlt className="text-gray-600" />
                      {task.due_date
                        ? new Date(task.due_date).toLocaleDateString()
                        : ""}
                    </span>
                  </td>
                  <td className="p-2 text-center w-32">
                    <span className="inline-flex items-center gap-1">
                      <FaClock className="text-gray-600" />
                      {task.time ? formatTime(task.time) : ""}
                    </span>
                  </td>
                  <td className="p-2">
                    <select
                      value={task.revision || "1st Revision"}
                      onChange={(e) =>
                        handleRevisionChange(task.id, e.target.value)
                      }
                      className="border rounded px-2 py-1 text-sm"
                    >
                      {REVISION_OPTIONS.map((rev, i) => (
                        <option key={i} value={rev}>
                          {rev}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
  <select
    value={task.status || "To Do"}
    onChange={(e) => handleStatusChange(task.id, e.target.value)}
    className="border rounded px-2 py-1 text-sm text-white"
    style={{
      backgroundColor: statusColors[task.status] || "#FABC3F",
    }}
  >
    {STATUS_OPTIONS.map((s) => (
      <option key={s} value={s}>
        {s}
      </option>
    ))}
    <option value="Missed">Missed</option>
    <option value="Completed">Completed</option> {/* ✅ still selectable */}
  </select>
</td>
                  <td className="p-2">{task.methodology}</td>
                  <td className="p-2">{task.project_phase}</td>
                  <td className="p-2">
                    <button
                      onClick={() => MySwal.fire("Delete single task here")}
                      className="text-red-600 hover:text-red-800"
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
  );
}

