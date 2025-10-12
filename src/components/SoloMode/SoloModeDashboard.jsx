import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
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
  defaults as ChartDefaults,
} from "chart.js";
import { Line, Pie } from "react-chartjs-2";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

// 🎨 COLOR THEME
const MAROON = "#6E0E0A"; // base accent
const LIGHT_MAROON = "#A94D4A"; // lighter maroon
const LIGHTER_MAROON = "#D47D7A"; // even lighter maroon
const SURFACE = "#FFFFFF";
const TEXT_PRIMARY = "#1F1F1F";
const TEXT_SECONDARY = "#6B7280";
const CARD_BG = "#F9FAFB";
const BORDER = "#E5E7EB";

const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

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
ChartDefaults.font.family =
  'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial';
ChartDefaults.color = TEXT_PRIMARY;

// 🟣 Line colors for charts (replacing blue with maroon tones)
const getLineColor = (ctx) => {
  const colors = {
    "To Do": "#F59E0B",
    "In Progress": LIGHT_MAROON,
    "To Review": LIGHTER_MAROON,
    "Completed": "#10B981",
    "Missed": "#EF4444",
  };
  return colors[ctx.dataset.label] || "#1F2937";
};

const makeHalfAsOpaque = (ctx) => {
  const color = getLineColor(ctx);
  return color + "80";
};

const adjustRadiusBasedOnData = (ctx) => {
  const v = ctx.parsed.y;
  return v < 10 ? 5 : v < 25 ? 7 : v < 50 ? 9 : v < 75 ? 11 : 15;
};

// 🧁 PIE CHART
const TaskProgressChart = ({ statusCounts }) => {
  const data = {
    labels: ["To Do", "In Progress", "To Review", "Completed", "Missed"],
    datasets: [
      {
        data: [
          statusCounts["To Do"],
          statusCounts["In Progress"],
          statusCounts["To Review"],
          statusCounts["Completed"],
          statusCounts["Missed"],
        ],
        backgroundColor: [
          "#F59E0B",
          LIGHT_MAROON,
          LIGHTER_MAROON,
          "#10B981",
          "#EF4444",
        ],
        borderWidth: 0,
      },
    ],
  };
  const options = {
    responsive: true,
    plugins: {
      legend: { position: "bottom", labels: { color: TEXT_PRIMARY } },
      title: { display: false },
    },
  };
  return <Pie data={data} options={options} />;
};

export default function SoloModeDashboard() {
  const [tasks, setTasks] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [statusCounts, setStatusCounts] = useState({
    "To Do": 0,
    "In Progress": 0,
    "To Review": 0,
    "Completed": 0,
    "Missed": 0,
  });

  useEffect(() => {
    const fetchTasks = async () => {
      const storedUser = localStorage.getItem("customUser");
      if (!storedUser) return;
      const currentUser = JSON.parse(storedUser);

      const { data, error } = await supabase
        .from("solo_mode_task")
        .select("*")
        .eq("user_id", currentUser.id);

      if (error) {
        console.error("Error fetching solo tasks:", error);
      } else {
        setTasks(data || []);

        const counts = {
          "To Do": 0,
          "In Progress": 0,
          "To Review": 0,
          "Completed": 0,
          "Missed": 0,
        };
        (data || []).forEach((t) => {
          const s = t.status?.trim() || "To Do";
          if (counts[s] !== undefined) counts[s]++;
        });
        setStatusCounts(counts);

        const sorted = [...(data || [])]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5);
        setRecentTasks(sorted);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming = (data || [])
          .filter((t) => t.due_date && !["Completed", "Missed"].includes(t.status))
          .map((t) => {
            let dueDateObj = new Date(t.due_date);
            if (t.time) {
              const cleanTime = t.time.split("+")[0];
              const [h, m, s] = cleanTime.split(":").map((n) => parseInt(n, 10) || 0);
              dueDateObj.setHours(h, m, s);
            }
            return { ...t, dueDateObj };
          })
          .filter((t) => t.dueDateObj >= today)
          .sort((a, b) => a.dueDateObj - b.dueDateObj)
          .slice(0, 5);

        setUpcomingTasks(upcoming);
      }
    };
    fetchTasks();
  }, []);

  const weeklyData = WEEK_DAYS.map((day) => {
    const dayTasks = tasks.filter((t) => {
      if (!t.due_date) return false;
      const taskDay = new Date(t.due_date).toLocaleDateString("en-US", {
        weekday: "long",
      });
      return taskDay === day;
    });
    return {
      "To Do": dayTasks.filter((t) => t.status === "To Do").length,
      "In Progress": dayTasks.filter((t) => t.status === "In Progress").length,
      "To Review": dayTasks.filter((t) => t.status === "To Review").length,
      "Completed": dayTasks.filter((t) => t.status === "Completed").length,
      "Missed": dayTasks.filter((t) => t.status === "Missed").length,
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
        pointHoverRadius: 12,
      })
    ),
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: { position: "bottom", labels: { color: TEXT_PRIMARY } },
      tooltip: { enabled: true },
      title: { display: false },
    },
    scales: {
      x: { ticks: { color: TEXT_PRIMARY }, grid: { color: "rgba(0,0,0,0.05)" } },
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, color: TEXT_PRIMARY },
        grid: { color: "rgba(0,0,0,0.05)" },
      },
    },
  };

  // 🗓️ Calendar Events – lighter maroon instead of blue
  const calendarEvents = tasks.map((task) => ({
    id: task.id,
    title: task.task + " (" + task.status + ")",
    start: task.due_date + "T" + (task.time || "00:00"),
    color:
      task.status === "Completed"
        ? "#10B981"
        : task.status === "Missed"
        ? "#EF4444"
        : task.status === "In Progress"
        ? LIGHT_MAROON
        : task.status === "To Review"
        ? LIGHTER_MAROON
        : "#F59E0B",
    textColor: "#fff",
  }));

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Solo Mode Dashboard
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Overview of your solo tasks and productivity insights.
            </p>
          </div>
        </div>

        {/* UPCOMING TASKS */}
        <section className="mb-10">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
            Upcoming Tasks
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {upcomingTasks.length === 0 ? (
              <div className="col-span-3 bg-gray-50 rounded-2xl p-6 shadow-sm border border-gray-200">
                <p className="italic text-gray-500">No upcoming tasks</p>
              </div>
            ) : (
              upcomingTasks.map((t, i) => (
                <div
                  key={i}
                  className="bg-gray-50 rounded-2xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 text-lg">
                      {t.task}
                    </h4>
                    <span
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${MAROON}10`,
                        color: MAROON,
                      }}
                    >
                      {t.status}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1z" />
                      </svg>
                      <span>
                        {t.due_date
                          ? new Date(t.due_date).toLocaleDateString()
                          : "No due date"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11V5a1 1 0 10-2 0v3a1 1 0 00.293.707l2 2a1 1 0 001.414-1.414L11 7z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{t.time || "No time"}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* CHARTS */}
        <section className="mb-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gray-50 rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4">
              Weekly Summary
            </h3>
            <Line data={lineData} options={lineOptions} />
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col items-center justify-center">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4">
              Task Progress
            </h3>
            <div className="w-full max-w-xs">
              <TaskProgressChart statusCounts={statusCounts} />
            </div>
            <p className="text-xs text-gray-500 text-center mt-4">
              Overview of task distribution. Hover chart segments for details.
            </p>
          </div>
        </section>

        {/* RECENT + CALENDAR */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* RECENT */}
          <div className="bg-gray-50 rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Recent Tasks Created
            </h3>
            {recentTasks.length === 0 ? (
              <p className="italic text-gray-500">No recent tasks</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-gray-500">#</th>
                      <th className="text-left py-2 text-gray-500">Task</th>
                      <th className="text-left py-2 text-gray-500">Created</th>
                      <th className="text-left py-2 text-gray-500">Due</th>
                      <th className="text-left py-2 text-gray-500">Time</th>
                      <th className="text-left py-2 text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTasks.map((t, i) => (
                      <tr
                        key={t.id}
                        className="border-b border-gray-100 hover:bg-gray-100/40 transition"
                      >
                        <td className="py-3 text-gray-700">{i + 1}</td>
                        <td className="py-3 text-gray-900">{t.task}</td>
                        <td className="py-3 text-gray-500">
                          {new Date(t.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-gray-500">
                          {t.due_date
                            ? new Date(t.due_date).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="py-3 text-gray-500">{t.time || "-"}</td>
                        <td className="py-3">
                          <span
                            className="inline-block px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${MAROON}10`,
                              color: MAROON,
                            }}
                          >
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

          {/* CALENDAR */}
          <div className="lg:col-span-2 bg-gray-50 rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Task Calendar
            </h3>
            <div className="rounded-md" style={{ minHeight: 520 }}>
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth,timeGridWeek,timeGridDay",
                }}
                events={calendarEvents}
                height={520}
              />
            </div>
          </div>
        </section>

        <div className="mt-8 text-xs text-center text-gray-400"></div>
      </div>
    </div>
  );
}
