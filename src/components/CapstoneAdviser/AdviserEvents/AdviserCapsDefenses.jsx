import React, { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import { FaCalendarAlt, FaFilter } from "react-icons/fa";
 
const AdviserCapsDefenses = () => {
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
 
  const getFullName = (user) =>
    user ? `${user.last_name}, ${user.first_name}` : "";
 
  const getPanelists = (defense) => {
    const panelists = [
      defense.panel1 ? getFullName(defense.panel1) : "",
      defense.panel2 ? getFullName(defense.panel2) : "",
      defense.panel3 ? getFullName(defense.panel3) : ""
    ].filter(name => name !== "");
 
    return panelists.length > 0 ? panelists.join(", ") : "No panelists assigned";
  };
 
  // Get select styling based on verdict - EXACT COPY FROM ORALDEFENSE
  const getSelectStyle = (status, verdict) => {
    // For oral defenses, use verdict mapping
    if (verdict !== undefined && verdict !== null) {
      const verdictMap = {
        1: "Pending",
        2: "Approved", 
        3: "Revisions",
        4: "Disapproved"
      };
      const verdictText = verdictMap[verdict] || "Pending";
 
      switch (verdict) {
        case 1: // Pending - Default styling
          return 'bg-white border-[#B2B2B2] text-gray-700';
        case 2: // Approved - Green
          return 'bg-[#809D3C] border-[#6b8530] text-white font-semibold';
        case 3: // Revisions - Red
          return 'bg-[#3B0304] border-[#2a0203] text-white font-semibold';
        case 4: // Disapproved - Gray
          return 'bg-gray-600 border-gray-700 text-white font-semibold';
        default: // Default
          return 'bg-white border-[#B2B2B2] text-gray-700';
      }
    }
 
    // For final defenses or other statuses
    switch (status) {
      case "Completed": // Completed - Green
        return 'bg-[#809D3C] border-[#6b8530] text-white font-semibold';
      case "Missed": // Missed - Gray
        return 'bg-gray-600 border-gray-700 text-white font-semibold';
      case "Pending": // Pending - Default styling
        return 'bg-white border-[#B2B2B2] text-gray-700';
      case "Approved": // Approved - Green
        return 'bg-[#809D3C] border-[#6b8530] text-white font-semibold';
      case "Re-Defense": // Re-Defense - Red
        return 'bg-[#3B0304] border-[#2a0203] text-white font-semibold';
      case "Disapproved": // Disapproved - Gray
        return 'bg-gray-600 border-gray-700 text-white font-semibold';
      default: // Default
        return 'bg-white border-[#B2B2B2] text-gray-700';
    }
  };
 
  // Get verdict text for display
  const getVerdictText = (status, verdict) => {
    // For oral defenses, use verdict mapping
    if (verdict !== undefined && verdict !== null) {
      const verdictMap = {
        1: "Pending",
        2: "Approved", 
        3: "Revisions",
        4: "Disapproved"
      };
      return verdictMap[verdict] || "Pending";
    }
 
    // For final defenses, use status directly
    return status || "Pending";
  };
 
  // Filter defenses based on role
  const filterDefenses = (defenses) => {
    let filteredDefenses = defenses;
 
    // Filter by role (adviser or panelist)
    if (filterRole === "adviser") {
      filteredDefenses = defenses.filter(defense => 
        defense.adviser_id === adviserId
      );
    } else if (filterRole === "panelist") {
      filteredDefenses = defenses.filter(defense => 
        defense.panelist1_id === adviserId || 
        defense.panelist2_id === adviserId || 
        defense.panelist3_id === adviserId
      );
    }
 
    return filteredDefenses;
  };
 
  const currentDefenses = activeTab === "oral" ? filterDefenses(oralDefenses) : filterDefenses(finalDefenses);
 
  return (
    <div className="p-6">
      <style>{`
        /* Filter Styles */
        .filter-wrapper {
            position: relative;
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
        .filter-wrapper:hover {
            background-color: #f0f0f0;
            border-color: #3B0304; 
        }
        .filter-select {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0; 
            cursor: pointer;
            z-index: 10;
        }
        .filter-select option {
            background-color: white !important; 
            color: black !important; 
        }
        .filter-content {
            display: flex;
            align-items: center;
            gap: 6px;
            pointer-events: none;
        }
      `}</style>
 
      <h1 className="text-xl font-bold flex items-center gap-2 text-[#3B0304] mb-1">
        <FaCalendarAlt /> Capstone Defenses
      </h1>
      <div className="w-[calc(100%-1rem)] border-b border-[#3B0304] mt-2 mb-4"></div>
 
      {/* Combined buttons and filter in one row */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-4">
          <button
            className={`px-3 py-1.5 rounded-lg shadow-sm border border-[#B2B2B2] flex items-center gap-2 transition text-sm ${
              activeTab === "oral" 
                ? "bg-[#3B0304] text-white" 
                : "bg-white text-black hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab("oral")}
          >
            Oral Defense
          </button>
          <button
            className={`px-3 py-1.5 rounded-lg shadow-sm border border-[#B2B2B2] flex items-center gap-2 transition text-sm ${
              activeTab === "final" 
                ? "bg-[#3B0304] text-white" 
                : "bg-white text-black hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab("final")}
          >
            Final Defense
          </button>
        </div>
 
        <div className="flex items-center gap-2">
          {/* Role Filter - Now shows "Filter" text and the current role */}
          <div className="filter-wrapper">
            <span className="filter-content">
              <FaFilter size={14} /> Filter: {filterRole === "adviser" ? "Adviser" : "Panelist"}
            </span>
            <select
              className="filter-select"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="adviser">Adviser</option>
              <option value="panelist">Panelist</option>
            </select>
          </div>
        </div>
      </div>
 
      <div className="bg-white rounded-lg shadow-md">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                NO
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                TEAM
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                TITLE
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                PANELISTS
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                DATE
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                TIME
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                VERDICT
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentDefenses.map((defense, index) => (
              <tr key={defense.id}>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {index + 1}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {defense.manager?.group_name || "-"}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {defense.title || "-"}
                </td>
                <td className="px-4 py-4 text-sm text-gray-500">
                  {getPanelists(defense)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {defense.date}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {defense.time}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center">
                  {/* Reduced width and centered properly */}
                  <div className={`w-24 py-2 border rounded-lg text-xs flex items-center justify-center mx-auto ${getSelectStyle(defense.status, defense.verdict)}`}>
                    {getVerdictText(defense.status, defense.verdict)}
                  </div>
                </td>
              </tr>
            ))}
            {currentDefenses.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-4 text-gray-500">
                  No {activeTab === "oral" ? "Oral" : "Final"} Defense schedules found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
 
export default AdviserCapsDefenses;