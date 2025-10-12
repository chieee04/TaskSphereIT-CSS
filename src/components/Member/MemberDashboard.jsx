// src/pages/Member/MemberDashboard.jsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import Sidebar from "../Sidebar";
import MemberAllocation from "./MemberAllocation";
import MemberTask from "./MemberTask";
import MemberAdviserTasks from "./MemberAdviserTasks";
import MemberTaskBoard from "./MemberTaskBoard";
import MemberTasksRecord from "./MemberTaskRecord";
import MemberEvents from "./MemberEvents";
import Profile from "../Profile";
import { supabase } from "../../supabaseClient";
import { useAuthGuard } from "../../components/hooks/useAuthGuard";

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
  ArcElement,
} from "chart.js";
import { Line, Pie } from "react-chartjs-2";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import Footer from "../Footer";
import Header from "../Header";
import SoloModeDashboard from "../SoloMode/SoloModeDashboard";
import SoloModeTasks from "../SoloMode/SoloModeTasks";
import SoloModeTasksBoard from "../SoloMode/SoloModeTasksBoard";
import SoloModeTasksRecord from "../SoloMode/SoloModeTasksRecord";

// NEW: ToS modal + auth context
import TermsOfService from "../../components/TermsOfService";
import { UserAuth } from "../../Contex/AuthContext";

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const ROLE_MEMBER = 2;
const TOS_VERSION = "2025-05-09";

// TaskSphere colors (match Instructor)
const TASKSPHERE_PRIMARY = "#5a0d0e";
const TASKSPHERE_LIGHT = "#7a1d1e";
const TASKSPHERE_LIGHTER = "#9a3d3e";

// ToS helpers
const getUserKey = (u) =>
  u?.id ||
  u?.user_id ||
  u?.uuid ||
  u?.email ||
  u?.user_email ||
  u?.username ||
  u?.user_key ||
  null;

async function fetchTosAcceptance(userKey, role) {
  const { data, error } = await supabase
    .from("tos_acceptance")
    .select("user_key")
    .eq("user_key", String(userKey))
    .eq("role", Number(role || 0))
    .eq("version", TOS_VERSION)
    .maybeSingle();
  if (error && error.code !== "PGRST116") throw error;
  return !!data;
}

async function acceptTos(userKey, role) {
  const { error } = await supabase.from("tos_acceptance").insert({
    user_key: String(userKey),
    role: Number(role || 0),
    version: TOS_VERSION,
  });
  if (error && error.code !== "23505") throw error;
}

// Chart helpers
function getLineColor(ctx) {
  const colors = {
    "To Do": "#FABC3F",
    "In Progress": "#809D3C",
    "To Review": "#578FCA",
    Completed: "#4BC0C0",
    Missed: "#FF6384",
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

// Pie chart
const TeamProgressChart = ({ statusCounts }) => {
  const data = {
    labels: ["To Do", "In Progress", "To Review", "Completed", "Missed"],
    datasets: [
      {
        data: [
          statusCounts["To Do"] || 0,
          statusCounts["In Progress"] || 0,
          statusCounts["To Review"] || 0,
          statusCounts["Completed"] || 0,
          statusCounts["Missed"] || 0,
        ],
        backgroundColor: [
          "#FABC3F",
          "#809D3C",
          "#578FCA",
          "#4BC0C0",
          "#FF6384",
        ],
        borderWidth: 1,
      },
    ],
  };
  const options = {
    responsive: true,
    plugins: { legend: { position: "bottom" }, title: { display: false } },
  };
  return (
    <div style={{ width: "220px", height: "220px", margin: "0 auto" }}>
      <Pie data={data} options={options} />
    </div>
  );
};

// UI formatters
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";
const fmtTime12 = (t) => {
  if (!t) return "—";
  const [h, m] = (t || "00:00").split(":");
  let H = parseInt(h, 10);
  const ampm = H >= 12 ? "PM" : "AM";
  H = H % 12 || 12;
  return `${H}:${m} ${ampm}`;
};

const MemberDashboard = () => {
  useAuthGuard();

  const { logout } = UserAuth?.() || { logout: null };
  const location = useLocation();
  const navigate = useNavigate();
  const { subPage } = useParams();

  // ToS state
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("customUser") || "null");
    } catch {
      return null;
    }
  }, []);
  const userKey = getUserKey(storedUser);
  const role = Number(storedUser?.user_roles || ROLE_MEMBER);

  const [checkingTos, setCheckingTos] = useState(true);
  const [showTos, setShowTos] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!userKey || role !== ROLE_MEMBER) {
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
    }
  };
  const handleTosDecline = () => {
    localStorage.removeItem("customUser");
    localStorage.removeItem("user_id");
    if (typeof logout === "function") logout();
    navigate("/Signin", { replace: true });
  };

  // dashboard state (unchanged fetching)
  const initialPage =
    location.state?.activePage ||
    localStorage.getItem("activePage") ||
    "Dashboard";
  const [activePage, setActivePage] = useState(initialPage);
  const [isSoloMode, setIsSoloMode] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(70);
  const [allTasks, setAllTasks] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]); // still fetched; harmless if unused
  const [statusCounts, setStatusCounts] = useState({
    "To Do": 0,
    "In Progress": 0,
    "To Review": 0,
    Completed: 0,
    Missed: 0,
  });

  const handlePageChange = (page) => {
    setActivePage(page);
    navigate(`/Member/${page.replace(/\s+/g, "")}`, {
      state: { activePage: page },
    });
  };

  useEffect(() => {
    if (subPage) setActivePage(subPage);
    else if (isSoloMode) setActivePage("SoloModeDashboard");
    else setActivePage("Dashboard");
  }, [isSoloMode, subPage]);

  useEffect(() => {
    const fetchTasks = async () => {
      const stored = localStorage.getItem("customUser");
      if (!stored) return;
      const currentUser = JSON.parse(stored);

      const { data: memberData } = await supabase
        .from("user_credentials")
        .select("id, group_number")
        .eq("id", currentUser.id)
        .single();
      if (!memberData) return;

      const { data: managerData } = await supabase
        .from("user_credentials")
        .select("id")
        .eq("group_number", memberData.group_number)
        .eq("user_roles", 1)
        .single();
      if (!managerData) return;

      const managerId = managerData.id;

      let allData = [];
      const tables = [
        {
          name: "manager_title_task",
          mapTask: (t) => t.task_name,
          mapCreated: (t) => t.created_date,
          mapTime: (t) => t.due_time?.slice(0, 5),
        },
        {
          name: "manager_oral_task",
          mapTask: (t) => t.task,
          mapCreated: (t) => t.created_at,
          mapTime: (t) => t.time?.slice(0, 5),
        },
        {
          name: "manager_final_task",
          mapTask: (t) => t.task,
          mapCreated: (t) => t.created_at,
          mapTime: (t) => t.time?.slice(0, 5),
        },
        {
          name: "manager_final_redef",
          mapTask: (t) => t.task,
          mapCreated: (t) => t.created_at,
          mapTime: (t) => t.time?.slice(0, 5),
        },
      ];

      for (const table of tables) {
        const { data } = await supabase
          .from(table.name)
          .select("*")
          .eq("manager_id", managerId)
          .eq("member_id", memberData.id);
        if (data) {
          const standardized = data.map((t) => ({
            id: t.id,
            task: table.mapTask(t),
            created_at: table.mapCreated(t),
            due_date: t.due_date,
            time: table.mapTime(t) || "00:00",
            status: t.status || "To Do",
          }));
          allData = [...allData, ...standardized];
        }
      }

      setAllTasks(allData);

      const counts = {
        "To Do": 0,
        "In Progress": 0,
        "To Review": 0,
        Completed: 0,
        Missed: 0,
      };
      allData.forEach((t) => {
        const s = t.status?.trim() || "To Do";
        if (counts[s] !== undefined) counts[s]++;
      });
      setStatusCounts(counts);

      const sortedRecent = [...allData]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
      setRecentTasks(sortedRecent);

      const today = new Date();
      const upcoming = allData
        .filter(
          (t) => t.due_date && !["Completed", "Missed"].includes(t.status)
        )
        .map((t) => ({
          ...t,
          dueDateObj: new Date(t.due_date + "T" + (t.time || "00:00")),
        }))
        .filter((t) => t.dueDateObj >= today)
        .sort((a, b) => a.dueDateObj - b.dueDateObj)
        .slice(0, 5);
      setUpcomingTasks(upcoming);
    };

    fetchTasks();
  }, []);

  const weeklyData = WEEK_DAYS.map((day) => {
    const dayTasks = allTasks.filter((task) => {
      const taskDay = new Date(task.due_date).toLocaleDateString("en-US", {
        weekday: "long",
      });
      return taskDay === day;
    });
    return {
      "To Do": dayTasks.filter((t) => t.status === "To Do").length,
      "In Progress": dayTasks.filter((t) => t.status === "In Progress").length,
      "To Review": dayTasks.filter((t) => t.status === "To Review").length,
      Completed: dayTasks.filter((t) => t.status === "Completed").length,
      Missed: dayTasks.filter((t) => t.status === "Missed").length,
    };
  });

  const lineData = {
    labels: WEEK_DAYS,
    datasets: ["To Do", "In Progress", "To Review", "Completed", "Missed"].map(
      (status) => ({
        label: status,
        data: weeklyData.map((d) => d[status]),
        borderColor: getLineColor({ dataset: { label: status } }),
        backgroundColor: "transparent",
        fill: false,
        tension: 0.3,
        pointBackgroundColor: getLineColor({ dataset: { label: status } }),
        pointHoverBackgroundColor: makeHalfAsOpaque,
        pointRadius: adjustRadiusBasedOnData,
        pointHoverRadius: 15,
      })
    ),
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
      tooltip: { enabled: true },
      title: { display: false },
    },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
  };

  // Calendar events (uniform TaskSphere color)
  const calendarEvents = allTasks.map((task) => ({
    id: task.id,
    title: `${task.task} (${task.status})`,
    start: task.due_date + "T" + (task.time || "00:00"),
    backgroundColor: TASKSPHERE_PRIMARY,
    borderColor: TASKSPHERE_PRIMARY,
  }));

  const renderContent = () => {
    switch (activePage) {
      case "TasksAllocation":
        return <MemberAllocation />;
      case "Tasks":
        return <MemberTask />;
      case "AdviserTasks":
        return <MemberAdviserTasks />;
      case "TasksBoard":
        return <MemberTaskBoard />;
      case "TasksRecord":
        return <MemberTasksRecord />;
      case "Events":
        return <MemberEvents />;
      case "Profile":
        return <Profile />;
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
          <div className="member-dashboard-modern">
            {/* UPCOMING TASKS */}
            <div className="dashboard-section-modern">
              <h4 className="section-title-modern">UPCOMING TASKS</h4>
              <div className="upcoming-cards-grid">
                {upcomingTasks.length === 0 ? (
                  <p className="fst-italic text-muted">No upcoming tasks</p>
                ) : (
                  upcomingTasks.map((t, i) => (
                    <div key={i} className="upcoming-card-modern">
                      <div className="card-header-badge">Task</div>
                      <div className="card-manager-info">
                        <i className="fas fa-tasks"></i>
                        <span>{t.task}</span>
                      </div>
                      <div className="card-details">
                        <div className="detail-row">
                          <i className="fas fa-calendar-alt"></i>
                          <span>{fmtDate(t.due_date)}</span>
                        </div>
                        <div className="detail-row">
                          <i className="fas fa-clock"></i>
                          <span>{fmtTime12(t.time)}</span>
                        </div>
                        <div className="detail-row">
                          <i className="fas fa-info-circle"></i>
                          <span>Status: {t.status}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* WEEKLY SUMMARY & STATUS */}
            <div className="dashboard-section-modern">
              <h4 className="section-title-modern">WEEKLY SUMMARY & STATUS</h4>
              <div className="summary-progress-layout">
                <div className="weekly-summary-card">
                  <Line data={lineData} options={lineOptions} />
                </div>
                <div className="team-progress-card">
                  <TeamProgressChart statusCounts={statusCounts} />
                </div>
              </div>
            </div>

            {/* CALENDAR */}
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

            {/* Styles */}
            <style>{`
              .member-dashboard-modern {
                max-width: 1400px; margin: 0 auto; padding: 20px;
                display: flex; flex-direction: column; gap: 30px; background: #ffffff;
              }
              .dashboard-section-modern {
                background: #ffffff; border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.08);
                overflow: hidden; border: 1px solid #e8e8e8;
              }
              .section-title-modern {
                margin: 0; padding: 20px 25px; font-size: 0.9rem; font-weight: 700; letter-spacing: 1px;
                color: #333; border-bottom: 1px solid #e8e8e8;
              }

              /* Upcoming */
              .upcoming-cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; padding: 25px; }
              .upcoming-card-modern { background: #fff; border: 2px solid #e8e8e8; border-radius: 12px; overflow: hidden; transition: all .3s; }
              .upcoming-card-modern:hover { box-shadow: 0 4px 12px rgba(0,0,0,.1); transform: translateY(-2px); border-color: ${TASKSPHERE_LIGHTER}; }
              .card-header-badge { background: ${TASKSPHERE_PRIMARY}; color: #fff; padding: 12px 16px; font-size: .85rem; font-weight: 600; }
              .card-manager-info { display: flex; align-items: center; gap: 10px; padding: 16px; border-bottom: 1px solid #f0f0f0; }
              .card-manager-info i { color: ${TASKSPHERE_PRIMARY}; font-size: 1.1rem; }
              .card-manager-info span { font-weight: 600; color: #333; font-size: .95rem; }
              .card-details { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
              .detail-row { display: flex; align-items: center; gap: 10px; color: #666; font-size: .9rem; }
              .detail-row i { color: ${TASKSPHERE_PRIMARY}; width: 16px; }

              /* Summary + progress */
              .summary-progress-layout { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; padding: 25px; }
              .weekly-summary-card, .team-progress-card { background: #fff; border: 2px solid #e8e8e8; border-radius: 12px; padding: 16px; }

              /* Calendar */
              .calendar-wrapper-modern { padding: 25px; background: #fff; }
              .calendar-wrapper-modern .fc { border: none; background: #fff; }
              .fc .fc-toolbar-title { font-size: 1.3rem; font-weight: 700; color: #333; }
              .fc .fc-button { background-color: ${TASKSPHERE_PRIMARY} !important; border-color: ${TASKSPHERE_PRIMARY} !important; color: #fff !important; text-transform: capitalize; font-weight: 600; padding: 8px 16px; border-radius: 6px; }
              .fc .fc-button:hover { background-color: ${TASKSPHERE_LIGHT} !important; border-color: ${TASKSPHERE_LIGHT} !important; }
              .fc .fc-button:disabled { background-color: #ccc !important; border-color: #ccc !important; opacity: .5; }
              .fc .fc-button-active { background-color: ${TASKSPHERE_LIGHT} !important; border-color: ${TASKSPHERE_LIGHT} !important; }
              .fc-theme-standard .fc-scrollgrid { border: 1px solid #e8e8e8; border-radius: 8px; background: #fff; }
              .fc-theme-standard td, .fc-theme-standard th { border-color: #f0f0f0; background: #fff; }
              .fc .fc-col-header-cell { background: #fafafa; font-weight: 600; color: #666; padding: 12px 8px; }
              .fc .fc-daygrid-day-number { color: #333; font-weight: 600; padding: 8px; }
              .fc .fc-daygrid-day.fc-day-today { background-color: rgba(90, 13, 14, 0.05) !important; }
              .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
                background: ${TASKSPHERE_PRIMARY}; color: #fff; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
              }
              .fc .fc-event { background-color: ${TASKSPHERE_PRIMARY}; border-color: ${TASKSPHERE_PRIMARY}; border-radius: 4px; padding: 2px 4px; font-size: .85rem; }
              .fc .fc-event:hover { background-color: ${TASKSPHERE_LIGHT}; border-color: ${TASKSPHERE_LIGHT}; }
              .fc .fc-daygrid-event-dot { border-color: #fff; }

              /* Responsive */
              @media (max-width: 1024px) { .summary-progress-layout { grid-template-columns: 1fr; } }
              @media (max-width: 768px) {
                .member-dashboard-modern { padding: 15px; gap: 20px; }
                .section-title-modern { padding: 15px 20px; font-size: .85rem; }
                .upcoming-cards-grid { grid-template-columns: 1fr; padding: 20px; }
                .fc .fc-toolbar { flex-direction: column; gap: 10px; }
                .fc .fc-toolbar-chunk { display: flex; justify-content: center; }
              }
              @media (max-width: 480px) {
                .upcoming-cards-grid { padding: 15px; }
                .section-title-modern { padding: 12px 15px; font-size: .8rem; }
                .fc .fc-button { padding: 6px 12px; font-size: .85rem; }
              }
            `}</style>
          </div>
        );
    }
  };

  return (
    <div>
      <Header isSoloMode={isSoloMode} setIsSoloMode={setIsSoloMode} />
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
          <main className="flex-grow-1 p-3">{renderContent()}</main>
          <Footer />
        </div>
      </div>

      {!checkingTos && (
        <TermsOfService
          open={showTos}
          onAccept={handleTosAccept}
          onDecline={handleTosDecline}
        />
      )}
    </div>
  );
};

export default MemberDashboard;
