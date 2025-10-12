// src/components/CapstoneAdviser/AdviserTask.jsx
import React from "react";
import { Link } from "react-router-dom";
import tasksIcon from "../../../assets/tasks-icon.png";
import recordIcon from "../../../assets/records-icon.png";

const ACCENT = "#5a0d0e";

export default function AdviserTask() {
  const items = [
    { title: "Oral Defense",  icon: recordIcon, to: "/Adviser/OralDefense"  },
    { title: "Final Defense", icon: recordIcon, to: "/Adviser/FinalDefense" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="px-6 sm:px-8 py-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: ACCENT }}>
          <img src={tasksIcon} alt="Tasks Icon" className="w-5 h-5" />
          Tasks
        </h2>
        <hr className="mb-6" style={{ borderColor: ACCENT }} />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map(({ title, icon, to }) => (
            <Link
              key={title}
              to={to}
              className="flex items-center justify-center bg-white shadow-md rounded-md overflow-hidden hover:shadow-lg transition border border-gray-200 focus:outline-none focus:ring-2"
              style={{ ringColor: `${ACCENT}33` }}
              onClick={() => window.scrollTo({ top: 0, behavior: "instant" })}
            >
              <div style={{ background: ACCENT }} className="w-4 h-full" />
              <div className="flex flex-col items-center justify-center p-4 w-full h-32">
                <img src={icon} alt={`${title} Icon`} className="w-8 h-8 mb-2" />
                <h3 className="text-sm font-semibold text-center" style={{ color: ACCENT }}>
                  {title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
