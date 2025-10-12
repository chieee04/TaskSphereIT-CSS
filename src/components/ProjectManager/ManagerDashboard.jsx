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
  ArcElement,
  BarElement,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useAuthGuard } from "../../components/hooks/useAuthGuard";

// Pages
import Tasks from "./ManagerTask/ManagerTask";
import AdviserTasks from "./ManagerAdviserTask";
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

// ToS + auth
import TermsOfService from "../../components/TermsOfService";
import { UserAuth } from "../../Contex/AuthContext";

// Register core elements
ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
  BarElement
);

// --- single-color pillar background behind bars
const PillarBgPlugin = {
  id: "pillarBg",
  beforeDatasetsDraw(chart, _args, pluginOpts) {
    const { ctx, scales } = chart;
    const x = scales.x;
    const y = scales.y;
    if (!x || !y) return;

    const {
      color = "#EFEFF3",
      radius = 12,
      thickness = 32,
      maxValue = 10,
    } = pluginOpts || {};

    const topPx = y.getPixelForValue(maxValue);
    const bottomPx = y.getPixelForValue(0);

    ctx.save();
    ctx.fillStyle = color;

    const rrRect = (rx, ry, w, h, r) => {
      const rr = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(rx + rr, ry);
      ctx.arcTo(rx + w, ry, rx + w, ry + rr, rr);
      ctx.arcTo(rx + w, ry + h, rx + w - rr, ry + h, rr);
      ctx.arcTo(rx, ry + h, rx, ry + h - rr, rr);
      ctx.arcTo(rx, ry, rx + rr, ry, rr);
      ctx.closePath();
      ctx.fill();
    };

    for (let i = 0; i < x.ticks.length; i++) {
      const cx = x.getPixelForTick(i);
      const left = cx - thickness / 2;
      const height = bottomPx - topPx;
      rrRect(left, topPx, thickness, height, radius);
    }
    ctx.restore();
  },
};
ChartJS.register(PillarBgPlugin);

// ---------- constants ----------
const ROLE_MANAGER = 1;
const TOS_VERSION = "2025-05-09";
const ACCENT = "#5a0d0e";
const ACCENT_DARK = "#4e0b0c";
const STATUSES = ["To Do", "In Progress", "To Review", "Completed", "Missed"];

// ---------- TEAM PROGRESS ----------
const TeamProgressChart = () => {
  const [statusCounts, setStatusCounts] = useState({
    "To Do": 0,
    "In Progress": 0,
    "To Review": 0,
    "Completed": 0,
    "Missed": 0,
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
      allData.forEach((task) => {
        const status = task.status?.trim() || "To Do";
        if (counts[status] !== undefined) counts[status]++;
      });
      setStatusCounts(counts);
    };
    fetchTaskStatusCounts();
  }, []);

  const data = {
    labels: STATUSES,
    datasets: [
      {
        data: STATUSES.map((s) => statusCounts[s]),
        backgroundColor: [
          "#E9E9EE",
          "#E1E1E8",
          "#DADAE5",
          ACCENT,    // Completed (accent)
          "#F0F0F4",
        ],
        borderWidth: 1,
      },
    ],
  };
  const options = {
    responsive: true,
    plugins: {
      legend: { position: "bottom", align: "center" },
      title: { display: false },
    },
    maintainAspectRatio: false,
  };

  // smaller on small screens
  return (
    <div className="w-full flex justify-center items-center">
      <div className="w-[220px] sm:w-[280px] md:w-[360px] aspect-square">
        <Pie data={data} options={options} />
      </div>
    </div>
  );
};

const ManagerDashboard = ({ activePageFromHeader }) => {
  useAuthGuard();

  const { logout } = UserAuth?.() || { logout: null };
  const location = useLocation();
  const navigate = useNavigate();
  const { subPage } = useParams();

  // ===== ToS (manager: check user_credentials by user_id) =====
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("customUser") || "null");
    } catch {
      return null;
    }
  }, []);
  const role = Number(storedUser?.user_roles || ROLE_MANAGER);
  const userId = storedUser?.user_id != null ? String(storedUser.user_id) : null;

  const [checkingTos, setCheckingTos] = useState(true);
  const [showTos, setShowTos] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (Number(role) !== ROLE_MANAGER) {
          if (alive) setShowTos(false);
          return;
        }
        if (!userId) {
          if (alive) setShowTos(true);
          return;
        }
        const { data, error } = await supabase
          .from("user_credentials")
          .select("tos_agree, tos_version")
          .eq("user_id", userId)
          .single();
        if (error) {
          if (alive) setShowTos(true);
          return;
        }
        const agreed = data?.tos_agree === true && data?.tos_version === TOS_VERSION;
        if (alive) setShowTos(!agreed);
      } catch {
        if (alive) setShowTos(true);
      } finally {
        if (alive) setCheckingTos(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [role, userId]);

  const handleTosDecline = () => {
    localStorage.removeItem("customUser");
    localStorage.removeItem("user_id");
    if (typeof logout === "function") logout();
    navigate("/Signin", { replace: true });
  };

  // ===== Dashboard state =====
  const [activePage, setActivePage] = useState(location.state?.activePage || activePageFromHeader || "Dashboard");
  const [upcomingByMember, setUpcomingByMember] = useState([]);
  const [allWeeklyTasks, setAllWeeklyTasks] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [isSoloMode, setIsSoloMode] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(70);

  // Weekly Summary: start-day picker
  const todayISO = new Date().toISOString().slice(0, 10);
  const [weekStart, setWeekStart] = useState(todayISO);

  const handlePageChange = (page) => {
    setActivePage(page);
    navigate(`/Manager/${page.replace(/\s+/g, "")}`, { state: { activePage: page } });
  };

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activePage]);

  // Sync subPage / solo mode -> page
  useEffect(() => {
    if (subPage) setActivePage(subPage);
    else if (isSoloMode) setActivePage("SoloModeDashboard");
    else setActivePage("Dashboard");
  }, [isSoloMode, subPage]);

  // ----- Fetch all weekly tasks -----
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
          mapTask: (t) => t.task_name,
          mapCreated: (t) => t.created_date,
          mapTime: (t) => t.due_time?.slice(0, 5),
        },
        {
          name: "manager_oral_task",
          select: "id, task, due_date, time, status, created_at, member_id, project_phase",
          mapTask: (t) => t.task,
          mapCreated: (t) => t.created_at,
          mapTime: (t) => t.time?.slice(0, 5),
        },
        {
          name: "manager_final_task",
          select: "id, task, due_date, time, status, created_at, member_id, project_phase",
          mapTask: (t) => t.task,
          mapCreated: (t) => t.created_at,
          mapTime: (t) => t.time?.slice(0, 5),
        },
        {
          name: "manager_final_redef",
          select: "id, task, due_date, time, status, created_at, member_id, project_phase",
          mapTask: (t) => t.task,
          mapCreated: (t) => t.created_at,
          mapTime: (t) => t.time?.slice(0, 5),
        },
      ];

      for (const table of tables) {
        const { data } = await supabase.from(table.name).select(table.select).eq("manager_id", managerUUID);
        if (data) {
          const standardized = data.map((t) => ({
            id: t.id,
            task: table.mapTask(t),
            created_at: table.mapCreated(t),
            due_date: t.due_date,
            time: table.mapTime(t) || "00:00",
            project_phase: t.project_phase || "-",
            status: t.status || "To Do",
            member_id: t.member_id,
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

  // ----- Fetch upcoming tasks (grouped by member) -----
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
          mapTask: (t) => t.task_name,
          mapTime: (t) => t.due_time?.slice(0, 5),
        },
        {
          name: "manager_oral_task",
          select: "id, task, due_date, time, member_id, status",
          mapTask: (t) => t.task,
          mapTime: (t) => t.time?.slice(0, 5),
        },
        {
          name: "manager_final_task",
          select: "id, task, due_date, time, member_id, status",
          mapTask: (t) => t.task,
          mapTime: (t) => t.time?.slice(0, 5),
        },
        {
          name: "manager_final_redef",
          select: "id, task, due_date, time, status, created_at, member_id, project_phase",
          mapTask: (t) => t.task,
          mapTime: (t) => t.time?.slice(0, 5),
        },
      ];

      for (const table of tables) {
        const { data } = await supabase.from(table.name).select(table.select).eq("manager_id", managerUUID);
        if (data) {
          const standardized = data.map((t) => ({
            id: t.id,
            task: table.mapTask(t),
            due_date: t.due_date,
            time: table.mapTime(t) || "00:00",
            member_id: t.member_id,
            status: t.status || "To Do",
          }));
          allData = [...allData, ...standardized];
        }
      }

      const today = new Date();
      const upcoming = allData
        .filter((task) => task.due_date && !["Completed", "Missed"].includes(task.status))
        .map((task) => ({ ...task, dueDateObj: new Date(task.due_date + "T" + task.time) }))
        .filter((task) => task.dueDateObj >= today)
        .sort((a, b) => a.dueDateObj - b.dueDateObj);

      const withNames = await Promise.all(
        upcoming.map(async (task) => {
          if (!task.member_id) return { ...task, memberName: "No Member" };
          const { data: member } = await supabase
            .from("user_credentials")
            .select("first_name,last_name")
            .eq("id", task.member_id)
            .single();
          return { ...task, memberName: member ? `${member.first_name} ${member.last_name}` : "Unknown" };
        })
      );

      const safeDueAt = (t) => {
        const ts = t.time && /^\d{1,2}:\d{2}/.test(t.time) ? t.time : "23:59";
        const d = new Date(`${t.due_date}T${ts}`);
        return isNaN(d.getTime()) ? new Date(8640000000000000) : d;
      };
      const groupedMap = withNames.reduce((acc, t) => {
        const key = t.memberName || "No Member";
        if (!acc[key]) acc[key] = [];
        acc[key].push(t);
        return acc;
      }, {});
      const groupedArr = Object.entries(groupedMap).map(([memberName, tasks]) => ({
        memberName,
        tasks: tasks.sort((a, b) => safeDueAt(a) - safeDueAt(b)),
      }));
      groupedArr.sort((a, b) => a.memberName.localeCompare(b.memberName));

      setUpcomingByMember(groupedArr);
    };

    fetchUpcomingTasks();
  }, []);

  // ---------- WEEKLY SUMMARY ----------
  const weeklyCounts = useMemo(() => {
    const start = new Date(weekStart + "T00:00:00");
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const counts = { "To Do": 0, "In Progress": 0, "To Review": 0, "Completed": 0, "Missed": 0 };
    for (const t of allWeeklyTasks) {
      if (!t.due_date) continue;
      const d = new Date(t.due_date + "T00:00:00");
      if (d >= start && d <= end) {
        const s = t.status || "To Do";
        if (counts[s] !== undefined) counts[s]++;
      }
    }
    return counts;
  }, [allWeeklyTasks, weekStart]);

  const barMax = Math.max(5, ...Object.values(weeklyCounts));
  const barData = {
    labels: STATUSES,
    datasets: [
      {
        label: "Weekly Summary",
        data: STATUSES.map((s) => weeklyCounts[s]),
        backgroundColor: ACCENT,
        borderRadius: 12,
        borderSkipped: false,
        grouped: false,
        barThickness: 24,
        maxBarThickness: 28,
      },
    ],
  };
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
      pillarBg: { color: "#EFEFF3", radius: 12, thickness: 36, maxValue: barMax },
    },
    scales: {
      x: { grid: { display: false }, offset: true, ticks: { color: "#111827" } },
      y: { beginAtZero: true, suggestedMax: barMax, ticks: { precision: 0, stepSize: 1, color: "#111827" }, grid: { color: "#E5E7EB" } },
    },
  };

  const calendarEvents = allWeeklyTasks.map((task) => ({
    id: task.id,
    title: `${task.task} (${task.status})`,
    start: task.due_date + "T" + (task.time || "00:00"),
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

  // ---------- helpers ----------
  const renderStatusBadge = (status) => {
    if ((status || "").toLowerCase() === "completed") {
      return (
        <span
          className="px-3 py-1 rounded-full text-white text-xs font-semibold"
          style={{ backgroundColor: ACCENT }}
        >
          Completed
        </span>
      );
    }
    return <span className={`status-badge status-${status?.toLowerCase().replace(" ", "-")}`}>{status}</span>;
  };

  // ---------- Render ----------
  const renderContent = () => {
    switch (activePage) {
      case "AdviserTasks":
        return <AdviserTasks />;
      case "TasksBoard":
        return <ManagerTaskBoard />;
      case "Tasks":
        return <Tasks setActivePage={setActivePage} />;
      case "Title Defense":
        return <ManagerTitleDefense />;
      case "Oral Defense":
        return <ManagerOralDefense />;
      case "Final Defense":
        return <ManagerFinalDefense />;
      case "Final Re-Defense":
        return <ManagerFinalRedefTask />;
      case "Tasks Allocation":
        return <ManagerAllocation />;
      case "TasksRecord":
        return <ManagerTaskRecord setActivePage={setActivePage} />;
      case "Title Defense Record":
        return <ManagerTitleRecord />;
      case "Oral Defense Record":
        return <ManagerOralRecord />;
      case "Final Defense Record":
        return <ManagerFinalRecord />;
      case "Events":
        return <ManagerEvents />;
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
          <div className="flex flex-col gap-6">
            {/* UPCOMING (grouped) */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-3 border-b"
                style={{ borderColor: "#E9E9EE" }}
              >
                <h4 className="text-base sm:text-lg font-semibold text-gray-800">
                  <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: ACCENT }} />
                  UPCOMING TASKS
                </h4>
              </div>

              <div className="p-4 sm:p-6">
                {upcomingByMember.length === 0 ? (
                  <p className="italic text-gray-500">No upcoming tasks</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {upcomingByMember.map((group) => (
                      <div
                        key={group.memberName}
                        className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow transition"
                      >
                        <div
                          className="px-3 py-1 rounded-t-lg text-white text-xs font-semibold flex items-center justify-between"
                          style={{ backgroundColor: ACCENT }}
                        >
                          <span className="truncate">{group.memberName}</span>
                          <span className="ml-2 opacity-90">({group.tasks.length})</span>
                        </div>
                        <div className="p-4 space-y-4">
                          {group.tasks.map((t, idx) => (
                            <div key={t.id ?? `${group.memberName}-${idx}`}>
                              <h6 className="font-semibold text-gray-800 leading-snug break-words">
                                <i className="fas fa-tasks mr-2" />
                                {t.task}
                              </h6>
                              <div className="mt-1 text-sm text-gray-600 flex items-center gap-4 flex-wrap">
                                <span className="flex items-center gap-1">
                                  <i className="fas fa-calendar-alt" />
                                  {new Date(t.due_date).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <i className="fas fa-clock" />
                                  {t.time || "No Time"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* SUMMARY + TEAM PROGRESS */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly Summary (bars + day picker) */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-3 border-b gap-3"
                  style={{ borderColor: "#E9E9EE" }}
                >
                  <h4 className="text-base sm:text-lg font-semibold text-gray-800">
                    <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: ACCENT }} />
                    WEEKLY SUMMARY
                  </h4>

                  {/* Day picker */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 whitespace-nowrap">Start day:</label>
                    <input
                      type="date"
                      value={weekStart}
                      onChange={(e) => setWeekStart(e.target.value)}
                      className="text-sm border rounded px-2 py-1 bg-gray-900 text-white"
                    />
                  </div>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="w-full" style={{ minHeight: 280 }}>
                    <Bar data={barData} options={barOptions} />
                  </div>
                </div>
              </div>

              {/* Team Progress (pie smaller on small screens) */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div
                  className="flex items-center justify-between px-4 sm:px-6 py-3 border-b"
                  style={{ borderColor: "#E9E9EE" }}
                >
                  <h4 className="text-base sm:text-lg font-semibold text-gray-800">
                    <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: ACCENT }} />
                    TEAM PROGRESS
                  </h4>
                </div>
                <div className="p-4 sm:p-6">
                  <TeamProgressChart />
                </div>
              </div>
            </section>

            {/* RECENT TASKS — full row on desktop */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div
                className="flex items-center justify-between px-4 sm:px-6 py-3 border-b"
                style={{ borderColor: "#E9E9EE" }}
              >
                <h4 className="text-base sm:text-lg font-semibold text-gray-800">
                  <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: ACCENT }} />
                  RECENT TASKS CREATED
                </h4>
              </div>

              {recentTasks.length === 0 ? (
                <div className="p-6">
                  <p className="italic text-gray-500">No recent tasks</p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[420px]">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr className="text-left text-gray-600">
                        <th className="px-4 py-3">NO</th>
                        <th className="px-4 py-3">Task</th>
                        <th className="px-4 py-3">Date Created</th>
                        <th className="px-4 py-3">Due Date</th>
                        <th className="px-4 py-3">Time</th>
                        <th className="px-4 py-3">Project Phase</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {recentTasks.map((t, i) => (
                        <tr key={t.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">{i + 1}.</td>
                          <td className="px-4 py-3">{t.task}</td>
                          <td className="px-4 py-3">{new Date(t.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3">{new Date(t.due_date).toLocaleDateString()}</td>
                          <td className="px-4 py-3">{t.time}</td>
                          <td className="px-4 py-3">{t.project_phase}</td>
                          <td className="px-4 py-3">{renderStatusBadge(t.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* CALENDAR (separate section below, responsive, no sideways scroll) */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div
                className="flex items-center justify-between px-4 sm:px-6 py-3 border-b"
                style={{ borderColor: "#E9E9EE" }}
              >
                <h4 className="text-base sm:text-lg font-semibold text-gray-800">
                  <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: ACCENT }} />
                  TASK CALENDAR
                </h4>
              </div>
              <div className="p-4 sm:p-6">
                {/* calendar theme (buttons/arrows/month/week/day) */}
                <div className="task-calendar-theme">
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
                    contentHeight="auto"
                    aspectRatio={1.5} // helps responsiveness, no sideways scroll
                  />
                </div>
              </div>
            </section>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col pt-14 bg-gray-50">
      <Header isSoloMode={isSoloMode} setIsSoloMode={setIsSoloMode} />
      <div className="flex w-full">
        <Sidebar
          activeItem={activePage}
          onSelect={handlePageChange}
          onWidthChange={setSidebarWidth}
          isSoloMode={isSoloMode}
        />
        <div
          className="flex-1"
          style={{ marginLeft: `${sidebarWidth}px`, transition: "margin-left 0.3s ease" }}
          id="main-content-wrapper"
        >
          <main className="p-3 sm:p-4 lg:p-6">{renderContent()}</main>
          <Footer />
        </div>
      </div>

      {/* ToS modal */}
      {!checkingTos && (
        <TermsOfService open={showTos} onAccept={() => setShowTos(false)} onDecline={handleTosDecline} />
      )}

      {/* theme variables for calendar buttons (FullCalendar v6) */}
      <style>{`
        :root { --manager-accent:${ACCENT}; }
        /* FullCalendar button theming */
        .task-calendar-theme .fc .fc-button {
          background-color: ${ACCENT};
          border-color: ${ACCENT};
          color: #fff;
        }
        .task-calendar-theme .fc .fc-button:disabled {
          background-color: ${ACCENT};
          border-color: ${ACCENT};
          opacity: .6;
        }
        .task-calendar-theme .fc .fc-button:not(:disabled):hover,
        .task-calendar-theme .fc .fc-button:not(:disabled).fc-button-active {
          background-color: ${ACCENT_DARK};
          border-color: ${ACCENT_DARK};
          color: #fff;
        }
        .task-calendar-theme .fc .fc-button-primary:not(:disabled).fc-button-active {
          background-color: ${ACCENT_DARK};
          border-color: ${ACCENT_DARK};
        }
        /* keep page from accidental horizontal scroll due to calendar internals */
        #main-content-wrapper { min-width: 0; overflow-x: hidden; }
      `}</style>
    </div>
  );
};

export default ManagerDashboard;
