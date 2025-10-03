import React, { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import { FaCalendarAlt, FaSearch } from "react-icons/fa";
 
const AdviserCapsDefenses = () => {
  const [oralDefenses, setOralDefenses] = useState([]);
  const [finalDefenses, setFinalDefenses] = useState([]);
  const [adviserId, setAdviserId] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("oral");
 
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
        )
        .eq("adviser_id", adviserId);
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
        )
        .eq("adviser_id", adviserId);
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
 
  const getStatusBadge = (status, verdict) => {
    // For oral defenses, use verdict mapping
    if (verdict !== undefined && verdict !== null) {
      const verdictMap = {
        1: "Pending",
        2: "Re-Defense", 
        3: "Disapproved",
        4: "Approved"
      };
      const verdictText = verdictMap[verdict] || "Pending";
 
      const verdictClass = {
        "Pending": "bg-warning text-dark",
        "Re-Defense": "bg-warning text-dark", 
        "Disapproved": "bg-danger",
        "Approved": "bg-success"
      };
 
      return (
        <span className={`badge ${verdictClass[verdictText] || "bg-secondary"}`}>
          {verdictText}
        </span>
      );
    }
 
    // For final defenses or other statuses
    const statusClass = {
      "Completed": "bg-success",
      "Missed": "bg-danger", 
      "Pending": "bg-warning text-dark",
      "Approved": "bg-success",
      "Re-Defense": "bg-warning text-dark",
      "Disapproved": "bg-danger"
    };
 
    return (
      <span className={`badge ${statusClass[status] || "bg-secondary"}`}>
        {status || "Pending"}
      </span>
    );
  };
 
  // Filter defenses based on search
  const filterDefenses = (defenses) => {
    return defenses.filter(defense => 
      defense.manager?.group_name?.toLowerCase().includes(search.toLowerCase()) ||
      defense.title?.toLowerCase().includes(search.toLowerCase()) ||
      getPanelists(defense).toLowerCase().includes(search.toLowerCase())
    );
  };
 
  const currentDefenses = activeTab === "oral" ? filterDefenses(oralDefenses) : filterDefenses(finalDefenses);
 
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold flex items-center gap-2 text-[#3B0304] mb-1">
        <FaCalendarAlt /> Capstone Defenses
      </h1>
      <div className="w-[calc(100%-1rem)] border-b border-[#3B0304] mt-2 mb-4"></div>
 
      <div className="flex flex-col mb-6">
        <div className="flex gap-4 mb-4">
          <button
            className={`px-4 py-2 rounded-lg shadow-sm border border-[#B2B2B2] flex items-center gap-2 transition ${
              activeTab === "oral" 
                ? "bg-[#3B0304] text-white" 
                : "bg-white text-black hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab("oral")}
          >
            Oral Defense
          </button>
          <button
            className={`px-4 py-2 rounded-lg shadow-sm border border-[#B2B2B2] flex items-center gap-2 transition ${
              activeTab === "final" 
                ? "bg-[#3B0304] text-white" 
                : "bg-white text-black hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab("final")}
          >
            Final Defense
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div className="relative w-full" style={{ maxWidth: '250px' }}>
            <input
              type="text"
              className="w-full px-4 py-2 pl-10 bg-white border border-[#B2B2B2] rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
              placeholder="Search Team..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
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
                STATUS
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
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  {getStatusBadge(defense.status, defense.verdict)}
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