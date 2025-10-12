// src/pages/AdviserTeamsSummary.jsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { FaSearch } from "react-icons/fa";

ChartJS.register(ArcElement, Tooltip, Legend);

const ACCENT = "#5a0d0e";
const STATUS_ORDER = ["To Do", "In Progress", "To Review", "Completed", "Missed"];
const STATUS_COLORS = {
  "To Do": "#FABC3F",
  "In Progress": "#809D3C",
  "To Review": "#578FCA",
  "Completed": ACCENT,
  "Missed": "#FF6384",
};

export default function AdviserTeamsSummary() {
  const [view, setView] = useState("summary");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [adviserId, setAdviserId] = useState(null);

  // Summary
  const [teams, setTeams] = useState([]); // [{name, preview}]
  const [teamSearch, setTeamSearch] = useState("");

  // Detail
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [progress, setProgress] = useState({
    "To Do": 0,
    "In Progress": 0,
    "To Review": 0,
    "Completed": 0,
    "Missed": 0,
  });
  const [tasks, setTasks] = useState([]);

  // Resolve adviser id (user_credentials.id) from localStorage customUser.user_id
  useEffect(() => {
    (async () => {
      try {
        setErr("");
        const raw = localStorage.getItem("customUser");
        if (!raw) return setErr("No logged-in user.");
        const u = JSON.parse(raw);
        if (!u?.user_id) return setErr("Cannot resolve user id.");

        const { data, error } = await supabase
          .from("user_credentials")
          .select("id, user_id")
          .eq("user_id", u.user_id)
          .single();
        if (error) throw error;
        setAdviserId(data?.id || null);
      } catch {
        setErr("Failed to load adviser profile.");
      }
    })();
  }, []);

  // Load teams the adviser handles (distinct group_name across adviser tables)
  useEffect(() => {
    if (!adviserId) return;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const tables = ["adviser_final_def", "adviser_oral_def"];
        const groups = new Set();

        for (const t of tables) {
          const { data, error } = await supabase
            .from(t)
            .select("group_name, adviser_id")
            .eq("adviser_id", adviserId);
          if (!error && data) {
            data.forEach((r) => r.group_name && groups.add(r.group_name));
          }
        }

        const result = [];
        for (const g of [...groups].sort((a, b) => a.localeCompare(b))) {
          let preview = "Team";
          const { data: anyMember } = await supabase
            .from("user_credentials")
            .select("first_name,last_name,group_name")
            .eq("group_name", g)
            .limit(1);
          if (anyMember && anyMember.length) {
            const m = anyMember[0];
            preview = `${m.last_name || m.first_name || "Member"}, Et Al`;
          }
          result.push({ name: g, preview });
        }
        setTeams(result);
      } catch {
        setErr("Failed to load teams.");
      } finally {
        setLoading(false);
      }
    })();
  }, [adviserId]);

  // Open a team (detail)
  const openTeam = async (groupName) => {
    setSelectedTeam(groupName);
    setView("detail");
    setLoading(true);
    setErr("");
    try {
      // Members
      let mems = [];
      const { data: m1 } = await supabase
        .from("user_credentials")
        .select("first_name,last_name,role,group_name")
        .eq("group_name", groupName);
      if (m1) mems = m1;

      // Tasks + status counts from adviser tables
      const tables = ["adviser_final_def", "adviser_oral_def"];
      const counts = { "To Do": 0, "In Progress": 0, "To Review": 0, "Completed": 0, "Missed": 0 };
      let merged = [];

      for (const t of tables) {
        const { data } = await supabase.from(t).select("*").eq("group_name", groupName);

        if (data) {
          data.forEach((row) => {
            const s = (row.status || "To Do").trim();
            if (counts[s] !== undefined) counts[s]++;

            merged.push({
              id: row.id,
              task: row.task || row.task_name || "Untitled Task",
              subtask: row.subtask || row.subtasks || "No Subtask",
              elements: row.elements || "-",
              due_date: row.due_date || null,
              time: row.time || row.due_time || null,
              revisions_no:
                row.revisions_no != null
                  ? String(row.revisions_no)
                  : row.revisions !== undefined
                  ? String(row.revisions)
                  : "No Revisions",
            });
          });
        }
      }

      mems.sort(
        (a, b) =>
          (a.role || "").localeCompare(b.role || "") ||
          (a.last_name || "").localeCompare(b.last_name || "")
      );
      merged.sort((a, b) => new Date(a.due_date || 0) - new Date(b.due_date || 0));

      if (!mems.length) {
        mems = [{ first_name: "—", last_name: "No members linked", role: "" }];
      }

      setMembers(mems);
      setProgress(counts);
      setTasks(merged);
    } catch {
      setErr("Failed to load team details.");
    } finally {
      setLoading(false);
    }
  };

  // Donut chart data
  const donut = useMemo(() => {
    const labels = STATUS_ORDER;
    const data = labels.map((k) => progress[k] || 0);
    const total = data.reduce((a, b) => a + b, 0);
    return {
      total,
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: labels.map((l) => STATUS_COLORS[l]),
            borderWidth: 1,
          },
        ],
      },
    };
  }, [progress]);

  // Filtered teams for summary search
  const visibleTeams = teams.filter((t) =>
    (t.name || "").toLowerCase().includes(teamSearch.toLowerCase())
  );

  return (
    // Same shell as your other pages so the footer stays pinned
    <div className="min-h-screen flex flex-col bg-white">
      <div className="flex-1">
        <div className="container mx-auto px-6 py-6">
          {/* Header */}
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: ACCENT }} />
            <h1 className="text-sm font-semibold" style={{ color: ACCENT }}>
              {view === "summary" ? "Teams Summary" : `Teams Summary › ${selectedTeam}`}
            </h1>
          </div>
          <hr className="mb-4" style={{ borderColor: ACCENT }} />

          {/* Error */}
          {err && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {err}
            </div>
          )}

          {/* SUMMARY VIEW */}
          {view === "summary" && (
            <>
              {/* White search bar (like the other screens) */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <div className="relative w-full md:max-w-xs">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={teamSearch}
                    onChange={(e) => setTeamSearch(e.target.value)}
                    placeholder="Search team"
                    className="w-full border rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 bg-white text-gray-900 placeholder-gray-400"
                    style={{ borderColor: "#B2B2B2", backgroundColor: "#FFFFFF" }}
                  />
                </div>
              </div>

              {loading ? (
                <div className="py-10 text-center text-sm text-neutral-500">Loading teams…</div>
              ) : visibleTeams.length === 0 ? (
                <div className="py-10 text-center text-sm text-neutral-500">
                  {teams.length === 0 ? "No groups found for your account." : "No teams match your search."}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {visibleTeams.map((t) => (
                    <button
                      key={t.name}
                      onClick={() => openTeam(t.name)}
                      className="group flex flex-col rounded-xl border border-neutral-200 bg-white shadow-sm outline-none transition hover:shadow-md"
                    >
                      <div className="flex flex-1 flex-col items-center gap-3 px-4 pt-5 pb-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-neutral-700" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path fillRule="evenodd" d="M3 14s1-1 5-1 5 1 5 1v1H3v-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-neutral-900">{t.name}</div>
                        </div>
                      </div>
                      <div
                        className="rounded-b-xl px-4 py-2 text-center text-xs font-medium text-white"
                        style={{ backgroundColor: ACCENT }}
                      >
                        {t.preview}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* DETAIL VIEW */}
          {view === "detail" && (
            <>
              <div className="mb-4 flex items-center justify-between">
                <button
                  onClick={() => setView("summary")}
                  className="rounded-md border border-neutral-300 px-3 bg-[#5a0d0e] py-1.5 text-sm font-medium text-white hover:bg-[#7a1a1b] focus:outline-none focus:ring-2 focus:ring-[#5a0d0e]/50 transition"
                >
                  ← Back
                </button>
              </div>

              {loading ? (
                <div className="py-10 text-center text-sm text-neutral-500">Loading team details…</div>
              ) : (
                <>
                  {/* Members + Donut */}
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Members */}
                    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
                      <div className="border-b px-4 py-2 text-sm font-semibold text-neutral-800">Team</div>
                      <div className="max-h-[260px] overflow-y-auto">
                        <table className="min-w-full text-sm">
                          <thead className="sticky top-0 bg-neutral-50">
                            <tr className="text-left text-neutral-600">
                              <th className="w-14 px-4 py-2">NO</th>
                              <th className="px-4 py-2">Name</th>
                              <th className="w-40 px-4 py-2">Role</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {members.map((m, i) => (
                              <tr key={`${m.first_name}-${m.last_name}-${i}`}>
                                <td className="px-4 py-2">{i + 1}.</td>
                                <td className="px-4 py-2">
                                  {`${m.first_name || ""} ${m.last_name || ""}`.trim() || "—"}
                                </td>
                                <td className="px-4 py-2">{m.role || "Member"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Progress donut */}
                    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
                      <div className="border-b px-4 py-2 text-sm font-semibold text-neutral-800">Tasks Progress</div>
                      <div className="flex flex-col items-center gap-4 p-4 sm:flex-row sm:items-start">
                        <div className="mx-auto h-[220px] w-[220px]">
                          <Pie
                            data={donut.data}
                            options={{
                              maintainAspectRatio: false,
                              plugins: { legend: { display: false } },
                            }}
                          />
                        </div>
                        <ul className="space-y-2 text-sm">
                          {STATUS_ORDER.map((label) => (
                            <li key={label} className="flex items-center gap-2">
                              <span
                                className="inline-block h-3 w-3 rounded-sm"
                                style={{ backgroundColor: STATUS_COLORS[label] }}
                              />
                              <span className="text-neutral-700">{label}</span>
                              <span className="ml-2 rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700">
                                {progress[label] || 0}
                              </span>
                            </li>
                          ))}
                          <li className="mt-1 text-xs text-neutral-500">
                            Total: <b>{donut.total}</b>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Team Tasks */}
                  <div className="mt-6 rounded-xl border border-neutral-200 bg-white shadow-sm">
                    <div className="border-b px-4 py-2 text-sm font-semibold text-neutral-800">Team Tasks</div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-neutral-50">
                          <tr className="text-left text-neutral-600">
                            <th className="w-14 px-4 py-3">NO</th>
                            <th className="px-4 py-3">Task</th>
                            <th className="px-4 py-3">Subtask</th>
                            <th className="px-4 py-3">Elements</th>
                            <th className="px-4 py-3">Due Date</th>
                            <th className="px-4 py-3">Time</th>
                            <th className="px-4 py-3">Revisions NO</th>
                            <th className="w-24 px-4 py-3">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {tasks.length === 0 ? (
                            <tr>
                              <td className="px-4 py-6 text-center text-neutral-500" colSpan={8}>
                                No tasks
                              </td>
                            </tr>
                          ) : (
                            tasks.map((t, i) => (
                              <tr key={t.id}>
                                <td className="px-4 py-3">{i + 1}.</td>
                                <td className="px-4 py-3">{t.task}</td>
                                <td className="px-4 py-3">{t.subtask}</td>
                                <td className="px-4 py-3">{t.elements || "-"}</td>
                                <td className="px-4 py-3">
                                  {t.due_date ? new Date(t.due_date).toLocaleDateString() : "—"}
                                </td>
                                <td className="px-4 py-3">{t.time || "—"}</td>
                                <td className="px-4 py-3">{t.revisions_no}</td>
                                <td className="px-4 py-3">
                                  <button
                                    className="rounded-md border px-2 py-1 text-xs font-medium bg-[#5a0d0e] text-white hover:bg-[#7a1a1b] focus:outline-none focus:ring-2 focus:ring-[#5a0d0e]/50 transition"
                                    style={{ borderColor: ACCENT }}
                                    title="View"
                                    onClick={() => console.log("view task", t)}
                                  >
                                    View
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
