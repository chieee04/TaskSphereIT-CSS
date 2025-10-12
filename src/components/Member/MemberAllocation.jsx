// src/components/MemberAllocation.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import taskIcon from "../../assets/tasks-allocation.png";

// Reuse your existing page-level styles
import "../Style/Member/MemberAllocation.css";

// (Optional) If your StudentCredentials table styles live here and you want
// them verbatim, you can also import them. Otherwise, the CSS below already
// mimics that flat, squared style.
// import "../Style/Instructor/StudentCredentials.css";

const MemberAllocation = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem("customUser"));

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        // 1. Get current user record
        const { data: userData, error: userError } = await supabase
          .from("user_credentials")
          .select("*")
          .eq("user_id", currentUser.user_id)
          .single();

        if (userError) throw userError;
        if (!userData) return;

        // 2. Get all group members with the same group_name
        const { data: groupMembers, error: groupError } = await supabase
          .from("user_credentials")
          .select("*")
          .eq("group_name", userData.group_name);

        if (groupError) throw groupError;

        // 3. For each member, compute tasks
        const enrichedMembers = await Promise.all(
          (groupMembers || []).map(async (m) => {
            let assignedCount = 0;
            let completedCount = 0;

            if (m.user_roles === 1) {
              // Project Manager → use id as manager_id
              const { data: titleTasks } = await supabase
                .from("manager_title_task")
                .select("*")
                .eq("manager_id", m.id);

              const { data: oralTasks } = await supabase
                .from("manager_oral_task")
                .select("*")
                .eq("manager_id", m.id);

              const { data: finalTasks } = await supabase
                .from("manager_final_task")
                .select("*")
                .eq("manager_id", m.id);

              const { data: redefTasks } = await supabase
                .from("manager_final_redef")
                .select("*")
                .eq("manager_id", m.id);

              const allTasks = [
                ...(titleTasks || []),
                ...(oralTasks || []),
                ...(finalTasks || []),
                ...(redefTasks || []), // ✅ include re-defense tasks
              ];
              assignedCount = allTasks.length;
              completedCount = allTasks.filter(
                (t) => t.status === "Completed"
              ).length;
            } else if (m.user_roles === 2) {
              // Member → use id as member_id
              const { data: titleTasks } = await supabase
                .from("manager_title_task")
                .select("*")
                .eq("member_id", m.id);

              const { data: oralTasks } = await supabase
                .from("manager_oral_task")
                .select("*")
                .eq("member_id", m.id);

              const { data: finalTasks } = await supabase
                .from("manager_final_task")
                .select("*")
                .eq("member_id", m.id);

              const { data: redefTasks } = await supabase
                .from("manager_final_redef")
                .select("*")
                .eq("member_id", m.id);

              const allTasks = [
                ...(titleTasks || []),
                ...(oralTasks || []),
                ...(finalTasks || []),
                ...(redefTasks || []), // ✅ include re-defense tasks
              ];
              assignedCount = allTasks.length;
              completedCount = allTasks.filter(
                (t) => t.status === "Completed"
              ).length;
            }

            return {
              ...m,
              assignedCount,
              completedCount,
            };
          })
        );

        setMembers(enrichedMembers);
      } catch (err) {
        console.error("Error fetching member allocation:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const getRoleName = (role) => {
    if (role === 1) return "Project Manager";
    if (role === 2) return "Member";
    return "Unknown";
  };

  if (loading) {
    return <div className="page-wrapper">Loading...</div>;
  }

  return (
    <div className="page-wrapper">
      <h2 className="section-title sc-title">
        <img src={taskIcon} alt="Tasks Icon" className="icon-image sc-icon" />
        Tasks Allocation
      </h2>
      <hr className="divider sc-divider" />

      <div className="sc-table-wrap">
        <table className="sc-table">
          <thead className="sc-thead">
            <tr>
              <th className="sc-th center-text">NO</th>
              <th className="sc-th center-text">Name</th>
              <th className="sc-th center-text">Role</th>
              <th className="sc-th center-text">Assigned Tasks</th>
              <th className="sc-th center-text">Completed Tasks</th>
            </tr>
          </thead>
          <tbody className="sc-tbody">
            {members.length === 0 ? (
              <tr>
                <td colSpan="5" className="center-text sc-empty">
                  No members found in your group.
                </td>
              </tr>
            ) : (
              members.map((m, idx) => (
                <tr key={m.id || idx} className="sc-tr">
                  <td className="sc-td center-text">{idx + 1}</td>
                  <td className="sc-td center-text">
                    {m.first_name} {m.last_name}
                  </td>
                  <td className="sc-td center-text">
                    {getRoleName(m.user_roles)}
                  </td>
                  <td className="sc-td center-text">{m.assignedCount}</td>
                  <td className="sc-td center-text">{m.completedCount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MemberAllocation;
