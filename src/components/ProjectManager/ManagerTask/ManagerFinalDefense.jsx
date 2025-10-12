// src/components/tasks/ManagerFinalDefense.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../supabaseClient";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import {
  FaPlus,
  FaSearch,
  FaCalendarAlt,
  FaClock,
  FaTrash,
  FaChevronLeft,
} from "react-icons/fa";
import Footer from "../../Footer";
import { openCreateFinalTask } from "../../../services/Manager/ManagerFinalTask";

const MySwal = withReactContent(Swal);

const REVISION_OPTIONS = Array.from({ length: 10 }, (_, i) => {
  const num = i + 1;
  if (num === 1) return "1st Revision";
  if (num === 2) return "2nd Revision";
  if (num === 3) return "3rd Revision";
  return `${num}th Revision`;
});

const STATUS_OPTIONS = ["To Do", "In Progress", "To Review"];

export default function ManagerFinalDefense() {
  const navigate = useNavigate();

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
        .neq("status", "Completed") // exclude Completed from active list
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

  // Search + Filter
  useEffect(() => {
    let data = tasks;

    if (search) {
      const lower = search.toLowerCase();
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
        ].some((val) => (val ? String(val).toLowerCase().includes(lower) : false))
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
        // remove from active table
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
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header + Back */}
      <div className="px-4 pt-4">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="section-title m-0 text-[#3B0304] font-semibold">
            Final Defense
          </h2>
        </div>
        <hr className="divider" />
      </div>

      {/* Main */}
      <main className="px-4 pb-6 flex-1">
        {/* Local styles to match your design system */}
        <style>{`
          .section-title { display:flex; align-items:center; }
          .divider {
            height: 1.5px;
            background-color: #3B0304;
            width: calc(100% + 50px);
            margin-left: -16px;
            border-radius: 50px;
            margin-bottom: 1.0rem;
            border: none;
          }
          .primary-button {
            font-size: .85rem!important; padding:6px 12px!important; border-radius:6px!important;
            border:1.5px solid #3B0304!important; background:#fff!important; color:#3B0304!important;
            font-weight:500!important; cursor:pointer!important; transition:background .2s!important;
            display:inline-flex!important; align-items:center!important; gap:6px!important; white-space:nowrap;
          }
          .primary-button:hover { background:#f0f0f0!important; }

          .search-wrap {
            border: 1px solid #B2B2B2; border-radius: 6px; background: #fff; padding: 4px 8px;
            display:flex; align-items:center; gap:6px; width: 210px;
          }
          .search-input { outline:none; width:100%; font-size:.9rem; color:#111827; }
          .filter-select {
            border:1px solid #B2B2B2; border-radius:6px; padding:6px 8px; background:#fff; color:#111827; font-size:.9rem;
          }

          table thead th {
            background:#f8f9fa; color:#3B0304; text-transform:uppercase; font-weight:600; font-size:.75rem;
            padding:12px 8px; white-space:nowrap; text-align:center;
          }
          table tbody td {
            padding:10px 8px; font-size:.875rem; color:#495057; border-top:1px solid #edf2f7; vertical-align:middle; text-align:center;
          }
          .badge-cell { display:inline-flex; align-items:center; gap:6px; }
        `}</style>

        {/* Create Task */}
        <div className="mb-3">
          <button onClick={openCreateFinalTask} className="primary-button">
            <FaPlus /> Create Task
          </button>
        </div>

        {/* Search + Delete + Filter */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="search-wrap">
            <FaSearch className="text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="search-input"
            />
          </div>

          <div className="flex items-center gap-2">
            {selected.length > 0 && (
              <button onClick={handleBulkDelete} className="primary-button">
                <FaTrash /> Delete
              </button>
            )}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
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
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[1100px]">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    onChange={(e) =>
                      setSelected(e.target.checked ? tasks.map((t) => t.id) : [])
                    }
                    checked={selected.length === tasks.length && tasks.length > 0}
                  />
                </th>
                <th>No</th>
                <th>Assigned</th>
                <th>Tasks</th>
                <th>Subtasks</th>
                <th>Elements</th>
                <th>Due Date</th>
                <th>Time</th>
                <th>Revision</th>
                <th>Status</th>
                <th>Methodology</th>
                <th>Project Phase</th>
                <th>Action</th>
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
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.includes(task.id)}
                        onChange={() => toggleSelect(task.id)}
                      />
                    </td>
                    <td>{index + 1}</td>
                    <td>
                      {task.member?.first_name} {task.member?.last_name}
                    </td>
                    <td>{task.task}</td>
                    <td>{task.subtask}</td>
                    <td>{task.element}</td>
                    <td>
                      <span className="badge-cell justify-center">
                        <FaCalendarAlt className="text-gray-600" />
                        {task.due_date
                          ? new Date(task.due_date).toLocaleDateString()
                          : ""}
                      </span>
                    </td>
                    <td>
                      <span className="badge-cell justify-center">
                        <FaClock className="text-gray-600" />
                        {task.time ? formatTime(task.time) : ""}
                      </span>
                    </td>
                    <td>
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
                    <td>
                      <select
                        value={task.status || "To Do"}
                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        className="border rounded px-2 py-1 text-sm text-white"
                        style={{
                          backgroundColor:
                            statusColors[task.status] || "#FABC3F",
                        }}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                        <option value="Missed">Missed</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>
                    <td>{task.methodology}</td>
                    <td>{task.project_phase}</td>
                    <td>
                      <button
                        onClick={() => MySwal.fire("Delete single task here")}
                        className="text-red-600 hover:text-red-800"
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
      </main>
    </div>
  );
}
