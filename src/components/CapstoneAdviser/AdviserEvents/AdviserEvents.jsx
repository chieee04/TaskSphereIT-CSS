// src/components/CapstoneAdviser/AdviserEvents/AdviserEvents.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import eventsIcon from "../../../assets/events-icon.png";
import manuscriptIcon from "../../../assets/manuscript-icon.png";
import recordIcon from "../../../assets/records-icon.png";
import Footer from "../../Footer";

/**
 * AdviserEvents
 * - Cards navigate via react-router to /Adviser/:subPage
 * - Also sets active page (optional) so Sidebar highlights correctly
 * - Footer stays pinned using min-h-screen flex layout + mt-auto
 */
export default function AdviserEvents({ setActivePage }) {
  const maroon = "#3B0304";
  const navigate = useNavigate();

  const go = (path, pageKey, pageLabel) => {
    // keep Sidebar selection in sync (optional – dashboard also picks subPage from URL)
    if (setActivePage) setActivePage(pageKey);
    // smooth-ish UX
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "instant" }));
    navigate(path, { state: { activePage: pageLabel || pageKey } });
  };

  const items = [
    {
      title: "Manucript Results",
      icon: manuscriptIcon,
      path: "/Adviser/ManucriptResults",
      pageKey: "ManucriptResults", // matches AdviserDashboard switch/case
      pageLabel: "Manucript Results",
    },
    {
      title: "Capstone Defenses",
      icon: recordIcon,
      path: "/Adviser/CapstoneDefenses",
      pageKey: "CapstoneDefenses", // IMPORTANT: no space (matches AdviserDashboard)
      pageLabel: "Capstone Defenses",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800">
      {/* Main content */}
      <main className="px-6 py-6 max-w-6xl w-full mx-auto flex-1">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <img src={eventsIcon} alt="Events Icon" className="w-6 h-6" />
          <h2 className="text-[#3B0304] font-semibold text-lg">Events</h2>
        </div>
        <div className="h-[2px] bg-[#3B0304] rounded mb-6" />

        {/* Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {items.map(({ title, icon, path, pageKey, pageLabel }, idx) => (
            <button
              key={idx}
              onClick={() => go(path, pageKey, pageLabel)}
              className="relative group bg-white rounded-xl shadow-sm border border-transparent hover:shadow-md transition p-4 text-left flex flex-col items-center justify-center overflow-visible"
              aria-label={title}
            >
              {/* Left vertical bar (L-shape) */}
              <div
                aria-hidden
                className="absolute left-0 top-0 h-full w-3 rounded-l-md"
                style={{ backgroundColor: maroon }}
              />
              {/* Bottom strip */}
              <div
                aria-hidden
                className="absolute left-0 right-0 bottom-0 h-3 rounded-b-md"
                style={{ backgroundColor: maroon }}
              />

              {/* Card content */}
              <div className="relative z-10 flex flex-col items-center gap-3">
                <div className="bg-white rounded-md p-3 shadow-inner">
                  <img src={icon} alt={`${title} icon`} className="w-12 h-12" />
                </div>

                <h3 className="text-sm text-center text-slate-700 leading-tight">
                  {title.split(" ").map((w, i) => (
                    <span key={i}>
                      {w}
                      {i < title.split(" ").length - 1 ? "\u00A0" : ""}
                    </span>
                  ))}
                </h3>
              </div>
            </button>
          ))}
        </div>
      </main>

      {/* Footer pinned to bottom */}
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}
