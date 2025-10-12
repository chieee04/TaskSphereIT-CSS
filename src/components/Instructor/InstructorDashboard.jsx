// src/pages/Instructor/InstructorDashboard.jsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../Sidebar";
import Teams from "./Teams";
import Schedule from "./Schedule";
import StudentCredentials from "./StudentCredentials";
import AdviserCredentials from "./AdviserCredentials";
import Enroll from "./Enroll-Member";
import Adviser from "./Adviser-Enroll";
import TitleDefense from "./TitleDefense";
import ManuScript from "./ManuScript";
import OralDefense from "./OralDefense";
import { useAuthGuard } from "../../components/hooks/useAuthGuard";

import Footer from "../Footer";
import Header from "../Header";
import SoloModeDashboard from "../SoloMode/SoloModeDashboard";
import SoloModeTasks from "../SoloMode/SoloModeTasks";
import SoloModeTasksBoard from "../SoloMode/SoloModeTasksBoard";
import SoloModeTasksRecord from "../SoloMode/SoloModeTasksRecord";
import Profile from "../Profile";
import FinalDefense from "./FinalDefense";
import RoleTransfer from "./RolesTransfer";
import { supabase } from "../../supabaseClient";

// ToS modal + auth context
import TermsOfService from "../../components/TermsOfService";
import { UserAuth } from "../../Contex/AuthContext";

// FullCalendar
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

// Chart.js
import { Chart as ChartJS, Tooltip, Legend, ArcElement } from "chart.js";
import { Doughnut } from "react-chartjs-2";
ChartJS.register(Tooltip, Legend, ArcElement);

const TASKSPHERE_PURPLE = "#805ad5";

// Version your ToS so you can reprompt after changes
const TOS_VERSION = "2025-05-09"; // bump to re-prompt

// ---------- Helpers for ToS ----------
const getUserKey = (u) =>
  u?.email ||
  u?.user_email ||
  u?.username ||
  u?.user_key ||
  u?.userId ||
  u?.user_id ||
  u?.id ||
  null;

async function fetchTosAcceptance(userKey, role) {
  const { data, error } = await supabase
    .from("tos_acceptance")
    .select("user_key")
    .eq("user_key", userKey)
    .eq("role", Number(role || 0))
    .eq("version", TOS_VERSION)
    .maybeSingle();
  if (error && error.code !== "PGRST116") throw error;
  return !!data;
}

async function acceptTos(userKey, role) {
  // insert; if you later add a UNIQUE constraint on (user_key, role, version),
  // you can switch this to upsert.
  const { error } = await supabase.from("tos_acceptance").insert({
    user_key: userKey,
    role: Number(role || 0),
    version: TOS_VERSION,
  });
  // Ignore duplicate-key error if you add a unique constraint later
  if (error && error.code !== "23505") throw error;
}

// -------- Team Progress ----------
const AdviserTeamProgress = ({ teamsProgress }) => {
  const completion = (counts) => {
    const total = Object.values(counts).reduce((s, c) => s + c, 0);
    const done = counts["Completed"] || 0;
    return total > 0 ? Math.round((done / total) * 100) : 0;
  };

  return (
    <div className="team-progress-container">
      {teamsProgress.length > 0 ? (
        <div className="progress-grid">
          {teamsProgress.map((team, idx) => {
            const totalTasks = Object.values(team.counts).reduce((s, c) => s + c, 0);
            const pct = completion(team.counts);

            const chartData = {
              labels: ["Completed", "Remaining"],
              datasets: [
                {
                  label: "Tasks",
                  data: [team.counts["Completed"] || 0, totalTasks - (team.counts["Completed"] || 0)],
                  backgroundColor: ["#AA60C8", "#e9ecef"],
                  borderColor: "#ffffff",
                  borderWidth: 2,
                  cutout: "70%",
                },
              ],
            };
            const chartOptions = {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false }, tooltip: { enabled: false } },
            };

            return (
              <div key={idx} className="progress-card">
                <div className="progress-card-header">
                  <h5>{team.group_name}</h5>
                  <span className="total-tasks">Total: {totalTasks} tasks</span>
                </div>
                <div className="chart-container">
                  <div style={{ width: 200, height: 200, margin: "auto", position: "relative" }}>
                    <Doughnut data={chartData} options={chartOptions} />
                    <div className="chart-center-percentage">
                      <span className="percentage-value">{pct}%</span>
                      <span className="percentage-label">Completed</span>
                    </div>
                  </div>
                </div>
                <div className="progress-stats">
                  <div className="stat-item">
                    <span className="stat-label">Completed:</span>
                    <span className="stat-value" style={{ color: "#4BC0C0" }}>
                      {team.counts["Completed"] || 0}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">In Progress:</span>
                    <span className="stat-value" style={{ color: "#809D3C" }}>
                      {team.counts["In Progress"] || 0}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">To Do:</span>
                    <span className="stat-value" style={{ color: "#FABC3F" }}>
                      {team.counts["To Do"] || 0}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">To Review:</span>
                    <span className="stat-value" style={{ color: "#578FCA" }}>
                      {team.counts["To Review"] || 0}
                    </span>
                  </div>
                  {team.task_breakdown && (
                    <div className="task-breakdown">
                      <small className="text-muted">
                        {team.task_breakdown.manager_tasks} manager tasks,{" "}
                        {team.task_breakdown.adviser_oral_tasks} oral defense,{" "}
                        {team.task_breakdown.adviser_final_tasks} final defense
                      </small>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="no-teams-message">
          <i className="fas fa-users fa-3x text-muted mb-3"></i>
          <p className="fst-italic text-muted">No teams with tasks to display progress.</p>
        </div>
      )}
    </div>
  );
};

const AdviserGroupSection = ({ adviserGroup, teams, adviserName }) => (
  <div className="adviser-group-section">
    <div className="adviser-group-header">
      <div className="adviser-info">
        <i className="fas fa-user-tie"></i>
        <div>
          <h4>{adviserName || `Adviser Group: ${adviserGroup}`}</h4>
        </div>
      </div>
    </div>
    <AdviserTeamProgress teamsProgress={teams} />
  </div>
);

const ProgressCircle = ({ percentage }) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const isFilled = percentage > 0;
  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r={radius} fill="none" stroke="#f0f0f0" strokeWidth="12" />
      {isFilled && (
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={TASKSPHERE_PURPLE}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
        />
      )}
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="1.5rem"
        fontWeight="bold"
        fill={isFilled ? TASKSPHERE_PURPLE : "#ccc"}
      >
        {percentage}%
      </text>
    </svg>
  );
};

const TeamCard = ({ adviser, teams }) => (
  <div className="team-card">
    <div className="adviser-header">
      <i className="fas fa-user-tie"></i>
      <span>{adviser}</span>
    </div>
    <div className="team-progress-container">
      {teams.map((team, index) => (
        <div key={index} className="team-item">
          <div className="team-name">
            <i className="fas fa-users"></i>
            <span>{team.name}</span>
          </div>
          <ProgressCircle percentage={team.progress} />
        </div>
      ))}
    </div>
  </div>
);

const InstructorDashboard = () => {
  useAuthGuard();

  const { logout } = UserAuth?.() || { logout: null };
  const navigate = useNavigate();
  const { subPage } = useParams();

  // ===== ToS state =====
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("customUser") || "null");
    } catch {
      return null;
    }
  }, []);
  const userKey = getUserKey(storedUser);
  const role = Number(storedUser?.user_roles || 0);

  const [checkingTos, setCheckingTos] = useState(true);
  const [showTos, setShowTos] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!userKey) {
          if (alive) setShowTos(false);
          return;
        }
        const accepted = await fetchTosAcceptance(userKey, role);
        if (alive) setShowTos(!accepted);
      } catch (e) {
        console.error("ToS check failed:", e);
        if (alive) setShowTos(true);
      } finally {
        if (alive) setCheckingTos(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [userKey, role]);

  const handleTosAccept = async () => {
    try {
      if (!userKey) return;
      await acceptTos(userKey, role);
      setShowTos(false);
    } catch (e) {
      console.error("ToS accept failed:", e);
      // keep modal open so user can retry
    }
  };

  const handleTosDecline = () => {
    localStorage.removeItem("customUser");
    localStorage.removeItem("user_id");
    if (typeof logout === "function") logout();
    navigate("/Signin", { replace: true });
  };

  // ===== dashboard state =====
  const [activePage, setActivePage] = useState("Dashboard");
  const [sidebarWidth, setSidebarWidth] = useState(70);
  const [isSoloMode, setIsSoloMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState("");

  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [teamsProgress, setTeamsProgress] = useState([]);
  const [adviserGroups, setAdviserGroups] = useState([]);

  const handlePageChange = (page) => {
    setActivePage(page);
    navigate(`/Instructor/${page.replace(/\s+/g, "")}`, { state: { activePage: page } });
  };

  useEffect(() => {
    if (subPage) setActivePage(subPage);
    else if (isSoloMode) setActivePage("SoloModeDashboard");
    else setActivePage("Dashboard");
  }, [isSoloMode, subPage]);

  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    const [hour, minute] = timeString.split(":");
    let h = parseInt(hour, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${minute} ${ampm}`;
  };

  useEffect(() => {
    const fetchInstructorData = async () => {
      try {
        setIsLoading(true);
        setDebugInfo("Fetching instructor dashboard data...");

        const [oralTasksResult, finalTasksResult] = await Promise.all([
          supabase.from("adviser_oral_def").select("*"),
          supabase.from("adviser_final_def").select("*"),
        ]);

        const allAdviserTasks = [
          ...(oralTasksResult.data || []).map((t) => ({ ...t, type: "Oral Defense" })),
          ...(finalTasksResult.data || []).map((t) => ({ ...t, type: "Final Defense" })),
        ];

        const today = new Date();
        const upcoming = allAdviserTasks
          .filter((task) => task.due_date && new Date(task.due_date) >= today && task.status !== "Completed")
          .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
          .slice(0, 5);

        const upcomingWithNames = await Promise.all(
          upcoming.map(async (task) => {
            if (!task.manager_id) return { ...task, managerName: "N/A" };
            const { data: manager } = await supabase
              .from("user_credentials")
              .select("first_name, last_name")
              .eq("id", task.manager_id)
              .single();
            return { ...task, managerName: manager ? `${manager.first_name} ${manager.last_name}` : "Unknown Manager" };
          })
        );
        setUpcomingTasks(upcomingWithNames);

        const recent = [...allAdviserTasks]
          .sort((a, b) => new Date(b.date_created || b.created_at) - new Date(a.date_created || a.created_at))
          .slice(0, 5);
        const recentWithNames = await Promise.all(
          recent.map(async (task) => {
            if (!task.manager_id) return { ...task, managerName: "N/A" };
            const { data: manager } = await supabase
              .from("user_credentials")
              .select("first_name, last_name")
              .eq("id", task.manager_id)
              .single();
            return { ...task, managerName: manager ? `${manager.first_name} ${manager.last_name}` : "Unknown Manager" };
          })
        );
        setRecentTasks(recentWithNames);

        const { data: teams, error: teamsError } = await supabase
          .from("user_credentials")
          .select("id, group_name, first_name, last_name, adviser_group")
          .eq("user_roles", 1);

        if (teamsError || !teams) {
          setTeamsProgress([]);
          setAdviserGroups([]);
        } else {
          const teamsProgressData = await Promise.all(
            teams.map(async (team) => {
              const [managerTasksResult, adviserOralTasksResult, adviserFinalTasksResult] = await Promise.all([
                supabase.from("manager_title_task").select("status, task_name, due_date").eq("manager_id", team.id),
                supabase.from("adviser_oral_def").select("status, task, due_date").eq("manager_id", team.id),
                supabase.from("adviser_final_def").select("status, task, due_date").eq("manager_id", team.id),
              ]);

              const managerTasks = managerTasksResult.data || [];
              const adviserOralTasks = adviserOralTasksResult.data || [];
              const adviserFinalTasks = adviserFinalTasksResult.data || [];

              const allTeamTasks = [
                ...managerTasks.map((t) => ({ ...t, source: "manager" })),
                ...adviserOralTasks.map((t) => ({ ...t, source: "adviser_oral" })),
                ...adviserFinalTasks.map((t) => ({ ...t, source: "adviser_final" })),
              ];

              if (allTeamTasks.length === 0) return null;

              const counts = { "To Do": 0, "In Progress": 0, "To Review": 0, "Completed": 0, "Missed": 0 };
              allTeamTasks.forEach((task) => {
                if (counts[task.status] !== undefined) counts[task.status]++;
                else counts["To Do"]++;
              });

              return {
                group_name: team.group_name,
                manager_id: team.id,
                manager_name: `${team.first_name} ${team.last_name}`,
                adviser_group: team.adviser_group,
                counts,
                total_tasks: allTeamTasks.length,
                task_breakdown: {
                  manager_tasks: managerTasks.length,
                  adviser_oral_tasks: adviserOralTasks.length,
                  adviser_final_tasks: adviserFinalTasks.length,
                },
              };
            })
          );

          const filtered = teamsProgressData.filter(Boolean);
          setTeamsProgress(filtered);

          const groupedByAdviser = filtered.reduce((groups, t) => {
            const ag = t.adviser_group || "Ungrouped";
            if (!groups[ag]) groups[ag] = [];
            groups[ag].push(t);
            return groups;
          }, {});

          const adviserGroupsWithNames = await Promise.all(
            Object.entries(groupedByAdviser).map(async ([ag, groupTeams]) => {
              let adviserName = `Adviser Group: ${ag}`;
              if (ag && ag !== "Ungrouped") {
                const { data: adviser } = await supabase
                  .from("user_credentials")
                  .select("first_name, last_name")
                  .eq("adviser_group", ag)
                  .eq("user_roles", 3)
                  .single();
                if (adviser) adviserName = `${adviser.first_name} ${adviser.last_name}`;
              }
              return { adviserGroup: ag, adviserName, teams: groupTeams };
            })
          );
          setAdviserGroups(adviserGroupsWithNames);
        }

        const events = (oralTasksResult?.data || [])
          .concat(finalTasksResult?.data || [])
          .map((task) => ({
            id: task.id,
            title: `${task.task} (${task.status})`,
            start: task.due_date,
            color:
              task.status === "Completed"
                ? "#4BC0C0"
                : task.status === "Missed"
                ? "#FF6384"
                : task.status === "In Progress"
                ? "#809D3C"
                : task.status === "To Review"
                ? "#578FCA"
                : "#FABC3F",
          }));
        setCalendarEvents(events);
      } catch (error) {
        setDebugInfo(`Error: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (!isSoloMode) fetchInstructorData();
  }, [isSoloMode]);

  // ==== MAIN CONTENT RENDER ====
  const renderContent = () => {
    switch (activePage) {
      case "Students":
        return <Enroll />;
      case "Advisers":
        return <Adviser />;
      case "Teams":
        return <Teams />;
      case "StudentCredentials":
        return <StudentCredentials />;
      case "AdviserCredentials":
        return <AdviserCredentials />;
      case "Schedule":
        return <Schedule setActivePage={setActivePage} />;
      case "Title Defense":
        return <TitleDefense />;
      case "ManuScript":
        return <ManuScript />;
      case "Oral Defense":
        return <OralDefense />;
      case "Final Defense":
        return <FinalDefense />;
      case "RoleTransfer":
        return <RoleTransfer />;
      case "SoloModeDashboard":
        return <SoloModeDashboard />;
      case "SolomodeTasks":
        return <SoloModeTasks />;
      case "SolomodeTasksBoard":
        return <SoloModeTasksBoard />;
      case "SolomodeTasksRecord":
        return <SoloModeTasksRecord />;
      case "Profile":
        return <Profile />;
      default:
        return (
          <div className="adviser-dashboard-content">
            {isLoading ? (
              <div className="loading-container">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p>Loading dashboard data...</p>
              </div>
            ) : (
              <>
                <div className="dashboard-section">
                  <h4>INSTRUCTOR UPCOMING ACTIVITY</h4>
                  <div className="upcoming-activity">
                    {upcomingTasks.length === 0 ? (
                      <p className="fst-italic text-muted">No upcoming tasks.</p>
                    ) : (
                      upcomingTasks.map((t, i) => (
                        <div key={i} className="activity-card">
                          <div className="activity-header">
                            <i className="fas fa-user-tag"></i>
                            <span>{t.managerName}</span>
                          </div>
                          <div className="activity-body">
                            <h5>
                              <i className="fas fa-tasks"></i> {t.task}
                            </h5>
                            <p>
                              <i className="fas fa-calendar-alt"></i> {new Date(t.due_date).toLocaleDateString()}
                            </p>
                            <p>
                              <i className="fas fa-clock"></i> {formatTime(t.time) || "No Time"}
                            </p>
                            <p>
                              <i className="fas fa-flag"></i> {t.type}
                            </p>
                            <span className={`status-badge status-${t.status.toLowerCase().replace(" ", "-")}`}>
                              {t.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="dashboard-section">
                  <div className="section-header">
                    <h4>TEAMS PROGRESS BY ADVISER</h4>
                    <span className="teams-count">
                      {teamsProgress.length} team(s) across {adviserGroups.length} adviser group(s)
                    </span>
                  </div>

                  {adviserGroups.length > 0 ? (
                    <div className="adviser-groups-container">
                      {adviserGroups.map((group) => (
                        <AdviserGroupSection
                          key={group.adviserGroup}
                          adviserGroup={group.adviserGroup}
                          adviserName={group.adviserName}
                          teams={group.teams}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="no-teams-message">
                      <i className="fas fa-users fa-3x text-muted mb-3"></i>
                      <p className="fst-italic text-muted">No teams with tasks to display progress.</p>
                    </div>
                  )}
                </div>

                <div className="dashboard-section">
                  <h4>RECENT ACTIVITY CREATED</h4>
                  {recentTasks.length === 0 ? (
                    <p className="fst-italic text-muted">No recent activities.</p>
                  ) : (
                    <div className="recent-table-container">
                      <table>
                        <thead>
                          <tr>
                            <th>NO</th>
                            <th>TASK</th>
                            <th>DATE CREATED</th>
                            <th>DUE DATE</th>
                            <th>TIME</th>
                            <th>STATUS</th>
                            <th>TYPE</th>
                            <th>MANAGER</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentTasks.map((t, i) => (
                            <tr key={t.id}>
                              <td>{i + 1}.</td>
                              <td>{t.task}</td>
                              <td>{new Date(t.date_created || t.created_at).toLocaleDateString()}</td>
                              <td>{t.due_date ? new Date(t.due_date).toLocaleDateString() : "—"}</td>
                              <td>{formatTime(t.time) || "—"}</td>
                              <td>
                                <span className={`status-badge status-${t.status.toLowerCase().replace(" ", "-")}`}>
                                  {t.status}
                                </span>
                              </td>
                              <td>{t.type}</td>
                              <td>{t.managerName || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="dashboard-section">
                  <h4>INSTRUCTOR CALENDAR</h4>
                  <div className="calendar-container">
                    <FullCalendar
                      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                      initialView="dayGridMonth"
                      headerToolbar={{
                        left: "prev,next today",
                        center: "title",
                        right: "dayGridMonth,timeGridWeek,timeGridDay",
                      }}
                      events={calendarEvents}
                      height="400px"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Styles */}
            <style>{`
              .adviser-dashboard-content { display:flex; flex-direction:column; gap:25px; }
              .loading-container { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px; gap:15px; }
              .dashboard-section { background:#fff; padding:20px; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,0.1); }
              .dashboard-section h4 { margin-bottom:15px; color:#333; border-bottom:2px solid #f0f0f0; padding-bottom:8px; }
              .section-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:2px solid #f0f0f0; padding-bottom:8px; }
              .teams-count { color:#666; font-size:.9rem; font-style:italic; }
              .adviser-groups-container { display:flex; flex-direction:column; gap:25px; }
              .adviser-group-section { background:#f8f9fa; border-radius:8px; padding:20px; border:1px solid #e9ecef; }
              .adviser-group-header { margin-bottom:20px; padding-bottom:15px; border-bottom:2px solid #dee2e6; }
              .adviser-info { display:flex; align-items:center; gap:12px; }
              .adviser-info i { font-size:1.5rem; color:#805ad5; }
              .upcoming-activity { display:flex; flex-direction:column; gap:12px; max-height:300px; overflow-y:auto; }
              .activity-card { border:1px solid #e0e0e0; border-radius:6px; padding:15px; background:#f9f9f9; transition:.3s; }
              .activity-card:hover { box-shadow:0 4px 8px rgba(0,0,0,0.1); transform:translateY(-2px); }
              .activity-header { display:flex; align-items:center; gap:8px; margin-bottom:10px; font-weight:700; color:#333; }
              .progress-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:20px; padding:10px 0; }
              .progress-card { background:#fff; padding:15px; border-radius:8px; border:1px solid #e9ecef; text-align:center; transition:.3s; position:relative; box-shadow:0 2px 4px rgba(0,0,0,0.05); }
              .progress-card:hover { box-shadow:0 4px 8px rgba(0,0,0,0.1); }
              .progress-card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; }
              .total-tasks { font-size:.8rem; color:#666; background:#e9ecef; padding:2px 8px; border-radius:12px; }
              .chart-container { position:relative; display:flex; justify-content:center; align-items:center; }
              .chart-center-percentage { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center; pointer-events:none; }
              .percentage-value { display:block; font-size:1.5rem; font-weight:700; color:#333; line-height:1.2; }
              .percentage-label { display:block; font-size:.8rem; color:#666; margin-top:2px; }
              .progress-stats { margin-top:15px; display:flex; flex-direction:column; gap:8px; }
              .stat-item { display:flex; justify-content:space-between; align-items:center; padding:4px 0; border-bottom:1px solid #f0f0f0; }
              .recent-table-container { max-height:400px; overflow-y:auto; border:1px solid #e0e0e0; border-radius:6px; }
              table { width:100%; border-collapse:collapse; }
              th, td { padding:10px 12px; text-align:left; border-bottom:1px solid #ddd; }
              th { background:#f8f9fa; font-weight:700; position:sticky; top:0; z-index:10; }
              tr:hover { background:#f5f5f5; }
              .status-badge { padding:4px 8px; border-radius:4px; font-size:.8em; font-weight:700; white-space:nowrap; }
              .status-to-do { background:#FABC3F; color:#fff; } .status-in-progress { background:#809D3C; color:#fff; }
              .status-to-review { background:#578FCA; color:#fff; } .status-completed { background:#4BC0C0; color:#fff; }
              .status-missed { background:#FF6384; color:#fff; }
              .calendar-container { background:#fff; border-radius:8px; overflow:hidden; border:1px solid #e0e0e0; }
              @media (max-width:768px){ .dashboard-section{padding:15px;} .section-header{flex-direction:column; align-items:flex-start; gap:8px;}
                .adviser-info{flex-direction:column; align-items:flex-start; gap:8px;}
                .progress-grid{grid-template-columns:1fr; gap:15px;}
                .progress-card-header{flex-direction:column; gap:8px; align-items:flex-start;}
                .recent-table-container{overflow-x:auto;} table{min-width:800px;}
              }
            `}</style>
          </div>
        );
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header isSoloMode={isSoloMode} setIsSoloMode={setIsSoloMode} />
      <div className="d-flex" style={{ marginTop: "30px" }}></div>
      <div className="d-flex" style={{ flexGrow: 1 }}>
        <Sidebar
          activeItem={activePage}
          onSelect={handlePageChange}
          onWidthChange={setSidebarWidth}
          isSoloMode={isSoloMode}
        />

        <div
          className="flex-grow-1"
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            flexGrow: 1,
            marginLeft: `${sidebarWidth}px`,
            transition: "margin-left 0.3s",
          }}
          id="main-content-wrapper"
        >
          <main style={{ flexGrow: 1, padding: "20px" }}>{renderContent()}</main>
          <Footer />
        </div>
      </div>

      {/* Show ToS only after DB check finishes */}
      {!checkingTos && (
        <TermsOfService open={showTos} onAccept={handleTosAccept} onDecline={handleTosDecline} />
      )}
    </div>
  );
};

export default InstructorDashboard;
