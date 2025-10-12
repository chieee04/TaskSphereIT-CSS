import React, { useEffect, useState } from "react";
import { FaBell, FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/img/Logo.png";

// --- TEMPORARY INLINE CSS STYLES FOR THE SWITCH ---
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
// ----------------------------------------------------

const Header = ({ isSoloMode, setIsSoloMode }) => {
  const navigate = useNavigate();
  const [activeUser, setActiveUser] = useState(null);

  useEffect(() => {
    const storedUser =
      JSON.parse(localStorage.getItem("customUser")) ||
      JSON.parse(localStorage.getItem("adminUser")) ||
      null;
    setActiveUser(storedUser);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("customUser");
    localStorage.removeItem("adminUser");
    setActiveUser(null);
    navigate("/");
  };

  // Click -> go to Profile (no hover dropdown)
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

  // ✅ Toggle Solo/Team Mode
  const handleToggleMode = () => {
    const newMode = !isSoloMode;
    setIsSoloMode(newMode);

    const customUser = JSON.parse(localStorage.getItem("customUser"));
    const role = customUser?.user_roles;
    let basePath = "/";

    if (role === 1) basePath = "/Manager";
    else if (role === 2) basePath = "/Member";
    else if (role === 3) basePath = "/Adviser";
    else if (role === 4) basePath = "/Instructor";

    if (newMode) {
      navigate(`${basePath}/SoloModeDashboard`, { state: { activePage: "SoloModeDashboard" } });
    } else {
      navigate(`${basePath}/Dashboard`, { state: { activePage: "Dashboard" } });
    }
  };

  const getUserRole = () => {
    const roleId = activeUser?.user_roles;
    if (roleId === 1) return "Manager";
    if (roleId === 2) return "Member";
    if (roleId === 3) return "Adviser";
    if (roleId === 4) return "Instructor";
    return "User";
  };

  const userName = activeUser
    ? `${activeUser.firstName || ""} ${activeUser.lastName || ""}`.trim()
    : "Guest";
  const userRole = getUserRole();

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
            gap: "10px",
          }}
        >
          {/* SOLO/TEAM SWITCH */}
          <div
            style={{
              ...switchContainerStyle,
              backgroundColor: isSoloMode ? "#000000" : "#FFFFFF",
              justifyContent: isSoloMode ? "flex-end" : "flex-start",
            }}
            onClick={handleToggleMode}
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

          {/* Notifications (kept as button, no change) */}
          <button
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "black",
            }}
            aria-label="Notifications"
            title="Notifications"
          >
            <FaBell size={20} />
          </button>

          {/* PROFILE — no hover, no dropdown; click navigates */}
          <button
            onClick={handleProfileClick}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              color: "black",
            }}
            aria-label="Open Profile"
            title={`${userName} — ${userRole}`}
          >
            <FaUserCircle size={20} />
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
