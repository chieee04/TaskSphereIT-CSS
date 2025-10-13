// src/components/Notification.jsx  (Adviser)
import React, { useEffect, useMemo, useState } from "react";
import { FaCheckCircle } from "react-icons/fa";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { supabase } from "../../supabaseClient";

const MySwal = withReactContent(Swal);
const ACCENT = "#3B0304";

const AdviserNotification = () => {
  const [rows, setRows] = useState([]);
  const [groupByNoteId, setGroupByNoteId] = useState({});
  const [loading, setLoading] = useState(true);

  // ---------- format helpers (match Header.jsx alert) ----------
  const fmt = useMemo(
    () => ({
      date: (yyyyMmDd) => {
        if (!yyyyMmDd) return "";
        const d = new Date(yyyyMmDd);
        if (Number.isNaN(d.getTime())) {
          const [y, m, dd] = String(yyyyMmDd || "").split("-");
          return new Date(`${y}-${m}-${dd}T00:00:00`).toLocaleDateString(
            "en-US",
            { month: "short", day: "numeric", year: "numeric" }
          );
        }
        return d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      },
      time: (hhmm) => {
        if (!hhmm) return "";
        const [h, m] = String(hhmm || "").split(":").map((x) => parseInt(x, 10));
        if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
        const ampm = h >= 12 ? "PM" : "AM";
        const hh = ((h % 12) || 12).toString();
        const mm = String(m).padStart(2, "0");
        return `${hh}:${mm} ${ampm}`;
      },
    }),
    []
  );

  // ---------- resolve UUID exactly like Header.jsx ----------
  const resolveUserUuid = async (storedUser) => {
    if (storedUser?.uuid) return storedUser.uuid;
    if (storedUser?.id && String(storedUser.id).includes("-")) return storedUser.id;
    if (storedUser?.user_id) {
      const { data, error } = await supabase
        .from("user_credentials")
        .select("uuid")
        .eq("user_id", storedUser.user_id)
        .maybeSingle();
      if (error) {
        console.error("Lookup uuid by user_id failed:", error);
        return null;
      }
      return data?.uuid || null;
    }
    return null;
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // 1) Who am I?
        const storedUser =
  JSON.parse(localStorage.getItem("customUser")) ||
  JSON.parse(localStorage.getItem("adminUser")) ||
  null;
const userId = storedUser?.user_id || storedUser?.id || null;

if (!userId) {
  console.warn("No user_id found in localStorage");
  setRows([]);
  setGroupByNoteId({});
  return;
}

        // 2) My notifications
        const { data: notes, error: nErr } = await supabase
          .from("user_notification")
          .select("*")
          .eq("user_id", userId)
          .order("date", { ascending: false })
          .order("time", { ascending: false });

        if (nErr) {
          console.error("Fetch notifications failed:", nErr);
          setRows([]);
          setGroupByNoteId({});
          return;
        }

        const list = (notes || []).map((r) => ({
          id: r.id,
          user_id: r.user_id,
          title: r.title || "Notification",
          date: r.date,          // "YYYY-MM-DD"
          time: r.time,          // "HH:MM"
          type: r.type,          // 1=Title Defense, 2=Task, etc.
          description: r.description || "",
        }));
        setRows(list);

        // 3) All schedules (used to derive the team for a given date+time)
        const { data: sched, error: sErr } = await supabase
          .from("user_titledef")
          .select("id, date, time, manager_id");
        if (sErr) {
          console.error("Fetch schedules failed:", sErr);
        }

        // index schedules by date|time
        const schedByKey = {};
        (sched || []).forEach((s) => {
          if (!s.date || !s.time) return;
          const key = `${s.date}|${s.time}`;
          // If duplicates ever exist, prefer the latest added one, but usually your app prevents overlap.
          schedByKey[key] = s;
        });

        // collect manager_ids we need to resolve to group_name
        const managerIds = [
          ...new Set(
            (sched || [])
              .map((s) => s?.manager_id)
              .filter(Boolean)
          ),
        ];

        // 4) manager_id -> group_name
        let mgrToGroup = {};
        if (managerIds.length) {
          const { data: managers, error: uErr } = await supabase
            .from("user_credentials")
            .select("id, group_name")
            .in("id", managerIds);

          if (uErr) {
            console.error("Fetch managers failed:", uErr);
          } else {
            managers?.forEach((m) => {
              mgrToGroup[m.id] = m.group_name || "—";
            });
          }
        }

        // 5) For each note, derive its group by matching schedule (date+time ⇒ manager ⇒ group_name)
        const groupMap = {};
        list.forEach((n) => {
          const key = `${n.date}|${n.time}`;
          const schedule = schedByKey[key];
          if (schedule?.manager_id && mgrToGroup[schedule.manager_id]) {
            groupMap[n.id] = mgrToGroup[schedule.manager_id];
          } else {
            groupMap[n.id] = "—";
          }
        });
        setGroupByNoteId(groupMap);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ---------- actions ----------
const handleView = async (note) => {
  const result = await MySwal.fire({
    title: `<div style="color:#3B0304;font-size:1.3rem;font-weight:600;">${note.title}</div>`,
    html: `
      <p style="color:#333;font-size:0.95rem;">${note.description}</p>
      <p style="font-size:0.8rem;color:#888;margin-top:10px;">${new Date(
        note.date
      ).toLocaleString()}</p>
    `,
    showCancelButton: true,
    confirmButtonText: "Confirm",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#3B0304",
    cancelButtonColor: "#6c757d",
    width: "400px",
  });

  if (result.isConfirmed) {
    const storedUser = JSON.parse(localStorage.getItem("customUser"));
    if (!storedUser) return;

    try {
      // ✅ Step 1: Fetch current IT Instructor(s)
      const { data: oldInstructors, error: fetchError } = await supabase
        .from("user_credentials")
        .select("id")
        .eq("user_roles", 4);

      if (fetchError) throw fetchError;

      // ✅ Step 2: Delete each old IT Instructor
      for (const old of oldInstructors) {
        const { error: deleteError } = await supabase
          .from("user_credentials")
          .delete()
          .eq("id", old.id);
        if (deleteError) throw deleteError;
      }

      // ✅ Step 3: Promote current user to IT Instructor
      const { error: updateError } = await supabase
        .from("user_credentials")
        .update({ user_roles: 4 })
        .eq("id", storedUser.id);

      if (updateError) throw updateError;

      // ✅ Step 4: Success Message
      await MySwal.fire({
        icon: "success",
        title: "Role Transferred!",
        text: "You are now assigned as the new IT Instructor. You will be signed out automatically.",
        confirmButtonColor: "#3B0304",
      });

      // ✅ Step 5: Auto Logout
      localStorage.removeItem("customUser");
      localStorage.removeItem("user_id");
      window.location.href = "/";
    } catch (error) {
      console.error("Error updating roles:", error);
      await MySwal.fire({
        icon: "error",
        title: "Something went wrong",
        text: "Failed to transfer the role. Please try again.",
        confirmButtonColor: "#3B0304",
      });
    }
  } else if (result.dismiss === Swal.DismissReason.cancel) {
    await MySwal.fire({
      icon: "info",
      title: "Cancelled",
      text: "You cancelled viewing this notification.",
      confirmButtonColor: "#3B0304",
    });
  }
};
  const handleDelete = async (id) => {
    const confirm = await MySwal.fire({
      title: "Delete Notification?",
      text: "This will permanently remove the notification.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
    });
    if (!confirm.isConfirmed) return;

    const { error } = await supabase.from("user_notification").delete().eq("id", id);
    if (error) {
      console.error("Error deleting notification:", error);
      return;
    }
    setRows((prev) => prev.filter((n) => n.id !== id));
    await MySwal.fire({
      icon: "success",
      title: "Deleted!",
      text: "Notification removed successfully.",
      confirmButtonColor: ACCENT,
    });
  };

  // ---------- UI ----------
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 overflow-hidden">
      <div className="flex-grow container mx-auto px-6 py-6">
        <h2 className="section-title">Notifications</h2>
        <hr className="divider" />

        {loading ? (
          <p>Loading…</p>
        ) : rows.length === 0 ? (
          <p>No notifications available.</p>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Group Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {rows.map((n) => (
                  <tr key={n.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                      {groupByNoteId[n.id] || "—"}
                    </td>
                    <td className="px-4 py-3">{n.title}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{fmt.date(n.date)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{fmt.time(n.time)}</td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <button
                        className="btn btn-view mr-2 inline-flex items-center gap-2"
                        onClick={() => handleView(n)}
                        title="View"
                      >
                        <FaCheckCircle /> View
                      </button>
                      <button
                        className="btn btn-delete inline-flex items-center"
                        onClick={() => handleDelete(n.id)}
                        title="Delete"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .section-title { font-size: 20px; font-weight: bold; color: ${ACCENT}; margin-bottom: 5px; }
        .divider { border: none; border-top: 2px solid ${ACCENT}; margin-bottom: 20px; }
        .btn { padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 500; cursor: pointer; border: none; transition: all .2s; }
        .btn-view { background-color: #28a745; color: white; }
        .btn-view:hover { background-color: #23963e; }
        .btn-delete { background-color: white; color: #dc3545; border: 1px solid #dc3545; }
        .btn-delete:hover { background-color: #fce9e9; }
      `}</style>
    </div>
  );
};

export default AdviserNotification; 
