import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import "bootstrap/dist/css/bootstrap.min.css";
import Swal from "sweetalert2";
import {
  FaCalendarAlt,
  FaClock,
  FaListAlt,
  FaFileAlt,
  FaShieldAlt,
  FaUsers,
} from "react-icons/fa";

const ManagerEvents = () => {
  const [titleDef, setTitleDef] = useState(null);
  const [manuscript, setManuscript] = useState(null);
  const [oralDefenses, setOralDefenses] = useState([]);
  const [finalDefenses, setFinalDefenses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [customUser, setCustomUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      const storedUser = JSON.parse(localStorage.getItem("customUser"));
      if (!storedUser) return;
      setCustomUser(storedUser);
      const managerId = storedUser.id;

      // Fetch accounts
      const { data: accData } = await supabase.from("user_credentials").select("*");
      setAccounts(accData || []);

      // Title Defense (keep as before)
      const { data: titleDefData } = await supabase
        .from("user_titledef")
        .select("*")
        .eq("manager_id", managerId)
        .maybeSingle();
      setTitleDef(titleDefData);

      // Manuscript (keep as before)
      const { data: manuData } = await supabase
        .from("user_manuscript_sched")
        .select("*")
        .eq("manager_id", managerId)
        .maybeSingle();
      setManuscript(manuData);

      // Oral Defense
      const { data: oralData } = await supabase
        .from("user_oraldef")
        .select(
          `
          *,
          manager:manager_id ( first_name, last_name, group_name ),
          panel1:panelist1_id ( first_name, last_name ),
          panel2:panelist2_id ( first_name, last_name ),
          panel3:panelist3_id ( first_name, last_name )
        `
        )
        .eq("manager_id", managerId);
      setOralDefenses(oralData || []);

      // Final Defense
      const { data: finalData } = await supabase
        .from("user_final_sched")
        .select(
          `
          *,
          manager:manager_id ( first_name, last_name, group_name ),
          panel1:panelist1_id ( first_name, last_name ),
          panel2:panelist2_id ( first_name, last_name ),
          panel3:panelist3_id ( first_name, last_name )
        `
        )
        .eq("manager_id", managerId);
      setFinalDefenses(finalData || []);

      setLoading(false);
    };

    fetchSchedule();
  }, []);

  const getName = (id) => {
    const person = accounts.find((a) => a.id === id);
    return person ? `${person.last_name}, ${person.first_name}` : "Unknown";
  };

  const getFullName = (user) => (user ? `${user.first_name} ${user.last_name}` : "-");

  if (loading) return <div className="text-center mt-5">Loading...</div>;

  return (
    <div className="container my-4">

      <h2 className="fw-bold mb-2 d-flex align-items-center">
        <FaListAlt className="me-2" style={{ color: '#3B0304' }} /> Events
      </h2>
      <hr style={{ borderTop: "1px solid #3B0304" }} />

      {/* ===================== Manuscript Section ===================== */}
      <h4 className="mb-3 mt-5 d-flex align-items-center fw-bold">
        <FaFileAlt className="me-2" style={{ color: '#3B0304' }} /> Manuscript Results
      </h4>
      <div className="bg-white rounded-lg shadow-sm relative">
        <div className="table-scroll-area overflow-x-auto overflow-y-auto" style={{ maxHeight: '600px' }}>
          <table className="table table-bordered">
            <thead className="thead-light">
              <tr>
                <th>No</th>
                <th>Team</th>
                <th>Title</th>
                <th>Adviser</th>
                <th>Due Date</th>
                <th>Time</th>
                <th>Plagiarism</th>
                <th>AI</th>
                <th>File Uploaded</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {manuscript ? (
                <tr>
                  <td>1</td>
                  <td>{customUser?.group_name || "Unknown Team"}</td>
                  <td>{customUser?.project_title || "No Title"}</td>
                  <td>{getName(manuscript.adviser_id)}</td>
                  <td>{manuscript.date ? new Date(manuscript.date).toLocaleDateString() : "No Date"}</td>
                  <td>{manuscript.time || "N/A"}</td>
                  <td>{manuscript.plagiarism || 0}%</td>
                  <td>{manuscript.ai || 0}%</td>
                  <td>{manuscript.file_uploaded || "No File"}</td>
                  <td>{manuscript.verdict || "Pending"}</td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={10} className="text-center">No manuscript schedule found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================== Title Defense Section ===================== */}
      <h4 className="mb-3 mt-5 d-flex align-items-center fw-bold">
        <FaShieldAlt className="me-2" style={{ color: '#3B0304' }} /> Title Defense
      </h4>
      {titleDef ? (
        <div className="card shadow-sm mb-3 p-3">
          <h5 className="fw-bold">{customUser?.group_name || "Unknown Team"}</h5>
          <div className="row mb-1">
            <div className="col fw-bold">Title:</div>
            <div className="col">{customUser?.project_title || "No Title"}</div>
          </div>
          <div className="row mb-1">
            <div className="col fw-bold">Panelists:</div>
            <div className="col">
              <ul className="mb-0">
                <li>{getName(titleDef.panelist1_id)}</li>
                <li>{getName(titleDef.panelist2_id)}</li>
                <li>{getName(titleDef.panelist3_id)}</li>
              </ul>
            </div>
          </div>
          <div className="row mb-1">
            <div className="col fw-bold">Date:</div>
            <div className="col">{titleDef.date ? new Date(titleDef.date).toLocaleDateString() : "-"}</div>
          </div>
          <div className="row mb-1">
            <div className="col fw-bold">Time:</div>
            <div className="col">{titleDef.time || "N/A"}</div>
          </div>
          <div className="row">
            <div className="col fw-bold">Status:</div>
            <div className="col">{titleDef.verdict || "Pending"}</div>
          </div>
        </div>
      ) : <p className="text-muted">No schedule found for your team.</p>}

      {/* ===================== Oral Defense Section ===================== */}
      <h4 className="mb-3 mt-5 d-flex align-items-center fw-bold">
        <FaUsers className="me-2" style={{ color: '#3B0304' }} /> Oral Defenses
      </h4>
      {oralDefenses.length > 0 ? oralDefenses.map((def) => (
        <div key={def.id} className="card shadow-sm mb-3 p-3">
          <h5 className="fw-bold">{def.manager?.group_name || "Unknown Team"}</h5>
          <div className="row mb-1">
            <div className="col fw-bold">Title:</div>
            <div className="col">{def.title || "Untitled"}</div>
          </div>
          <div className="row mb-1">
            <div className="col fw-bold">Panelists:</div>
            <div className="col">
              <ul className="mb-0">
                <li>{getFullName(def.panel1)}</li>
                <li>{getFullName(def.panel2)}</li>
                <li>{getFullName(def.panel3)}</li>
              </ul>
            </div>
          </div>
          <div className="row mb-1">
            <div className="col fw-bold">Date:</div>
            <div className="col">{def.date ? new Date(def.date).toLocaleDateString() : "-"}</div>
          </div>
          <div className="row mb-1">
            <div className="col fw-bold">Time:</div>
            <div className="col">{def.time || "TBA"}</div>
          </div>
          <div className="row">
            <div className="col fw-bold">Status:</div>
            <div className="col">{def.status || "Pending"}</div>
          </div>
        </div>
      )) : <p className="text-muted">No Oral Defense Scheduled.</p>}

      {/* ===================== Final Defense Section ===================== */}
      <h4 className="mb-3 mt-5 d-flex align-items-center fw-bold">
        <FaUsers className="me-2" style={{ color: '#3B0304' }} /> Final Defenses
      </h4>
      {finalDefenses.length > 0 ? finalDefenses.map((def) => (
        <div key={def.id} className="card shadow-sm mb-3 p-3">
          <h5 className="fw-bold">{def.manager?.group_name || "Unknown Team"}</h5>
          <div className="row mb-1">
            <div className="col fw-bold">Title:</div>
            <div className="col">{def.title || "Untitled"}</div>
          </div>
          <div className="row mb-1">
            <div className="col fw-bold">Panelists:</div>
            <div className="col">
              <ul className="mb-0">
                <li>{getFullName(def.panel1)}</li>
                <li>{getFullName(def.panel2)}</li>
                <li>{getFullName(def.panel3)}</li>
              </ul>
            </div>
          </div>
          <div className="row mb-1">
            <div className="col fw-bold">Date:</div>
            <div className="col">{def.date ? new Date(def.date).toLocaleDateString() : "-"}</div>
          </div>
          <div className="row mb-1">
            <div className="col fw-bold">Time:</div>
            <div className="col">{def.time || "TBA"}</div>
          </div>
          <div className="row">
            <div className="col fw-bold">Status:</div>
            <div className="col">{def.status || "Pending"}</div>
          </div>
        </div>
      )) : <p className="text-muted">No Final Defense Scheduled.</p>}

    </div>
  );
};

export default ManagerEvents;
