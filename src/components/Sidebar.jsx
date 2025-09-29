import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useNavigate } from 'react-router-dom';
import { UserAuth } from '../Contex/AuthContext';
import './Style/Sidebar.css'; 

const Sidebar = ({ activeItem, onSelect }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [showEnrollSubmenu, setShowEnrollSubmenu] = useState(false);
  const [user_roles, setuser_roles] = useState(null);

  // ✅ Huwag i-destructure agad
  const auth = UserAuth();
  const user = auth?.user || null;
  const logout = auth?.logout || (() => {});
  const navigate = useNavigate();

  // ✅ Detect role
  useEffect(() => {
    if (user?.email) {
      setuser_roles(0); // Admin
      return;
    }
    const customUser = JSON.parse(localStorage.getItem("customUser"));
    if (customUser?.user_roles) {
      setuser_roles(customUser.user_roles);
      return;
    }
  }, [user]);

  // ✅ Sign Out
  const handleSignOut = async (e) => {
    e.preventDefault();
    await logout();
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

  // ✅ Sidebar Items
  let sidebarItems;
  if (user_roles === 0) {
    // Admin
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
        {renderMenuItem('bi-arrow-left-right', 'Role Transfer', () => onSelect('Role Transfer'), activeItem === 'Role Transfer')}
      </>
    );
  } else if (user_roles === 1) {
    // Manager
    sidebarItems = (
      <>
        {renderMenuItem('bi-speedometer2', 'Dashboard', () => onSelect('Dashboard'), activeItem === 'Dashboard')}
        {renderMenuItem('bi-list-task', 'Tasks', () => onSelect('Tasks'), activeItem === 'Tasks')}
        {renderMenuItem('bi-person-check', 'Adviser Tasks', () => onSelect('Adviser Tasks'), activeItem === 'Adviser Tasks')}
        {renderMenuItem('bi-kanban', 'Tasks Board', () => onSelect('Tasks Board'), activeItem === 'Tasks Board')}
        {renderMenuItem('bi-journal-text', 'Tasks Record', () => onSelect('Tasks Record'), activeItem === 'Tasks Record')}
        {renderMenuItem('bi-calendar-event', 'Events', () => onSelect('Events'), activeItem === 'Events')}
      </>
    );
  } else if (user_roles === 2) {
    // Member
    sidebarItems = (
      <>
        {renderMenuItem('bi-speedometer2', 'Dashboard', () => onSelect('Dashboard'), activeItem === 'Dashboard')}
        {renderMenuItem('bi-diagram-3', 'Tasks Allocation', () => onSelect('Tasks Allocation'), activeItem === 'Tasks Allocation')}
        {renderMenuItem('bi-list-task', 'Tasks', () => onSelect('Tasks'), activeItem === 'Tasks')}
        {renderMenuItem('bi-person-check', 'Adviser Tasks', () => onSelect('Adviser Tasks'), activeItem === 'Adviser Tasks')}
        {renderMenuItem('bi-kanban', 'Tasks Board', () => onSelect('Tasks Board'), activeItem === 'Tasks Board')}
        {renderMenuItem('bi-journal-text', 'Tasks Record', () => onSelect('Tasks Record'), activeItem === 'Tasks Record')}
        {renderMenuItem('bi-calendar-event', 'Events', () => onSelect('Events'), activeItem === 'Events')}
      </>
    );
  } else if (user_roles === 3) {
  // Adviser
  sidebarItems = (
    <>
      {renderMenuItem('bi-speedometer2', 'Dashboard', () => onSelect('Dashboard'), activeItem === 'Dashboard')}
      {renderMenuItem('bi-people', 'Teams Summary', () => onSelect('Teams Summary'), activeItem === 'Teams Summary')}
      {renderMenuItem('bi-list-task', 'Tasks', () => onSelect('Tasks'), activeItem === 'Tasks')}
      {renderMenuItem('bi-kanban', 'Teams Board', () => onSelect('Teams Board'), activeItem === 'Teams Board')}
      {renderMenuItem('bi-journal-text', 'Tasks Record', () => onSelect('Tasks Record'), activeItem === 'Tasks Record')}
      {renderMenuItem('bi-calendar-event', 'Events', () => onSelect('Events'), activeItem === 'Events')}
      {renderMenuItem('bi-person-circle', 'Profile', () => onSelect('Profile'), activeItem === 'Profile')}  {/* ← Added */}
    </>
  );
}
 else {
    return null;
  }

  return (
    <div className={`sidebar ${collapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="btn btn-sm btn-outline-secondary sidebar-toggle"
        title={collapsed ? 'Expand' : 'Collapse'}
      >
        <i className={`bi ${collapsed ? 'bi-chevron-double-right' : 'bi-chevron-double-left'}`} />
      </button>

      <ul className="nav nav-pills flex-column mb-auto">{sidebarItems}</ul>

      <div className="mt-auto">
        <button
          className="btn btn-outline-danger d-flex align-items-center justify-content-center sidebar-signout"
          onClick={handleSignOut}
        >
          <i className="bi bi-box-arrow-right"></i>
          {!collapsed && <span className="ms-2">Sign Out</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
