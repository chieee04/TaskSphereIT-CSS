// src/components/MemberEvents.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import fileIcon from "../../assets/file-type-icon.png";
import "bootstrap/dist/css/bootstrap.min.css";

const MemberEvents = () => {
  const [customUser, setCustomUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [manuscript, setManuscript] = useState(null);
  const [titleDef, setTitleDef] = useState(null);
  const [oralDefenses, setOralDefenses] = useState([]);
  const [finalDefenses, setFinalDefenses] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const storedUser = JSON.parse(localStorage.getItem("customUser"));
      if (!storedUser) return setCustomUser(null);
      setCustomUser(storedUser);

      // Fetch accounts
      const { data: accData } = await supabase.from("user_credentials").select("*");
      setAccounts(accData || []);

      // Find manager
      const sameGroup = accData.filter(a => a.group_number === storedUser.group_number);
      const manager = sameGroup.find(a => a.user_roles === 1);
      if (!manager) return;
      const managerId = manager.id;

      // Fetch Manuscript
      const { data: manuData } = await supabase
        .from("user_manuscript_sched")
        .select("*")
        .eq("manager_id", managerId)
        .maybeSingle();
      setManuscript(manuData);

      // Fetch Title Defense
      const { data: titleDefData } = await supabase
        .from("user_titledef")
        .select("*")
        .eq("manager_id", managerId)
        .maybeSingle();
      setTitleDef(titleDefData);

      // Fetch Oral Defense
      const { data: oralData } = await supabase
        .from("user_oraldef")
        .select("*")
        .eq("manager_id", managerId);
      setOralDefenses(oralData || []);

      // Fetch Final Defense
      const { data: finalData } = await supabase
        .from("user_final_sched")
        .select("*")
        .eq("manager_id", managerId);
      setFinalDefenses(finalData || []);
    };

    fetchData();
  }, []);

  const getName = (id) => {
    const person = accounts.find(a => a.id === id);
    return person ? `${person.last_name}, ${person.first_name}` : "Unknown";
  };

  const renderDefenseCard = (def) => (
    <div className="card mb-3 shadow-sm">
      <div className="card-body">
        <h5 className="card-title">{customUser?.group_name || "Unknown Team"}</h5>
        <div className="row mb-2">
          <div className="col-md-6 fw-bold">Title:</div>
          <div className="col-md-6 fw-bold">Panelists:</div>
        </div>
        <div className="row mb-2">
          <div className="col-md-6">{def.title || "Untitled"}</div>
          <div className="col-md-6">{getName(def.panelist1_id)}</div>
        </div>
        <div className="row mb-2">
          <div className="col-md-6 fw-bold">Date:</div>
          <div className="col-md-6">{getName(def.panelist2_id)}</div>
        </div>
        <div className="row mb-2">
          <div className="col-md-6">
            {def.date
              ? new Date(def.date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              : "No Date"}
          </div>
          <div className="col-md-6">{getName(def.panelist3_id)}</div>
        </div>
        <div className="row mb-2">
          <div className="col-md-6 fw-bold">Time:</div>
          <div className="col-md-6 fw-bold">Status:</div>
        </div>
        <div className="row">
          <div className="col-md-6">{def.time || "N/A"}</div>
          <div className="col-md-6">{def.status || "Pending"}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container my-4">
      <h2 className="mb-3">Events</h2>
      <hr />

      {/* Manuscript Results */}
      <h4 className="mt-4">Manuscript Results</h4>
      <div className="table-responsive mb-4">
        <table className="table table-bordered table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>No</th>
              <th>Team</th>
              <th>Title</th>
              <th>Due Date</th>
              <th>Time</th>
              <th>Plagiarism</th>
              <th>AI</th>
              <th>File</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {manuscript ? (
              <tr>
                <td>1</td>
                <td>{customUser?.group_name || "Unknown Team"}</td>
                <td>{customUser?.project_title || "No Title"}</td>
                <td>{manuscript.date ? new Date(manuscript.date).toLocaleDateString() : "No Date"}</td>
                <td>{manuscript.time || "N/A"}</td>
                <td>{manuscript.plagiarism || 0}%</td>
                <td>{manuscript.ai || 0}%</td>
                <td>
                  {manuscript.file_name ? (
                    <>
                      <img src={fileIcon} alt="File" style={{ width: 20, height: 20 }} /> {manuscript.file_name}
                    </>
                  ) : "No File"}
                </td>
                <td>{manuscript.verdict || "Pending"}</td>
              </tr>
            ) : (
              <tr>
                <td colSpan={9} className="text-center">No manuscript schedule found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Title Defense */}
      <h4 className="mt-4">Title Defense</h4>
      {titleDef ? renderDefenseCard(titleDef) : <p className="text-muted">No title defense schedule found.</p>}

      {/* Oral Defense */}
      <h4 className="mt-4">Oral Defense</h4>
      {oralDefenses.length > 0 ? oralDefenses.map(renderDefenseCard) : <p className="text-muted">No oral defense schedule found.</p>}

      {/* Final Defense */}
      <h4 className="mt-4">Final Defense</h4>
      {finalDefenses.length > 0 ? finalDefenses.map(renderDefenseCard) : <p className="text-muted">No final defense schedule found.</p>}
    </div>
  );
};

export default MemberEvents;