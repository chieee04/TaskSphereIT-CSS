// src/components/Notification.jsx
import React, { useEffect, useState } from "react";
import { FaCheckCircle } from "react-icons/fa";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { supabase } from "../../supabaseClient";

const MySwal = withReactContent(Swal);

const Notification = () => {
  const [notifications, setNotifications] = useState([]);

  // ✅ Fetch notifications for the currently signed-in user
  useEffect(() => {
    const fetchNotifications = async () => {
      const storedUser = localStorage.getItem("customUser");
      if (!storedUser) return;

      const user = JSON.parse(storedUser);
      if (!user.id) return;

      const { data, error } = await supabase
        .from("notification")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) {
        console.error("Error fetching notifications:", error);
        return;
      }

      setNotifications(data || []);
    };

    fetchNotifications();
  }, []);

  // ✅ View Notification Details (with Confirm + Cancel)
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
      await MySwal.fire({
        icon: "success",
        title: "Confirmed!",
        text: "You have confirmed this notification.",
        confirmButtonColor: "#3B0304",
      });
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      await MySwal.fire({
        icon: "info",
        title: "Cancelled",
        text: "You cancelled viewing this notification.",
        confirmButtonColor: "#3B0304",
      });
    }
  };

  // ✅ Delete Notification
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

    if (confirm.isConfirmed) {
      const { error } = await supabase.from("notification").delete().eq("id", id);
      if (error) {
        console.error("Error deleting notification:", error);
        return;
      }
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      MySwal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Notification removed successfully.",
        confirmButtonColor: "#3B0304",
      });
    }
  };

  return (
    <div className="notification-page">
      <h2 className="section-title">Notifications</h2>
      <hr className="divider" />

      {notifications.length === 0 ? (
        <p>No notifications available.</p>
      ) : (
        <div className="notification-list">
          {notifications.map((note) => (
            <div key={note.id} className="notification-card success">
              <div className="icon">
                <FaCheckCircle className="success-icon" />
              </div>
              <div className="notification-content">
                <h4 className="notification-title">{note.title}</h4>
                <p className="notification-message">{note.description}</p>
                <p className="notification-date">
                  {new Date(note.date).toLocaleDateString("en-GB")}
                </p>
              </div>
              <div className="notification-actions">
                <button className="btn btn-view" onClick={() => handleView(note)}>
                  View
                </button>
                <button className="btn btn-delete" onClick={() => handleDelete(note.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        * { box-sizing: border-box; }
        .notification-page {
          width: 100%;
          padding: 20px;
        }
        .section-title {
          font-size: 20px;
          font-weight: bold;
          color: #3B0304;
          margin-bottom: 5px;
        }
        .divider {
          border: none;
          border-top: 2px solid #3B0304;
          margin-bottom: 20px;
        }

        .notification-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .notification-card {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          background-color: #f2fff2;
          border-left: 4px solid #28a745;
          border-radius: 10px;
          padding: 15px 20px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.08);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .notification-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 3px 10px rgba(0,0,0,0.1);
        }

        .icon {
          margin-right: 16px;
          margin-top: 6px;
        }
        .success-icon { color: #28a745; font-size: 1.2rem; }

        .notification-content {
          flex: 1;
          color: #333;
        }
        .notification-title {
          font-weight: 600;
          margin-bottom: 4px;
          color: #212529;
        }
        .notification-message {
          margin: 0;
          font-size: 0.9rem;
          color: #555;
        }
        .notification-date {
          margin-top: 6px;
          font-size: 0.8rem;
          color: #999;
        }

        .notification-actions {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
        }
        .btn {
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }
        .btn-view {
          background-color: #28a745;
          color: white;
        }
        .btn-view:hover { background-color: #23963e; }
        .btn-delete {
          background-color: white;
          color: #dc3545;
          border: 1px solid #dc3545;
        }
        .btn-delete:hover { background-color: #fce9e9; }
      `}</style>
    </div>
  );
};

export default Notification;
