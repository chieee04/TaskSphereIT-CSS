import { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";
import { FaCalendarAlt, FaClock } from "react-icons/fa";

export default function ManagerFinalRecord() {
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCompletedTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("manager_final_task")
        .select(
          `*, member:user_credentials!manager_final_task_member_id_fkey(first_name, last_name)`
        )
        .eq("status", "Completed")
        .order("due_date", { ascending: true });

      if (error) throw error;
      setCompletedTasks(data || []);
    } catch (err) {
      console.error("Error fetching completed tasks:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedTasks();
  }, []);

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
    <div className="flex flex-col min-h-screen bg-[#FFFDF9]">
      {/* ✅ Main Content */}
      <div className="flex-grow p-4">
        <h2 className="text-[#3B0304] font-semibold mb-4">
          ✅ Completed Final Defense Tasks
        </h2>

        <div className="border rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[1000px] text-center">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">No</th>
                <th className="p-2">Assigned</th>
                <th className="p-2">Tasks</th>
                <th className="p-2">Subtasks</th>
                <th className="p-2">Elements</th>
                <th className="p-2 w-32 text-center">Due Date</th>
                <th className="p-2 w-32 text-center">Time</th>
                <th className="p-2">Revision</th>
                <th className="p-2">Methodology</th>
                <th className="p-2">Project Phase</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="11" className="text-center p-4">
                    Loading...
                  </td>
                </tr>
              ) : completedTasks.length === 0 ? (
                <tr>
                  <td colSpan="11" className="text-center p-4">
                    No Completed Tasks
                  </td>
                </tr>
              ) : (
                completedTasks.map((task, index) => (
                  <tr key={task.id} className="border-t hover:bg-gray-50">
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
                    <td className="p-2">{task.revision}</td>
                    <td className="p-2">{task.methodology}</td>
                    <td className="p-2">{task.project_phase}</td>
                    <td className="p-2 text-green-600 font-bold">Completed</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
