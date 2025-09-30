// MemberDashboard.jsx
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../Sidebar";
import MemberAllocation from "./MemberAllocation";
import MemberTask from "./MemberTask";
import MemberAdviserTasks from "./MemberAdviserTasks";
import MemberTaskBoard from "./MemberTaskBoard";
import MemberTasksRecord from "./MemberTaskRecord";
import MemberEvents from "./MemberEvents";
import Profile from "../Profile";
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
  ArcElement
} from "chart.js";
import { Line, Pie } from "react-chartjs-2";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import Footer from "../Footer";
import Header from "../Header";
import SoloModeDashboard from "../SoloMode/SoloModeDashboard";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Title, Tooltip, Legend, Filler, ArcElement);

const WEEK_DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

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
  return color + "80"; // 50% opacity
}

function adjustRadiusBasedOnData(ctx) {
  const v = ctx.parsed.y;
  return v < 10 ? 5 : v < 25 ? 7 : v < 50 ? 9 : v < 75 ? 11 : 15;
}

// Pie chart component
const TeamProgressChart = ({ statusCounts }) => {
  const data = {
    labels: ["To Do","In Progress","To Review","Completed","Missed"],
    datasets:[{
      data:[
        statusCounts["To Do"] || 0,
        statusCounts["In Progress"] || 0,
        statusCounts["To Review"] || 0,
        statusCounts["Completed"] || 0,
        statusCounts["Missed"] || 0
      ],
      backgroundColor: ["#FABC3F","#809D3C","#578FCA","#4BC0C0","#FF6384"],
      borderWidth: 1
    }]
  };
  const options = { responsive:true, plugins:{legend:{position:"bottom"}, title:{display:false}} };
  return (
    <div style={{width:"220px", height:"220px", margin:"0 auto"}}>
      <Pie data={data} options={options}/>
    </div>
  );
};

const MemberDashboard = () => {
  const location = useLocation();
  const initialPage = location.state?.activePage || localStorage.getItem("activePage") || "Dashboard";
  const [activePage, setActivePage] = useState(initialPage);
 const [isSoloMode, setIsSoloMode] = useState(false); //
const [sidebarWidth, setSidebarWidth] = useState(70);
  const [allTasks, setAllTasks] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [statusCounts, setStatusCounts] = useState({ "To Do":0,"In Progress":0,"To Review":0,"Completed":0,"Missed":0 });

  // Fetch tasks for member's group
  useEffect(() => {
    const fetchTasks = async () => {
      const storedUser = localStorage.getItem("customUser");
      if(!storedUser) return;

      const currentUser = JSON.parse(storedUser);

      // 1️⃣ Get current member record
      const { data: memberData } = await supabase
        .from("user_credentials")
        .select("id, group_number")
        .eq("id", currentUser.id)
        .single();
      if(!memberData) return;

      // 2️⃣ Find manager of this group
      const { data: managerData } = await supabase
        .from("user_credentials")
        .select("id")
        .eq("group_number", memberData.group_number)
        .eq("user_roles", 1)
        .single();
      if(!managerData) return;

      const managerId = managerData.id;

      // 3️⃣ Fetch tasks from all manager tables
      let allData = [];
      const tables = [
        { name:"manager_title_task", mapTask: t=>t.task_name, mapCreated: t=>t.created_date, mapTime: t=>t.due_time?.slice(0,5) },
        { name:"manager_oral_task", mapTask: t=>t.task, mapCreated: t=>t.created_at, mapTime: t=>t.time?.slice(0,5) },
        { name:"manager_final_task", mapTask: t=>t.task, mapCreated: t=>t.created_at, mapTime: t=>t.time?.slice(0,5) }
      ];

      for(const table of tables){
        const { data } = await supabase.from(table.name).select("*").eq("manager_id", managerId).eq("member_id", memberData.id);
        if(data){
          const standardized = data.map(t=>({
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

      // Weekly summary
      const counts = { "To Do":0,"In Progress":0,"To Review":0,"Completed":0,"Missed":0 };
      allData.forEach(t=>{
        const s = t.status?.trim() || "To Do";
        if(counts[s] !== undefined) counts[s]++;
      });
      setStatusCounts(counts);

      // Recent tasks
      const sortedRecent = [...allData].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,5);
      setRecentTasks(sortedRecent);

      // Upcoming tasks
      const today = new Date();
      const upcoming = allData
        .filter(t=>t.due_date && !["Completed","Missed"].includes(t.status))
        .map(t=>({...t, dueDateObj: new Date(t.due_date+"T"+(t.time||"00:00"))}))
        .filter(t=>t.dueDateObj >= today)
        .sort((a,b)=>a.dueDateObj - b.dueDateObj)
        .slice(0,5);
      setUpcomingTasks(upcoming);
    };

    fetchTasks();
  }, []);

  const weeklyData = WEEK_DAYS.map(day=>{
    const dayTasks = allTasks.filter(task=>{
      const taskDay = new Date(task.due_date).toLocaleDateString("en-US",{weekday:"long"});
      return taskDay === day;
    });
    return {
      "To Do": dayTasks.filter(t=>t.status==="To Do").length,
      "In Progress": dayTasks.filter(t=>t.status==="In Progress").length,
      "To Review": dayTasks.filter(t=>t.status==="To Review").length,
      "Completed": dayTasks.filter(t=>t.status==="Completed").length,
      "Missed": dayTasks.filter(t=>t.status==="Missed").length
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

  const calendarEvents = allTasks.map(task=>({
    id: task.id,
    title: task.task + " (" + task.status + ")",
    start: task.due_date + "T" + (task.time || "00:00"),
    color: task.status === "Completed" ? "#4BC0C0"
          : task.status === "Missed" ? "#FF6384"
          : task.status === "In Progress" ? "#809D3C"
          : task.status === "To Review" ? "#578FCA"
          : "#FABC3F"
  }));
  //////////////////////
  useEffect(() => {
    if (isSoloMode) {
      setActivePage("SoloModeDashboard");
    } else {
      setActivePage("Dashboard");
    }
  }, [isSoloMode]);
////////////////////
  const renderContent = ()=>{
    switch(activePage){
            //////////
      case "SoloModeDashboard":
        return <SoloModeDashboard />;
//////////
      case "Tasks Allocation": return <MemberAllocation />;
      case "Tasks": return <MemberTask />;
      case "Adviser Tasks": return <MemberAdviserTasks />;
      case "Tasks Board": return <MemberTaskBoard />;
      case "Tasks Record": return <MemberTasksRecord />;
      case "Events": return <MemberEvents />;
      case "Profile": return <Profile />;
      default:
        return (
          <div className="dashboard-content">
            <h4>UPCOMING TASKS</h4>
            <div className="upcoming-activity">
              {upcomingTasks.length===0 ? (
                <p className="fst-italic text-muted">No upcoming tasks</p>
              ) : upcomingTasks.map((t,i)=>(
                <div key={i} className="activity-card">
                  <div className="activity-header">
                    <i className="fas fa-tasks"></i>
                    <span>Task</span>
                  </div>
                  <div className="activity-body">
                    <h5>{t.task}</h5>
                    <p><i className="fas fa-calendar-alt"></i> {new Date(t.due_date).toLocaleDateString()}</p>
                    <p><i className="fas fa-clock"></i> {t.time || "No Time"}</p>
                    <p>Status: {t.status}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="summary-progress-container">
              <div className="weekly-summary">
                <h4>WEEKLY SUMMARY</h4>
                <Line data={lineData} options={lineOptions}/>
              </div>
              <div className="team-progress">
                <h4>TASK STATUS</h4>
                <TeamProgressChart statusCounts={statusCounts}/>
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
                        <th>NO</th><th>Task</th><th>Date Created</th><th>Due Date</th><th>Time</th><th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTasks.map((t,i)=>(
                        <tr key={t.id}>
                          <td>{i+1}.</td>
                          <td>{t.task}</td>
                          <td>{new Date(t.created_at).toLocaleDateString()}</td>
                          <td>{new Date(t.due_date).toLocaleDateString()}</td>
                          <td>{t.time}</td>
                          <td>{t.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="calendar-container">
                <h4>TASK CALENDAR</h4>
                <FullCalendar
                  plugins={[dayGridPlugin,timeGridPlugin,interactionPlugin]}
                  initialView="dayGridMonth"
                  headerToolbar={{
                    left:"prev,next today",
                    center:"title",
                    right:"dayGridMonth,timeGridWeek,timeGridDay"
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
          onSelect={setActivePage}
          onWidthChange={setSidebarWidth}
          isSoloMode={isSoloMode}
        />
        <div
          className="flex-grow-1 p-3"
          style={{
            marginLeft: `${sidebarWidth}px`,
            transition: "margin-left 0.3s",
          }}
       id="main-content-wrapper" // New wrapper for content and footer
      >
        <main className="flex-grow-1 p-3">
          {renderContent()}
        </main>
        {/* ✨ ADD THE FOOTER COMPONENT HERE */}
        <Footer /> 
      </div>
      </div>
    </div>
  );
};

export default MemberDashboard;
