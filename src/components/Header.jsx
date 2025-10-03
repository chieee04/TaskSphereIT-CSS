import React, { useEffect, useState } from "react";
import { FaBell, FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/img/Logo.png";
import { UserAuth } from "../Contex/AuthContext";

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

// ✅ Accept isSoloMode and setIsSoloMode as props
const Header = ({ isSoloMode, setIsSoloMode }) => {
  const auth = UserAuth();
  const user = auth?.user || null;
  const logout = auth?.logout || (() => {});

  const navigate = useNavigate();
  const [activeUser, setActiveUser] = useState(null);
  const [showProfileCard, setShowProfileCard] = useState(false);

  useEffect(() => {
    if (user) {
      setActiveUser(user);
    } else {
      const customUser = localStorage.getItem("customUser");
      const adminUser = localStorage.getItem("adminUser");
      if (customUser) setActiveUser(JSON.parse(customUser));
      else if (adminUser) setActiveUser(JSON.parse(adminUser));
      else setActiveUser(null);
    }
  }, [user]);

  const handleSignOut = async () => {
    await logout();
    localStorage.removeItem("customUser");
    localStorage.removeItem("adminUser");
    setActiveUser(null);
    navigate("/");
  };

  const handleProfileClick = () => {
    const customUser = JSON.parse(localStorage.getItem("customUser"));

    if (customUser?.user_roles === 1) {
      navigate("/ManagerDashboard", { state: { activePage: "Profile" } });
    } else if (customUser?.user_roles === 2) {
      navigate("/MemberDashboard", { state: { activePage: "Profile" } });
    } else if (customUser?.user_roles === 3) {
      navigate("/AdviserDashboard", { state: { activePage: "Profile" } });
    } else if (user) {
      navigate("/InstructorDashboard", { state: { activePage: "Profile" } });
    } else {
      navigate("/Profile");
    }
  };

  const getUserRole = () => {
    const roleId = activeUser?.user_roles;
    if (roleId === 1) return "Manager";
    if (roleId === 2) return "Member";
    if (roleId === 3) return "Adviser";
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
        position: "fixed", // Changed from relative to fixed
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
          <div
            style={{
              ...switchContainerStyle,
              backgroundColor: isSoloMode ? "#000000" : "#FFFFFF",
              justifyContent: isSoloMode ? "flex-end" : "flex-start",
            }}
            onClick={() => setIsSoloMode(!isSoloMode)} // ✅ Use the setter from props
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

          <button
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "black",
            }}
          >
            <FaBell size={20} />
          </button>

          <div
            style={{ position: "relative" }}
            onMouseEnter={() => setShowProfileCard(true)}
            onMouseLeave={() => setShowProfileCard(false)}
          >
            <button
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                color: "black",
              }}
              onClick={handleProfileClick}
            >
              <FaUserCircle size={20} />
            </button>

            {showProfileCard && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 10px)",
                  right: "-5px",
                  width: "250px",
                  backgroundColor: "white",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                  padding: "15px",
                  zIndex: 1000,
                }}
              >
                <div
                  style={{
                    marginBottom: "10px",
                    paddingBottom: "5px",
                    borderBottom: "1px solid black",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontWeight: "bold",
                      fontSize: "18px",
                      color: "black",
                    }}
                  >
                    Profile
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center" }}>
                  <FaUserCircle
                    size={28}
                    style={{ marginRight: "10px", color: "#6c757d" }}
                  />
                  <div style={{ lineHeight: "1.2" }}>
                    <p
                      style={{
                        margin: 0,
                        fontWeight: "bold",
                        fontSize: "16px",
                      }}
                    >
                      {userName}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "12px",
                        color: "#6c757d",
                      }}
                    >
                      {userRole}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  style={{
                    marginTop: "10px",
                    width: "100%",
                    padding: "8px",
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
export default Header;