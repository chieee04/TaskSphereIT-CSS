import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
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

// ADDED FULLCALENDAR IMPORTS
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

// ADDED CHARTJS IMPORTS
import { Chart as ChartJS, Tooltip, Legend, ArcElement } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(Tooltip, Legend, ArcElement);

// Define the primary color constants for consistency
const TASKSPHERE_PRIMARY = "#5a0d0e";
const TASKSPHERE_LIGHT = "#7a1d1e";
const TASKSPHERE_LIGHTER = "#9a3d3e";
const TASKSPHERE_LIGHTEST = "#ba5d5e";

// Enhanced Team Progress Component with uniform colors
const AdviserTeamProgress = ({ teamsProgress }) => {
  const calculateCompletionPercentage = (counts) => {
    const totalTasks = Object.values(counts).reduce(
      (sum, count) => sum + count,
      0
    );
    const completedTasks = counts["Completed"] || 0;
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

<<<<<<< HEAD
  const getStatusColor = (status) => {
    const colors = {
      Completed: "#4BC0C0",
      "To Do": "#FABC3F",
      "In Progress": "#809D3C",
      "To Review": "#578FCA",
      Missed: "#FF6384",
    };
    return colors[status] || "#999999";
  };

=======
>>>>>>> 5b15d1d0e9f31e5eab7c8102b1a1dfffbaa33113
  return (
    <div className="team-progress-container">
      {teamsProgress.length > 0 ? (
        <div className="progress-grid">
          {teamsProgress.map((team, index) => {
            const completionPercentage = calculateCompletionPercentage(
              team.counts
            );
            const totalTasks = Object.values(team.counts).reduce(
              (sum, count) => sum + count,
              0
            );

            const chartData = {
              labels: ["Completed", "Remaining"],
              datasets: [
                {
                  label: "Tasks",
<<<<<<< HEAD
                  data: [
                    team.counts["Completed"] || 0,
                    totalTasks - (team.counts["Completed"] || 0),
                  ],
                  backgroundColor: ["#AA60C8", "#e9ecef"],
                  borderColor: "#ffffff",
                  borderWidth: 2,
                  cutout: "70%",
=======
                  data: [team.counts["Completed"] || 0, 
                         (totalTasks - (team.counts["Completed"] || 0))],
                  backgroundColor: [TASKSPHERE_PRIMARY, "#f0f0f0"],
                  borderColor: "#ffffff",
                  borderWidth: 3,
                  cutout: '75%',
>>>>>>> 5b15d1d0e9f31e5eab7c8102b1a1dfffbaa33113
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
<<<<<<< HEAD
                <div className="chart-container">
                  <div
                    style={{
                      width: "200px",
                      height: "200px",
                      margin: "auto",
                      position: "relative",
                    }}
                  >
                    <Doughnut data={chartData} options={chartOptions} />
                    <div className="chart-center-percentage">
                      <span className="percentage-value">
                        {completionPercentage}%
                      </span>
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
=======
                <div className="chart-wrapper">
                  <div className="chart-container-large">
                    <Doughnut data={chartData} options={chartOptions} />
                    <div className="chart-percentage-center">
                      <span className="percentage-num">{completionPercentage}%</span>
                    </div>
                  </div>
                </div>
>>>>>>> 5b15d1d0e9f31e5eab7c8102b1a1dfffbaa33113
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

// New Component: Group teams by adviser
const AdviserGroupSection = ({ adviserGroup, teams, adviserName }) => {
  const calculateGroupStats = (teams) => {
    const totalTeams = teams.length;
    const totalTasks = teams.reduce(
      (sum, team) =>
        sum + Object.values(team.counts).reduce((a, b) => a + b, 0),
      0
    );
    const completedTasks = teams.reduce(
      (sum, team) => sum + (team.counts["Completed"] || 0),
      0
    );
    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return { totalTeams, totalTasks, completedTasks, completionRate };
  };

  const groupStats = calculateGroupStats(teams);

  return (
    <div className="adviser-group-section-new">
      <div className="adviser-header-new">
        <div className="adviser-name-badge">
          <i className="fas fa-user-tie"></i>
<<<<<<< HEAD
          <div>
            <h4>{adviserName || `Adviser Group: ${adviserGroup}`}</h4>
            <small className="text-muted">
              {groupStats.totalTeams} team(s) • {groupStats.totalTasks} total
              tasks • {groupStats.completionRate}% overall completion
            </small>
          </div>
=======
          <span>{adviserName || `Adviser Group: ${adviserGroup}`}</span>
>>>>>>> 5b15d1d0e9f31e5eab7c8102b1a1dfffbaa33113
        </div>
      </div>
      <AdviserTeamProgress teamsProgress={teams} />
    </div>
  );
};

const InstructorDashboard = () => {
  useAuthGuard();
  const [activePage, setActivePage] = useState("Dashboard");
  const [sidebarWidth, setSidebarWidth] = useState(70);
  const [isSoloMode, setIsSoloMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState("");

  const navigate = useNavigate();
  const { subPage } = useParams();

  const handlePageChange = (page) => {
    setActivePage(page);
    navigate(`/Instructor/${page.replace(/\s+/g, "")}`, {
      state: { activePage: page },
    });
  };

  useEffect(() => {
    if (subPage) {
      setActivePage(subPage);
    } else if (isSoloMode) {
      setActivePage("SoloModeDashboard");
    } else {
      setActivePage("Dashboard");
    }
  }, [isSoloMode, subPage]);

  // ==== NEW STATES FOR TASKS ====
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [teamsProgress, setTeamsProgress] = useState([]);
  const [adviserGroups, setAdviserGroups] = useState([]);

  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    const [hour, minute] = timeString.split(":");
    let h = parseInt(hour, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${minute} ${ampm}`;
  };

  // ==== FETCH ALL PROJECT MANAGERS PROGRESS AND GROUP BY ADVISER ====
  useEffect(() => {
    const fetchInstructorData = async () => {
      try {
        setIsLoading(true);
        setDebugInfo("Fetching instructor dashboard data...");

        const [oralTasksResult, finalTasksResult] = await Promise.all([
          supabase.from("adviser_oral_def").select("*"),
          supabase.from("adviser_final_def").select("*"),
        ]);

        if (oralTasksResult.error)
          console.error("Error fetching oral tasks:", oralTasksResult.error);
        if (finalTasksResult.error)
          console.error("Error fetching final tasks:", finalTasksResult.error);

        const allAdviserTasks = [
          ...(oralTasksResult.data || []).map((t) => ({
            ...t,
            type: "Oral Defense",
          })),
          ...(finalTasksResult.data || []).map((t) => ({
            ...t,
            type: "Final Defense",
          })),
        ];

        const today = new Date();

        // 1. Upcoming Tasks
        const upcoming = allAdviserTasks
          .filter(
            (task) =>
              task.due_date &&
              new Date(task.due_date) >= today &&
              task.status !== "Completed"
          )
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
            return {
              ...task,
              managerName: manager
                ? `${manager.first_name} ${manager.last_name}`
                : "Unknown Manager",
            };
          })
        );
        setUpcomingTasks(upcomingWithNames);

        // 2. Recent Tasks
        const recent = [...allAdviserTasks]
          .sort(
            (a, b) =>
              new Date(b.date_created || b.created_at) -
              new Date(a.date_created || a.created_at)
          )
          .slice(0, 4);
        const recentWithNames = await Promise.all(
          recent.map(async (task) => {
            if (!task.manager_id) return { ...task, managerName: "N/A" };
            const { data: manager } = await supabase
              .from("user_credentials")
              .select("first_name, last_name")
              .eq("id", task.manager_id)
              .single();
<<<<<<< HEAD
            return {
              ...task,
              managerName: manager
                ? `${manager.first_name} ${manager.last_name}`
                : "Unknown Manager",
=======
            return { 
              ...task, 
              managerName: manager ? `${manager.first_name} ${manager.last_name}` : "Unknown Manager" 
>>>>>>> 5b15d1d0e9f31e5eab7c8102b1a1dfffbaa33113
            };
          })
        );
        setRecentTasks(recentWithNames);

<<<<<<< HEAD
        // 3. Teams' Progress - Fetch ALL project managers with ALL their tasks
        console.log("👥 Fetching all project managers...");

=======
        // 3. Teams' Progress
>>>>>>> 5b15d1d0e9f31e5eab7c8102b1a1dfffbaa33113
        const { data: teams, error: teamsError } = await supabase
          .from("user_credentials")
          .select("id, group_name, first_name, last_name, adviser_group")
          .eq("user_roles", 1);

        if (teamsError) {
          console.error("❌ Error fetching teams:", teamsError);
          setTeamsProgress([]);
          setAdviserGroups([]);
        } else if (!teams || teams.length === 0) {
          setTeamsProgress([]);
          setAdviserGroups([]);
        } else {
<<<<<<< HEAD
          setDebugInfo(`Found ${teams.length} project manager(s)`);

          // Fetch comprehensive task progress for each project manager
          const teamsProgressData = await Promise.all(
            teams.map(async (team) => {
              try {
                console.log(
                  `🔍 Checking tasks for team: ${team.group_name} (ID: ${team.id})`
                );

                // Fetch ALL task types for this project manager
                const [
                  managerTasksResult,
                  adviserOralTasksResult,
                  adviserFinalTasksResult,
                ] = await Promise.all([
                  // Manager tasks from manager_title_task
                  supabase
                    .from("manager_title_task")
                    .select("status, task_name, due_date")
                    .eq("manager_id", team.id),
                  // Adviser oral defense tasks for this manager (from any adviser)
                  supabase
                    .from("adviser_oral_def")
                    .select("status, task, due_date")
                    .eq("manager_id", team.id),
                  // Adviser final defense tasks for this manager (from any adviser)
                  supabase
                    .from("adviser_final_def")
                    .select("status, task, due_date")
                    .eq("manager_id", team.id),
=======
          const teamsProgressData = await Promise.all(
            teams.map(async (team) => {
              try {
                const [managerTasksResult, adviserOralTasksResult, adviserFinalTasksResult] = await Promise.all([
                  supabase.from("manager_title_task").select("status, task_name, due_date").eq("manager_id", team.id),
                  supabase.from("adviser_oral_def").select("status, task, due_date").eq("manager_id", team.id),
                  supabase.from("adviser_final_def").select("status, task, due_date").eq("manager_id", team.id)
>>>>>>> 5b15d1d0e9f31e5eab7c8102b1a1dfffbaa33113
                ]);

                const managerTasks = managerTasksResult.data || [];
                const adviserOralTasks = adviserOralTasksResult.data || [];
                const adviserFinalTasks = adviserFinalTasksResult.data || [];

                const allTeamTasks = [
                  ...managerTasks.map((t) => ({ ...t, source: "manager" })),
                  ...adviserOralTasks.map((t) => ({
                    ...t,
                    source: "adviser_oral",
                  })),
                  ...adviserFinalTasks.map((t) => ({
                    ...t,
                    source: "adviser_final",
                  })),
                ];

<<<<<<< HEAD
                console.log(`📋 Team ${team.group_name} tasks:`, {
                  managerTasks: managerTasks.length,
                  adviserOralTasks: adviserOralTasks.length,
                  adviserFinalTasks: adviserFinalTasks.length,
                  total: allTeamTasks.length,
                });

                // Only include teams that actually have tasks
                if (allTeamTasks.length === 0) {
                  console.log(
                    `ℹ️ Team ${team.group_name} has no tasks, skipping`
                  );
                  return null;
                }

                // Count tasks by status - COMBINE ALL TASK TYPES
                const counts = {
                  "To Do": 0,
                  "In Progress": 0,
                  "To Review": 0,
                  Completed: 0,
                  Missed: 0,
=======
                if (allTeamTasks.length === 0) {
                  return null;
                }

                const counts = { 
                  "To Do": 0, 
                  "In Progress": 0, 
                  "To Review": 0, 
                  "Completed": 0, 
                  "Missed": 0 
>>>>>>> 5b15d1d0e9f31e5eab7c8102b1a1dfffbaa33113
                };

                allTeamTasks.forEach((task) => {
                  if (counts[task.status] !== undefined) {
                    counts[task.status]++;
                  } else {
                    counts["To Do"]++;
                  }
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
<<<<<<< HEAD

                console.log(
                  `✅ Team ${team.group_name} progress:`,
                  teamProgress
                );
                return teamProgress;
=======
>>>>>>> 5b15d1d0e9f31e5eab7c8102b1a1dfffbaa33113
              } catch (error) {
                console.error(
                  `❌ Error processing team ${team.group_name}:`,
                  error
                );
                return null;
              }
            })
          );
<<<<<<< HEAD

          // Filter out null values (teams with no tasks or errors)
=======
          
>>>>>>> 5b15d1d0e9f31e5eab7c8102b1a1dfffbaa33113
          const filteredTeamsProgress = teamsProgressData.filter(Boolean);
          setTeamsProgress(filteredTeamsProgress);
<<<<<<< HEAD

          // Group teams by adviser_group
          const groupedByAdviser = filteredTeamsProgress.reduce(
            (groups, team) => {
              const adviserGroup = team.adviser_group || "Ungrouped";
              if (!groups[adviserGroup]) {
                groups[adviserGroup] = [];
              }
              groups[adviserGroup].push(team);
              return groups;
            },
            {}
          );
=======
          
          const groupedByAdviser = filteredTeamsProgress.reduce((groups, team) => {
            const adviserGroup = team.adviser_group || 'Ungrouped';
            if (!groups[adviserGroup]) {
              groups[adviserGroup] = [];
            }
            groups[adviserGroup].push(team);
            return groups;
          }, {});
>>>>>>> 5b15d1d0e9f31e5eab7c8102b1a1dfffbaa33113

          const adviserGroupsWithNames = await Promise.all(
<<<<<<< HEAD
            Object.entries(groupedByAdviser).map(
              async ([adviserGroup, teams]) => {
                // Try to get adviser name from user_credentials
                let adviserName = `Adviser Group: ${adviserGroup}`;

                if (adviserGroup && adviserGroup !== "Ungrouped") {
                  const { data: adviser } = await supabase
                    .from("user_credentials")
                    .select("first_name, last_name")
                    .eq("adviser_group", adviserGroup)
                    .eq("user_roles", 3) // FIXED: user_roles = 3 for advisers
                    .single();

                  if (adviser) {
                    adviserName = `${adviser.first_name} ${adviser.last_name}`;
                    console.log(
                      `✅ Found adviser: ${adviserName} for group: ${adviserGroup}`
                    );
                  } else {
                    console.log(
                      `❌ No adviser found for group: ${adviserGroup} with user_roles = 3`
                    );
                  }
=======
            Object.entries(groupedByAdviser).map(async ([adviserGroup, teams]) => {
              let adviserName = `Adviser Group: ${adviserGroup}`;
              
              if (adviserGroup && adviserGroup !== 'Ungrouped') {
                const { data: adviser } = await supabase
                  .from("user_credentials")
                  .select("first_name, last_name")
                  .eq("adviser_group", adviserGroup)
                  .eq("user_roles", 3)
                  .single();

                if (adviser) {
                  adviserName = `${adviser.first_name} ${adviser.last_name}`;
>>>>>>> 5b15d1d0e9f31e5eab7c8102b1a1dfffbaa33113
                }

                return {
                  adviserGroup,
                  adviserName,
                  teams,
                };
              }
            )
          );

          setAdviserGroups(adviserGroupsWithNames);
<<<<<<< HEAD

          if (filteredTeamsProgress.length === 0) {
            setDebugInfo((prev) => prev + " - But no teams have tasks yet");
          } else {
            setDebugInfo(
              (prev) =>
                prev +
                ` - ${filteredTeamsProgress.length} team(s) across ${adviserGroupsWithNames.length} adviser group(s)`
            );
          }
=======
>>>>>>> 5b15d1d0e9f31e5eab7c8102b1a1dfffbaa33113
        }

        // 4. Calendar Events - with uniform color
        const events = allAdviserTasks.map((task) => ({
          id: task.id,
          title: `${task.task} (${task.status})`,
          start: task.due_date,
          color: TASKSPHERE_PRIMARY,
        }));

        setCalendarEvents(events);
      } catch (error) {
        console.error("❌ Error loading instructor dashboard data:", error);
        setDebugInfo(`Error: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (!isSoloMode) {
      fetchInstructorData();
    }
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
          <div className="instructor-dashboard-modern">
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
                      <p className="fst-italic text-muted">
                        No upcoming tasks.
                      </p>
                    ) : (
                      upcomingTasks.map((t, i) => (
                        <div key={i} className="upcoming-card-modern">
                          <div className="card-header-badge">Title Defense</div>
                          <div className="card-manager-info">
                            <i className="fas fa-users"></i>
                            <span>{t.managerName}</span>
                          </div>
<<<<<<< HEAD
                          <div className="activity-body">
                            <h5>
                              <i className="fas fa-tasks"></i> {t.task}
                            </h5>
                            <p>
                              <i className="fas fa-calendar-alt"></i>{" "}
                              {new Date(t.due_date).toLocaleDateString()}
                            </p>
                            <p>
                              <i className="fas fa-clock"></i>{" "}
                              {formatTime(t.time) || "No Time"}
                            </p>
                            <p>
                              <i className="fas fa-flag"></i> {t.type}
                            </p>
                            <span
                              className={`status-badge status-${t.status
                                .toLowerCase()
                                .replace(" ", "-")}`}
                            >
                              {t.status}
                            </span>
=======
                          <div className="card-details">
                            <div className="detail-row">
                              <i className="fas fa-calendar-alt"></i>
                              <span>{new Date(t.due_date).toLocaleDateString()}</span>
                            </div>
                            <div className="detail-row">
                              <i className="fas fa-clock"></i>
                              <span>{formatTime(t.time) || "No Time"}</span>
                            </div>
>>>>>>> 5b15d1d0e9f31e5eab7c8102b1a1dfffbaa33113
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

<<<<<<< HEAD
                {/* Section 2: TEAMS' PROGRESS GROUPED BY ADVISER */}
                <div className="dashboard-section">
                  <div className="section-header">
                    <h4>TEAMS PROGRESS BY ADVISER</h4>
                    <span className="teams-count">
                      {teamsProgress.length} team(s) across{" "}
                      {adviserGroups.length} adviser group(s)
                    </span>
                  </div>

=======
                {/* Section 2: TEAMS' PROGRESS */}
                <div className="dashboard-section-modern">
                  <h4 className="section-title-modern">TEAMS' PROGRESS</h4>
                  
>>>>>>> 5b15d1d0e9f31e5eab7c8102b1a1dfffbaa33113
                  {adviserGroups.length > 0 ? (
                    <div className="adviser-groups-wrapper">
                      {adviserGroups.map((group, index) => (
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
                      <p className="fst-italic text-muted">
                        No teams with tasks to display progress.
                      </p>
                    </div>
                  )}
                </div>

                {/* Section 3: RECENT ACTIVITY CREATED */}
                <div className="dashboard-section-modern">
                  <h4 className="section-title-modern">RECENT ACTIVITY CREATED</h4>
                  {recentTasks.length === 0 ? (
                    <p className="fst-italic text-muted">
                      No recent activities.
                    </p>
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
                            <tr key={t.id}>
                              <td>{i + 1}.</td>
<<<<<<< HEAD
                              <td>{t.task}</td>
                              <td>
                                {new Date(
                                  t.date_created || t.created_at
                                ).toLocaleDateString()}
                              </td>
                              <td>
                                {t.due_date
                                  ? new Date(t.due_date).toLocaleDateString()
                                  : "—"}
                              </td>
                              <td>{formatTime(t.time) || "—"}</td>
                              <td>
                                <span
                                  className={`status-badge status-${t.status
                                    .toLowerCase()
                                    .replace(" ", "-")}`}
                                >
                                  {t.status}
                                </span>
=======
                              <td>{t.managerName || "—"}</td>
                              <td>{new Date(t.date_created || t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                              <td>{t.due_date ? new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "—"}</td>
                              <td>{formatTime(t.time) || "—"}</td>
                              <td>
                                <span className="status-badge-modern">{t.status}</span>
>>>>>>> 5b15d1d0e9f31e5eab7c8102b1a1dfffbaa33113
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
                      plugins={[
                        dayGridPlugin,
                        timeGridPlugin,
                        interactionPlugin,
                      ]}
                      initialView="dayGridMonth"
                      headerToolbar={{
                        left: "prev,next today",
                        center: "title",
<<<<<<< HEAD
                        right: "dayGridMonth,timeGridWeek,timeGridDay",
=======
                        right: "dayGridMonth"
>>>>>>> 5b15d1d0e9f31e5eab7c8102b1a1dfffbaa33113
                      }}
                      events={calendarEvents}
                      height="auto"
                      eventDisplay="block"
                    />
                  </div>
                </div>
              </>
            )}

            {/* CSS Styles */}
            <style>{`
              .instructor-dashboard-modern {
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
              
              /* Teams Progress - UPDATED CHART CONTAINER SIZE */
              .adviser-groups-wrapper {
                padding: 25px;
                display: flex;
                flex-direction: column;
                gap: 30px;
                background: #ffffff;
              }
              
              .adviser-group-section-new {
                background: #fafafa;
                border-radius: 12px;
                padding: 20px;
                border: 1px solid #e8e8e8;
              }
              
              .adviser-header-new {
                margin-bottom: 20px;
              }
              
              .adviser-name-badge {
                display: inline-flex;
                align-items: center;
                gap: 10px;
                background: white;
                padding: 10px 20px;
                border-radius: 8px;
                border: 2px solid ${TASKSPHERE_PRIMARY};
                font-weight: 600;
                color: ${TASKSPHERE_PRIMARY};
              }
              
              .adviser-name-badge i {
                font-size: 1.2rem;
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
              
              /* UPDATED: Larger chart container to prevent overlapping */
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
              
              /* Scrollbar Styling */
              .upcoming-cards-grid::-webkit-scrollbar,
              .recent-table-modern::-webkit-scrollbar {
                width: 8px;
                height: 8px;
              }
              
              .upcoming-cards-grid::-webkit-scrollbar-track,
              .recent-table-modern::-webkit-scrollbar-track {
                background: #f0f0f0;
                border-radius: 4px;
              }
              
              .upcoming-cards-grid::-webkit-scrollbar-thumb,
              .recent-table-modern::-webkit-scrollbar-thumb {
                background: ${TASKSPHERE_PRIMARY};
                border-radius: 4px;
              }
              
              .upcoming-cards-grid::-webkit-scrollbar-thumb:hover,
              .recent-table-modern::-webkit-scrollbar-thumb:hover {
                background: ${TASKSPHERE_LIGHT};
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
                .instructor-dashboard-modern {
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
                
                .adviser-groups-wrapper {
                  padding: 20px;
                  gap: 20px;
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
              
              @media (max-width: 480px) {
                .upcoming-cards-grid,
                .adviser-groups-wrapper,
                .recent-table-modern,
                .calendar-wrapper-modern {
                  padding: 15px;
                }
                
                .section-title-modern {
                  padding: 12px 15px;
                  font-size: 0.8rem;
                }
                
                .upcoming-card-modern {
                  border-radius: 8px;
                }
                
                .card-header-badge {
                  padding: 10px 12px;
                  font-size: 0.8rem;
                }
                
                .card-manager-info,
                .card-details {
                  padding: 12px;
                }
                
                .adviser-name-badge {
                  padding: 8px 16px;
                  font-size: 0.9rem;
                }
                
                .progress-card-new {
                  padding: 15px;
                  min-height: 240px;
                }

                .progress-grid {
                  grid-template-columns: 1fr;
                  gap: 15px;
                }

                .chart-container-large {
                  width: 120px;
                  height: 120px;
                }

                .percentage-num {
                  font-size: 1.4rem;
                }
                
                .fc .fc-button {
                  padding: 6px 12px;
                  font-size: 0.85rem;
                }
              }
              
              /* Animation Effects */
              @keyframes fadeInUp {
                from {
                  opacity: 0;
                  transform: translateY(20px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              
              .dashboard-section-modern {
                animation: fadeInUp 0.5s ease-out;
              }
              
              .upcoming-card-modern,
              .progress-card-new {
                animation: fadeInUp 0.5s ease-out;
              }
              
              /* Print Styles */
              @media print {
                .dashboard-section-modern {
                  page-break-inside: avoid;
                  box-shadow: none;
                  border: 1px solid #ddd;
                }
                
                .upcoming-card-modern,
                .progress-card-new {
                  page-break-inside: avoid;
                }
                
                .fc .fc-button {
                  display: none;
                }
              }
              
              /* Accessibility */
              .upcoming-card-modern:focus,
              .progress-card-new:focus {
                outline: 3px solid ${TASKSPHERE_PRIMARY};
                outline-offset: 2px;
              }
              
              /* Loading State Animation */
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              
              .loading-container .spinner-border {
                animation: spin 1s linear infinite;
              }
              
              /* Hover Effects for Interactive Elements */
              .recent-table-modern tbody tr,
              .upcoming-card-modern,
              .progress-card-new {
                cursor: pointer;
              }
              
              /* Custom Focus Styles for Better Accessibility */
              *:focus {
                outline: 2px solid ${TASKSPHERE_PRIMARY};
                outline-offset: 2px;
              }
              
              button:focus,
              a:focus {
                outline: 3px solid ${TASKSPHERE_PRIMARY};
                outline-offset: 3px;
              }
              
              /* Smooth Transitions */
              * {
                transition: all 0.3s ease;
              }
              
              /* Reduced Motion Support */
              @media (prefers-reduced-motion: reduce) {
                *,
                *::before,
                *::after {
                  animation-duration: 0.01ms !important;
                  animation-iteration-count: 1 !important;
                  transition-duration: 0.01ms !important;
                }
              }
            `}</style>
          </div>
        );
    }
  };

  return (
<<<<<<< HEAD
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
=======
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#ffffff" }}>
>>>>>>> 5b15d1d0e9f31e5eab7c8102b1a1dfffbaa33113
      <Header isSoloMode={isSoloMode} setIsSoloMode={setIsSoloMode} />
      <div className="d-flex" style={{ marginTop: "30px" }}></div>
      <div className="d-flex" style={{ flexGrow: 1, background: "#ffffff" }}>
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
            background: "#ffffff"
          }}
          id="main-content-wrapper"
        >
<<<<<<< HEAD
          <main style={{ flexGrow: 1, padding: "20px" }}>
=======
          <main style={{ flexGrow: 1, padding: "20px", background: "#ffffff" }}>
>>>>>>> 5b15d1d0e9f31e5eab7c8102b1a1dfffbaa33113
            {renderContent()}
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;
