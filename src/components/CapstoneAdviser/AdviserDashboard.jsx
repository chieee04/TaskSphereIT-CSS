// src/components/CapstoneAdviser/AdviserDashboard.jsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import Sidebar from "../Sidebar";
import { useAuthGuard } from "../../components/hooks/useAuthGuard";
import AdviserTeamSummary from "./AdviserTeamsSummary";
import AdviserTermsOfService from "./AdviserTermsOfService";
import AdviserTask from "./AdviserTask/AdviserTask";
import AdviserOralDef from "./AdviserTask/AdviserOralDef";
import AdviserFinalDef from "./AdviserTask/AdviserFinalDef";
import AdviserTaskRecord from "./TaskRecord/AdviserTaskRecord";
import AdviserTeamBoard from "./AdviserBoard/AdviserTeamBoard";
import AdviserOralRecord from "./TaskRecord/AdviserOralRecord";
import AdviserFinalRecord from "./TaskRecord/AdviserFinalRecord";
import AdviserEvents from "./AdviserEvents/AdviserEvents";
import AdviserManuResult from "./AdviserEvents/AdviserManuResult";
import AdviserCapsDefenses from "./AdviserEvents/AdviserCapsDefenses";
import Profile from "../Profile";
import SoloModeDashboard from "../SoloMode/SoloModeDashboard";
import Header from "../Header";
import Footer from "../Footer";
import AdviserFinalRedefTask from "./AdviserTask/AdviserFinalRedefTask";
import SoloModeTasks from "../SoloMode/SoloModeTasks";
import SoloModeTasksBoard from "../SoloMode/SoloModeTasksBoard";
import SoloModeTasksRecord from "../SoloMode/SoloModeTasksRecord";
import { supabase } from "../../supabaseClient";

// NEW: ToS modal + auth context
import TermsOfService from "../../components/TermsOfService";
import { UserAuth } from "../../Contex/AuthContext";

// FULLCALENDAR IMPORTS
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

// CHARTJS IMPORTS
import { Chart as ChartJS, Tooltip, Legend, ArcElement } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import Notification from "./Notification";

ChartJS.register(Tooltip, Legend, ArcElement);

// === TOS VERSION must match TermsOfService.jsx ===
const TOS_VERSION = "2025-05-09";

// Define the primary color constants for consistency
const TASKSPHERE_PRIMARY = "#5a0d0e";
const TASKSPHERE_LIGHT = "#7a1d1e";
const TASKSPHERE_LIGHTER = "#9a3d3e";
const TASKSPHERE_LIGHTEST = "#ba5d5e";

// ---------------- Team Progress card ----------------
const AdviserTeamProgress = ({ teamsProgress }) => {
  const calculateCompletionPercentage = (counts) => {
    const totalTasks = Object.values(counts).reduce((sum, count) => sum + count, 0);
    const completedTasks = counts["Completed"] || 0;
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  return (
    <div className="team-progress-container">
      {teamsProgress.length > 0 ? (
        <div className="progress-grid">
          {teamsProgress.map((team, index) => {
            const completionPercentage = calculateCompletionPercentage(team.counts);
            const totalTasks = Object.values(team.counts).reduce((sum, count) => sum + count, 0);

            const chartData = {
              labels: ["Completed", "Remaining"],
              datasets: [
                {
                  label: "Tasks",
                  data: [
                    team.counts["Completed"] || 0,
                    Math.max(0, totalTasks - (team.counts["Completed"] || 0)),
                  ],
                  backgroundColor: [TASKSPHERE_PRIMARY, "#f0f0f0"],
                  borderColor: "#ffffff",
                  borderWidth: 3,
                  cutout: "75%",
                },
              ],
            };

            const chartOptions = {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false,
                },
                tooltip: {
                  enabled: false,
                },
              },
            };

            return (
              <div key={index} className="progress-card-new">
                <div className="team-member-info">
                  <i className="fas fa-users"></i>
                  <span className="team-name">{team.group_name}</span>
                </div>
                <div className="chart-wrapper">
                  <div className="chart-container-large">
                    <Doughnut data={chartData} options={chartOptions} />
                    <div className="chart-percentage-center">
                      <span className="percentage-num">
                        {completionPercentage}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="no-teams-message">
          <i className="fas fa-users fa-3x text-muted mb-3"></i>
          <p className="fst-italic text-muted">
            No teams with tasks to display progress.
          </p>
        </div>
      )}
    </div>
  );
};

// ---------------- Main Adviser Dashboard ----------------
const AdviserDashboard = ({ activePageFromHeader }) => {
  useAuthGuard();

  const { logout } = UserAuth?.() || { logout: null };
  const navigate = useNavigate();
  const location = useLocation();
  const { subPage } = useParams();

  const [sidebarWidth, setSidebarWidth] = useState(70);
  const [isSoloMode, setIsSoloMode] = useState(false);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [teamsProgress, setTeamsProgress] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // page selection
  const [activePage, setActivePage] = useState(
    location.state?.activePage || activePageFromHeader || "Dashboard"
  );

  // ===== Read user info once; build the same userKey the ToS modal upserts =====
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("customUser") || "null");
    } catch {
      return null;
    }
  }, []);

  const role = Number(storedUser?.user_roles); // adviser = 3
  const userKey = useMemo(() => {
    if (!storedUser) return null;
    return (
      storedUser.username || // <— matches your table rows (admin1, adviser, etc.)
      storedUser.email ||
      storedUser.user_id ||
      storedUser.id ||
      String(storedUser.adviser_group || "")
    );
  }, [storedUser]);

  // ToS modal state
  const [showTos, setShowTos] = useState(false);

  // Check ToS acceptance in DB
  useEffect(() => {
    const checkTos = async () => {
      try {
        if (!userKey || role !== 3) return; // only for advisers here
        const { data, error } = await supabase
          .from("tos_acceptance")
          .select("user_key")
          .eq("user_key", String(userKey))
          .eq("role", 3)
          .eq("version", TOS_VERSION)
          .maybeSingle();

        if (error) {
          // network/rls/etc → be safe and show ToS
          setShowTos(true);
          return;
        }
        setShowTos(!data); // show if not found
      } catch {
        setShowTos(true);
      }
    };
    checkTos();
  }, [userKey, role]);

  const handleTosAccept = () => {
    // The modal performed the upsert. Here we simply hide it.
    setShowTos(false);
  };

  const handleTosDecline = () => {
    localStorage.removeItem("customUser");
    localStorage.removeItem("user_id");
    if (typeof logout === "function") logout();
    navigate("/Signin", { replace: true });
  };

  // routing within adviser area
  const handlePageChange = (page) => {
    setActivePage(page);
    navigate(`/Adviser/${page.replace(/\s+/g, "")}`, { state: { activePage: page } });
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

  // Fetch dashboard data
  useEffect(() => {
    const fetchAdviserData = async () => {
      try {
        setIsLoading(true);
        const stored = localStorage.getItem("customUser");
        if (!stored) return;

        const adviser = JSON.parse(stored);
        const adviserId = adviser.id;
        const adviserGroup = adviser.adviser_group;
        if (!adviserId || !adviserGroup) return;

        let allAdviserTasks = [];

        const [oralTasksResult, finalTasksResult] = await Promise.all([
          supabase.from("adviser_oral_def").select("*").eq("adviser_id", adviserId),
          supabase.from("adviser_final_def").select("*").eq("adviser_id", adviserId),
        ]);

        if (oralTasksResult.data) {
          allAdviserTasks = [...allAdviserTasks, ...oralTasksResult.data.map((t) => ({ ...t, type: "Oral Defense" }))];
        }
        if (finalTasksResult.data) {
          allAdviserTasks = [...allAdviserTasks, ...finalTasksResult.data.map((t) => ({ ...t, type: "Final Defense" }))];
        }

        // upcoming
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcoming = allAdviserTasks
          .filter((task) => {
            if (!task.due_date) return false;
            const dueDate = new Date(task.due_date);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate >= today && task.status !== "Completed";
          })
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

        // recent
        const recent = [...allAdviserTasks]
          .sort((a, b) => new Date(b.date_created || b.created_at) - new Date(a.date_created || a.created_at))
          .slice(0, 4);
        
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

        // teams progress
        const { data: teams, error: teamsError } = await supabase
          .from("user_credentials")
          .select("id, group_name, first_name, last_name, adviser_group, user_roles")
          .eq("adviser_group", adviserGroup)
          .eq("user_roles", 1);

        if (teamsError || !teams || teams.length === 0) {
          setTeamsProgress([]);
        } else {
          const teamsProgressData = await Promise.all(
            teams.map(async (team) => {
              try {
                const [managerTasksResult, adviserOralTasksResult, adviserFinalTasksResult] = await Promise.all([
                  supabase.from("manager_title_task").select("status, task_name, due_date").eq("manager_id", team.id),
                  supabase
                    .from("adviser_oral_def")
                    .select("status, task, due_date")
                    .eq("manager_id", team.id)
                    .eq("adviser_id", adviserId),
                  supabase
                    .from("adviser_final_def")
                    .select("status, task, due_date")
                    .eq("manager_id", team.id)
                    .eq("adviser_id", adviserId),
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
                  counts,
                  total_tasks: allTeamTasks.length,
                  task_breakdown: {
                    manager_tasks: managerTasks.length,
                    adviser_oral_tasks: adviserOralTasks.length,
                    adviser_final_tasks: adviserFinalTasks.length,
                  },
                };
              } catch (error) {
                console.error(`Error processing team ${team.group_name}:`, error);
                return null;
              }
            })
          );

          setTeamsProgress(teamsProgressData.filter(Boolean));
        }

        // calendar events
        const events = allAdviserTasks.map((task) => ({
          id: task.id,
          title: `${task.task} (${task.status})`,
          start: task.due_date,
          color: TASKSPHERE_PRIMARY,
        }));
        setCalendarEvents(events);
      } catch (error) {
        console.error("Error in fetchAdviserData:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!isSoloMode) fetchAdviserData();
  }, [isSoloMode]);

  // ------- Render content by page -------
  const renderContent = () => {
    switch (activePage) {
      case "TeamsSummary":
        return <AdviserTeamSummary />;
      case "TermsOfService":
        return <TermsOfService />;
      case "Tasks":
        return <AdviserTask setActivePage={setActivePage} />;
      case "OralDefense":
      case "Oral Defense":
        return <AdviserOralDef />;
      case "FinalDefense":
      case "Final Defense":
        return <AdviserFinalDef />;
      case "TeamsBoard":
        return <AdviserTeamBoard />;
      case "TasksRecord":
        return <AdviserTaskRecord setActivePage={setActivePage} />;
      case "OralDefenseRecord":
      case "Oral Defense Record":
        return <AdviserOralRecord />;
      case "TitleDefenseRecord":
        return <AdviserFinalRecord />;
      case "Events":
        return <AdviserEvents setActivePage={setActivePage} />;
      case "ManucriptResults":
      case "Manucript Results":
        return <AdviserManuResult />;
      case "CapstoneDefenses":
        return <AdviserCapsDefenses />;
      case "Profile":
        return <Profile />;
      case "FinalReDefense":
      case "Final Re Defense":
        return <AdviserFinalRedefTask />;
      case "Notification":
        return <Notification />;
      case "SoloModeDashboard":
        return <SoloModeDashboard />;
      case "SolomodeTasks":
        return <SoloModeTasks />;
      case "SolomodeTasksBoard":
        return <SoloModeTasksBoard />;
      case "SolomodeTasksRecord":
        return <SoloModeTasksRecord />;
      default:
        return (
          <div className="adviser-dashboard-modern">
            {isLoading ? (
              <div className="loading-container">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p>Loading dashboard data...</p>
              </div>
            ) : (
              <>
                {/* Section 1: UPCOMING ACTIVITY */}
                <div className="dashboard-section-modern">
                  <h4 className="section-title-modern">UPCOMING ACTIVITY</h4>
                  <div className="upcoming-cards-grid">
                    {upcomingTasks.length === 0 ? (
                      <p className="fst-italic text-muted">No upcoming tasks.</p>
                    ) : (
                      upcomingTasks.map((t, i) => (
                        <div key={i} className="upcoming-card-modern">
                          <div className="card-header-badge">{t.type}</div>
                          <div className="card-manager-info">
                            <i className="fas fa-users"></i>
                            <span>{t.managerName}</span>
                          </div>
                          <div className="card-details">
                            <div className="detail-row">
                              <i className="fas fa-calendar-alt"></i>
                              <span>{new Date(t.due_date).toLocaleDateString()}</span>
                            </div>
                            <div className="detail-row">
                              <i className="fas fa-clock"></i>
                              <span>{formatTime(t.time) || "No Time"}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Section 2: TEAMS' PROGRESS */}
                <div className="dashboard-section-modern">
                  <h4 className="section-title-modern">TEAMS' PROGRESS</h4>
                  <AdviserTeamProgress teamsProgress={teamsProgress} />
                </div>

                {/* Section 3: RECENT ACTIVITY CREATED */}
                <div className="dashboard-section-modern">
                  <h4 className="section-title-modern">RECENT ACTIVITY CREATED</h4>
                  {recentTasks.length === 0 ? (
                    <p className="fst-italic text-muted">No recent activities.</p>
                  ) : (
                    <div className="recent-table-modern">
                      <table>
                        <thead>
                          <tr>
                            <th>NO</th>
                            <th>Team</th>
                            <th>Date Created</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentTasks.map((t, i) => (
                            <tr key={t.id || i}>
                              <td>{i + 1}.</td>
                              <td>{t.managerName || "—"}</td>
                              <td>
                                {new Date(t.date_created || t.created_at).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </td>
                              <td>
                                {t.due_date
                                  ? new Date(t.due_date).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })
                                  : "—"}
                              </td>
                              <td>{formatTime(t.time) || "—"}</td>
                              <td>
                                <span className="status-badge-modern">
                                  {t.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Section 4: CALENDAR */}
                <div className="dashboard-section-modern">
                  <h4 className="section-title-modern">CALENDAR</h4>
                  <div className="calendar-wrapper-modern">
                    <FullCalendar
                      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                      initialView="dayGridMonth"
                      headerToolbar={{
                        left: "prev,next today",
                        center: "title",
                        right: "dayGridMonth,timeGridWeek,timeGridDay",
                      }}
                      events={calendarEvents}
                      height="auto"
                      eventDisplay="block"
                    />
                  </div>
                </div>
              </>
            )}

            {/* CSS Styles - Matching Instructor Dashboard */}
            <style>{`
              .adviser-dashboard-modern {
                max-width: 1400px;
                margin: 0 auto;
                padding: 20px;
                display: flex;
                flex-direction: column;
                gap: 30px;
                background: #ffffff;
              }
              
              .loading-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 60px;
                gap: 20px;
                background: #ffffff;
              }
              
              .loading-container .spinner-border {
                color: ${TASKSPHERE_PRIMARY};
                width: 3rem;
                height: 3rem;
              }
              
              .dashboard-section-modern {
                background: #ffffff;
                padding: 0;
                border-radius: 16px;
                box-shadow: 0 2px 12px rgba(0,0,0,0.08);
                overflow: hidden;
                border: 1px solid #e8e8e8;
              }
              
              .section-title-modern {
                background: #ffffff;
                margin: 0;
                padding: 20px 25px;
                font-size: 0.9rem;
                font-weight: 700;
                letter-spacing: 1px;
                color: #333;
                border-bottom: 1px solid #e8e8e8;
              }
              
              /* Upcoming Activity Cards */
              .upcoming-cards-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 20px;
                padding: 25px;
                background: #ffffff;
              }
              
              .upcoming-card-modern {
                background: #ffffff;
                border: 2px solid #e8e8e8;
                border-radius: 12px;
                padding: 0;
                overflow: hidden;
                transition: all 0.3s ease;
              }
              
              .upcoming-card-modern:hover {
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                transform: translateY(-2px);
                border-color: ${TASKSPHERE_LIGHTER};
              }
              
              .card-header-badge {
                background: ${TASKSPHERE_PRIMARY};
                color: white;
                padding: 12px 16px;
                font-size: 0.85rem;
                font-weight: 600;
              }
              
              .card-manager-info {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 16px;
                border-bottom: 1px solid #f0f0f0;
                background: #ffffff;
              }
              
              .card-manager-info i {
                color: ${TASKSPHERE_PRIMARY};
                font-size: 1.1rem;
              }
              
              .card-manager-info span {
                font-weight: 600;
                color: #333;
                font-size: 0.95rem;
              }
              
              .card-details {
                padding: 16px;
                display: flex;
                flex-direction: column;
                gap: 10px;
                background: #ffffff;
              }
              
              .detail-row {
                display: flex;
                align-items: center;
                gap: 10px;
                color: #666;
                font-size: 0.9rem;
              }
              
              .detail-row i {
                color: ${TASKSPHERE_PRIMARY};
                width: 16px;
              }
              
              /* Teams Progress */
              .team-progress-container {
                padding: 25px;
                background: #ffffff;
              }
              
              .progress-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                gap: 25px;
              }
              
              .progress-card-new {
                background: white;
                border-radius: 12px;
                padding: 25px 20px;
                text-align: center;
                border: 2px solid #e8e8e8;
                transition: all 0.3s ease;
                min-height: 280px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
              }
              
              .progress-card-new:hover {
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                transform: translateY(-2px);
                border-color: ${TASKSPHERE_PRIMARY};
              }
              
              .team-member-info {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 2px solid #f0f0f0;
              }
              
              .team-member-info i {
                color: ${TASKSPHERE_PRIMARY};
                font-size: 1.2rem;
              }
              
              .team-name {
                font-weight: 600;
                color: #333;
                font-size: 0.95rem;
              }
              
              .chart-wrapper {
                display: flex;
                justify-content: center;
                align-items: center;
                flex-grow: 1;
              }
              
              .chart-container-large {
                width: 160px;
                height: 160px;
                margin: auto;
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              
              .chart-percentage-center {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
                pointer-events: none;
                width: 100%;
              }
              
              .percentage-num {
                display: block;
                font-size: 1.8rem;
                font-weight: 700;
                color: ${TASKSPHERE_PRIMARY};
                line-height: 1.2;
              }
              
              /* Recent Activity Table */
              .recent-table-modern {
                padding: 25px;
                overflow-x: auto;
                background: #ffffff;
              }
              
              .recent-table-modern table {
                width: 100%;
                border-collapse: collapse;
                background: #ffffff;
              }
              
              .recent-table-modern th,
              .recent-table-modern td {
                padding: 14px 16px;
                text-align: left;
                border-bottom: 1px solid #f0f0f0;
                background: #ffffff;
              }
              
              .recent-table-modern th {
                background: #fafafa;
                font-weight: 600;
                color: #666;
                font-size: 0.85rem;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              
              .recent-table-modern tbody tr {
                transition: background-color 0.2s ease;
                background: #ffffff;
              }
              
              .recent-table-modern tbody tr:hover {
                background-color: #fafafa;
              }
              
              .status-badge-modern {
                display: inline-block;
                padding: 5px 12px;
                border-radius: 20px;
                font-size: 0.8rem;
                font-weight: 600;
                border: 2px solid ${TASKSPHERE_LIGHTER};
                color: ${TASKSPHERE_PRIMARY};
                background: rgba(90, 13, 14, 0.05);
              }
              
              /* Calendar */
              .calendar-wrapper-modern {
                padding: 25px;
                background: #ffffff;
              }
              
              .fc {
                border: none;
                background: #ffffff;
              }
              
              .fc .fc-toolbar-title {
                font-size: 1.3rem;
                font-weight: 700;
                color: #333;
              }
              
              .fc .fc-button {
                background-color: ${TASKSPHERE_PRIMARY} !important;
                border-color: ${TASKSPHERE_PRIMARY} !important;
                color: white !important;
                text-transform: capitalize;
                font-weight: 600;
                padding: 8px 16px;
                border-radius: 6px;
              }
              
              .fc .fc-button:hover {
                background-color: ${TASKSPHERE_LIGHT} !important;
                border-color: ${TASKSPHERE_LIGHT} !important;
              }
              
              .fc .fc-button:disabled {
                background-color: #cccccc !important;
                border-color: #cccccc !important;
                opacity: 0.5;
              }
              
              .fc .fc-button-active {
                background-color: ${TASKSPHERE_LIGHT} !important;
                border-color: ${TASKSPHERE_LIGHT} !important;
              }
              
              .fc-theme-standard .fc-scrollgrid {
                border: 1px solid #e8e8e8;
                border-radius: 8px;
                background: #ffffff;
              }
              
              .fc-theme-standard td,
              .fc-theme-standard th {
                border-color: #f0f0f0;
                background: #ffffff;
              }
              
              .fc .fc-col-header-cell {
                background: #fafafa;
                font-weight: 600;
                color: #666;
                padding: 12px 8px;
              }
              
              .fc .fc-daygrid-day-number {
                color: #333;
                font-weight: 600;
                padding: 8px;
              }
              
              .fc .fc-daygrid-day.fc-day-today {
                background-color: rgba(90, 13, 14, 0.05) !important;
              }
              
              .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
                background: ${TASKSPHERE_PRIMARY};
                color: white;
                border-radius: 50%;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              
              .fc .fc-event {
                background-color: ${TASKSPHERE_PRIMARY};
                border-color: ${TASKSPHERE_PRIMARY};
                border-radius: 4px;
                padding: 2px 4px;
                font-size: 0.85rem;
              }
              
              .fc .fc-event:hover {
                background-color: ${TASKSPHERE_LIGHT};
                border-color: ${TASKSPHERE_LIGHT};
              }
              
              .fc .fc-daygrid-event-dot {
                border-color: white;
              }
              
              /* No Teams Message */
              .no-teams-message {
                text-align: center;
                padding: 60px 20px;
                color: #999;
                background: #ffffff;
              }
              
              .no-teams-message i {
                color: rgba(90, 13, 14, 0.2);
              }
              
              /* Responsive Design */
              @media (max-width: 1024px) {
                .upcoming-cards-grid {
                  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                  gap: 15px;
                }
                
                .progress-grid {
                  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                  gap: 20px;
                }

                .chart-container-large {
                  width: 140px;
                  height: 140px;
                }

                .percentage-num {
                  font-size: 1.6rem;
                }
              }
              
              @media (max-width: 768px) {
                .adviser-dashboard-modern {
                  padding: 15px;
                  gap: 20px;
                }
                
                .dashboard-section-modern {
                  border-radius: 12px;
                }
                
                .section-title-modern {
                  padding: 15px 20px;
                  font-size: 0.85rem;
                }
                
                .upcoming-cards-grid {
                  grid-template-columns: 1fr;
                  padding: 20px;
                }
                
                .team-progress-container {
                  padding: 20px;
                }
                
                .progress-grid {
                  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                  gap: 15px;
                }

                .progress-card-new {
                  padding: 20px 15px;
                  min-height: 260px;
                }

                .chart-container-large {
                  width: 130px;
                  height: 130px;
                }

                .percentage-num {
                  font-size: 1.5rem;
                }
                
                .recent-table-modern {
                  padding: 20px;
                }
                
                .recent-table-modern table {
                  min-width: 600px;
                }
                
                .calendar-wrapper-modern {
                  padding: 20px;
                }
                
                .fc .fc-toolbar {
                  flex-direction: column;
                  gap: 10px;
                }
                
                .fc .fc-toolbar-chunk {
                  display: flex;
                  justify-content: center;
                }
              }
            `}</style>
          </div>
        );
    }
  };

  return (
    <div>
      <Header isSoloMode={isSoloMode} setIsSoloMode={setIsSoloMode} />
      <div className="d-flex" style={{ marginTop: "30px" }}>
        <Sidebar
          activeItem={activePage}
          onSelect={handlePageChange}
          onWidthChange={setSidebarWidth}
          isSoloMode={isSoloMode}
        />
        <div
          className="flex-grow-1 p-3"
          style={{ marginLeft: `${sidebarWidth}px`, transition: "margin-left 0.3s" }}
          id="main-content-wrapper"
        >
          <main className="flex-grow-1 p-3">{renderContent()}</main>
          <Footer />
        </div>
      </div>

      {/* ToS portal modal – sits above everything */}
      <TermsOfService open={showTos} onAccept={handleTosAccept} onDecline={handleTosDecline} />
    </div>
  );
};

export default AdviserDashboard;