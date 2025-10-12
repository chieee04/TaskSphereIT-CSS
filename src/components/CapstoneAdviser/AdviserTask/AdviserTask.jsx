import React from "react";
import tasksIcon from "../../../assets/tasks-icon.png";
import recordIcon from "../../../assets/records-icon.png";

export default function AdviserTask({ setActivePage }) {
  const items = [
    {
      title: "Oral Defense",
      icon: recordIcon,
      onClick: () => setActivePage("Oral Defense"),
    },
    {
      title: "Final Defense",
      icon: recordIcon,
      onClick: () => setActivePage("Final Defense"),
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Content */}
      <div className="flex-grow px-8 py-6">
        {/* Header */}
        <h2 className="flex items-center gap-2 text-sm font-semibold text-[#3B0304] mb-2">
          <img src={tasksIcon} alt="Tasks Icon" className="w-5 h-5" />
          Tasks
        </h2>
        <hr className="border-t border-[#3B0304] mb-6" />

        {/* Task Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((item, index) => (
            <div
              key={index}
              onClick={item.onClick}
              className="cursor-pointer flex items-center justify-center bg-white shadow-md rounded-md overflow-hidden hover:shadow-lg transition-all duration-200 border border-gray-200"
            >
              {/* Left colored bar */}
              <div className="bg-[#3B0304] w-4 h-full" />

              {/* Card content */}
              <div className="flex flex-col items-center justify-center p-4 w-full h-32">
                <img
                  src={item.icon}
                  alt={`${item.title} Icon`}
                  className="w-8 h-8 mb-2"
                />
                <h3 className="text-sm font-semibold text-[#3B0304] text-center">
                  {item.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
