import React from "react";
import { FaCalendarAlt } from "react-icons/fa";
import { MdOutlineRecordVoiceOver } from "react-icons/md";
import { BsCalendar2Check } from "react-icons/bs";
import { GiArchiveRegister } from "react-icons/gi";

const ManagerTask = ({ setActivePage }) => {
  // 🔹 Cards config
  const items = [
    {
      title: "Title Defense",
      icon: <FaCalendarAlt size={36} color="#3B0304" />,
      page: "Title Defense",
    },
    {
      title: "Oral Defense",
      icon: <MdOutlineRecordVoiceOver size={36} color="#3B0304" />,
      page: "Oral Defense",
    },
    {
      title: "Final Defense",
      icon: <BsCalendar2Check size={36} color="#3B0304" />,
      page: "Final Defense",
    },
    {
      title: "Final Re-Defense",
      icon: <BsCalendar2Check size={36} color="#3B0304" />,
      page: "Final Re-Defense",
    },
    {
      title: "Tasks Allocation",
      icon: <GiArchiveRegister size={36} color="#3B0304" />,
      page: "Tasks Allocation",
    },
  ];

  return (
    <div
      className="flex flex-col min-h-screen bg-[#FFFDF8]"
      style={{ color: "#3B0304" }}
    >
      {/* Main Content */}
      <div className="flex-grow container-fluid px-4 py-3">
        <div className="d-flex align-items-center mb-2">
          <i className="bi bi-list-task me-2"></i>
          <strong>Manager Tasks</strong>
        </div>

        <hr
          style={{
            borderTop: "2px solid #3B0304",
            marginTop: 0,
            marginBottom: "1.5rem",
          }}
        />

        <div className="d-flex flex-wrap gap-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="d-flex flex-column align-items-center justify-content-center"
              style={{
                width: "130px",
                height: "150px",
                borderRadius: "12px",
                background: "white",
                borderLeft: "12px solid #3B0304",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
              }}
              onClick={() => setActivePage(item.page)}
            >
              <div className="mb-2">{item.icon}</div>
              <div
                className="text-center px-2"
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#3B0304",
                }}
              >
                {item.title}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManagerTask;
