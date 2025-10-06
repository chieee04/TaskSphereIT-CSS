// src/hooks/useAuthGuard.js
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const useAuthGuard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem("customUser");
      if (!storedUser) {
        navigate("/Signin", { replace: true });
      }
    };

    // Initial check
    checkAuth();

    // Disable back/forward when logged out
    window.history.pushState(null, "", window.location.href);
    window.onpopstate = () => {
      const storedUser = localStorage.getItem("customUser");
      if (!storedUser) {
        navigate("/Signin", { replace: true });
      } else {
        window.history.pushState(null, "", window.location.href);
      }
    };

    // Optional: listen to storage changes (for multi-tab logout)
    const handleStorageChange = () => checkAuth();
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.onpopstate = null;
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [navigate]);
};
