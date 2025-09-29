// src/components/MemberTaskRecord.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import "../Style/Member/MemberTask.css";

const MemberTaskRecord = () => {
  const [completedTasks, setCompletedTasks] = useState([]);

  const fetchCompletedTasks = async () => {
    const storedUser = JSON.parse(localStorage.getItem("customUser"));
    if (!storedUser) {
      console.error("❌ No customUser found in localStorage");
      return;
    }

    const currentMemberId = storedUser.id;
    console.log("📌 Fetching Completed tasks for Member:", currentMemberId);

    const { data, error } = await supabase
      .from("manager_title_task")
      .select(`
        id,
        task_name,
        due_date,
        due_time,
        created_date,
        created_time,
        methodology,
        project_phase,
        revision,
        status,
        manager:user_credentials!manager_title_task_manager_id_fkey(first_name, last_name)
      `)
      .eq("member_id", currentMemberId)
      .eq("status", "Completed") // ✅ only completed
      .order("created_date", { ascending: false });

    if (error) {
      console.error("❌ Fetch error:", error);
      return;
    }

    setCompletedTasks(data);
  };

  useEffect(() => {
    fetchCompletedTasks();
  }, []);

  return (
    <div className="member-task-page">
      <h2 className="member-task-title">✅ Completed Tasks</h2>

      <div className="table-wrapper">
        <table className="member-task-table">
          <thead>
            <tr>
              <th>NO</th>
              <th>Manager</th>
              <th>Task</th>
              <th>Date Created</th>
              <th>Due Date</th>
              <th>Time</th>
              <th>Revision No.</th>
              <th>Status</th>
              <th>Methodology</th>
              <th>Project Phase</th>
            </tr>
          </thead>
          <tbody>
            {completedTasks.length > 0 ? (
              completedTasks.map((t, index) => (
                <tr key={t.id}>
                  <td>{index + 1}</td>
                  <td>{t.manager?.first_name} {t.manager?.last_name}</td>
                  <td>{t.task_name}</td>
                  <td>{t.created_date}</td>
                  <td>{t.due_date}</td>
                  <td>{t.due_time}</td>
                  <td>{t.revision || "-"}</td>
                  <td style={{ color: "green", fontWeight: "bold" }}>
                    {t.status}
                  </td>
                  <td>{t.methodology}</td>
                  <td>{t.project_phase}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" style={{ textAlign: "center", padding: "1rem" }}>
                  No completed tasks found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MemberTaskRecord;
