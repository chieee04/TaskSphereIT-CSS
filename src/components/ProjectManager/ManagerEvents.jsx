// src/pages/Manager/ManagerEvents.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  FaCalendarAlt,
  FaClock,
  FaListAlt,
  FaFileAlt,
  FaShieldAlt,
  FaUsers,
} from "react-icons/fa";

const ACCENT = "#3B0304";

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
      const storedUserRaw = localStorage.getItem("customUser");
      if (!storedUserRaw) {
        setLoading(false);
        return;
      }
      const storedUser = JSON.parse(storedUserRaw);
      setCustomUser(storedUser);
      const managerId = storedUser.id;

      const [{ data: accData }, { data: titleDefData }, { data: manuData }, { data: oralData }, { data: finalData }] =
        await Promise.all([
          supabase.from("user_credentials").select("*"),
          supabase.from("user_titledef").select("*").eq("manager_id", managerId).maybeSingle(),
          supabase.from("user_manuscript_sched").select("*").eq("manager_id", managerId).maybeSingle(),
          supabase
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
            .eq("manager_id", managerId),
          supabase
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
            .eq("manager_id", managerId),
        ]);

      setAccounts(accData || []);
      setTitleDef(titleDefData || null);
      setManuscript(manuData || null);
      setOralDefenses(oralData || []);
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

  return (
    <>
      {/* Ensure the entire app area is white and 100% tall to avoid showing any dark background on mobile emulators */}
      <style>{`
        html, body, #root { height: 100%; background: #ffffff; }
        /* Page shell */
        .events-page { min-height: 100vh; background:#fff; display:flex; flex-direction:column; }
        .events-header { position:sticky; top:0; z-index:10; background:#fff; }
        .events-header hr { border-top: 1px solid ${ACCENT}; opacity: 1; margin: 0 0 12px 0; }
        .events-content { flex:1 1 auto; overflow:auto; -webkit-overflow-scrolling:touch; padding-bottom:24px; }
        .section-title { color:#111; font-weight:700; margin: 20px 0 12px; display:flex; align-items:center; gap:.5rem; }
        .section-title .icon { color:${ACCENT}; }
        .card { border-radius:10px; border:1px solid #eee; }
        .card h5 { margin-bottom: .5rem; }
        .table-scroll-area { max-height: 60vh; }
        .table thead th { position: sticky; top: 0; background: #f8f9fa; z-index: 5; }
        .accent { color: ${ACCENT}; }
        .btn-accent { background:${ACCENT}; color:#fff; }
        /* Compact on small screens */
        @media (max-width: 576px){
          .container-fluid, .container { padding-left: 12px; padding-right: 12px; }
          .section-title { margin-top: 14px; margin-bottom: 8px; }
          .card { padding: .75rem !important; }
          .table { font-size: 0.9rem; }
        }
      `}</style>

      <div className="events-page">
        {/* Header (sticky) */}
        <header className="events-header">
          <div className="container-fluid py-3">
            <h2 className="fw-bold mb-2 d-flex align-items-center">
              <FaListAlt className="me-2 icon" /> Events
            </h2>
            <hr />
          </div>
        </header>

        {/* Scrollable content */}
        <main className="events-content">
          <div className="container-fluid">
            {loading ? (
              <div className="d-flex justify-content-center align-items-center py-5">
                <div className="spinner-border" role="status" style={{ color: ACCENT }}>
                  <span className="visually-hidden">Loading…</span>
                </div>
              </div>
            ) : (
              <>
                {/* Manuscript Results */}
                <h4 className="section-title">
                  <FaFileAlt className="icon" /> Manuscript Results
                </h4>
                <div className="bg-white rounded-lg shadow-sm mb-4">
                  <div className="table-responsive table-scroll-area">
                    <table className="table table-bordered align-middle mb-0">
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
                            <td>
                              {manuscript.date
                                ? new Date(manuscript.date).toLocaleDateString()
                                : "No Date"}
                            </td>
                            <td>{manuscript.time || "N/A"}</td>
                            <td>{manuscript.plagiarism || 0}%</td>
                            <td>{manuscript.ai || 0}%</td>
                            <td className="text-truncate" style={{ maxWidth: 220 }}>
                              {manuscript.file_uploaded || "No File"}
                            </td>
                            <td>{manuscript.verdict || "Pending"}</td>
                          </tr>
                        ) : (
                          <tr>
                            <td colSpan={10} className="text-center">
                              No manuscript schedule found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Title Defense */}
                <h4 className="section-title">
                  <FaShieldAlt className="icon" /> Title Defense
                </h4>
                {titleDef ? (
                  <div className="card shadow-sm mb-4 p-3">
                    <h5 className="fw-bold mb-2">
                      {customUser?.group_name || "Unknown Team"}
                    </h5>
                    <div className="row g-2">
                      <div className="col-12 col-md-6">
                        <div className="fw-bold">Title:</div>
                        <div>{customUser?.project_title || "No Title"}</div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div className="fw-bold">Panelists:</div>
                        <ul className="mb-0 ps-3">
                          <li>{getName(titleDef.panelist1_id)}</li>
                          <li>{getName(titleDef.panelist2_id)}</li>
                          <li>{getName(titleDef.panelist3_id)}</li>
                        </ul>
                      </div>

                      <div className="col-6 col-md-3">
                        <div className="fw-bold d-flex align-items-center gap-2">
                          <FaCalendarAlt className="accent" /> Date
                        </div>
                        <div>
                          {titleDef.date
                            ? new Date(titleDef.date).toLocaleDateString()
                            : "-"}
                        </div>
                      </div>
                      <div className="col-6 col-md-3">
                        <div className="fw-bold d-flex align-items-center gap-2">
                          <FaClock className="accent" /> Time
                        </div>
                        <div>{titleDef.time || "N/A"}</div>
                      </div>
                      <div className="col-12 col-md-3">
                        <div className="fw-bold">Status</div>
                        <div>{titleDef.verdict || "Pending"}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted">No schedule found for your team.</p>
                )}

                {/* Oral Defenses */}
                <h4 className="section-title">
                  <FaUsers className="icon" /> Oral Defenses
                </h4>
                {oralDefenses.length > 0 ? (
                  <div className="row g-3 mb-4">
                    {oralDefenses.map((def) => (
                      <div key={def.id} className="col-12 col-md-6 col-xl-4">
                        <div className="card shadow-sm h-100 p-3">
                          <h5 className="fw-bold">
                            {def.manager?.group_name || "Unknown Team"}
                          </h5>
                          <div className="small text-muted mb-2">
                            {def.title || "Untitled"}
                          </div>

                          <div className="mb-2">
                            <div className="fw-bold">Panelists</div>
                            <ul className="mb-0 ps-3">
                              <li>{getFullName(def.panel1)}</li>
                              <li>{getFullName(def.panel2)}</li>
                              <li>{getFullName(def.panel3)}</li>
                            </ul>
                          </div>

                          <div className="row g-2">
                            <div className="col-6">
                              <div className="fw-bold d-flex align-items-center gap-2">
                                <FaCalendarAlt className="accent" /> Date
                              </div>
                              <div>
                                {def.date
                                  ? new Date(def.date).toLocaleDateString()
                                  : "-"}
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="fw-bold d-flex align-items-center gap-2">
                                <FaClock className="accent" /> Time
                              </div>
                              <div>{def.time || "TBA"}</div>
                            </div>
                            <div className="col-12">
                              <div className="fw-bold">Status</div>
                              <div>{def.status || "Pending"}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">No Oral Defense Scheduled.</p>
                )}

                {/* Final Defenses */}
                <h4 className="section-title">
                  <FaUsers className="icon" /> Final Defenses
                </h4>
                {finalDefenses.length > 0 ? (
                  <div className="row g-3">
                    {finalDefenses.map((def) => (
                      <div key={def.id} className="col-12 col-md-6 col-xl-4">
                        <div className="card shadow-sm h-100 p-3">
                          <h5 className="fw-bold">
                            {def.manager?.group_name || "Unknown Team"}
                          </h5>
                          <div className="small text-muted mb-2">
                            {def.title || "Untitled"}
                          </div>

                          <div className="mb-2">
                            <div className="fw-bold">Panelists</div>
                            <ul className="mb-0 ps-3">
                              <li>{getFullName(def.panel1)}</li>
                              <li>{getFullName(def.panel2)}</li>
                              <li>{getFullName(def.panel3)}</li>
                            </ul>
                          </div>

                          <div className="row g-2">
                            <div className="col-6">
                              <div className="fw-bold d-flex align-items-center gap-2">
                                <FaCalendarAlt className="accent" /> Date
                              </div>
                              <div>
                                {def.date
                                  ? new Date(def.date).toLocaleDateString()
                                  : "-"}
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="fw-bold d-flex align-items-center gap-2">
                                <FaClock className="accent" /> Time
                              </div>
                              <div>{def.time || "TBA"}</div>
                            </div>
                            <div className="col-12">
                              <div className="fw-bold">Status</div>
                              <div>{def.status || "Pending"}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted mb-0">No Final Defense Scheduled.</p>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default ManagerEvents;
