import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import eventsIcon from "../../../assets/events-icon.png"; // Updated icon
import manuscriptIcon from "../../../assets/manuscript-icon.png"; // Updated card icon
import recordIcon from "../../../assets/records-icon.png";

export default function AdviserEvents({ setActivePage }) {
  // ✅ Cards data (mas madaling dagdagan/alisin)
  const items = [
    {
      title: "Manucript Results",
      icon: manuscriptIcon,
      onClick: () => setActivePage("Manucript Results"),
    },
    {
      title: "Capstone Defenses",
      icon: recordIcon,
      onClick: () => setActivePage("Capstone Defenses"),
    },
  ];

  return (
    <div className="tasks-record-wrapper">
      <h2 className="section-title">
        <img src={eventsIcon} alt="Tasks Icon" className="section-icon" />
        Tasks
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
