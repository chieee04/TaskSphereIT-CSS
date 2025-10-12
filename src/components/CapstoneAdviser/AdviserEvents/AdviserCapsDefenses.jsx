// src/components/CapstoneAdviser/AdviserEvents/AdviserCapsDefenses.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../supabaseClient";
import { FaCalendarAlt, FaFilter, FaChevronLeft } from "react-icons/fa";
import Footer from "../../Footer";

const AdviserCapsDefenses = () => {
  const navigate = useNavigate();
  const [oralDefenses, setOralDefenses] = useState([]);
  const [finalDefenses, setFinalDefenses] = useState([]);
  const [adviserId, setAdviserId] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [activeTab, setActiveTab] = useState("oral");
  const [filterRole, setFilterRole] = useState("adviser"); // "adviser" or "panelist"

  // Get signed-in adviser ID
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("customUser"));
    if (storedUser?.id) setAdviserId(storedUser.id);
  }, []);

  // Fetch all accounts for name resolution
  useEffect(() => {
    const fetchAccounts = async () => {
      const { data } = await supabase.from("user_credentials").select("*");
      setAccounts(data || []);
    };
    fetchAccounts();
  }, []);

  // Fetch Oral & Final Defenses
  useEffect(() => {
    if (!adviserId) return;

    const fetchDefenses = async () => {
      // Oral Defense
      const { data: oralData, error: oralError } = await supabase
        .from("user_oraldef")
        .select(
          `*, 
          manager:manager_id ( first_name, last_name, group_name ),
          panel1:panelist1_id ( first_name, last_name ),
          panel2:panelist2_id ( first_name, last_name ),
          panel3:panelist3_id ( first_name, last_name )`
        );

      if (oralError) console.error("Oral defense fetch error:", oralError);
      else setOralDefenses(oralData || []);

      // Final Defense
      const { data: finalData, error: finalError } = await supabase
        .from("user_final_sched")
        .select(
          `*, 
          manager:manager_id ( first_name, last_name, group_name ),
          panel1:panelist1_id ( first_name, last_name ),
          panel2:panelist2_id ( first_name, last_name ),
          panel3:panelist3_id ( first_name, last_name )`
        );

      if (finalError) console.error("Final defense fetch error:", finalError);
      else setFinalDefenses(finalData || []);
    };

    fetchDefenses();
  }, [adviserId]);

  const getFullName = (user) => (user ? `${user.last_name}, ${user.first_name}` : "");

  const getPanelists = (defense) => {
    const panelists = [
      defense.panel1 ? getFullName(defense.panel1) : "",
      defense.panel2 ? getFullName(defense.panel2) : "",
      defense.panel3 ? getFullName(defense.panel3) : "",
    ].filter((name) => name !== "");

    return panelists.length > 0 ? panelists.join(", ") : "No panelists assigned";
  };

  // Get select styling based on verdict
  const getSelectStyle = (status, verdict) => {
    if (verdict !== undefined && verdict !== null) {
      switch (verdict) {
        case 1: return "bg-white border-[#B2B2B2] text-gray-700";
        case 2: return "bg-[#809D3C] border-[#6b8530] text-white font-semibold";
        case 3: return "bg-[#3B0304] border-[#2a0203] text-white font-semibold";
        case 4: return "bg-gray-600 border-gray-700 text-white font-semibold";
        default: return "bg-white border-[#B2B2B2] text-gray-700";
      }
    }
    switch (status) {
      case "Completed":
      case "Approved":
        return "bg-[#809D3C] border-[#6b8530] text-white font-semibold";
      case "Missed":
      case "Disapproved":
        return "bg-gray-600 border-gray-700 text-white font-semibold";
      case "Re-Defense":
        return "bg-[#3B0304] border-[#2a0203] text-white font-semibold";
      case "Pending":
      default:
        return "bg-white border-[#B2B2B2] text-gray-700";
    }
  };

  const getVerdictText = (status, verdict) => {
    if (verdict !== undefined && verdict !== null) {
      const verdictMap = { 1: "Pending", 2: "Approved", 3: "Revisions", 4: "Disapproved" };
      return verdictMap[verdict] || "Pending";
    }
    return status || "Pending";
  };

  const filterDefenses = (defenses) => {
    if (filterRole === "adviser") {
      return defenses.filter((d) => d.adviser_id === adviserId);
    }
    if (filterRole === "panelist") {
      return defenses.filter(
        (d) =>
          d.panelist1_id === adviserId ||
          d.panelist2_id === adviserId ||
          d.panelist3_id === adviserId
      );
    }
    return defenses;
  };

  const currentDefenses =
    activeTab === "oral" ? filterDefenses(oralDefenses) : filterDefenses(finalDefenses);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header + Back */}
      <div className="px-6 pt-6">
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            onClick={() => navigate("/Adviser/Events")}
            title="Back to Events"
            aria-label="Back to Events"
            className="inline-flex items-center gap-2 text-sm font-medium rounded-md px-3 py-1.5
                       border border-[#3B0304] bg-[#3B0304] text-white
                       hover:bg-[#5a0d0e] focus:outline-none focus:ring-2 focus:ring-[#3B0304]/30 transition"
          >
            <FaChevronLeft /> Back
          </button>
          <h1 className="text-xl font-bold flex items-center gap-2 text-[#3B0304]">
            <FaCalendarAlt /> Capstone Defenses
          </h1>
        </div>
        <div className="h-[2px] bg-[#3B0304] rounded mb-4" />
      </div>

      {/* Main */}
      <main className="px-6 pb-6 max-w-7xl w-full mx-auto flex-1">
        {/* Tabs + Filter Row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-3">
            <button
              className={`px-3 py-1.5 rounded-lg shadow-sm border border-[#B2B2B2] transition text-sm ${
                activeTab === "oral" ? "bg-[#3B0304] text-white" : "bg-white text-black hover:bg-gray-100"
              }`}
              onClick={() => setActiveTab("oral")}
            >
              Oral Defense
            </button>
            <button
              className={`px-3 py-1.5 rounded-lg shadow-sm border border-[#B2B2B2] transition text-sm ${
                activeTab === "final" ? "bg-[#3B0304] text-white" : "bg-white text-black hover:bg-gray-100"
              }`}
              onClick={() => setActiveTab("final")}
            >
              Final Defense
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="filter-wrapper relative">
              <span className="filter-content">
                <FaFilter size={14} /> Filter: {filterRole === "adviser" ? "Adviser" : "Panelist"}
              </span>
              <select
                className="filter-select absolute inset-0 opacity-0 cursor-pointer"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="adviser">Adviser</option>
                <option value="panelist">Panelist</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">NO</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">TEAM</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">TITLE</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">PANELISTS</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">DATE</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">TIME</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">VERDICT</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentDefenses.map((defense, index) => (
                <tr key={defense.id}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{defense.manager?.group_name || "-"}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{defense.title || "-"}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{getPanelists(defense)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{defense.date}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{defense.time}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <div
                      className={`w-24 py-2 border rounded-lg text-xs flex items-center justify-center mx-auto ${getSelectStyle(
                        defense.status,
                        defense.verdict
                      )}`}
                    >
                      {getVerdictText(defense.status, defense.verdict)}
                    </div>
                  </td>
                </tr>
              ))}
              {currentDefenses.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-gray-500">
                    No {activeTab === "oral" ? "Oral" : "Final"} Defense schedules found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Inline styles for the filter control */}
        <style>{`
          .filter-wrapper {
            display: flex;
            align-items: center;
            border: 1px solid #B2B2B2;
            border-radius: 6px;
            background-color: white;
            color: #3B0304;
            font-size: 0.85rem;
            font-weight: 500;
            padding: 6px 8px;
            gap: 6px;
            cursor: pointer;
            transition: border-color 0.2s, background-color 0.2s;
          }
          .filter-wrapper:hover { background-color: #f0f0f0; border-color: #3B0304; }
          .filter-content { display: flex; align-items: center; gap: 6px; pointer-events: none; }
        `}</style>
      </main>

      {/* Footer pinned to bottom */}
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
};

export default AdviserCapsDefenses;
