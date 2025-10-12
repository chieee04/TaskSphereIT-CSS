// src/components/CapstoneAdviser/AdviserFinalDef.jsx
import React, { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import {
  FaCalendarAlt, FaClock, FaChevronDown, FaChevronLeft, FaChevronRight,
  FaEdit, FaEllipsisV, FaEye, FaFilter, FaPlus, FaSearch, FaTasks, FaTrash
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { fetchTasksFromDB } from "../../../services/Adviser/AdviserFinalTask";

const STATUS_OPTIONS = ["To Do", "In Progress", "To Review", "Completed", "Missed"];
const FILTER_OPTIONS = ["All", "To Do", "In Progress", "To Review", "Missed"];
const REVISION_OPTIONS = ["No Revision", ...Array.from({ length: 10 }, (_, i) => {
  const n = i + 1; return n === 1 ? "1st Revision" : n === 2 ? "2nd Revision" : n === 3 ? "3rd Revision" : `${n}th Revision`;
})];
const METHODOLOGY_OPTIONS = ["Agile", "Extreme Programming", "Prototyping", "Scrum", "Waterfall"];
const PHASE_OPTIONS = ["Planning", "Design", "Development", "Testing", "Deployment"];
const ACCENT = "#5a0d0e";

const color = (s) => ({ "To Do": "#FABC3F", "In Progress": "#809D3C", "To Review": "#578FCA", "Completed": "#AA60C8", "Missed": "#D60606" }[s] || "#ccc");
const clean = (v) => (v || "").replace(/^\d+\.\s*/, "");
const revCount = (txt) => (!txt || txt === "No Revision" ? 0 : parseInt(txt, 10) || 0);
const nextRev = (txt) => {
  const n = Math.min(10, revCount(txt) + 1);
  if (n === 0) return "No Revision";
  if (n === 1) return "1st Revision";
  if (n === 2) return "2nd Revision";
  if (n === 3) return "3rd Revision";
  return `${n}th Revision`;
};
const fmtTime = (t) => {
  if (!t) return "N/A";
  const time = t.split("+")[0];
  const [h, m] = time.split(":");
  let hh = parseInt(h, 10);
  const ampm = hh >= 12 ? "PM" : "AM";
  hh = hh % 12 || 12;
  return `${hh}:${m} ${ampm}`;
};

export default function AdviserFinalDef() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [searchTerm, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState([]);
  const [selectMode, setSelectMode] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const [view, setView] = useState(0);
  const kebabRefs = useRef({});

  useEffect(() => { fetchTasksFromDB(setTasks); }, []);

  const filtered = (tasks || [])
    .filter((t) => t.group_name && t.group_name.trim() !== "")
    .filter((t) => (filter === "All" ? true : t.status === filter))
    .filter((t) => (t.task_type || "").toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((t) => t.status !== "Completed");

  const allSelected = filtered.length > 0 && selected.length === filtered.length;

  const setTask = (id, up) => setTasks((p) => p.map((t) => (t.id === id ? up(t) : t)));
  const missed = (t) => t.status === "Missed";

  const onStatus = async (id, s) => {
    const t = tasks.find((x) => x.id === id);
    if (!t || missed(t)) return;
    if (s === "Completed") {
      const ok = await Swal.fire({ icon: "question", title: "Mark as Completed?", showCancelButton: true, confirmButtonColor: ACCENT });
      if (!ok.isConfirmed) return;
      setTask(id, (cur) => ({ ...cur, status: "Completed", date_completed: new Date().toISOString().slice(0, 10) }));
      return;
    }
    setTask(id, (cur) => ({ ...cur, status: s }));
  };

  const onUpdate = (id) => {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;

    if (missed(t)) {
      const next = nextRev(t.revision_no);
      const capped = revCount(next) >= 10;
      setTask(id, (cur) => ({ ...cur, revision_no: next, status: capped ? "Missed" : "To Do" }));
      Swal.fire({
        icon: "success",
        title: capped ? "Revision maxed (10)" : "Revision +1 & Status reset",
        text: capped ? "Task remains Missed." : "Status returned to To Do.",
        confirmButtonColor: ACCENT,
      });
      setOpenMenu(null);
      return;
    }

    Swal.fire({
      title: `<div style="color:${ACCENT};font-weight:700;">Update Task</div>`,
      html: `
        <div style="text-align:left">
          <label style="font-weight:600">Revision No.</label>
          <select id="u-rev" class="swal2-input" style="width:100%;margin:4px 0 10px;">
            ${REVISION_OPTIONS.map((o) => `<option value="${o}" ${o === (t.revision_no || "No Revision") ? "selected" : ""}>${o}</option>`).join("")}
          </select>
          <label style="font-weight:600">Status</label>
          <select id="u-stat" class="swal2-input" style="width:100%;margin:4px 0 10px;">
            ${STATUS_OPTIONS.map((s) => `<option value="${s}" ${s === (t.status || "To Do") ? "selected" : ""}>${s}</option>`).join("")}
          </select>
          <label style="font-weight:600">Methodology</label>
          <select id="u-meth" class="swal2-input" style="width:100%;margin:4px 0 10px;">
            ${METHODOLOGY_OPTIONS.map((m) => `<option value="${m}" ${m === (t.methodology || "Agile") ? "selected" : ""}>${m}</option>`).join("")}
          </select>
          <label style="font-weight:600">Project Phase</label>
          <select id="u-phase" class="swal2-input" style="width:100%;">
            ${PHASE_OPTIONS.map((p) => `<option value="${p}" ${p === (t.project_phase || "Planning") ? "selected" : ""}>${p}</option>`).join("")}
          </select>
        </div>
      `,
      confirmButtonText: "Save",
      showCancelButton: true,
      confirmButtonColor: ACCENT,
      preConfirm: () => ({
        revision_no: document.getElementById("u-rev").value,
        status: document.getElementById("u-stat").value,
        methodology: document.getElementById("u-meth").value,
        project_phase: document.getElementById("u-phase").value,
      }),
    }).then((res) => {
      if (!res.isConfirmed) return;
      const v = res.value;
      const capped = revCount(v.revision_no) >= 10 && v.status !== "Completed";
      setTask(id, (cur) => ({ ...cur, ...v, status: capped ? "Missed" : v.status }));
      Swal.fire({ icon: "success", title: capped ? "Revision maxed (10): set to Missed" : "Saved", confirmButtonColor: ACCENT });
    });

    setOpenMenu(null);
  };

  const menuPos = (id) => {
    const el = kebabRefs.current[id]; if (!el) return { top: 0, left: 0 };
    const r = el.getBoundingClientRect(); return { top: r.bottom + window.scrollY, left: r.right + window.scrollX - 140 };
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <style>{`
        .section-title{font-weight:600;color:${ACCENT};display:flex;align-items:center;margin-bottom:.5rem}
        .divider{height:1.5px;background:${ACCENT};width:100%;border-radius:50px;margin-bottom:1.5rem;border:none}
        .primary-button{font-size:.85rem;padding:6px 12px;border-radius:6px;border:1.5px solid ${ACCENT};background:#fff;color:${ACCENT};font-weight:500;cursor:pointer;display:flex;align-items:center;gap:6px}
        .primary-button:hover{background:#f0f0f0}
        .tasks-table{width:100%;border-collapse:collapse}
        .tasks-table th{background:#f8f9fa;font-weight:600;color:${ACCENT};text-transform:uppercase;font-size:.75rem;padding:12px 6px;border-bottom:1px solid #dee2e6}
        .tasks-table td{padding:8px 6px;font-size:.875rem;border-bottom:1px solid #dee2e6;vertical-align:middle}
        .kebab-menu{position:fixed;background:#fff;border:1px solid #ddd;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,.15);z-index:9999;min-width:140px;padding:6px 0}
        .kebab-menu-item{display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer;background:none;border:none;width:100%;text-align:left}
        .kebab-menu-item:hover{background:#f8f9fa}
      `}</style>

      {/* Content */}
      <div className="flex-1">
        <div className="container-fluid px-4 py-3">
          <div className="row">
            <div className="col-12">
              {/* Back on the LEFT, title to the right of it */}
              <div className="d-flex align-items-center gap-2 mb-2">
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => navigate("/Adviser/Tasks")}
                  title="Back to Tasks"
                >
                  <FaChevronLeft /> Back
                </button>
                <h2 className="section-title m-0">
                  <FaTasks className="me-2" size={18} /> Final Defense Tasks
                </h2>
              </div>
              <hr className="divider" />
            </div>

            <div className="col-12">
              {/* Top bar */}
              <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-3">
                <div className="d-flex align-items-center gap-2">
                  <div className="position-relative">
                    <FaSearch className="position-absolute" style={{ left: 10, top: 10, color: "#aaa" }} />
                    <input
                      className="form-control bg-white"
                      style={{ paddingLeft: 32, width: 240, backgroundColor: "#FFFFFF", borderColor: "#B2B2B2" }}
                      placeholder="Search task type..."
                      value={searchTerm}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  <div className="position-relative">
                    <button className="primary-button"><FaFilter /> Filter: {filter}</button>
                    <select
                      className="position-absolute w-100 h-100"
                      style={{ left: 0, top: 0, opacity: 0, cursor: "pointer" }}
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      {FILTER_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  {selectMode && (
                    <button className="primary-button" onClick={() => { setSelectMode(false); setSelected([]); }}>
                      Cancel
                    </button>
                  )}
                  <button
                    className="primary-button"
                    onClick={() => {
                      if (!selectMode) { setSelectMode(true); return; }
                      if (!selected.length) return;
                      Swal.fire({
                        icon: "warning", title: "Delete selected?", text: `${selected.length} task(s)`,
                        showCancelButton: true, confirmButtonColor: "#D60606"
                      }).then((ok) => { if (ok.isConfirmed) setTasks((p) => p.filter((t) => !selected.includes(t.id))); });
                    }}
                    disabled={selectMode && !selected.length}
                  >
                    <FaTrash /> {selectMode ? "Delete Selected" : "Delete"}
                  </button>
                  <button
                    className="primary-button"
                    onClick={() =>
                      Swal.fire(
                        "Tip",
                        "Use Oral screen’s Create modal to generate tasks per methodology/teams. (Same rules apply.)",
                        "info"
                      )
                    }
                  >
                    <FaPlus /> Create Task
                  </button>
                </div>
              </div>

              {/* Table container */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  {view === 0 ? (
                    <table className="tasks-table">
                      <thead>
                        <tr>
                          {selectMode && (
                            <th className="text-center" style={{ width: 40 }}>
                              <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={(e) => setSelected(e.target.checked ? filtered.map((t) => t.id) : [])}
                                disabled={!filtered.length}
                              />
                            </th>
                          )}
                          <th className="text-center">NO</th>
                          <th className="text-center">Assigned</th>
                          <th className="text-center">Tasks</th>
                          <th className="text-center">SubTasks</th>
                          <th className="text-center">Elements</th>
                          <th className="text-center">Date Created</th>
                          <th className="text-center">Due Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.length ? (
                          filtered.map((t, idx) => (
                            <tr key={t.id}>
                              {selectMode && (
                                <td className="text-center">
                                  <input
                                    type="checkbox"
                                    checked={selected.includes(t.id)}
                                    onChange={(e) =>
                                      setSelected((p) => (e.target.checked ? [...p, t.id] : p.filter((x) => x !== t.id)))
                                    }
                                  />
                                </td>
                              )}
                              <td className="text-center">{idx + 1}.</td>
                              <td className="text-center">{t.group_name}</td>
                              <td className="text-center">{clean(t.task) || "-"}</td>
                              <td className="text-center">{t.subtask || "-"}</td>
                              <td className="text-center">{t.elements || "-"}</td>
                              <td className="text-center">
                                {t.date_created ? new Date(t.date_created).toLocaleDateString("en-US") : "-"}
                              </td>
                              <td className="text-center">
                                <FaCalendarAlt className="me-1" /> {t.due_date ? new Date(t.due_date).toLocaleDateString("en-US") : "-"}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={selectMode ? 8 : 7} className="text-center italic text-gray-500 py-8">
                              No tasks found for this filter.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  ) : (
                    <table className="tasks-table">
                      <thead>
                        <tr>
                          <th className="text-center">NO</th>
                          <th className="text-center">Time</th>
                          <th className="text-center">Revision No.</th>
                          <th className="text-center">Status</th>
                          <th className="text-center">Methodology</th>
                          <th className="text-center">Project Phase</th>
                          <th className="text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.length ? (
                          filtered.map((t, idx) => {
                            const frozen = t.status === "Missed";
                            return (
                              <tr key={t.id}>
                                <td className="text-center">{idx + 1}.</td>
                                <td className="text-center"><FaClock className="me-1" /> {fmtTime(t.time)}</td>
                                <td className="text-center">
                                  {frozen ? (
                                    t.revision_no || "No Revision"
                                  ) : (
                                    <div className="position-relative d-inline-flex" style={{ minWidth: 120 }}>
                                      <select
                                        className="form-select"
                                        value={t.revision_no || "No Revision"}
                                        onChange={(e) => setTask(t.id, (cur) => ({ ...cur, revision_no: e.target.value }))}
                                      >
                                        {REVISION_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                                      </select>
                                      <FaChevronDown className="position-absolute" style={{ right: 8, top: 10 }} />
                                    </div>
                                  )}
                                </td>
                                <td className="text-center">
                                  {frozen ? (
                                    <span className="px-2 py-1 rounded text-white" style={{ background: color(t.status) }}>{t.status}</span>
                                  ) : (
                                    <div className="position-relative d-inline-flex" style={{ minWidth: 120 }}>
                                      <select
                                        className="form-select text-white"
                                        style={{ background: color(t.status) }}
                                        value={t.status || "To Do"}
                                        onChange={(e) => onStatus(t.id, e.target.value)}
                                      >
                                        {STATUS_OPTIONS.filter((s) => s !== "Missed").map((s) => (
                                          <option key={s} value={s} style={{ color: "black" }}>{s}</option>
                                        ))}
                                      </select>
                                      <FaChevronDown className="position-absolute text-white" style={{ right: 8, top: 10 }} />
                                    </div>
                                  )}
                                </td>
                                <td className="text-center">{t.methodology || "-"}</td>
                                <td className="text-center">{t.project_phase || "-"}</td>
                                <td className="text-center">
                                  <button
                                    ref={(el) => (kebabRefs.current[t.id] = el)}
                                    className="p-1 rounded hover:bg-gray-100"
                                    onClick={() => setOpenMenu(openMenu === t.id ? null : t.id)}
                                  >
                                    <FaEllipsisV />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="7" className="text-center italic text-gray-500 py-8">No tasks found for this filter.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* nav controls */}
                <div className="d-flex justify-content-end gap-2 border-top px-3 py-2 bg-light">
                  <button className="primary-button" onClick={() => setView(0)} disabled={view === 0}>
                    <FaChevronLeft /> Previous
                  </button>
                  <button className="primary-button" onClick={() => setView(1)} disabled={view === 1}>
                    Next <FaChevronRight />
                  </button>
                </div>
              </div>

              {openMenu && (
                <div className="kebab-menu" style={{ top: menuPos(openMenu).top, left: menuPos(openMenu).left }}>
                  <button className="kebab-menu-item" onClick={() => onUpdate(openMenu)}>
                    <FaEdit size={12} /> Update
                  </button>
                  <button
                    className="kebab-menu-item"
                    onClick={() => {
                      const it = tasks.find((x) => x.id === openMenu);
                      setOpenMenu(null);
                      Swal.fire({
                        icon: "warning",
                        title: "Delete task?",
                        text: clean(it?.task || ""),
                        showCancelButton: true,
                        confirmButtonColor: "#D60606",
                      }).then((ok) => ok.isConfirmed && setTasks((p) => p.filter((x) => x.id !== it.id)));
                    }}
                  >
                    <FaTrash size={12} /> Delete
                  </button>
                  <button className="kebab-menu-item" onClick={() => { setOpenMenu(null); window.location.assign("/TeamsBoard/Task"); }}>
                    <FaEye size={12} /> View
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
