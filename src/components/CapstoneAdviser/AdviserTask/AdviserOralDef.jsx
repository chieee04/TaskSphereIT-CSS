// src/components/CapstoneAdviser/AdviserOralDef.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  FaClock, FaChevronDown, FaChevronLeft, FaEllipsisV, FaEdit, FaEye, FaTrash,
  FaFilter, FaPlus, FaTasks, FaCheck
} from "react-icons/fa";

import { fetchTasksFromDB } from "../../../services/Adviser/AdCapsTask";

const ACCENT = "#5a0d0e";

const STATUS_OPTS  = ["To Do", "In Progress", "To Review", "Completed", "Missed"];
const FILTER_OPTS  = ["All", "To Do", "In Progress", "To Review", "Missed"]; // no Completed
const REV_OPTS     = ["No Revision", ...Array.from({ length: 10 }, (_, i) => {
  const n = i + 1;
  return n === 1 ? "1st Revision" : n === 2 ? "2nd Revision" : n === 3 ? "3rd Revision" : `${n}th Revision`;
})];

const METHODOLOGIES = ["Agile", "Extreme Programming", "Prototyping", "Scrum", "Waterfall"];
const PHASES        = ["Planning", "Design", "Development", "Testing", "Deployment"];

const AdviserOralDef = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [menuFor, setMenuFor] = useState(null);
  const kebabRefs = useRef({});

  useEffect(() => { fetchTasksFromDB(setTasks); }, []);

  const formatTime = (v) => {
    if (!v) return "8:00 AM";
    const t = v.split("+")[0];
    const [hh, mm] = t.split(":");
    let h = parseInt(hh, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${mm} ${ampm}`;
  };
  const clean = (s) => (s || "").replace(/^\d+\.\s*/, "");
  const isMissed = (t) => t.status === "Missed";
  const revCount = (txt) => (txt && txt !== "No Revision" ? parseInt(txt, 10) || 0 : 0);
  const nextRev  = (txt) => {
    const n = Math.min(10, revCount(txt) + 1);
    if (n === 0) return "No Revision";
    if (n === 1) return "1st Revision";
    if (n === 2) return "2nd Revision";
    if (n === 3) return "3rd Revision";
    return `${n}th Revision`;
  };

  // -------- helpers ----------
  const uniqList = (arr) =>
    Array.from(
      new Set(
        (arr || [])
          .map((v) => (v ?? "").toString().trim())
          .filter((v) => v.length > 0)
      )
    );

  // -------- Create Task ----------
  const openCreate = async () => {
    const allTeams = Array.from(
      new Map(
        (tasks || [])
          .filter((t) => t.group_name)
          .map((t) => [t.group_name, { group_name: t.group_name, methodology: t.methodology || "Agile" }])
      ).values()
    );

    const taskChoices = uniqList((tasks || []).map((t) => clean(t.task)));
    const subChoices  = uniqList((tasks || []).map((t) => t.subtask));
    const elmChoices  = uniqList((tasks || []).map((t) => t.elements));

    const { value, isConfirmed } = await Swal.fire({
      title: `<div style="color:${ACCENT};font-weight:700">Create Task</div>`,
      html: `
        <div id="ct-wrap" style="text-align:left;max-height:none">
          <label style="font-weight:600;color:#222">Methodology</label>
          <select id="c-method" class="swal2-input" style="width:100%;margin:4px 0 10px;background:${ACCENT};color:#fff;border:none"></select>

          <label style="font-weight:600;color:#222">Teams (multi-select)</label>
          <div id="c-teams" style="border:1px solid #ddd;border-radius:8px;padding:8px;height:140px;overflow:auto;margin:4px 0 12px"></div>

          <label style="font-weight:600;color:#222">Task</label>
          <div style="display:flex;gap:8px;align-items:center;margin:4px 0 8px">
            <select id="c-task" class="swal2-input"
                    style="flex:1;background:${ACCENT};color:#fff;border:none">
            </select>
            <input id="c-task-custom" class="swal2-input" placeholder="Custom task"
                   style="flex:1;display:none;border:1px solid ${ACCENT};background:#fff;color:#111">
          </div>

          <label style="font-weight:600;color:#222">Subtask</label>
          <div style="display:flex;gap:8px;align-items:center;margin:4px 0 8px">
            <select id="c-sub" class="swal2-input"
                    style="flex:1;background:${ACCENT};color:#fff;border:none">
            </select>
            <input id="c-sub-custom" class="swal2-input" placeholder="Custom subtask"
                   style="flex:1;display:none;border:1px solid ${ACCENT};background:#fff;color:#111">
          </div>

          <label style="font-weight:600;color:#222">Elements</label>
          <div style="display:flex;gap:8px;align-items:center;margin:4px 0 8px">
            <select id="c-elm" class="swal2-input"
                    style="flex:1;background:${ACCENT};color:#fff;border:none">
            </select>
            <input id="c-elm-custom" class="swal2-input" placeholder="Custom elements"
                   style="flex:1;display:none;border:1px solid ${ACCENT};background:#fff;color:#111">
          </div>

          <label style="font-weight:600;color:#222">Project Phase</label>
          <select id="c-phase" class="swal2-input"
                  style="width:100%;margin:4px 0 8px;background:${ACCENT};color:#fff;border:none"></select>

          <label style="font-weight:600;color:#222;display:block">Comment (optional)</label>
          <div style="display:flex;justify-content:center">
            <textarea id="c-cmt" class="swal2-textarea" placeholder="Optional..."
                      style="width:100%;max-width:520px;min-height:110px;resize:vertical;border:1px solid ${ACCENT};background:#fff;color:#111"></textarea>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Create",
      confirmButtonColor: ACCENT,
      customClass: { popup: "ct-popup" },
      didOpen: () => {
        const $m = document.getElementById("c-method");
        $m.innerHTML = METHODOLOGIES.map((m) => `<option value="${m}">${m}</option>`).join("");
        const $p = document.getElementById("c-phase");
        $p.innerHTML = PHASES.map((p) => `<option value="${p}">${p}</option>`).join("");

        const $teams = document.getElementById("c-teams");
        const renderTeams = () => {
          const meth = $m.value;
          const list = allTeams.filter((t) => (t.methodology || "Agile") === meth);
          $teams.innerHTML = list.length
            ? list
                .map(
                  (t) => `
              <label style="display:flex;align-items:center;gap:8px;margin:4px 0">
                <input type="checkbox" value="${t.group_name}">
                <span>${t.group_name}</span>
              </label>`
                )
                .join("")
            : `<div style="color:#888">No teams with “${meth}”.</div>`;
        };
        $m.addEventListener("change", renderTeams);
        renderTeams();

        const fillSelect = ($sel, values, placeholder) => {
          const opts = [
            `<option value="" disabled selected>${placeholder}</option>`,
            ...values.map((v) => `<option value="${v}">${v}</option>`),
            `<option value="__custom__">Custom…</option>`,
          ];
          $sel.innerHTML = opts.join("");
        };

        const $task = document.getElementById("c-task");
        const $taskC = document.getElementById("c-task-custom");
        const $sub  = document.getElementById("c-sub");
        const $subC = document.getElementById("c-sub-custom");
        const $elm  = document.getElementById("c-elm");
        const $elmC = document.getElementById("c-elm-custom");

        fillSelect($task, taskChoices, "Select task");
        fillSelect($sub,  subChoices,  "Select subtask");
        fillSelect($elm,  elmChoices,  "Select elements");

        const wireCustomToggle = ($sel, $custom) => {
          const toggle = () => {
            const custom = $sel.value === "__custom__";
            $custom.style.display = custom ? "block" : "none";
            if (custom) $custom.focus();
          };
          $sel.addEventListener("change", toggle);
        };
        wireCustomToggle($task, $taskC);
        wireCustomToggle($sub,  $subC);
        wireCustomToggle($elm,  $elmC);

        const popup = document.querySelector(".ct-popup");
        if (popup) {
          popup.style.maxHeight = "none";
          popup.style.overflow = "visible";
        }
      },
      preConfirm: () => {
        const method = document.getElementById("c-method").value;
        const phase  = document.getElementById("c-phase").value;

        const taskSel = document.getElementById("c-task").value;
        const taskCus = (document.getElementById("c-task-custom").value || "").trim();
        const subSel  = document.getElementById("c-sub").value;
        const subCus  = (document.getElementById("c-sub-custom").value || "").trim();
        const elmSel  = document.getElementById("c-elm").value;
        const elmCus  = (document.getElementById("c-elm-custom").value || "").trim();

        const cmt     = (document.getElementById("c-cmt").value || "").trim();
        const teams   = Array.from(document.querySelectorAll("#c-teams input[type=checkbox]:checked")).map((x) => x.value);

        const task = taskSel === "__custom__" ? taskCus : taskSel;
        const sub  = subSel  === "__custom__" ? subCus  : subSel;
        const elm  = elmSel  === "__custom__" ? elmCus  : elmSel;

        if (!task)  return Swal.showValidationMessage("Task is required");
        if (!teams.length) return Swal.showValidationMessage("Pick at least one team");

        return { method, phase, task, sub, elm, cmt, teams };
      },
    });

    if (!isConfirmed) return;

    const dup = (g) =>
      tasks.some(
        (t) =>
          (t.group_name || "") === g &&
          clean(t.task).toLowerCase() === value.task.toLowerCase() &&
          (t.subtask || "").toLowerCase() === (value.sub || "").toLowerCase() &&
          (t.elements || "").toLowerCase() === (value.elm || "").toLowerCase()
      );

    const blocked = value.teams.filter(dup);
    if (blocked.length) {
      await Swal.fire({
        icon: "error",
        title: "Duplicate task for team(s)",
        html: `Already exists for: <b>${blocked.join(", ")}</b>`,
        confirmButtonColor: ACCENT,
      });
      return;
    }

    const now = new Date();
    const toAdd = value.teams.map((g, i) => ({
      id: `${Date.now()}-${i}`,
      group_name: g,
      methodology: value.method,
      project_phase: value.phase,
      task: value.task,
      subtask: value.sub || "",
      elements: value.elm || "",
      comment: value.cmt || null,
      status: "To Do",
      revision_no: "No Revision",
      date_created: now.toISOString(),
      due_date: null,
      time: null,
      task_type: "Oral Defense",
    }));

    setTasks((prev) => [...toAdd, ...prev]);
    Swal.fire({
      icon: "success",
      title: "Task(s) created",
      text: `${toAdd.length} task(s) added.`,
      confirmButtonColor: ACCENT,
    });
  };

  // ---------- filter/search ----------
  const filtered = (tasks || [])
    .filter(t => t.group_name && t.group_name.trim() !== "")
    .filter(t => (filter === "All" ? true : t.status === filter))
    .filter(t => (t.group_name || "").toLowerCase().includes(search.toLowerCase()));

  const allSelected = filtered.length > 0 && selectedIds.length === filtered.length;
  const toggleSelectAll = (v) => setSelectedIds(v ? filtered.map(t => t.id) : []);
  const toggleSelectOne = (id, v) => setSelectedIds(p => v ? [...p, id] : p.filter(x => x !== id));

  const deleteSelected = async () => {
    if (!selectedIds.length) return;
    const ok = await Swal.fire({
      icon: "warning",
      title: "Delete selected tasks?",
      text: `You are about to delete ${selectedIds.length} task(s).`,
      showCancelButton: true,
      confirmButtonColor: "#d60606",
      cancelButtonColor: "#6c757d"
    });
    if (!ok.isConfirmed) return;
    setTasks(prev => prev.filter(t => !selectedIds.includes(t.id)));
    setSelectedIds([]);
    setSelectMode(false);
    Swal.fire({ icon: "success", title: "Deleted", confirmButtonColor: ACCENT });
  };

  // ---------- status / revision ----------
  const patch = (id, fn) => setTasks(prev => prev.map(t => (t.id === id ? fn(t) : t)));

  const changeStatus = async (id, newStatus) => {
    const t = tasks.find(x => x.id === id);
    if (!t || isMissed(t)) return;

    if (newStatus === "Completed") {
      const ok = await Swal.fire({
        icon: "question",
        title: "Mark as Completed?",
        text: `Confirm to mark "${clean(t.task)}" as completed.`,
        showCancelButton: true,
        confirmButtonColor: ACCENT
      });
      if (!ok.isConfirmed) return;
      patch(id, c => ({ ...c, status: "Completed", date_completed: new Date().toISOString().slice(0, 10) }));
      return;
    }
    patch(id, c => ({ ...c, status: newStatus }));
  };

  const openUpdate = (id) => {
    const t = tasks.find(x => x.id === id);
    if (!t) return;

    if (isMissed(t)) {
      const nxt = nextRev(t.revision_no);
      const capped = revCount(nxt) >= 10;
      patch(id, c => ({ ...c, revision_no: nxt, status: capped ? "Missed" : "To Do" }));
      Swal.fire({
        icon: "success",
        title: capped ? "Revision maxed (10). Task remains Missed." : "Revision +1; status reset to To Do.",
        confirmButtonColor: ACCENT
      });
      setMenuFor(null);
      return;
    }

    Swal.fire({
      title: `<div style="color:${ACCENT};font-weight:700">Update Task</div>`,
      html: `
        <div style="text-align:left">
          <label style="font-weight:600">Revision No.</label>
          <select id="u-rev" class="swal2-input" style="width:100%;margin:4px 0 10px;background:${ACCENT};color:#fff;border:none">
            ${REV_OPTS.map(o => `<option ${o === (t.revision_no || "No Revision") ? "selected":""}>${o}</option>`).join("")}
          </select>

          <label style="font-weight:600">Status</label>
          <select id="u-status" class="swal2-input" style="width:100%;margin:4px 0 10px;background:${ACCENT};color:#fff;border:none">
            ${STATUS_OPTS.map(s => `<option ${s === (t.status || "To Do") ? "selected":""}>${s}</option>`).join("")}
          </select>

          <label style="font-weight:600">Methodology</label>
          <select id="u-meth" class="swal2-input" style="width:100%;margin:4px 0 10px;background:${ACCENT};color:#fff;border:none">
            ${METHODOLOGIES.map(m => `<option ${m === (t.methodology || "Agile") ? "selected":""}>${m}</option>`).join("")}
          </select>

          <label style="font-weight:600">Project Phase</label>
          <select id="u-phase" class="swal2-input" style="width:100%;background:${ACCENT};color:#fff;border:none">
            ${PHASES.map(p => `<option ${p === (t.project_phase || "Planning") ? "selected":""}>${p}</option>`).join("")}
          </select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Save",
      confirmButtonColor: ACCENT,
      preConfirm: () => ({
        revision_no: document.getElementById("u-rev").value,
        status:      document.getElementById("u-status").value,
        methodology: document.getElementById("u-meth").value,
        project_phase: document.getElementById("u-phase").value
      })
    }).then(res => {
      if (!res.isConfirmed) return;
      const v = res.value;
      const capped = revCount(v.revision_no) >= 10 && v.status !== "Completed";
      patch(id, c => ({ ...c, ...v, status: capped ? "Missed" : v.status }));
      Swal.fire({ icon: "success", title: capped ? "Revision maxed (10) → Missed" : "Saved", confirmButtonColor: ACCENT });
    });

    setMenuFor(null);
  };

  const openView = (id) => {
    const t = tasks.find(x => x.id === id);
    setMenuFor(null);
    navigate("/Adviser/TeamsBoard/ViewTask", { state: { taskId: id, team: t?.group_name } });
  };

  const menuPos = (id) => {
    const el = kebabRefs.current[id];
    if (!el) return { top: 0, left: 0 };
    const r = el.getBoundingClientRect();
    return { top: r.bottom + window.scrollY, left: r.right + window.scrollX - 140 };
  };

  const backToTasks = () => navigate("/Adviser/Tasks");

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <style>{`
        .section-title{font-weight:600;color:${ACCENT};display:flex;align-items:center}
        .divider{height:1.5px;background:${ACCENT};border:none;border-radius:50px}
        .primary-button{font-size:.85rem;padding:6px 12px;border-radius:6px;border:1.5px solid ${ACCENT};background:#fff;color:${ACCENT};font-weight:500;cursor:pointer;display:flex;align-items:center;gap:6px}
        .primary-button:hover{background:#f0f0f0}
        .select-accent{appearance:none;background:${ACCENT};color:#fff;padding:.375rem 2rem .375rem .5rem;border-radius:.375rem;border:none;min-width:9rem}
        .select-accent option{ color:#111; background:#fff; }
        .select-wrapper{ position:relative; display:inline-flex; align-items:center; }
        .select-wrapper .chev{ position:absolute; right:.5rem; pointer-events:none; color:#fff; }
        .kebab{border:none;background:transparent;padding:.25rem;border-radius:.375rem}
        .kebab:hover{background:#f3f3f3}
        .kmenu{position:fixed; background:#fff; border:1px solid #ddd; border-radius:.5rem; box-shadow:0 2px 10px rgba(0,0,0,.12); padding:.25rem 0; z-index:9999; min-width:140px}
        .kitem{display:flex;align-items:center;gap:.5rem; padding:.5rem .75rem; width:100%; background:transparent; border:none; text-align:left}
        .kitem:hover{background:#f7f7f7}
        .tbl{width:100%; border-collapse:collapse}
        .tbl th{background:#fafafa; color:${ACCENT}; font-weight:600; text-transform:uppercase; font-size:.75rem; padding:.75rem .5rem; border-bottom:1px solid #e6e6e6}
        .tbl td{padding:.5rem; border-bottom:1px solid #eee; font-size:.9rem; vertical-align:middle}
      `}</style>

      {/* Content */}
      <div className="flex-1">
        <div className="px-4 sm:px-6 lg:px-8 py-5">
          {/* Header with Back on the LEFT (same as Final Def) */}
          <div className="flex items-center gap-2 mb-2">
            <button className="primary-button" onClick={backToTasks} title="Back to Tasks">
              <FaChevronLeft /> Back
            </button>
            <h2 className="section-title gap-2">
              <FaTasks /> Oral Defense
            </h2>
          </div>
          <hr className="my-3 divider" />

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search team…"
                className="border border-gray-300 rounded-md px-3 py-2 w-64 bg-white"
              />
              <div className="relative">
                <button className="primary-button"><FaFilter size={14}/> Filter: {filter}</button>
                <select
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  {FILTER_OPTS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectMode && (
                <button className="primary-button" onClick={() => { setSelectMode(false); setSelectedIds([]); }}>
                  Cancel
                </button>
              )}
              <button
                className="primary-button"
                onClick={() => (selectMode ? deleteSelected() : setSelectMode(true))}
                disabled={selectMode && selectedIds.length === 0}
                style={selectMode && selectedIds.length === 0 ? { opacity: .6, cursor: "not-allowed" } : undefined}
              >
                <FaTrash size={14}/> {selectMode ? "Delete Selected" : "Delete"}
              </button>
              <button className="primary-button" onClick={openCreate}>
                <FaPlus size={14}/> Create Task
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow-sm">
            <table className="tbl">
              <thead>
                <tr>
                  {selectMode && (
                    <th className="text-center" style={{ width: 40 }}>
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(e) => toggleSelectAll(e.target.checked)}
                        disabled={!filtered.length}
                      />
                    </th>
                  )}
                  <th className="text-center">No</th>
                  <th className="text-center">Assigned</th>
                  <th className="text-center">Task</th>
                  <th className="text-center">Subtask</th>
                  <th className="text-center">Elements</th>
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
                  filtered.map((t, i) => {
                    const frozen = isMissed(t);
                    const revTick  = t.revision_no && t.revision_no !== "No Revision";
                    const statTick = t.status && t.status !== "To Do";
                    return (
                      <tr key={t.id} className="hover:bg-gray-50">
                        {selectMode && (
                          <td className="text-center">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(t.id)}
                              onChange={(e) => toggleSelectOne(t.id, e.target.checked)}
                            />
                          </td>
                        )}
                        <td className="text-center">{i + 1}.</td>
                        <td className="text-center">{t.group_name}</td>
                        <td className="text-center">{clean(t.task) || "-"}</td>
                        <td className="text-center">{t.subtask || "-"}</td>
                        <td className="text-center">{t.elements || "-"}</td>
                        <td className="text-center">
                          <FaClock className="inline mr-1" style={{ color: ACCENT }}/> {formatTime(t.time)}
                        </td>

                        {/* Revision */}
                        <td className="text-center">
                          {frozen ? (
                            <span className="inline-flex items-center gap-1" style={{ color: ACCENT }}>
                              {t.revision_no || "No Revision"} {revTick && <FaCheck />}
                            </span>
                          ) : (
                            <span className="select-wrapper">
                              <select
                                className="select-accent"
                                value={t.revision_no || "No Revision"}
                                onChange={(e) => patch(t.id, c => ({ ...c, revision_no: e.target.value }))}
                              >
                                {REV_OPTS.map(o => <option key={o}>{o}</option>)}
                              </select>
                              <FaChevronDown className="chev" />
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="text-center">
                          {frozen ? (
                            <span className="inline-flex items-center gap-1 text-white px-2 py-1 rounded" style={{ background: ACCENT }}>
                              {t.status} {statTick && <FaCheck className="text-white" />}
                            </span>
                          ) : (
                            <span className="select-wrapper">
                              <select
                                className="select-accent"
                                value={t.status || "To Do"}
                                onChange={(e) => changeStatus(t.id, e.target.value)}
                              >
                                {STATUS_OPTS.filter(s => s !== "Missed").map(s => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                              <FaChevronDown className="chev" />
                            </span>
                          )}
                        </td>

                        <td className="text-center">{t.methodology || "-"}</td>
                        <td className="text-center">{t.project_phase || "-"}</td>

                        <td className="text-center">
                          <button
                            ref={(el) => (kebabRefs.current[t.id] = el)}
                            className="kebab"
                            onClick={() => setMenuFor(menuFor === t.id ? null : t.id)}
                            title="More actions"
                          >
                            <FaEllipsisV />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      className="text-center italic text-gray-500 py-8"
                      colSpan={selectMode ? 12 : 11}
                    >
                      No tasks found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Kebab menu */}
          {menuFor && (
            <div className="kmenu" style={menuPos(menuFor)}>
              <button className="kitem" onClick={() => openUpdate(menuFor)}>
                <FaEdit size={12}/> Update
              </button>
              <button className="kitem" onClick={() => openView(menuFor)}>
                <FaEye size={12}/> View
              </button>
              <button
                className="kitem"
                onClick={() => {
                  const t = tasks.find(x => x.id === menuFor);
                  setMenuFor(null);
                  Swal.fire({
                    icon: "warning",
                    title: "Delete task?",
                    text: clean(t?.task || ""),
                    showCancelButton: true,
                    confirmButtonColor: "#d60606"
                  }).then(res => {
                    if (res.isConfirmed) setTasks(prev => prev.filter(x => x.id !== menuFor));
                  });
                }}
              >
                <FaTrash size={12}/> Delete
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Footer stays pinned by min-h-screen + flex-1 in your app layout */}
    </div>
  );
};

export default AdviserOralDef;
