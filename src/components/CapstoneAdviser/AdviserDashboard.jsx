import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
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
const AdviserDashboard = ({ activePageFromHeader }) => {
  const [sidebarWidth, setSidebarWidth] = useState(70);
  ///
  const [isSoloMode, setIsSoloMode] = useState(false);
  ///
  const location = useLocation();

  const [activePage, setActivePage] = useState(
    location.state?.activePage || activePageFromHeader || "Dashboard"
  );

  useEffect(() => {
    if (location.state?.activePage) {
      setActivePage(location.state.activePage);
    }
  }, [location.key]);

  //////////////////////
  useEffect(() => {
    if (isSoloMode) {
      setActivePage("SoloModeDashboard");
    } else {
      setActivePage("Dashboard");
    }
  }, [isSoloMode]);
  ////////////////////

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
        return <h4 className="text-center text-muted">INSTRUCTOR DASHBOARD</h4>;
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

export default AdviserDashboard;