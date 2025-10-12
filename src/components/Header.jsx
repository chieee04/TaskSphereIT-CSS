// src/components/Header.jsx
import React, { useEffect, useRef, useState } from "react";
import { FaBell, FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/img/Logo.png";
import { supabase } from "../supabaseClient";

const ACCENT = "#3B0304";

// --- TEMP SWITCH STYLES ---
const switchContainerStyle = {
  width: "70px",
  height: "24px",
  borderRadius: "12px",
  padding: "2px",
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
  position: "relative",
  transition: "background-color 0.3s",
  border: "1px solid black",
};
const sliderStyle = {
  width: "20px",
  height: "20px",
  backgroundColor: "white",
  borderRadius: "50%",
  boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
  transition: "transform 0.3s",
};
const textStyle = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  fontSize: "10px",
  fontWeight: "bold",
  width: "100%",
  textAlign: "center",
  zIndex: 1,
};

const Header = ({ isSoloMode, setIsSoloMode }) => {
  const navigate = useNavigate();
  const [activeUser, setActiveUser] = useState(null);

  // Notifications
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotif, setLoadingNotif] = useState(false);
  const unreadCount = notifications.filter((n) => !n._read).length;

  // formatters
  const fmtDate = (yyyyMmDd) => {
    if (!yyyyMmDd) return "";
    const d = new Date(yyyyMmDd);
    if (Number.isNaN(d.getTime())) {
      const [y, m, day] = (yyyyMmDd || "").split("-");
      return new Date(`${y}-${m}-${day}T00:00:00`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };
  const fmtTime = (hhmm) => {
    if (!hhmm) return "";
    const [h, m] = (hhmm || "").split(":").map((x) => parseInt(x, 10));
    if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
    const ampm = h >= 12 ? "PM" : "AM";
    const hh = ((h % 12) || 12).toString();
    const mm = String(m).padStart(2, "0");
    return `${hh}:${mm} ${ampm}`;
  };

  // resolve uuid
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

  // fetch notifications
  const fetchNotifications = async (userUuid) => {
    try {
      if (!userUuid) {
        setNotifications([]);
        return;
      }
      setLoadingNotif(true);

      const { data, error, status } = await supabase
        .from("user_notification")
        .select("*")
        .eq("user_id", userUuid)
        .order("date", { ascending: false })
        .order("time", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Failed to fetch notifications:", error, "status:", status);
        setNotifications([]);
        return;
      }

      const rows = (data || []).map((r) => ({
        id: r.id,
        title: r.title || "Notification",
        date: r.date,
        time: r.time,
        type: r.type,
        _read: false,
      }));

      setNotifications(rows);
    } catch (e) {
      console.error("Notif fetch exception:", e);
      setNotifications([]);
    } finally {
      setLoadingNotif(false);
    }
  };

  // click-outside to close
  useEffect(() => {
    const onClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleToggleNotif = () => {
    setShowNotif((prev) => !prev);
    if (!showNotif) {
      // mark as read locally
      setNotifications((prev) => prev.map((n) => ({ ...n, _read: true })));
    }
  };

  // 👉 ROUTE advisers to their Notification page instead of alert
  const handleNotifClick = (n) => {
    const role = activeUser?.user_roles;
    if (role === 3) {
      // Adviser
      navigate("/Adviser/Notification", {
        state: {
          // optional: allow Notification page to highlight this row
          highlightId: n.id,
          // optional: pass date/time/title if you want to pre-filter
          note: { id: n.id, title: n.title, date: n.date, time: n.time, type: n.type },
        },
      });
      return;
    }

    // Fallback behavior (non-adviser roles): keep your old alert
    window.alert(`Title: ${n.title}\nDate: ${fmtDate(n.date)}\nTime: ${fmtTime(n.time)}`);
  };

  // load active user & fetch notifs
  useEffect(() => {
    const storedUser =
      JSON.parse(localStorage.getItem("customUser")) ||
      JSON.parse(localStorage.getItem("adminUser")) ||
      null;

    setActiveUser(storedUser);

    (async () => {
      const userUuid = await resolveUserUuid(storedUser);
      await fetchNotifications(userUuid);
    })();
  }, []);

  const handleProfileClick = () => {
    const customUser = JSON.parse(localStorage.getItem("customUser"));
    const role = customUser?.user_roles;
    switch (role) {
      case 1:
        navigate("/Manager/Profile", { state: { activePage: "Profile" } });
        break;
      case 2:
        navigate("/Member/Profile", { state: { activePage: "Profile" } });
        break;
      case 3:
        navigate("/Adviser/Profile", { state: { activePage: "Profile" } });
        break;
      case 4:
        navigate("/Instructor/Profile", { state: { activePage: "Profile" } });
        break;
      default:
        navigate("/Profile");
        break;
    }
  };

  const handleToggleMode = () => {
    const customUser = JSON.parse(localStorage.getItem("customUser"));
    const role = customUser?.user_roles;
    if (role === 4) return; // Instructor cannot toggle

    const newMode = !isSoloMode;
    setIsSoloMode(newMode);

    let basePath = "/";
    if (role === 1) basePath = "/Manager";
    else if (role === 2) basePath = "/Member";
    else if (role === 3) basePath = "/Adviser";
    else if (role === 4) basePath = "/Instructor";

    if (newMode) {
      navigate(`${basePath}/SoloModeDashboard`, {
        state: { activePage: "SoloModeDashboard" },
      });
    } else {
      navigate(`${basePath}/Dashboard`, { state: { activePage: "Dashboard" } });
    }
  };

  const roleId = activeUser?.user_roles;

  // Hide bell for Admin or Instructor
  const isAdmin =
    !!localStorage.getItem("adminUser") ||
    String(
      activeUser?.role || activeUser?.user_role || activeUser?.userType || ""
    )
      .toLowerCase()
      .includes("admin") ||
    roleId === 0;
  const isInstructor = roleId === 4;
  const hideBell = isAdmin || isInstructor;

  return (
    <header
      className="px-4 py-2"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "60px",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: "white",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
    >
      <a href="/" style={{ display: "inline-block" }}>
        <img src={Logo} width="150" height="120" alt="Logo" />
      </a>

      {activeUser && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginRight: "10px",
            gap: "14px",
          }}
        >
          {/* SOLO/TEAM SWITCH (hidden for Instructor) */}
          {roleId !== 4 && (
            <div
              style={{
                ...switchContainerStyle,
                backgroundColor: isSoloMode ? "#000000" : "#FFFFFF",
                justifyContent: isSoloMode ? "flex-end" : "flex-start",
              }}
              onClick={handleToggleMode}
              title={isSoloMode ? "Switch to Team mode" : "Switch to Solo mode"}
            >
              <div
                style={{
                  ...textStyle,
                  color: isSoloMode ? "white" : "black",
                }}
              >
                {isSoloMode ? "SOLO" : "TEAM"}
              </div>
              <div style={{ ...sliderStyle }} />
            </div>
          )}

          {/* Bell (hidden for Admin/Instructor) */}
          {!hideBell && (
            <div style={{ position: "relative" }} ref={notifRef}>
              <button
                onClick={handleToggleNotif}
                aria-label="Notifications"
                title="Notifications"
                style={{
                  position: "relative",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "black",
                  padding: 4,
                }}
              >
                <FaBell size={20} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: -2,
                      right: -2,
                      backgroundColor: "#e11d48",
                      color: "white",
                      minWidth: 16,
                      height: 16,
                      borderRadius: 8,
                      fontSize: 10,
                      lineHeight: "16px",
                      textAlign: "center",
                      padding: "0 4px",
                      fontWeight: 700,
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotif && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 10px)",
                    right: 0,
                    width: 360,
                    maxWidth: "90vw",
                    background: "#fff",
                    borderRadius: 10,
                    boxShadow: "0 12px 24px rgba(0,0,0,.12)",
                    border: "1px solid #ececec",
                    overflow: "hidden",
                    zIndex: 2000,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      padding: "10px 12px 0",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <button
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "#0f172a",
                        fontWeight: 600,
                        cursor: "default",
                        padding: "8px 12px",
                        borderRadius: 999,
                        boxShadow: `inset 0 0 0 1px ${ACCENT}`,
                        backgroundColor: "rgba(59,3,4,0.06)",
                      }}
                    >
                      Notifications
                    </button>
                  </div>

                  <div style={{ maxHeight: 380, overflowY: "auto" }}>
                    {loadingNotif && (
                      <div style={{ padding: 16, color: "#6b7280", fontSize: 14 }}>
                        Loading notifications…
                      </div>
                    )}

                    {!loadingNotif && notifications.length === 0 && (
                      <div style={{ padding: 16, color: "#6b7280", fontSize: 14 }}>
                        No notifications.
                      </div>
                    )}

                    {!loadingNotif &&
                      notifications.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => handleNotifClick(n)}
                          style={{
                            display: "flex",
                            width: "100%",
                            gap: 10,
                            padding: "12px 14px",
                            borderBottom: "1px solid #f2f2f2",
                            background: n._read ? "#fff" : "rgba(59,3,4,0.025)",
                            textAlign: "left",
                            border: "none",
                            cursor: "pointer",
                          }}
                          title="View details"
                        >
                          <div
                            aria-hidden
                            style={{
                              width: 28,
                              height: 28,
                              lineHeight: "28px",
                              textAlign: "center",
                              borderRadius: 6,
                              background: "#f3f4f6",
                              fontSize: 14,
                            }}
                          >
                            {n.type === 1 || n.type === "1" ? "📅" : "🔔"}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 14,
                                color: "#0f172a",
                                fontWeight: 600,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {n.title || "Notification"}
                            </div>
                            <div
                              style={{
                                marginTop: 6,
                                fontSize: 12,
                                color: "#64748b",
                                fontStyle: "italic",
                              }}
                            >
                              {fmtDate(n.date)} • {fmtTime(n.time)}
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Profile */}
          <button
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              color: "black",
              padding: 4,
            }}
            onClick={handleProfileClick}
            aria-label="Profile"
            title="Profile"
          >
            <FaUserCircle size={22} />
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
