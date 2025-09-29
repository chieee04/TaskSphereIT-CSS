// src/components/AdviserCapsDefenses.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import eventIcon from "../../../assets/events-icon.png";
import "bootstrap/dist/css/bootstrap.min.css";

const AdviserCapsDefenses = () => {
  const [oralDefenses, setOralDefenses] = useState([]);
  const [finalDefenses, setFinalDefenses] = useState([]);
  const [adviserId, setAdviserId] = useState(null);
  const [accounts, setAccounts] = useState([]);

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
    user ? `${user.last_name}, ${user.first_name}` : "Unknown";

  const renderDefenseCard = (defense) => (
    <div key={defense.id} className="card mb-3 shadow-sm">
      <div className="card-body">
        <h5 className="card-title mb-3">
          Team: {defense.manager?.group_name || "Unknown Team"}
        </h5>

        <div className="row mb-2">
          <div className="col-md-3 fw-bold">Title:</div>
          <div className="col-md-9">{defense.title || "Untitled"}</div>
        </div>

        <div className="row mb-2">
          <div className="col-md-3 fw-bold">Panelists:</div>
          <div className="col-md-9 d-flex flex-wrap gap-2">
            <span className="badge bg-primary">{getFullName(defense.panel1 || "aasd")}</span>
            <span className="badge bg-primary">{getFullName(defense.panel2 )|| "aasd"}</span>
            <span className="badge bg-primary">{getFullName(defense.panel3)}</span>
          </div>
        </div>

        <div className="row mb-2">
          <div className="col-md-3 fw-bold">Date:</div>
          <div className="col-md-9">
            {defense.date
              ? new Date(defense.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "-"}
          </div>
        </div>

        <div className="row mb-2">
          <div className="col-md-3 fw-bold">Time:</div>
          <div className="col-md-9">{defense.time || "TBA"}</div>
        </div>

        <div className="row">
          <div className="col-md-3 fw-bold">Status:</div>
          <div className="col-md-9">
            <span
              className={`badge ${
                defense.status === "Completed"
                  ? "bg-success"
                  : defense.status === "Missed"
                  ? "bg-danger"
                  : "bg-warning text-dark"
              }`}
            >
              {defense.status || "Pending"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container my-4">
      <div className="d-flex align-items-center mb-3">
        <img src={eventIcon} alt="Events Icon" style={{ width: 40, marginRight: 10 }} />
        <h2 className="mb-0">Capstone Defenses</h2>
      </div>
      <hr />

      {/* Oral Defense */}
      <h4 className="mt-4 mb-3">Oral Defense</h4>
      {oralDefenses.length > 0 ? oralDefenses.map(renderDefenseCard) : <p>No Oral Defense Scheduled</p>}

      {/* Final Defense */}
      <h4 className="mt-4 mb-3">Final Defense</h4>
      {finalDefenses.length > 0 ? finalDefenses.map(renderDefenseCard) : <p>No Final Defense Scheduled</p>}
    </div>
  );
};

export default AdviserCapsDefenses;
