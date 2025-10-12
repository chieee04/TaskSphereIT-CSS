import { useState, useEffect } from "react";
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

// FULLCALENDAR IMPORTS
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

// CHARTJS IMPORTS
import {
  Chart as ChartJS,
  Tooltip,
  Legend,
  ArcElement
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import Notification from "./Notification";

ChartJS.register(Tooltip, Legend, ArcElement);

// Team Progress Component
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
            
            const chartData = {
              labels: ["Completed", "Remaining"],
              datasets: [
                {
                  label: "Tasks",
                  data: [team.counts["Completed"] || 0, 
                         (Object.values(team.counts).reduce((sum, count) => sum + count, 0) - (team.counts["Completed"] || 0))],
                  backgroundColor: ["#AA60C8", "#e9ecef"],
                  borderColor: "#ffffff",
                  borderWidth: 2,
                  cutout: '70%',
                },
              ],
            };

            const chartOptions = {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false
                },
                tooltip: {
                  enabled: false
                }
              },
            };

            return (
              <div key={index} className="progress-card">
                <h5>{team.group_name}</h5>
                <div className="chart-container">
                  <div style={{ width: "200px", height: "200px", margin: "auto", position: "relative" }}>
                    <Doughnut data={chartData} options={chartOptions} />
                    <div className="chart-center-percentage">
                      <span className="percentage-value">{completionPercentage}%</span>
                      <span className="percentage-label">Completed</span>
                    </div>
                  </div>
                </div>
                <div className="progress-stats">
                  <div className="stat-item">
                    <span className="stat-label">Completed:</span>
                    <span className="stat-value">{team.counts["Completed"] || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">In Progress:</span>
                    <span className="stat-value">{team.counts["In Progress"] || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">To Do:</span>
                    <span className="stat-value">{team.counts["To Do"] || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Total Tasks:</span>
                    <span className="stat-value">{Object.values(team.counts).reduce((sum, count) => sum + count, 0)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="no-teams-message">
          <i className="fas fa-users fa-2x text-muted mb-2"></i>
          <p className="fst-italic text-muted">No teams with tasks to display progress.</p>
          <small className="text-muted">This could be because:</small>
          <ul className="text-muted small">
            <li>No teams are assigned to you</li>
            <li>Your teams don't have any tasks yet</li>
            <li>There might be a data mismatch in adviser_group</li>
          </ul>
        </div>
      )}
    </div>
  );
};

// Main AdviserDashboard Component
const AdviserDashboard = ({ activePageFromHeader }) => {
  useAuthGuard();
  const [sidebarWidth, setSidebarWidth] = useState(70);
  const [isSoloMode, setIsSoloMode] = useState(false);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [teamsProgress, setTeamsProgress] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  const [activePage, setActivePage] = useState(
    location.state?.activePage || activePageFromHeader || "Dashboard"
  );

  const navigate = useNavigate();
  const { subPage } = useParams();

  const handlePageChange = (page) => {
    setActivePage(page);
    navigate(`/Adviser/${page.replace(/\s+/g, "")}`, { state: { activePage: page } });
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

  // Fetch all data for the adviser dashboard
  useEffect(() => {
    const fetchAdviserData = async () => {
      try {
        setIsLoading(true);
        const storedUser = localStorage.getItem("customUser");
        if (!storedUser) {
          return;
        }
        
        const adviser = JSON.parse(storedUser);
        const adviserId = adviser.id;
        const adviserGroup = adviser.adviser_group;

        if (!adviserId || !adviserGroup) {
          return;
        }

        // Fetch all tasks for this adviser (oral and final defense tasks)
        let allAdviserTasks = [];
        
        const [oralTasksResult, finalTasksResult] = await Promise.all([
          supabase.from("adviser_oral_def").select("*").eq("adviser_id", adviserId),
          supabase.from("adviser_final_def").select("*").eq("adviser_id", adviserId)
        ]);

        if (oralTasksResult.error) console.error("Error fetching oral tasks:", oralTasksResult.error);
        if (finalTasksResult.error) console.error("Error fetching final tasks:", finalTasksResult.error);

        if (oralTasksResult.data) {
          allAdviserTasks = [...allAdviserTasks, ...oralTasksResult.data.map(t => ({...t, type: "oral"}))];
        }
        if (finalTasksResult.data) {
          allAdviserTasks = [...allAdviserTasks, ...finalTasksResult.data.map(t => ({...t, type: "final"}))];
        }

        // 1. Upcoming Tasks - tasks that are due today or in the future and not completed
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const upcoming = allAdviserTasks
          .filter(task => {
            if (!task.due_date) return false;
            const dueDate = new Date(task.due_date);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate >= today && task.status !== "Completed";
          })
          .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
          .slice(0, 5);

        // Fetch manager names for upcoming tasks
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
              managerName: manager ? `${manager.first_name} ${manager.last_name}` : "Unknown Manager" 
            };
          })
        );
        
        setUpcomingTasks(upcomingWithNames);

        // 2. Recent Tasks - sort by creation date
        const recent = [...allAdviserTasks]
          .sort((a, b) => new Date(b.date_created || b.created_at) - new Date(a.date_created || a.created_at))
          .slice(0, 5);
        setRecentTasks(recent);

        // 3. Teams' Progress - FIXED: Now also includes adviser tasks for teams
        const { data: teams, error: teamsError } = await supabase
          .from("user_credentials")
          .select("id, group_name, first_name, last_name, adviser_group, user_roles")
          .eq("adviser_group", adviserGroup)
          .eq("user_roles", 1); // Project managers

        if (teamsError) {
          console.error("Error fetching teams for adviser:", teamsError);
          setTeamsProgress([]);
        } else if (!teams || teams.length === 0) {
          setTeamsProgress([]);
        } else {
          // Fetch task progress for each team - NOW INCLUDES ADVISER TASKS
          const teamsProgressData = await Promise.all(
            teams.map(async (team) => {
              try {
                // Fetch BOTH manager tasks AND adviser tasks for this team
                const [managerTasksResult, adviserOralTasksResult, adviserFinalTasksResult] = await Promise.all([
                  // Manager tasks from manager_title_task
                  supabase.from("manager_title_task").select("status, task_name, due_date").eq("manager_id", team.id),
                  // Adviser oral defense tasks for this manager
                  supabase.from("adviser_oral_def").select("status, task, due_date").eq("manager_id", team.id).eq("adviser_id", adviserId),
                  // Adviser final defense tasks for this manager
                  supabase.from("adviser_final_def").select("status, task, due_date").eq("manager_id", team.id).eq("adviser_id", adviserId)
                ]);

                const managerTasks = managerTasksResult.data || [];
                const adviserOralTasks = adviserOralTasksResult.data || [];
                const adviserFinalTasks = adviserFinalTasksResult.data || [];

                // Combine all tasks for this team
                const allTeamTasks = [
                  ...managerTasks.map(t => ({ ...t, source: 'manager' })),
                  ...adviserOralTasks.map(t => ({ ...t, source: 'adviser_oral' })),
                  ...adviserFinalTasks.map(t => ({ ...t, source: 'adviser_final' }))
                ];

                // Only include teams that actually have tasks
                if (allTeamTasks.length === 0) {
                  return null;
                }

                // Count tasks by status - COMBINE ALL TASK TYPES
                const counts = { 
                  "To Do": 0, 
                  "In Progress": 0, 
                  "To Review": 0, 
                  "Completed": 0, 
                  "Missed": 0 
                };
                
                allTeamTasks.forEach(task => {
                  if (counts[task.status] !== undefined) {
                    counts[task.status]++;
                  } else {
                    // Handle unknown statuses
                    counts["To Do"]++;
                  }
                });

                const teamProgress = {
                  group_name: team.group_name,
                  manager_id: team.id,
                  manager_name: `${team.first_name} ${team.last_name}`,
                  counts,
                  total_tasks: allTeamTasks.length,
                  task_breakdown: {
                    manager_tasks: managerTasks.length,
                    adviser_oral_tasks: adviserOralTasks.length,
                    adviser_final_tasks: adviserFinalTasks.length
                  }
                };

                return teamProgress;

              } catch (error) {
                console.error(`Error processing team ${team.group_name}:`, error);
                return null;
              }
            })
          );
          
          // Filter out null values (teams with no tasks or errors)
          const filteredTeamsProgress = teamsProgressData.filter(Boolean);
          setTeamsProgress(filteredTeamsProgress);
        }

        // 4. Calendar Events
        const events = allAdviserTasks.map(task => ({
          id: task.id,
          title: `${task.task} (${task.status})`,
          start: task.due_date,
          color: task.status === "Completed" ? "#4BC0C0"
                : task.status === "Missed" ? "#FF6384"
                : task.status === "In Progress" ? "#809D3C"
                : task.status === "To Review" ? "#578FCA"
                : "#FABC3F"
        }));
        setCalendarEvents(events);

      } catch (error) {
        console.error("Error in fetchAdviserData:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!isSoloMode) {
      fetchAdviserData();
    }
  }, [isSoloMode]);

  const renderContent = () => {
    switch (activePage) {
      case "TeamsSummary":
        return <AdviserTeamSummary />;
      case "TermsOfService":
        return <TermsOfService />;
      case "Tasks":
        return <AdviserTask setActivePage={setActivePage} />;
      case "Oral Defense":
        return <AdviserOralDef />;
      case "Final Defense":
        return <AdviserFinalDef />;
      case "TeamsBoard":
        return <AdviserTeamBoard />;
      case "TasksRecord":
        return <AdviserTaskRecord setActivePage={setActivePage} />;
      case "Oral Defense Record":
        return <AdviserOralRecord />;
      case "Title Defense Record":
        return <AdviserFinalRecord />;
      case "Events":
        return <AdviserEvents setActivePage={setActivePage} />;
      case "Manucript Results":
        return <AdviserManuResult />;
      case "Capstone Defenses":
        return <AdviserCapsDefenses />;
      case "Profile":
        return <Profile />;
      case "Final Re Defense":
        return <AdviserFinalRedefTask />;
        case "Notification":
          return <Notification/>

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
                {/* Section 1: ADVISER UPCOMING ACTIVITY */}
                <div className="dashboard-section">
                  <h4>ADVISER UPCOMING ACTIVITY</h4>
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
                            <h5><i className="fas fa-tasks"></i> {t.task}</h5>
                            <p><i className="fas fa-calendar-alt"></i> {new Date(t.due_date).toLocaleDateString()}</p>
                            <p><i className="fas fa-clock"></i> {t.time || "No Time"}</p>
                            <p><i className="fas fa-flag"></i> {t.type === "oral" ? "Oral Defense" : "Final Defense"}</p>
                            <span className={`status-badge status-${t.status ? t.status.toLowerCase().replace(" ", "-") : 'to-do'}`}>
                              {t.status || "To Do"}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Section 2: ADVISER TEAMS' PROGRESS */}
                <div className="dashboard-section">
                  <div className="section-header">
                    <h4>ADVISER TEAMS' PROGRESS</h4>
                    <span className="teams-count">{teamsProgress.length} team(s) with tasks</span>
                  </div>
                  <AdviserTeamProgress teamsProgress={teamsProgress} />
                </div>

                {/* Section 3: RECENT ADVISER TASKS CREATED */}
                <div className="dashboard-section">
                  <h4>RECENT ADVISER TASKS CREATED</h4>
                  {recentTasks.length === 0 ? (
                    <p className="fst-italic text-muted">No recent tasks.</p>
                  ) : (
                    <div className="recent-table-container">
                      <table>
                        <thead>
                          <tr>
                            <th>NO</th>
                            <th>Task</th>
                            <th>Type</th>
                            <th>Date Created</th>
                            <th>Due Date</th>
                            <th>Time</th>
                            <th>Project Phase</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentTasks.map((t, i) => (
                            <tr key={t.id}>
                              <td>{i + 1}.</td>
                              <td>{t.task}</td>
                              <td>
                                <span className={`task-type-badge ${t.type}`}>
                                  {t.type === "oral" ? "Oral Defense" : "Final Defense"}
                                </span>
                              </td>
                              <td>{new Date(t.date_created || t.created_at).toLocaleDateString()}</td>
                              <td>{t.due_date ? new Date(t.due_date).toLocaleDateString() : "-"}</td>
                              <td>{t.time || "-"}</td>
                              <td>{t.project_phase || "-"}</td>
                              <td>
                                <span className={`status-badge status-${t.status ? t.status.toLowerCase().replace(" ", "-") : 'to-do'}`}>
                                  {t.status || "To Do"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Section 4: ADVISER CALENDAR */}
                <div className="dashboard-section">
                  <h4>ADVISER CALENDAR</h4>
                  <div className="calendar-container">
                    <FullCalendar
                      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                      initialView="dayGridMonth"
                      headerToolbar={{
                        left: "prev,next today",
                        center: "title",
                        right: "dayGridMonth,timeGridWeek,timeGridDay"
                      }}
                      events={calendarEvents}
                      height="400px"
                    />
                  </div>
                </div>
              </>
            )}

            {/* CSS Styles */}
            <style>{`
              .adviser-dashboard-content {
                display: flex;
                flex-direction: column;
                gap: 25px;
              }
              
              .loading-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 40px;
                gap: 15px;
              }
              
              .dashboard-section {
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              
              .dashboard-section h4 {
                margin-bottom: 15px;
                color: #333;
                border-bottom: 2px solid #f0f0f0;
                padding-bottom: 8px;
              }
              
              .section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                border-bottom: 2px solid #f0f0f0;
                padding-bottom: 8px;
              }
              
              .teams-count {
                color: #666;
                font-size: 0.9rem;
                font-style: italic;
              }
              
              .upcoming-activity {
                display: flex;
                flex-direction: column;
                gap: 12px;
                max-height: 300px;
                overflow-y: auto;
              }
              
              .activity-card {
                border: 1px solid #e0e0e0;
                border-radius: 6px;
                padding: 15px;
                background: #f9f9f9;
                transition: all 0.3s ease;
              }
              
              .activity-card:hover {
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                transform: translateY(-2px);
              }
              
              .activity-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 10px;
                font-weight: bold;
                color: #333;
              }
              
              .activity-body h5 {
                margin: 0 0 8px 0;
                color: #444;
                font-size: 1rem;
              }
              
              .activity-body p {
                margin: 4px 0;
                color: #666;
                display: flex;
                align-items: center;
                gap: 5px;
              }
              
              .progress-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 20px;
                padding: 10px 0;
              }
              
              .progress-card {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                border: 1px solid #e9ecef;
                text-align: center;
                transition: all 0.3s ease;
                position: relative;
              }
              
              .progress-card:hover {
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
              }
              
              .progress-card h5 {
                margin-bottom: 15px;
                color: #333;
                font-size: 1rem;
              }
              
              .chart-container {
                position: relative;
                display: flex;
                justify-content: center;
                align-items: center;
              }
              
              .chart-center-percentage {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
                pointer-events: none;
              }
              
              .percentage-value {
                display: block;
                font-size: 1.5rem;
                font-weight: bold;
                color: #333;
                line-height: 1.2;
              }
              
              .percentage-label {
                display: block;
                font-size: 0.8rem;
                color: #666;
                margin-top: 2px;
              }
              
              .progress-stats {
                margin-top: 15px;
                display: flex;
                flex-direction: column;
                gap: 8px;
              }
              
              .stat-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 4px 0;
                border-bottom: 1px solid #f0f0f0;
              }
              
              .stat-label {
                font-size: 0.85rem;
                color: #666;
              }
              
              .stat-value {
                font-weight: bold;
                color: #333;
              }
              
              .no-teams-message {
                text-align: center;
                padding: 30px 20px;
                color: #666;
              }
              
              .no-teams-message ul {
                text-align: left;
                max-width: 300px;
                margin: 10px auto;
              }
              
              .recent-table-container {
                max-height: 400px;
                overflow-y: auto;
                border: 1px solid #e0e0e0;
                border-radius: 6px;
              }
              
              table {
                width: 100%;
                border-collapse: collapse;
              }
              
              th, td {
                padding: 10px 12px;
                text-align: left;
                border-bottom: 1px solid #ddd;
              }
              
              th {
                background-color: #f8f9fa;
                font-weight: bold;
                position: sticky;
                top: 0;
                z-index: 10;
              }
              
              tr:hover {
                background-color: #f5f5f5;
              }
              
              .status-badge {
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 0.8em;
                font-weight: bold;
                white-space: nowrap;
              }
              
              .task-type-badge {
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 0.8em;
                font-weight: bold;
                white-space: nowrap;
              }
              
              .task-type-badge.oral {
                background-color: #578FCA;
                color: white;
              }
              
              .task-type-badge.final {
                background-color: #AA60C8;
                color: white;
              }
              
              .status-to-do { background-color: #FABC3F; color: white; }
              .status-in-progress { background-color: #809D3C; color: white; }
              .status-to-review { background-color: #578FCA; color: white; }
              .status-completed { background-color: #4BC0C0; color: white; }
              .status-missed { background-color: #FF6384; color: white; }
              
              .calendar-container {
                background: white;
                border-radius: 8px;
                overflow: hidden;
                border: 1px solid #e0e0e0;
              }
              
              /* Responsive Design */
              @media (max-width: 768px) {
                .dashboard-section {
                  padding: 15px;
                }
                
                .section-header {
                  flex-direction: column;
                  align-items: flex-start;
                  gap: 8px;
                }
                
                .progress-grid {
                  grid-template-columns: 1fr;
                  gap: 15px;
                }
                
                .recent-table-container {
                  overflow-x: auto;
                }
                
                table {
                  min-width: 800px;
                }
              }
            `}</style>
          </div>
        );
    }
  };

  return (
    <div>
      <Header
        isSoloMode={isSoloMode}
        setIsSoloMode={setIsSoloMode}
      />
      <div className="d-flex" style={{ marginTop: "30px" }}>
        <Sidebar
          activeItem={activePage}
          onSelect={handlePageChange}
          onWidthChange={setSidebarWidth}
          isSoloMode={isSoloMode}
        />
        <div
          className="flex-grow-1 p-3"
          style={{
            marginLeft: `${sidebarWidth}px`,
            transition: "margin-left 0.3s",
          }}
          id="main-content-wrapper"
        >
          <main className="flex-grow-1 p-3">
            {renderContent()}
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};
export default AdviserDashboard;