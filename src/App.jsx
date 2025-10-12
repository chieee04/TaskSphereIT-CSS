// src/App.jsx
import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const customUser = localStorage.getItem("customUser");
    const adminUser = localStorage.getItem("adminUser");
    setIsLoggedIn(!!(customUser || adminUser));
  }, []);

  return (
    <>
      <div className="d-flex">
        {/* If you have a Sidebar/Header/Footer, render them here */}
        <main className="flex-grow-1 p-3">
          {/* Child routes render here */}
          <Outlet context={{ setIsLoggedIn }} />
        </main>
      </div>
    </>
  );
}
