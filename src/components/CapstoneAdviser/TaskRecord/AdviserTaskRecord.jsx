import React from "react";
import tasksIcon from "../../../assets/tasks-icon.png";
import recordIcon from "../../../assets/records-icon.png";

export default function AdviserTaskRecord({ setActivePage }) {
  // ✅ Cards data
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
    <div className="flex flex-col min-h-screen bg-gray-50 overflow-hidden">
      {/* Main Content */}
      <div className="flex-grow container mx-auto px-6 py-6">
        <h2 className="section-title flex items-center mb-4">
          <img src={tasksIcon} alt="Tasks Icon" className="section-icon w-6 h-6 mr-2" />
          Tasks Record
        </h2>
        <hr className="divider border-t-2 border-gray-300 mb-4" />

        {/* ✅ Keep original cards */}
        <div className="tasks-record-container flex flex-wrap gap-6 justify-center">
          {items.map((item, index) => (
            <div
              key={index}
              className="task-card bg-white border border-gray-200 rounded-lg shadow-md p-6 text-center cursor-pointer hover:shadow-lg transition"
              onClick={item.onClick}
            >
              <div className="task-card-icon mb-3 flex justify-center">
                <img src={item.icon} alt={`${item.title} Icon`} className="card-icon w-16 h-16" />
              </div>
              <div className="task-card-header">
                <h3 className="task-title text-gray-800 font-semibold text-md">
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
    </div>
  );
}
