import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom"; // ✅ idagdag ito
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

const AdviserDashboard = ({ activePageFromHeader }) => {
  const [sidebarWidth, setSidebarWidth] = useState(70);
  const location = useLocation();

  // ✅ kunin yung galing sa navigate state
  const [activePage, setActivePage] = useState(
    location.state?.activePage || activePageFromHeader || "Dashboard"
  );

  useEffect(() => {
    if (location.state?.activePage) {
      setActivePage(location.state.activePage);
    }
  }, [location.key]);

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
        return <Profile/>;
      default:
        return <h4 className="text-center text-muted">INSTRUCTOR DASHBOARD</h4>;
    }
  };

  return (
    <div className="d-flex">
      <Sidebar 
        activeItem={activePage} 
        onSelect={setActivePage} 
        onWidthChange={setSidebarWidth} // ✨ PASS THE STATE SETTER FUNCTION
      />
      <div 
        className="flex-grow-1 p-3" 
        style={{ 
          marginLeft: `${sidebarWidth}px`, // ✨ USE THE DYNAMIC STATE HERE
          transition: 'margin-left 0.3s'
        }}
        id="main-content"
      >
        {renderContent()}
      </div>
    </div>
  );
};

export default AdviserDashboard;
