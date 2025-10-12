// src/components/pm-tasks-record/pm-tasks-record.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import taskIcon from "../../../assets/tasks-record-icon.png";
import recordIcon from "../../../assets/records-icon.png";
import "../../Style/ProjectManager/ManagerTaskRecord.css";

export default function ManagerTaskRecord({ setActivePage }) {
  const items = [
    {
      title: "Title Defense",
      icon: recordIcon,
      onClick: () => setActivePage("Title Defense Record"),
    },
    {
      title: "Oral Defense",
      icon: recordIcon,
      onClick: () => setActivePage("Oral Defense Record"),
    },
    {
      title: "Final Defense",
      icon: recordIcon,
      onClick: () => setActivePage("Final Defense Record"),
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Main content grows to push footer to bottom */}
      <main className="flex-grow container mx-auto px-6 py-6">
        <div className="tasks-record-wrapper">
          <h2 className="section-title">
            <img src={taskIcon} alt="Tasks Record Icon" className="section-icon" />
            Tasks Record
          </h2>
          <hr className="divider" />

          <div className="tasks-record-container">
            {items.map((item, index) => (
              <div key={index} className="task-card" onClick={item.onClick}>
                <div className="task-card-icon">
                  <img src={item.icon} alt={`${item.title} Icon`} className="card-icon" />
                </div>
                <div className="task-card-header">
                  <h3 className="task-title">
                    {item.title.split(" ").map((word, i) => (
                      <React.Fragment key={i}>
                        {word}
                        <br />
                      </React.Fragment>
                    ))}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main> 
    </div>
  );
}
