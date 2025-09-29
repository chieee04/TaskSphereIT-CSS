import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import Member from './Instructor/Enroll-Member';
import Teams from './Instructor/Teams';
import Advisers from './Instructor/Adviser-Enroll';
import ManagerDashboard from './ProjectManager/ManagerDashboard';
import ManagerTask from '../components/ProjectManager/ManagerTask/ManagerTask';
import Schedule from './Instructor/Schedule';
import ScheduleAdmin from './Instructor/TitleDefense';
import { UserAuth } from '../Contex/AuthContext';
import MemberTask from './Member/MemberTask';
import MemberAllocation from './Member/MemberAllocation';
import MemberAdviserTasks from './Member/MemberAdviserTasks';
import MemberTasksBoard from './Member/MemberTaskBoard';
import StudentCredentials from './Instructor/StudentCredentials';
import AdviserCredentials from './Instructor/AdviserCredentials';


const Dashboard = () => {
  const [activePage, setActivePage] = useState('Dashboard'); // preselect Dashboard
  const { user } = UserAuth(); // ✅ para ma-access ang role

  return (
    <div className="d-flex flex-column vh-100">
      <div className="d-flex flex-grow-1">
        <Sidebar activeItem={activePage} onSelect={setActivePage} />
        <div className="flex-grow-1 p-3 overflow-auto">
          {/* ✅ Role 0 (Admin Only) */}
          {user?.id === "366f087f-1186-4edb-bd1c-890db28eb94c" && (
            <>
              {activePage === 'Students' && <Member />}
              {activePage === 'Advisers' && <Advisers />}
              {activePage === 'Teams' && <Teams />}
              {activePage === 'Schedule' && (
                <Schedule setActivePage={setActivePage} />
              )}
              {activePage === 'Title Defense' && <ScheduleAdmin />}
              {activePage === 'StudentCredentials' && <StudentCredentials />}
              {activePage === 'AdviserCredentials' && <AdviserCredentials />}
            </>
          )}



          {/* ✅ Role 3 (Manager Only) */}
          {/* {user?.role === 3 && (
            <>
              {activePage === 'Dashboard' && <ManagerDashboard />}
              {activePage === 'Tasks' && <ManagerTask />}
            </>
          )} */}


          {/* ✅ Role 1 (Member Only) */}
          {/* {user?.role === 1 && (
            <>
              {activePage === 'Tasks' && <MemberTask />}
              {activePage === 'Tasks Allocation' && <MemberAllocation />}
              {activePage === 'Adviser Tasks' && <MemberAdviserTasks />}
              {activePage === 'Tasks Board' && <MemberTasksBoard />}
            </>
          )} */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
