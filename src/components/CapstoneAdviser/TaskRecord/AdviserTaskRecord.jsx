import React from "react";
import tasksIcon from "../../../assets/tasks-icon.png";
import recordIcon from "../../../assets/records-icon.png";

export default function AdviserTaskRecord({ setActivePage }) {
  // ✅ Cards data (mas madaling dagdagan/alisin)
  const items = [
    {
      title: "Oral Defense",
      icon: recordIcon,
      onClick: () => setActivePage("Oral Defense Record"),
    },
    {
      title: "Final Defense",
      icon: recordIcon,
      onClick: () => setActivePage("Title Defense Record"),
    },
  ];

  return (
    <div className="tasks-record-wrapper">
      <h2 className="section-title">
        <img src={tasksIcon} alt="Tasks Icon" className="section-icon" />
        Tasks Record
      </h2>
      <hr className="divider" />

      <div className="tasks-record-container">
        {items.map((item, index) => (
          <div
            key={index}
            className="task-card"
            onClick={item.onClick}  
          >
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
  );
}
