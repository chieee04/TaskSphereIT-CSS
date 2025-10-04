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


// Define the primary color constants for consistency
const TASKSPHERE_DARK_RED = "#5B0A0A";
const PENDING_TEXT_BROWN = "#795548";
const TASKSPHERE_PURPLE = "#805ad5";


// --- Calendar Helper Functions ---
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year, month) => {
  // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  return new Date(year, month, 1).getDay();
};

// --- Teams Progress Components ---

// SVG-based Circular Progress Bar
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

// Reusable component for a single adviser's card
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

  // State for the calendar
  const [currentDate, setCurrentDate] = useState(new Date(2025, 0, 1));
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const isJan2025 = year === 2025 && month === 0;
  const navigate = useNavigate();
  const { subPage } = useParams();
  const handlePageChange = (page) => {
    setActivePage(page);
    navigate(`/Instructor/${page.replace(/\s+/g, "")}`, { state: { activePage: page } });
  };

useEffect(() => {
  if (subPage) {
    setActivePage(subPage); // gamitin na lang raw string, walang formatting
  } else if (isSoloMode) {
    setActivePage("SoloModeDashboard");
  } else {
    setActivePage("Dashboard");
  }
}, [isSoloMode, subPage])



  // Hardcoded active days from the design for Jan 2025 only
  const activeDays = {
    filled: [8, 11, 15],
    bordered: [5, 17]
  };


  const handleMonthChange = (e) => {
    const [newMonthIndex, newYear] = e.target.value.split('-').map(Number);
    setCurrentDate(new Date(newYear, newMonthIndex));
  };

  const handleNav = (direction) => {
    const newMonth = month + direction;
    setCurrentDate(new Date(year, newMonth, 1));
  };

  // Generate the functional calendar grid data
  const calendarGrid = useMemo(() => {
    const totalCells = 42;
    const days = [];

    // Fill leading empty cells
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Fill actual days
    for (let day = 1; day <= daysInMonth; day++) {
      let type = 'normal';
      if (isJan2025) {
        if (activeDays.filled.includes(day)) {
          type = 'filled';
        } else if (activeDays.bordered.includes(day)) {
          type = 'bordered';
        }
      }
      days.push({ day, type });
    }

    // Pad the grid to fill the weeks for consistent layout
    while (days.length % 7 !== 0 && days.length < totalCells) {
      days.push(null);
    }

    // Divide into 7-day rows
    const grid = [];
    for (let i = 0; i < days.length; i += 7) {
      grid.push(days.slice(i, i + 7));
    }

    return grid;
  }, [year, month, daysInMonth, firstDay, isJan2025]);

  // Calendar Day Component Helper
  const CalendarDay = ({ data }) => {
    if (!data) return <td></td>;

    let className = '';
    if (data.type === 'filled') {
      className = 'primary-active-day';
    } else if (data.type === 'bordered') {
      className = 'secondary-active-day';
    }

    return (
      <td>
        <span className={className}>{data.day}</span>
      </td>
    );
  };


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
            <style>{`
              /* ====== Layout & Typography (Finalized) ====== */
              .dashboard-content { 
                  padding: 1rem; 
                  /* REMOVED flex-grow: 1; from here, it's now on the <main> element */
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              }
              h4 { 
                  color:#2c3e50; 
                  margin-bottom:1.2rem; 
                  font-size: 1.1rem; 
                  font-weight: 600; 
                  text-transform: uppercase;
              }
 
              /* ====== Upcoming Activity (Smaller Cards & Darker Shadows) ====== */
              .upcoming-activity { 
                  display:flex; 
                  flex-wrap: wrap;
                  gap:1rem; 
                  margin-bottom:2rem; 
                  align-items: flex-start; 
              }
              .activity-card { 
                  width: 220px; 
                  flex-shrink: 0; 
                  background:#fff; 
                  border-radius:6px; 
                  box-shadow:0 2px 8px rgba(0,0,0,0.2); 
                  padding:0; 
                  overflow: hidden;
              }
              .activity-header {
                  background: ${TASKSPHERE_DARK_RED}; 
                  color: #fff;
                  padding: 0.5rem 0.8rem; 
                  font-weight: 500;
                  font-size: 0.9rem; 
              }
              .activity-body {
                  padding: 0.6rem 0.8rem; 
                  color: #333;
              }
              .activity-body h5 { 
                  margin:0 0 0.4rem; 
                  font-weight: 600; 
                  font-size: 0.95rem; 
                  display:flex; 
                  align-items: center;
                  gap: 0.5rem;
              }
              .activity-body p { 
                  margin: 0.2rem 0; 
                  font-size: 0.85rem; 
                  line-height: 1.4;
                  color: #555;
                  display:flex;
                  align-items: center;
                  gap: 0.5rem; 
              }
              .activity-body p i, .activity-body h5 i { 
                  color: ${TASKSPHERE_DARK_RED}; 
                  font-size: 0.8rem; 
              }
 
              /* ====== Recent Activity & Calendar Layout (Darker Shadows) ====== */
              .recent-calendar-layout { 
                  display: grid; 
                  grid-template-columns: 2fr 1fr; 
                  gap: 1.5rem; 
                  align-items: flex-start; 
                  padding-bottom: 2rem; 
              }
              .recent-activity { 
                  background:#fff; 
                  border-radius:6px; 
                  box-shadow:0 2px 8px rgba(0,0,0,0.2); 
                  padding:1.5rem; 
                  height: fit-content; 
              }
              .calendar-container { 
                  background:#fff; 
                  border-radius:6px; 
                  box-shadow:0 2px 8px rgba(0,0,0,0.2); 
                  padding: 0.8rem 1.5rem 1.5rem 1.5rem; 
                  height: fit-content; 
                  width: 100%; 
              }
 
              /* ====== Recent Activity Created (Uniform White Rows & Darker Outlines) ====== */
              .recent-activity table { width:100%; border-collapse:collapse; margin-top: 1rem;}
              .recent-activity th, .recent-activity td { 
                  padding:0.7rem 0.5rem; 
                  text-align:left; 
                  font-size:.9rem; 
                  border-bottom: 1px solid #ccc; 
              }
              .recent-activity th {
                  font-weight: 600;
                  color: #333; 
                  font-size: 0.85rem;
                  text-transform: uppercase;
                  border-bottom: 2px solid #3B0304; 
              }
              .recent-activity tr:last-child td {
                  border-bottom: none; 
              }
 
              /* Status Pill Styling (Smaller Width & Darker Border) */
              .status-badge { 
                  padding:.2rem .6rem; /* Reduced horizontal padding */
                  border-radius:15px; 
                  font-size:.8rem; 
                  font-weight: 600;
                  text-align:center; 
                  display:inline-block; 
                  color: ${PENDING_TEXT_BROWN}; 
                  border: 2px solid ${TASKSPHERE_DARK_RED}; 
                  background-color: transparent; 
              }
 
              /* ====== Calendar Controls & Table (Functional & Darker Outlines) ====== */
              .calendar-header-controls { 
                  display: flex; 
                  justify-content: space-between; 
                  align-items: center; 
                  margin-bottom: 1rem; 
              }
              .calendar-month-select {
                  background-color: ${TASKSPHERE_DARK_RED}; 
                  color: #fff;
                  border: none; 
                  padding: 0.3rem 0.6rem;
                  border-radius: 4px;
                  font-size: 0.9rem;
                  cursor: pointer; 
                  font-weight: 500;
                  -webkit-appearance: none; 
                  -moz-appearance: none;    
                  appearance: none;        
                  background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%20viewBox%3D%220%200%20292.4%20292.4%22%3E%3Cpath%20fill%3D%22white%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13.4-6.3H18.9a17.6%2017.6%200%200%200-13.4%206.3%2017.6%2017.6%200%200%200-4.6%2014v6.8a17.6%2017.6%200%200%200%204.6%2014L145.4%20224.2a17.6%2017.6%200%200%200%2013.4%205.6h.4a17.6%2017.6%200%200%200%2013.4-5.6L287%20104.2a17.6%2017.6%200%200%200%204.6-14v-6.8a17.6%2017.6%200%200%200-4.6-14z%22%2F%3E%3C%2Fsvg%3E');
                  background-repeat: no-repeat;
                  background-position: right 8px center;
                  background-size: 10px;
                  padding-right: 25px; 
              }
              .calendar-month-select option {
                  color: #333;
                  background-color: #fff;
              }
 
              .calendar-nav-buttons button {
                  background: none;
                  border: 2px solid ${TASKSPHERE_DARK_RED}; 
                  font-size: 0.7rem;
                  width: 25px;
                  height: 25px;
                  border-radius: 4px;
                  color: ${TASKSPHERE_DARK_RED}; 
                  cursor: pointer;
                  margin-left: -1px; 
              }
 
              .calendar-table { width:100%; text-align:center; border-collapse:collapse; }
              .calendar-table th {
                  color:#333; 
                  padding:.4rem 0;
                  font-size: 0.85rem;
                  font-weight: 600;
              }
              .calendar-table td {
                  padding: 0.4rem 0.3rem; 
                  font-size: 0.9rem;
                  cursor: default; 
                  position: relative;
                  line-height: 1; 
                  color: #333; 
              }
              .calendar-table td:empty {
                  cursor: default;
              }
 
              /* Active Day Container (Centralized Styling) */
              .calendar-table td span {
                  display: inline-block;
                  width: 24px;
                  height: 24px;
                  line-height: 24px;
                  text-align: center;
                  font-weight: bold;
                  padding: 0;
                  border-radius: 50%;
                  cursor: pointer;
              }
 
              /* Primary active days (Filled) */
              .calendar-table td .primary-active-day {
                  background: ${TASKSPHERE_DARK_RED}; 
                  color: #fff;
              }
 
              /* Secondary active days (Bordered - Darker Border) */
              .calendar-table td .secondary-active-day {
                  background: #fff; 
                  color: ${TASKSPHERE_DARK_RED}; 
                  border: 2px solid ${TASKSPHERE_DARK_RED}; 
              }
 
              /* ====== TEAMS' PROGRESS STYLES ====== */
              .teams-progress-section {
                  padding-top: 1.5rem;
              }
              .teams-progress-container {
                  display: flex;
                  flex-wrap: wrap;
                  gap: 1.5rem;
              }
              .team-card {
                  background: #fff;
                  border-radius: 6px;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                  overflow: hidden;
                  padding: 1.2rem;
              }
              .adviser-header {
                  font-weight: 600;
                  color: #000;
                  font-size: 1rem;
                  border-bottom: 2px solid #3B0304;
                  padding-bottom: 0.8rem;
                  margin-bottom: 1.2rem;
                  display: flex;
                  align-items: center;
                  gap: 0.5rem;
              }
              .adviser-header i {
                  font-size: 1rem;
                  color: #2c3e50;
              }
              .team-progress-container {
                  display: flex;
                  gap: 1.5rem;
                  align-items: center;
                  justify-content: center;
              }
              .team-item {
                  text-align: center;
              }
              .team-name {
                  font-size: 0.9rem;
                  font-weight: 500;
                  color: #000;
                  margin-bottom: 0.8rem;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 0.4rem;
              }
              .team-name i {
                  color: ${TASKSPHERE_DARK_RED};
                  font-size: 0.9rem;
              }
              .teams-progress-section h4 {
                  color: #000;
              }
 
              /* Updated styles based on new request */
              .dashboard-content h4:first-child { /* Targets "UPCOMING ACTIVITY" */
                  color: #000;
              }
              .recent-activity h4 { /* Targets "RECENT ACTIVITY CREATED" */
                  color: #000;
              }
              .recent-activity th {
                  border-bottom: 2px solid #3B0304;
              }
            `}</style>

            {/* ==== UPCOMING ACTIVITY (Smaller Cards) ==== */}
            <h4>UPCOMING ACTIVITY</h4>
            <div className="upcoming-activity">
              {[
                { name: "Aguas, Et Al", activity: "Title Defense", date: "Jan 11, 2025", time: "8:00 AM - 9:00 AM" },
                { name: "Bernardo, Et Al", activity: "Title Defense", date: "Jan 11, 2025", time: "9:00 AM - 10:00 AM" },
                { name: "Hawke, Et Al", activity: "Title Defense", date: "Jan 11, 2025", time: "10:00 AM - 11:00 AM" },
              ].map((t, i) => (
                <div key={i} className="activity-card">
                  <div className="activity-header">{t.activity}</div>
                  <div className="activity-body">
                    <h5><i className="fas fa-user-friends"></i> {t.name}</h5>
                    <p><i className="fas fa-calendar-alt"></i> {t.date}</p>
                    <p><i className="fas fa-clock"></i> {t.time}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ==== RECENT ACTIVITY & CALENDAR LAYOUT ==== */}
            <div className="recent-calendar-layout">
              {/* ==== RECENT ACTIVITY CREATED (Uniform Rows) ==== */}
              <div className="recent-activity">
                <h4>RECENT ACTIVITY CREATED</h4>
                <table>
                  <thead>
                    <tr>
                      <th>NO</th>
                      <th>TEAMS</th>
                      <th>DATE CREATED</th>
                      <th>DATE</th>
                      <th>TIME</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>1.</td>
                      <td>Aguas, Et Al</td>
                      <td>Jan 03, 2025</td>
                      <td>Jan 11, 2025</td>
                      <td>8:00 AM - 9:00 AM</td>
                      <td><span className="status-badge">Pending</span></td>
                    </tr>
                    <tr>
                      <td>2.</td>
                      <td>Bernardo, Et Al</td>
                      <td>Jan 03, 2025</td>
                      <td>Jan 11, 2025</td>
                      <td>9:00 AM - 10:00 AM</td>
                      <td><span className="status-badge">Pending</span></td>
                    </tr>
                    <tr>
                      <td>3.</td>
                      <td>Hawke, Et Al</td>
                      <td>Jan 03, 2025</td>
                      <td>Jan 11, 2025</td>
                      <td>10:00 AM - 11:00 AM</td>
                      <td><span className="status-badge">Pending</span></td>
                    </tr>
                    <tr>
                      <td>4.</td>
                      <td>Mendoza, Et Al</td>
                      <td>Jan 03, 2025</td>
                      <td>Jan 11, 2025</td>
                      <td>9:00 AM - 10:00 AM</td>
                      <td><span className="status-badge">Pending</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* ==== FUNCTIONAL CALENDAR ==== */}
              <div className="calendar-container">
                <div className="calendar-header-controls">
                  <select
                    className="calendar-month-select"
                    value={`${month}-${year}`}
                    onChange={handleMonthChange}
                  >
                    <option value={`${month}-${year}`}>
                      {MONTH_NAMES[month]} {year}
                    </option>
                    {
                      (year !== 2025 || month !== 0) && (
                        <option value="0-2025">January 2025</option>
                      )
                    }
                  </select>
                  <div className="calendar-nav-buttons">
                    <button onClick={() => handleNav(-1)}>&lt;</button>
                    <button onClick={() => handleNav(1)}>&gt;</button>
                  </div>
                </div>
                <table className="calendar-table">
                  <thead>
                    <tr><th>S</th><th>M</th><th>T</th><th>W</th><th>T</th><th>F</th><th>S</th></tr>
                  </thead>
                  <tbody>
                    {/* Dynamically Rendered Calendar Grid */}
                    {calendarGrid.map((week, weekIndex) => (
                      <tr key={weekIndex}>
                        {week.map((dayData, dayIndex) => (
                          <CalendarDay key={dayIndex} data={dayData} />
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ====== TEAMS' PROGRESS SECTION ====== */}
            <div className="teams-progress-section">
              <h4>TEAMS' PROGRESS</h4>
              <div className="teams-progress-container">
                <TeamCard
                  adviser="Adam B Apostol"
                  teams={[
                    { name: "Hawke, Et Al", progress: 60 },
                    { name: "Quinlan, Et Al", progress: 40 },
                  ]}
                />
                <TeamCard
                  adviser="Grayson B Tolentino"
                  teams={[
                    { name: "Aguas, Et Al", progress: 40 },
                    { name: "Bernardo, Et Al", progress: 0 },
                    { name: "Mendoza, Et Al", progress: 40 },
                  ]}
                />
                <TeamCard
                  adviser="Von Jacob P Yu"
                  teams={[
                    { name: "Haraki, Et Al", progress: 20 },
                    { name: "Trinidad, Et Al", progress: 0 },
                  ]}
                />
              </div>
            </div>
          </div>
        );
    }
  };

  // --- CORRECTED RETURN BLOCK ---
  return (
    <div
      // This outer div now holds the entire page layout and ensures it takes full viewport height
      style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
    >
      <Header
        isSoloMode={isSoloMode}
        setIsSoloMode={setIsSoloMode}

      />
      <div className="d-flex" style={{ marginTop: "30px" }}></div>
      {/* This container manages the SIDEBAR and the MAIN CONTENT/FOOTER area side-by-side */}
      <div
        className="d-flex"
        style={{ flexGrow: 1 }} // Ensures this area takes all space below the header
      >
        <Sidebar
          activeItem={activePage}
          onSelect={handlePageChange}
          onWidthChange={setSidebarWidth}
          isSoloMode={isSoloMode}
        />

        {/* The main content/footer wrapper. This container is the key to the sticky footer. */}
        <div
          className="flex-grow-1"
          style={{
            // --- STICKY FOOTER CSS MAGIC ---
            display: 'flex',
            flexDirection: 'column', // Stack children (Header, Main, Footer) vertically
            minHeight: 0, // Allows the container to correctly calculate remaining vertical space
            flexGrow: 1, // Take up all available horizontal space

            // Sidebar transition styles
            marginLeft: `${sidebarWidth}px`,
            transition: "margin-left 0.3s",
          }}
          id="main-content-wrapper"
        >
          {/* The <main> element gets flex-grow: 1 to push the footer down */}
          <main
            style={{
              flexGrow: 1, // The most important line: forces content to fill all available space
              padding: '20px', // Apply padding here instead of in the surrounding div
            }}
          >
            {renderContent()}
          </main>

          {/* The Footer component naturally sits at the bottom */}
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;