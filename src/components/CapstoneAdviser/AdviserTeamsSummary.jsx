import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient"; 
import teamsSummaryIcon from "../../assets/teams-summary-icon.png";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

export default function AdviserTeamSummary() {
  const [teams, setTeams] = useState([]);
  const navigate = useNavigate();

  // Fetch adviser’s teams
  useEffect(() => {
    const fetchTeams = async () => {
      const storedUser = localStorage.getItem("customUser");
      if (!storedUser) return;

      const adviser = JSON.parse(storedUser);
      if (adviser.user_roles !== 3) return; // adviser only

      // ❌ Walang adviser_group = walang hawak na team
      if (!adviser.adviser_group) {
        setTeams([]); 
        return;
      }

      const { data, error } = await supabase
        .from("user_credentials")
        .select("group_number, group_name")
        .eq("adviser_group", adviser.adviser_group)
        .not("group_number", "is", null);

      if (error) {
        console.error("Error fetching adviser teams:", error);
        return;
      }

      // unique teams by group_number
      const uniqueTeams = [
        ...new Map(data.map((item) => [item.group_number, item])).values(),
      ];

      setTeams(uniqueTeams);
    };

    fetchTeams();
  }, []);

  // Show modal when team card is clicked
  const handleCardClick = async (team) => {
    const { data: members, error } = await supabase
      .from("user_credentials")
      .select("first_name, last_name, user_roles")
      .eq("group_number", team.group_number);

    if (error) {
      console.error("Error fetching team members:", error);
      return;
    }

    const manager = members.find((m) => m.user_roles === 1);
    const teamMembers = members.filter((m) => m.user_roles === 2);

    let memberList = "";
    if (teamMembers.length > 0) {
      memberList = teamMembers
        .map((m, index) => `${index + 1}. ${m.first_name} ${m.last_name}`)
        .join("<br>");
    } else {
      memberList = "<i>No members assigned</i>";
    }

    MySwal.fire({
      title: `<strong>${team.group_name}</strong>`,
      html: `
        <p><b>Project Manager:</b> ${
          manager ? manager.first_name + " " + manager.last_name : "Not Assigned"
        }</p>
        <p><b>Team Members:</b><br>${memberList}</p>
      `,
      icon: "info",
      confirmButtonText: "Close",
      customClass: {
        popup: "rounded-lg shadow-lg",
        confirmButton: "bg-[#830C18] text-white px-4 py-2 rounded",
      },
    });
  };

  return (
    <div className="teams-summary-wrapper">
      <h2 className="section-title">
        <img
          src={teamsSummaryIcon}
          alt="Teams Summary Icon"
          className="section-icon"
        />
        Teams Summary
      </h2>
      <hr className="divider" />

      <div className="teams-summary-container">
        {teams.length === 0 ? (
          <p className="text-gray-500">No teams assigned yet.</p>
        ) : (
          teams.map((team) => (
            <div
              key={team.group_number}
              className="task-card"
              onClick={() => handleCardClick(team)}
            >
              <div className="task-card-icon">
                <img
                  src={teamsSummaryIcon}
                  alt="Team Icon"
                  className="card-icon"
                />
                <p className="card-label">Capstone Team</p>
              </div>
              <div className="task-card-spacer" />
              <p className="card-subtext">{team.group_name}</p>
            </div>
          ))
        )}
      </div>

      <style>{`
        * { box-sizing: border-box; }
        .teams-summary-wrapper { width: 100%; padding: 40px 20px; background: #fff; border-radius: 10px; }
        .section-title { font-size: 20px; font-weight: bold; color: #3B0304; margin-bottom: 5px; display: flex; align-items: center; gap: 8px; }
        .section-icon { width: 24px; height: 24px; object-fit: contain; }
        .divider { border: none; border-top: 2px solid #3B0304; margin-bottom: 20px; }
        .teams-summary-container { display: flex; gap: 20px; justify-content: left; flex-wrap: wrap; }
        .task-card { background: #ffffff; border: 1px solid #B2B2B2; border-radius: 8px; width: 150px; height: 190px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); padding: 20px 10px; cursor: pointer; position: relative; display: flex; flex-direction: column; align-items: center; text-align: center; }
        .task-card-icon { display: flex; flex-direction: column; align-items: center; }
        .card-icon { width: 50px; height: 50px; object-fit: contain; }
        .card-label { font-size: 16px; font-weight: 550; margin-top: 6px; color: #000000; }
        .task-card-spacer { flex-grow: 1; }
        .card-subtext { font-size: 16px; font-weight: 550; color: #000000; margin-bottom: 10px; }
        .task-card::after { content: ''; position: absolute; bottom: 0; left: 0; width: 100%; height: 26px; background-color: #830C18; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; }
        .task-card:hover { box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2); }
      `}</style>
    </div>
  );
}
