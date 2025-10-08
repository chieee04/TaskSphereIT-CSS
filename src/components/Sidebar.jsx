// src/components/Sidebar.jsx
import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useNavigate } from 'react-router-dom';
import { UserAuth } from '../Contex/AuthContext';
import './Style/Sidebar.css';
 
// ✅ Add isSoloMode to the props
const Sidebar = ({ activeItem, onSelect, onWidthChange, isSoloMode }) => { 
  const [collapsed, setCollapsed] = useState(false);
  const [showEnrollSubmenu, setShowEnrollSubmenu] = useState(false);
  const [user_roles, setuser_roles] = useState(null);
  const [userData, setUserData] = useState(null);
 
  const auth = UserAuth();
  const user = auth?.user || null;
  const logout = auth?.logout || (() => {});
  const navigate = useNavigate();
 
  // ✅ Load user_roles and user data from AuthContext or localStorage
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("customUser"));
    if (storedUser) {
      setuser_roles(storedUser.user_roles);
      setUserData({
        first_name: storedUser.first_name,
        last_name: storedUser.last_name,
        user_roles: storedUser.user_roles
      });
    } else if (user) {
      setuser_roles(user.user_roles);
      setUserData({
        first_name: user.first_name,
        last_name: user.last_name,
        user_roles: user.user_roles
      });
    }
  }, [user]);
 
  useEffect(() => {
    const newWidth = collapsed ? 70 : 250;
    if (onWidthChange) {
      onWidthChange(newWidth);
    }
  }, [collapsed, onWidthChange]);
 
  const handleSignOut = async (e) => {
    e.preventDefault();
    await logout();
    localStorage.removeItem("customUser");
    localStorage.removeItem("user_id");
    navigate("/");
  };
 
  const renderMenuItem = (icon, label, onClick, isActive = false) => (
    <li className="nav-item mb-1">
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onClick();
        }}
        className={`nav-link ${isActive ? 'active' : ''}`}
        style={{
          backgroundColor: isActive ? '#3B0304' : 'transparent',
          color: isActive ? 'white' : 'inherit',
          border: isActive ? '1px solid #3B0304' : 'none'
        }}
      >
        <i className={`bi ${icon} me-2`} />
        {!collapsed && <span>{label}</span>}
        {!collapsed && label === 'Enroll' && (
          <i
            className={`ms-auto bi ${showEnrollSubmenu ? 'bi-chevron-up' : 'bi-chevron-down'}`}
          />
        )}
      </a>
    </li>
  );
 
  // Get role name based on user_roles
  const getRoleName = (role) => {
    switch(role) {
      case 1: return 'Manager';
      case 2: return 'Member';
      case 3: return 'Adviser';
      case 4: return 'Admin';
      default: return 'User';
    }
  };
 
  let sidebarItems;
 
  // ✅ Add conditional logic to check for solo mode
  if (isSoloMode) {
    sidebarItems = (
      <>
        {renderMenuItem('bi-speedometer2', 'Dashboard', () => onSelect('SoloModeDashboard'), activeItem === 'SoloModeDashboard')}
        {renderMenuItem('bi-list-task', 'Tasks', () => onSelect('SolomodeTasks'), activeItem === 'SolomodeTasks')}
        {renderMenuItem('bi-kanban', 'Tasks Board', () => onSelect('SolomodeTasksBoard'), activeItem === 'SolomodeTasksBoard')}
        {renderMenuItem('bi-journal-text', 'Tasks Record', () => onSelect('SolomodeTasksRecord'), activeItem === 'SolomodeTasksRecord')}
      </>
    );
  } else {
    // ✅ Updated switch statement — now includes role 4 = Admin
    switch (user_roles) {
      case 4: // Admin
        sidebarItems = (
          <>
            {renderMenuItem('bi-speedometer2', 'Dashboard', () => onSelect('Dashboard'), activeItem === 'Dashboard')}
            {renderMenuItem('bi-person-plus', 'Enroll', () => setShowEnrollSubmenu(!showEnrollSubmenu), activeItem === 'Enroll')}
            {!collapsed && showEnrollSubmenu && (
              <div className="ps-4">
                {renderMenuItem('bi-mortarboard', 'Students', () => onSelect('Students'), activeItem === 'Students')}
                {renderMenuItem('bi-person', 'Advisers', () => onSelect('Advisers'), activeItem === 'Advisers')}
              </div>
            )}
            {renderMenuItem('bi-key', 'Students Credentials', () => onSelect('StudentCredentials'), activeItem === 'StudentCredentials')}
            {renderMenuItem('bi-lock', 'Advisers Credentials', () => onSelect('AdviserCredentials'), activeItem === 'AdviserCredentials')}
            {renderMenuItem('bi-people', 'Teams', () => onSelect('Teams'), activeItem === 'Teams')}
            {renderMenuItem('bi-calendar-week', 'Schedule', () => onSelect('Schedule'), activeItem === 'Schedule')}
            {renderMenuItem('bi-arrow-left-right', 'Role Transfer', () => onSelect('RoleTransfer'), activeItem === 'RoleTransfer')}
          </>
        );
        break;
      case 1: // Manager
        sidebarItems = (
          <>
            {renderMenuItem('bi-speedometer2', 'Dashboard', () => onSelect('Dashboard'), activeItem === 'Dashboard')}
            {renderMenuItem('bi-list-task', 'Tasks', () => onSelect('Tasks'), activeItem === 'Tasks')}
            {renderMenuItem('bi-person-check', 'Adviser Tasks', () => onSelect('AdviserTasks'), activeItem === 'AdviserTasks')}
            {renderMenuItem('bi-kanban', 'Tasks Board', () => onSelect('TasksBoard'), activeItem === 'TasksBoard')}
            {renderMenuItem('bi-journal-text', 'Tasks Record', () => onSelect('TasksRecord'), activeItem === 'TasksRecord')}
            {renderMenuItem('bi-calendar-event', 'Events', () => onSelect('Events'), activeItem === 'Events')}
          </>
        );
        break;
      case 2: // Member
        sidebarItems = (
          <>
            {renderMenuItem('bi-speedometer2', 'Dashboard', () => onSelect('Dashboard'), activeItem === 'Dashboard')}
            {renderMenuItem('bi-diagram-3', 'Tasks Allocation', () => onSelect('TasksAllocation'), activeItem === 'TasksAllocation')}
            {renderMenuItem('bi-list-task', 'Tasks', () => onSelect('Tasks'), activeItem === 'Tasks')}
            {renderMenuItem('bi-person-check', 'Adviser Tasks', () => onSelect('AdviserTasks'), activeItem === 'AdviserTasks')}
            {renderMenuItem('bi-kanban', 'Tasks Board', () => onSelect('TasksBoard'), activeItem === 'TasksBoard')}
            {renderMenuItem('bi-journal-text', 'Tasks Record', () => onSelect('TasksRecord'), activeItem === 'TasksRecord')}
            {renderMenuItem('bi-calendar-event', 'Events', () => onSelect('Events'), activeItem === 'Events')}
          </>
        );
        break;
      case 3: // Adviser
        sidebarItems = (
          <>
            {renderMenuItem('bi-speedometer2', 'Dashboard', () => onSelect('Dashboard'), activeItem === 'Dashboard')}
            {renderMenuItem('bi-people', 'Teams Summary', () => onSelect('TeamsSummary'), activeItem === 'TeamsSummary')}
            {renderMenuItem('bi-list-task', 'Tasks', () => onSelect('Tasks'), activeItem === 'Tasks')}
            {renderMenuItem('bi-kanban', 'Teams Board', () => onSelect('TeamsBoard'), activeItem === 'TeamsBoard')}
            {renderMenuItem('bi-journal-text', 'Tasks Record', () => onSelect('TasksRecord'), activeItem === 'TasksRecord')}
            {renderMenuItem('bi-calendar-event', 'Events', () => onSelect('Events'), activeItem === 'Events')}
             {renderMenuItem('bi-calendar-event', 'Notification', () => onSelect('Notification'), activeItem === 'Notification')}
          </>
        );
        break;
      default:
        sidebarItems = null;
    }
  }
 
  if (sidebarItems === null) return null;
 
  return (
    <div className={`sidebar ${collapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="btn btn-sm sidebar-toggle"
        title={collapsed ? 'Expand' : 'Collapse'}
        style={{
          border: 'none',
          color: '#3B0304',
          backgroundColor: 'transparent'
        }}
      >
        <i className={`bi ${collapsed ? 'bi-chevron-double-right' : 'bi-chevron-double-left'}`} />
      </button>
 
      {/* User Profile Section at the top */}
      {!collapsed && userData && (
        <div className="user-profile-section mb-3">
          <div 
            className="d-flex align-items-center p-3 cursor-pointer"
            onClick={() => onSelect('Profile')}
            style={{ cursor: 'pointer' }}
          >
            <div className="profile-icon me-3">
              <i className="bi bi-person-circle" style={{ fontSize: '2.5rem', color: '#3B0304' }} />
            </div>
            <div className="user-info">
              <div className="user-name fw-bold" style={{ color: '#3B0304' }}>
                {userData.first_name} {userData.last_name}
              </div>
              <div className="user-role text-muted small">
                {getRoleName(userData.user_roles)}
              </div>
            </div>
          </div>
          {/* Divider with reduced thickness */}
          <div className="w-100" style={{ height: '1px', backgroundColor: '#3B0304' }} />
        </div>
      )}
 
      {/* Collapsed profile icon */}
      {collapsed && (
        <div 
          className="d-flex justify-content-center p-3 cursor-pointer"
          onClick={() => onSelect('Profile')}
          style={{ cursor: 'pointer' }}
        >
          <i className="bi bi-person-circle" style={{ fontSize: '1.5rem', color: '#3B0304' }} />
        </div>
      )}
 
      <ul className="nav nav-pills flex-column mb-auto">
        {sidebarItems}
      </ul>
 
      <div className="mt-auto">
        {/* Sign Out with same UI as other menu items */}
        <ul className="nav nav-pills flex-column">
          <li className="nav-item mb-1">
            <a
              href="#"
              onClick={handleSignOut}
              className="nav-link"
            >
              <i className="bi bi-box-arrow-right me-2" />
              {!collapsed && <span>Sign Out</span>}
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};
 
export default Sidebar;