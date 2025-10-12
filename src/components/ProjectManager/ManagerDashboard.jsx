// src/pages/Manager/ManagerDashboard.jsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import Sidebar from "../Sidebar";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from "chart.js";
import { Line, Pie } from "react-chartjs-2";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useAuthGuard } from "../../components/hooks/useAuthGuard";

// Pages
import Tasks from "./ManagerTask/ManagerTask";
import AdviserTasks from "./ManagerAdviserTask";
import MemberTaskBoard from "../Member/MemberTaskBoard";
import MemberTaskRecord from "../Member/MemberTaskRecord";
import ManagerTitleDefense from "./ManagerTask/ManagerTitleDefense";
import ManagerOralDefense from "./ManagerTask/ManagerOralDefense";
import ManagerFinalDefense from "./ManagerTask/ManagerFinalDefense";
import ManagerTaskRecord from "./ManagerTaskRecord/ManagerTaskRecord";
import ManagerTitleRecord from "./ManagerTaskRecord/ManagerTitleRecord";
import ManagerOralRecord from "./ManagerTaskRecord/ManagerOralRecord";
import ManagerTaskBoard from "./ManagerTaskBoard/ManagerTaskBoard";
import ManagerEvents from "./ManagerEvents";
import Profile from "../Profile";
import ManagerAllocation from "./ManagerTask/ManagerAllocation";
import ManagerFinalRecord from "./ManagerTaskRecord/ManagerFinalRecord";
import SoloModeDashboard from "../SoloMode/SoloModeDashboard";
import Header from "../Header";
import "../Style/ProjectManager/ManagerDB.css";
import { supabase } from "../../supabaseClient";
import Footer from "../Footer";
import ManagerFinalRedefTask from "./ManagerTask/ManagerFinalRedefTask";
import SoloModeTasks from "../SoloMode/SoloModeTasks";
import SoloModeTasksBoard from "../SoloMode/SoloModeTasksBoard";
import SoloModeTasksRecord from "../SoloMode/SoloModeTasksRecord";

// NEW: ToS modal + auth context
import TermsOfService from "../../components/TermsOfService";
import { UserAuth } from "../../Contex/AuthContext";

// ---- ChartJS
ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Title, Tooltip, Legend, Filler, ArcElement);

// ---- Constants
const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const ROLE_MANAGER = 1;                    // managers = 1 in your DB
const TOS_VERSION = "2025-05-09";          // must match TermsOfService.jsx

// ---- ToS helpers (role-agnostic check) ----
const getUserKey = (u) =>
  u?.id ||
  u?.user_id ||
  u?.uuid ||
  u?.email ||
  u?.user_email ||
  u?.username ||
  u?.user_key ||
  null;

// check ONLY by (user_key, version) → role is ignored
async function hasAcceptedTos(userKey) {
  const { data, error } = await supabase
    .from("tos_acceptance")
    .select("id")
    .eq("user_key", String(userKey))
    .eq("version", TOS_VERSION)
    .order("accepted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error && error.code !== "PGRST116") throw error;
  return !!data;
}

// insert a row; ignore duplicate key error if you add a unique index later
async function acceptTos(userKey, role) {
  const { error } = await supabase.from("tos_acceptance").insert({
    user_key: String(userKey),
    role: Number(role || 0),
    version: TOS_VERSION
  });
  if (error && error.code !== "23505") throw error;
}

// ---- Chart helpers
function getLineColor(ctx) {
  const colors = {
    "To Do": "#FABC3F",
    "In Progress": "#809D3C",
    "To Review": "#578FCA",
    "Completed": "#4BC0C0",
    "Missed": "#FF6384"
  };
  return colors[ctx.dataset.label] || "#000000";
}
function makeHalfAsOpaque(ctx) {
  const color = getLineColor(ctx);
  return color + "80";
}
function adjustRadiusBasedOnData(ctx) {
  const v = ctx.parsed.y;
  return v < 10 ? 5 : v < 25 ? 7 : v < 50 ? 9 : v < 75 ? 11 : 15;
}

// ---- Team progress pie chart
const TeamProgressChart = () => {
  const [statusCounts, setStatusCounts] = useState({
    "To Do": 0, "In Progress": 0, "To Review": 0, "Completed": 0, "Missed": 0
  });

  useEffect(() => {
    const fetchTaskStatusCounts = async () => {
      const storedUser = localStorage.getItem("customUser");
      if (!storedUser) return;
      const currentUser = JSON.parse(storedUser);
      const managerUUID = currentUser.uuid || currentUser.id;
      if (!managerUUID) return;

      let allData = [];
      const tables = ["manager_title_task", "manager_oral_task", "manager_final_task", "manager_final_redef"];
      for (const table of tables) {
        const { data } = await supabase.from(table).select("status").eq("manager_id", managerUUID);
        if (data) allData = [...allData, ...data];
      }

      const counts = { "To Do": 0, "In Progress": 0, "To Review": 0, "Completed": 0, "Missed": 0 };
      allData.forEach(task => {
        const status = task.status?.trim() || "To Do";
        if (counts[status] !== undefined) counts[status]++;
      });
      setStatusCounts(counts);
    };
    fetchTaskStatusCounts();
  }, []);

  const data = {
    labels: ["To Do", "In Progress", "To Review", "Completed", "Missed"],
    datasets: [{
      data: [
        statusCounts["To Do"],
        statusCounts["In Progress"],
        statusCounts["To Review"],
        statusCounts["Completed"],
        statusCounts["Missed"]
      ],
      backgroundColor: ["#FABC3F", "#809D3C", "#578FCA", "#4BC0C0", "#FF6384"],
      borderWidth: 1
    }]
  };
  const options = { responsive: true, plugins: { legend: { position: "bottom" }, title: { display: false } } };

  return (
    <div style={{ width: "220px", height: "220px", margin: "0 auto" }}>
      <Pie data={data} options={options} />
    </div>
  );
};

const ManagerDashboard = ({ activePageFromHeader }) => {
  useAuthGuard();

  const { logout } = UserAuth?.() || { logout: null };
  const location = useLocation();
  const navigate = useNavigate();
  const { subPage } = useParams();

  // ===== ToS state (role-agnostic check) =====
  const storedUser = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("customUser") || "null"); }
    catch { return null; }
  }, []);
  const userKey = getUserKey(storedUser);
  const role = Number(storedUser?.user_roles || ROLE_MANAGER);

  const [checkingTos, setCheckingTos] = useState(true);
  const [showTos, setShowTos] = useState(false);
  const [tosSaving, setTosSaving] = useState(false); // double-click guard

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!userKey) { if (alive) setShowTos(false); return; }
        const accepted = await hasAcceptedTos(userKey); // 👈 role ignored here
        if (alive) setShowTos(!accepted);
      } catch (e) {
        console.error("ToS check failed:", e);
        if (alive) setShowTos(true);
      } finally {
        if (alive) setCheckingTos(false);
      }
    })();
    return () => { alive = false; };
  }, [userKey]);

  const handleTosAccept = async () => {
    if (tosSaving) return;
    setTosSaving(true);
    try {
      if (!userKey) return;
      await acceptTos(userKey, role);
      setShowTos(false);
    } catch (e) {
      console.error("ToS accept failed:", e);
      // keep modal open so user can retry
    } finally {
      setTosSaving(false);
    }
  };

  const handleTosDecline = () => {
    localStorage.removeItem("customUser");
    localStorage.removeItem("user_id");
    if (typeof logout === "function") logout();
    navigate("/Signin", { replace: true });
  };

  // ===== Dashboard state =====
  const [activePage, setActivePage] = useState(location.state?.activePage || activePageFromHeader || "Dashboard");
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [allWeeklyTasks, setAllWeeklyTasks] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [isSoloMode, setIsSoloMode] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(70);

  const handlePageChange = (page) => {
    setActivePage(page);
    navigate(`/Manager/${page.replace(/\s+/g, "")}`, { state: { activePage: page } });
  };

  useEffect(() => {
    if (subPage) setActivePage(subPage);
    else if (isSoloMode) setActivePage("SoloModeDashboard");
    else setActivePage("Dashboard");
  }, [isSoloMode, subPage]);

  // Fetch all weekly tasks
  useEffect(() => {
    const fetchAllWeeklyTasks = async () => {
      const stored = localStorage.getItem("customUser");
      if (!stored) return;
      const currentUser = JSON.parse(stored);
      const managerUUID = currentUser.uuid || currentUser.id;
      if (!managerUUID) return;

      let allData = [];
      const tables = [
        {
          name: "manager_title_task",
          select: "id, task_name, due_date, due_time, status, created_date, member_id, project_phase",
          mapTask: t => t.task_name,
          mapCreated: t => t.created_date,
          mapTime: t => t.due_time?.slice(0, 5)
        },
        {
          name: "manager_oral_task",
          select: "id, task, due_date, time, status, created_at, member_id, project_phase",
          mapTask: t => t.task,
          mapCreated: t => t.created_at,
          mapTime: t => t.time?.slice(0, 5)
        },
        {
          name: "manager_final_task",
          select: "id, task, due_date, time, status, created_at, member_id, project_phase",
          mapTask: t => t.task,
          mapCreated: t => t.created_at,
          mapTime: t => t.time?.slice(0, 5)
        },
        {
          name: "manager_final_redef",
          select: "id, task, due_date, time, status, created_at, member_id, project_phase",
          mapTask: t => t.task,
          mapCreated: t => t.created_at,
          mapTime: t => t.time?.slice(0, 5)
        }
      ];

      for (const table of tables) {
        const { data } = await supabase.from(table.name).select(table.select).eq("manager_id", managerUUID);
        if (data) {
          const standardized = data.map(t => ({
            id: t.id,
            task: table.mapTask(t),
            created_at: table.mapCreated(t),
            due_date: t.due_date,
            time: table.mapTime(t) || "00:00",
            project_phase: t.project_phase || "-",
            status: t.status || "To Do",
            member_id: t.member_id
          }));
          allData = [...allData, ...standardized];
        }
      }

      setAllWeeklyTasks(allData);

      const sorted = [...allData].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
      setRecentTasks(sorted);
    };

    fetchAllWeeklyTasks();
  }, []);

  // Fetch upcoming tasks
  useEffect(() => {
    const fetchUpcomingTasks = async () => {
      const stored = localStorage.getItem("customUser");
      if (!stored) return;
      const currentUser = JSON.parse(stored);
      const managerUUID = currentUser.uuid || currentUser.id;
      if (!managerUUID) return;

      let allData = [];
      const tables = [
        {
          name: "manager_title_task",
          select: "id, task_name, due_date, due_time, member_id, status",
          mapTask: t => t.task_name,
          mapTime: t => t.due_time?.slice(0, 5)
        },
        {
          name: "manager_oral_task",
          select: "id, task, due_date, time, member_id, status",
          mapTask: t => t.task,
          mapTime: t => t.time?.slice(0, 5)
        },
        {
          name: "manager_final_task",
          select: "id, task, due_date, time, member_id, status",
          mapTask: t => t.task,
          mapTime: t => t.time?.slice(0, 5)
        },
        {
          name: "manager_final_redef",
          select: "id, task, due_date, time, status, created_at, member_id, project_phase",
          mapTask: t => t.task,
          mapCreated: t => t.created_at,
          mapTime: t => t.time?.slice(0, 5)
        }
      ];

      for (const table of tables) {
        const { data } = await supabase.from(table.name).select(table.select).eq("manager_id", managerUUID);
        if (data) {
          const standardized = data.map(t => ({
            id: t.id,
            task: table.mapTask(t),
            due_date: t.due_date,
            time: table.mapTime(t) || "00:00",
            member_id: t.member_id,
            status: t.status || "To Do"
          }));
          allData = [...allData, ...standardized];
        }
      }

      const today = new Date();
      const upcoming = allData
        .filter(task => task.due_date && !["Completed", "Missed"].includes(task.status))
        .map(task => ({ ...task, dueDateObj: new Date(task.due_date + "T" + task.time) }))
        .filter(task => task.dueDateObj >= today)
        .sort((a, b) => a.dueDateObj - b.dueDateObj)
        .slice(0, 5);

      const withNames = await Promise.all(upcoming.map(async task => {
        if (!task.member_id) return { ...task, memberName: "No Member" };
        const { data: member } = await supabase.from("user_credentials").select("first_name,last_name").eq("id", task.member_id).single();
        return { ...task, memberName: member ? `${member.first_name} ${member.last_name}` : "Unknown" };
      }));

      setUpcomingTasks(withNames);
    };

    fetchUpcomingTasks();
  }, []);

  // Weekly summary → chart data
  const weeklyData = WEEK_DAYS.map(day => {
    const dayTasks = allWeeklyTasks.filter(task => {
      const taskDay = new Date(task.due_date).toLocaleDateString("en-US", { weekday: "long" });
      return taskDay === day;
    });
    return {
      "To Do": dayTasks.filter(t => t.status === "To Do").length,
      "In Progress": dayTasks.filter(t => t.status === "In Progress").length,
      "To Review": dayTasks.filter(t => t.status === "To Review").length,
      "Completed": dayTasks.filter(t => t.status === "Completed").length,
      "Missed": dayTasks.filter(t => t.status === "Missed").length
    };
  });

  const lineData = {
    labels: WEEK_DAYS,
    datasets: ["To Do", "In Progress", "To Review", "Completed", "Missed"].map(status => ({
      label: status,
      data: weeklyData.map(d => d[status]),
      borderColor: getLineColor({ dataset: { label: status } }),
      backgroundColor: "transparent",
      fill: false,
      tension: 0.3,
      pointBackgroundColor: getLineColor({ dataset: { label: status } }),
      pointHoverBackgroundColor: makeHalfAsOpaque,
      pointRadius: adjustRadiusBasedOnData,
      pointHoverRadius: 15
    }))
  };

  const lineOptions = {
    responsive: true,
    plugins: { legend: { position: "bottom" }, tooltip: { enabled: true }, title: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
  };

  const calendarEvents = allWeeklyTasks.map(task => ({
    id: task.id,
    title: task.task + " (" + task.status + ")",
    start: task.due_date + "T" + (task.time || "00:00"),
    color: task.status === "Completed" ? "#4BC0C0"
      : task.status === "Missed" ? "#FF6384"
        : task.status === "In Progress" ? "#809D3C"
          : task.status === "To Review" ? "#578FCA"
            : "#FABC3F"
  }));

  const renderContent = () => {
    switch (activePage) {
      case "AdviserTasks": return <AdviserTasks />;
      case "TasksBoard": return <ManagerTaskBoard />;

      case "Tasks": return <Tasks setActivePage={setActivePage} />;
      case "Title Defense": return <ManagerTitleDefense />;
      case "Oral Defense": return <ManagerOralDefense />;
      case "Final Defense": return <ManagerFinalDefense />;
      case "Final Re-Defense": return <ManagerFinalRedefTask />;
      case "Tasks Allocation": return <ManagerAllocation />;

      case "TasksRecord": return <ManagerTaskRecord setActivePage={setActivePage} />;

      case "Title Defense Record": return <ManagerTitleRecord />;
      case "Oral Defense Record": return <ManagerOralRecord />;
      case "Final Defense Record": return <ManagerFinalRecord />;

      case "Events": return <ManagerEvents />;
      case "Profile": return <Profile />;
      case "SoloModeDashboard": return <SoloModeDashboard />;
      case "SolomodeTasks": return <SoloModeTasks />;
      case "SolomodeTasksBoard": return <SoloModeTasksBoard />;
      case "SolomodeTasksRecord": return <SoloModeTasksRecord />;
      default:
        return (
          <div className="dashboard-content">
            <h4>UPCOMING TASKS</h4>
            <div className="upcoming-activity">
              {upcomingTasks.length === 0 ? (
                <p className="fst-italic text-muted">No upcoming tasks</p>
              ) : (
                upcomingTasks.map((t, i) => (
                  <div key={i} className="activity-card">
                    <div className="activity-header">
                      <i className="fas fa-user-tag"></i>
                      <span>{t.memberName}</span>
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
              <div className="weekly-summary">
                <h4>WEEKLY SUMMARY</h4>
                <Line data={lineData} options={lineOptions} />
              </div>
              <div className="team-progress">
                <h4>TEAM PROGRESS</h4>
                <TeamProgressChart />
              </div>
            </div>

            <div className="recent-calendar-layout">
              <div className="recent-activity">
                <h4>RECENT TASKS CREATED</h4>
                {recentTasks.length === 0 ? (
                  <p className="fst-italic text-muted">No recent tasks</p>
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
                          <td>{new Date(t.created_at).toLocaleDateString()}</td>
                          <td>{new Date(t.due_date).toLocaleDateString()}</td>
                          <td>{t.time}</td>
                          <td>{t.project_phase}</td>
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
                <h4>TASK CALENDAR</h4>
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
      <div className="d-flex">
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

      {/* Show ToS only after the DB check completes */}
      {!checkingTos && (
        <TermsOfService open={showTos} onAccept={handleTosAccept} onDecline={handleTosDecline} />
      )}
    </div>
  );
};

export default ManagerDashboard;
