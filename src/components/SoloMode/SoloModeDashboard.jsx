// src/components/SoloMode/SoloModeDashboard.jsx
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
} from "chart.js";
import { Line, Pie } from "react-chartjs-2";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

const WEEK_DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Title, Tooltip, Legend, Filler, ArcElement);

const getLineColor = (ctx) => {
  const colors = {
    "To Do": "#FABC3F",
    "In Progress": "#809D3C",
    "To Review": "#578FCA",
    "Completed": "#4BC0C0",
    "Missed": "#FF6384",
  };
  return colors[ctx.dataset.label] || "#000000";
};

const makeHalfAsOpaque = (ctx) => {
  const color = getLineColor(ctx);
  return color + "80"; // 50% opacity
};

const adjustRadiusBasedOnData = (ctx) => {
  const v = ctx.parsed.y;
  return v < 10 ? 5 : v < 25 ? 7 : v < 50 ? 9 : v < 75 ? 11 : 15;
};

// Pie chart for task progress
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
        backgroundColor: ["#FABC3F", "#809D3C", "#578FCA", "#4BC0C0", "#FF6384"],
        borderWidth: 1,
      },
    ],
  };
  const options = {
    responsive: true,
    plugins: { legend: { position: "bottom" }, title: { display: false } },
  };
  return <Pie data={data} options={options} />;
};

const SoloModeDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [statusCounts, setStatusCounts] = useState({
    "To Do": 0, "In Progress": 0, "To Review": 0, "Completed": 0, "Missed": 0,
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
        setTasks(data);

        // Compute counts
        const counts = { "To Do":0,"In Progress":0,"To Review":0,"Completed":0,"Missed":0 };
        data.forEach(t => {
          const s = t.status?.trim() || "To Do";
          if (counts[s] !== undefined) counts[s]++;
        });
        setStatusCounts(counts);

        // Recent 5 tasks
        const sorted = [...data].sort((a,b)=>new Date(b.created_at) - new Date(a.created_at)).slice(0,5);
        setRecentTasks(sorted);

        // Upcoming tasks
        const today = new Date();
        today.setHours(0,0,0,0); // normalize to start of today

        const upcoming = data
          .filter(t => t.due_date && !["Completed","Missed"].includes(t.status))
          .map(t => {
            let dueDateObj = new Date(t.due_date);
            if (t.time) {
              // clean timezone part like "+00"
              const cleanTime = t.time.split("+")[0];
              const [h, m, s] = cleanTime.split(":").map(n => parseInt(n, 10) || 0);
              dueDateObj.setHours(h, m, s);
            }
            console.log("Upcoming parse:", t.task, "due:", t.due_date, "time:", t.time, "=>", dueDateObj);
            return { ...t, dueDateObj };
          })
          .filter(t => t.dueDateObj >= today)
          .sort((a, b) => a.dueDateObj - b.dueDateObj)
          .slice(0, 5);

        console.log("All tasks:", data);
        console.log("Upcoming computed:", upcoming);

        setUpcomingTasks(upcoming);
      }
    };
    fetchTasks();
  }, []);

  // Weekly summary
  const weeklyData = WEEK_DAYS.map(day => {
    const dayTasks = tasks.filter(t => {
      if (!t.due_date) return false;
      const taskDay = new Date(t.due_date).toLocaleDateString("en-US",{weekday:"long"});
      return taskDay === day;
    });
    return {
      "To Do": dayTasks.filter(t=>t.status==="To Do").length,
      "In Progress": dayTasks.filter(t=>t.status==="In Progress").length,
      "To Review": dayTasks.filter(t=>t.status==="To Review").length,
      "Completed": dayTasks.filter(t=>t.status==="Completed").length,
      "Missed": dayTasks.filter(t=>t.status==="Missed").length,
    };
  });

  const lineData = {
    labels: WEEK_DAYS,
    datasets: ["To Do","In Progress","To Review","Completed","Missed"].map(status=>({
      label: status,
      data: weeklyData.map(d=>d[status]),
      borderColor: getLineColor({dataset:{label:status}}),
      backgroundColor: "transparent",
      fill: false,
      tension: 0.3,
      pointBackgroundColor: getLineColor({dataset:{label:status}}),
      pointHoverBackgroundColor: makeHalfAsOpaque,
      pointRadius: adjustRadiusBasedOnData,
      pointHoverRadius: 15
    }))
  };

  const lineOptions = {
    responsive:true,
    plugins:{legend:{position:"bottom"}, tooltip:{enabled:true}, title:{display:false}},
    scales:{y:{beginAtZero:true,ticks:{stepSize:1}}}
  };

  const calendarEvents = tasks.map(task => ({
    id: task.id,
    title: task.task + " (" + task.status + ")",
    start: task.due_date + "T" + (task.time || "00:00"),
    color: task.status === "Completed" ? "#4BC0C0"
          : task.status === "Missed" ? "#FF6384"
          : task.status === "In Progress" ? "#809D3C"
          : task.status === "To Review" ? "#578FCA"
          : "#FABC3F"
  }));

  return (
    <div className="dashboard-content">
      {/* UPCOMING TASKS */}
      <h4>UPCOMING TASKS</h4>
      <div className="upcoming-activity">
        {upcomingTasks.length === 0 ? (
          <p className="fst-italic text-muted">No upcoming tasks</p>
        ) : (
          upcomingTasks.map((t,i)=>(
            <div key={i} className="activity-card">
              <div className="activity-body">
                <h5>{t.task}</h5>
                <p><i className="fas fa-calendar-alt"></i> {new Date(t.due_date).toLocaleDateString()}</p>
                <p><i className="fas fa-clock"></i> {t.time || "No Time"}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="summary-progress-container">
        {/* WEEKLY SUMMARY */}
        <div className="weekly-summary">
          <h4>WEEKLY SUMMARY</h4>
          <Line data={lineData} options={lineOptions}/>
        </div>

        {/* TEAM PROGRESS */}
        <div className="team-progress">
          <h4>TASK PROGRESS</h4>
          <TaskProgressChart statusCounts={statusCounts}/>
        </div>
      </div>

      {/* RECENT TASKS */}
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
                  <th>Time</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTasks.map((t,i)=>(
                  <tr key={t.id}>
                    <td>{i+1}.</td>
                    <td>{t.task}</td>
                    <td>{new Date(t.created_at).toLocaleDateString()}</td>
                    <td>{t.due_date ? new Date(t.due_date).toLocaleDateString() : "-"}</td>
                    <td>{t.time || "-"}</td>
                    <td>
                      <span className={`status-badge status-${t.status?.toLowerCase().replace(" ","-")}`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* TASK CALENDAR */}
        <div className="calendar-container">
          <h4>TASK CALENDAR</h4>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{ left:"prev,next today", center:"title", right:"dayGridMonth,timeGridWeek,timeGridDay" }}
            events={calendarEvents}
            height="600px"
          />
        </div>
      </div>
    </div>
  );
};

export default SoloModeDashboard;
