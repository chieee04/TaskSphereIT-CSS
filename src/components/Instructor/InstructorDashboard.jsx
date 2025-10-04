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

// Define the primary color constants for consistency
const TASKSPHERE_DARK_RED = "#5B0A0A";
const PENDING_TEXT_BROWN = "#795548";
const TASKSPHERE_PURPLE = "#805ad5";

// SVG-based Circular Progress Bar (kept)
const ProgressCircle = ({ percentage }) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const isFilled = percentage > 0;

  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <circle
        cx="60"
        cy="60"
        r={radius}
        fill="none"
        stroke="#f0f0f0"
        strokeWidth="12"
      />
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

const TeamCard = ({ adviser, teams }) => {
  return (
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
};

const InstructorDashboard = () => {
  const [activePage, setActivePage] = useState("Dashboard");
  const [sidebarWidth, setSidebarWidth] = useState(70);
  const [isSoloMode, setIsSoloMode] = useState(false);

  const navigate = useNavigate();
  const { subPage } = useParams();

  const handlePageChange = (page) => {
    setActivePage(page);
    navigate(`/Instructor/${page.replace(/\s+/g, "")}`, { state: { activePage: page } });
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

  // ==== FETCH TASKS FROM SUPABASE ====
  useEffect(() => {
    const fetchInstructorTasks = async () => {
      try {
        const { data: oralTasks, error: oralError } = await supabase
          .from("adviser_oral_def")
          .select("*");

        const { data: finalTasks, error: finalError } = await supabase
          .from("adviser_final_def")
          .select("*");

        if (oralError) console.error("Error fetching oral tasks:", oralError);
        if (finalError) console.error("Error fetching final tasks:", finalError);

        const allTasks = [
          ...(oralTasks || []).map((t) => ({ ...t, type: "Oral Defense" })),
          ...(finalTasks || []).map((t) => ({ ...t, type: "Final Defense" })),
        ];

        const today = new Date();

        // Upcoming = due date is today or later, not completed
        const upcoming = allTasks
          .filter(
            (task) =>
              task.due_date &&
              new Date(task.due_date) >= today &&
              task.status !== "Completed"
          )
          .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
          .slice(0, 5);
        setUpcomingTasks(upcoming);

        // Recent = latest created
        const recent = [...allTasks]
          .sort((a, b) => new Date(b.date_created) - new Date(a.date_created))
          .slice(0, 5);
        setRecentTasks(recent);

        // Calendar Events
        const events = allTasks.map((task) => ({
          id: task.id,
          title: `${task.task} (${task.type})`,
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
        console.error("Error loading instructor dashboard data:", error);
      }
    };

    fetchInstructorTasks();
  }, []);

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
          <div className="dashboard-content">
            <h4>UPCOMING ACTIVITY</h4>
            <div className="upcoming-activity">
              {upcomingTasks.length === 0 ? (
                <p className="fst-italic text-muted">No upcoming activities.</p>
              ) : (
                upcomingTasks.map((t, i) => (
                  <div key={i} className="activity-card">
                    <div className="activity-header">{t.type}</div>
                    <div className="activity-body">
                      <h5>
                        <i className="fas fa-tasks"></i> {t.task}
                      </h5>
                      <p>
                        <i className="fas fa-calendar-alt"></i>{" "}
                        {new Date(t.due_date).toLocaleDateString()}
                      </p>
                      <p>
                        <i className="fas fa-clock"></i> {t.time || "No Time"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="recent-calendar-layout">
              <div className="recent-activity">
                <h4>RECENT ACTIVITY CREATED</h4>
                {recentTasks.length === 0 ? (
                  <p className="fst-italic text-muted">No recent activities.</p>
                ) : (
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
                      </tr>
                    </thead>
                    <tbody>
                      {recentTasks.map((t, i) => (
                        <tr key={t.id}>
                          <td>{i + 1}.</td>
                          <td>{t.task}</td>
                          <td>{new Date(t.date_created).toLocaleDateString()}</td>
                          <td>{new Date(t.due_date).toLocaleDateString()}</td>
                          <td>{t.time || "—"}</td>
                          <td>{t.status}</td>
                          <td>{t.type}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="calendar-container">
                <h4>INSTRUCTOR CALENDAR</h4>
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  headerToolbar={{
                    left: "prev,next today",
                    center: "title",
                    right: "dayGridMonth,timeGridWeek,timeGridDay",
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
    </div>
  );
};

export default InstructorDashboard;
