import { useState, useEffect } from "react";
import { useNavigate, useLocation,useParams } from "react-router-dom";
import Sidebar from "../Sidebar";

import AdviserTeamSummary from "./AdviserTeamsSummary";
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

// ADDED FULLCALENDAR IMPORTS
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

// ADDED CHARTJS IMPORTS
import {
  Chart as ChartJS,
  Tooltip,
  Legend,
  ArcElement
} from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(Tooltip, Legend, ArcElement);

// Components for the new dashboard sections
const AdviserTeamProgress = ({ teamsProgress }) => {
  const getChartColor = (status) => {
    switch (status) {
      case "To Do":
        return "#FABC3F";
      case "In Progress":
        return "#809D3C";
      case "To Review":
        return "#578FCA";
      case "Completed":
        return "#4BC0C0";
      case "Missed":
        return "#FF6384";
      default:
        return "#B2B2B2";
    }
  };

  return (
    <div className="team-progress-container">
      {teamsProgress.length > 0 ? (
        teamsProgress.map((team, index) => {
          const chartData = {
            labels: Object.keys(team.counts),
            datasets: [
              {
                label: "Tasks",
                data: Object.values(team.counts),
                backgroundColor: Object.keys(team.counts).map(getChartColor),
                borderColor: "#ffffff",
                borderWidth: 2,
              },
            ],
          };

          const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "right",
              },
            },
          };

          return (
            <div key={index} className="progress-card">
              <h5>{team.group_name}</h5>
              <div style={{ width: "250px", height: "250px", margin: "auto" }}>
                <Pie data={chartData} options={chartOptions} />
              </div>
            </div>
          );
        })
      ) : (
        <p className="fst-italic text-muted">No teams to display progress.</p>
      )}
    </div>
  );
};

// Main AdviserDashboard Component
const AdviserDashboard = ({ activePageFromHeader }) => {
  const [sidebarWidth, setSidebarWidth] = useState(70);
  const [isSoloMode, setIsSoloMode] = useState(false);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [teamsProgress, setTeamsProgress] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const location = useLocation();

  const [activePage, setActivePage] = useState(
    location.state?.activePage || activePageFromHeader || "Dashboard"
  );

  const navigate = useNavigate();
const { subPage } = useParams();
const handlePageChange = (page) => {
  setActivePage(page);
  navigate(`/Adviser/${page.replace(/\s+/g, "")}`);
};
useEffect(() => {
    if (subPage) {
      setActivePage(subPage.replace(/([A-Z])/g, " $1").trim());
    } else {
      setActivePage("Dashboard");
    }
  }, [subPage]);



  useEffect(() => {
  if (isSoloMode) {
    setActivePage("SoloModeDashboard");
  } else if (subPage) {
    setActivePage(subPage.replace(/([A-Z])/g, " $1").trim());
  } else {
    setActivePage("Dashboard");
  }
}, [isSoloMode, subPage]);


  // Fetch all data for the adviser dashboard
  useEffect(() => {
    const fetchAdviserData = async () => {
      const storedUser = localStorage.getItem("customUser");
      if (!storedUser) return;
      const adviser = JSON.parse(storedUser);
      const adviserId = adviser.id;
      const adviserGroup = adviser.adviser_group;

      if (!adviserId || !adviserGroup) return;

      // Fetch all tasks for this adviser
      let allAdviserTasks = [];
      const oralTasksPromise = supabase
        .from("adviser_oral_def")
        .select("*")
        .eq("adviser_id", adviserId);
      const finalTasksPromise = supabase
        .from("adviser_final_def")
        .select("*")
        .eq("adviser_id", adviserId);

      const [{ data: oralTasks, error: oralError }, { data: finalTasks, error: finalError }] =
        await Promise.all([oralTasksPromise, finalTasksPromise]);

      if (oralError) console.error("Error fetching oral tasks:", oralError);
      if (finalError) console.error("Error fetching final tasks:", finalError);

      if (oralTasks) allAdviserTasks = [...allAdviserTasks, ...oralTasks.map(t => ({...t, type: "oral"}))];
      if (finalTasks) allAdviserTasks = [...allAdviserTasks, ...finalTasks.map(t => ({...t, type: "final"}))];

      // 1. Upcoming Tasks
      const today = new Date();
      const upcoming = allAdviserTasks
        .filter(task => task.due_date && new Date(task.due_date) >= today && task.status !== "Completed")
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
        .slice(0, 5);

      const upcomingWithNames = await Promise.all(upcoming.map(async (task) => {
        if (!task.manager_id) return { ...task, managerName: "N/A" };
        const { data: manager } = await supabase.from("user_credentials").select("first_name, last_name").eq("id", task.manager_id).single();
        return { ...task, managerName: manager ? `${manager.first_name} ${manager.last_name}` : "Unknown Manager" };
      }));
      setUpcomingTasks(upcomingWithNames);

      // 2. Recent Tasks
      const recent = [...allAdviserTasks]
        .sort((a, b) => new Date(b.date_created) - new Date(a.date_created))
        .slice(0, 5);
      setRecentTasks(recent);

      // 3. Teams' Progress
      const { data: teams, error: teamsError } = await supabase
        .from("user_credentials")
        .select("id, group_name")
        .eq("adviser_group", adviserGroup)
        .eq("user_roles", 1); // Get all managers for this adviser group

      if (teamsError) {
        console.error("Error fetching teams for adviser:", teamsError);
        return;
      }
      
      const teamsProgressData = await Promise.all(teams.map(async (team) => {
        const { data: managerTasks, error: tasksError } = await supabase
          .from("manager_title_task") // Assuming these tables are linked via manager_id
          .select("status")
          .eq("manager_id", team.id);

        if (tasksError) {
          console.error("Error fetching tasks for manager:", tasksError);
          return null;
        }

        const counts = { "To Do": 0, "In Progress": 0, "To Review": 0, "Completed": 0, "Missed": 0 };
        managerTasks?.forEach(task => {
          if (counts[task.status] !== undefined) {
            counts[task.status]++;
          }
        });

        return {
          group_name: team.group_name,
          counts,
        };
      }));
      setTeamsProgress(teamsProgressData.filter(Boolean));

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
    };

    fetchAdviserData();
  }, [isSoloMode]);

  const renderContent = () => {
    switch (activePage) {
      case "Teams Summary":
        return <AdviserTeamSummary />;
      case "Tasks":
        return <AdviserTask setActivePage={setActivePage} />;
      case "Oral Defense":
        return <AdviserOralDef />;
      case "Final Defense":
        return <AdviserFinalDef />;
      case "Teams Board":
        return <AdviserTeamBoard />;
      case "Tasks Record":
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
      case "SoloModeDashboard":
        return <SoloModeDashboard />;
      case "SolomodeTasks":
        return <SoloModeTasks />;
      case "SolomodeTasks Board":
        return <SoloModeTasksBoard />;
      case "SolomodeTasks Record":
        return <SoloModeTasksRecord />;

      default:
        return (
          <div className="adviser-dashboard-content">
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
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="summary-progress-container">
              <div className="adviser-team-progress">
                <h4>ADVISER TEAMS' PROGRESS</h4>
                <AdviserTeamProgress teamsProgress={teamsProgress} />
              </div>
            </div>

            <div className="recent-calendar-layout">
              <div className="recent-activity">
                <h4>RECENT ADVISER TASKS CREATED</h4>
                {recentTasks.length === 0 ? (
                  <p className="fst-italic text-muted">No recent tasks.</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>NO</th><th>Task</th><th>Date Created</th><th>Due Date</th>
                        <th>Time</th><th>Project Phase</th><th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTasks.map((t, i) => (
                        <tr key={t.id}>
                          <td>{i + 1}.</td>
                          <td>{t.task}</td>
                          <td>{new Date(t.date_created).toLocaleDateString()}</td>
                          <td>{new Date(t.due_date).toLocaleDateString()}</td>
                          <td>{t.time}</td>
                          <td>{t.project_phase || "-"}</td>
                          <td>
                            <span className={`status-badge status-${t.status.toLowerCase().replace(" ", "-")}`}>
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="calendar-container">
                <h4>ADVISER CALENDAR</h4>
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  headerToolbar={{
                    left: "prev,next today",
                    center: "title",
                    right: "dayGridMonth,timeGridWeek,timeGridDay"
                  }}
                  events={calendarEvents}
                  height="600px"
                />
              </div>
            </div>
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
    <div className="d-flex" style={{ marginTop: "30px" }}> {/* ✅ Idinagdag ang style={{ marginTop: "60px" }} */}
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