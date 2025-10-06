// src/components/Signin.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useOutletContext } from "react-router-dom";
import Swal from "sweetalert2";
import "../components/Style/Style.css";
import Logo1 from "../assets/img/Dct-Logo.png";
import Logo2 from "../assets/img/Costum.png";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../Contex/AuthContext";
import SigninHead from "./heade-foot/SigninHead";
import SigninFoot from "./heade-foot/SigninFoot";

const Signin = () => {
  const [userID, setUserID] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { setIsLoggedIn } = useOutletContext();
  const { login } = UserAuth();

  // =====================================================
  // 🚫 Route Guard (Trap user inside /Signin)
  // =====================================================
  useEffect(() => {
    const storedUser = localStorage.getItem("customUser");

    // 🔹 If user is logged in, redirect to their dashboard
    if (storedUser) {
      const user = JSON.parse(storedUser);
      const roleRoutes = {
        1: "/Manager/Dashboard",
        2: "/Member/Dashboard",
        3: "/Adviser/Dashboard",
        4: "/Instructor/Dashboard",
      };
      navigate(roleRoutes[user.user_roles] || "/Signin", { replace: true });
    } else {
      // 🔹 If user is not logged in, trap them inside /Signin
      const allowedPaths = ["/", "/Signin", "/signin"];
      if (!allowedPaths.includes(location.pathname)) {
        navigate("/Signin", { replace: true });
      }

      // Disable back/forward navigation
      window.history.pushState(null, "", window.location.href);
      window.onpopstate = () => {
        window.history.pushState(null, "", window.location.href);
      };
    }
  }, [location, navigate]);

  // =====================================================
  // 🔹 Handle Sign In
  // =====================================================
  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: user, error } = await supabase
        .from("user_credentials")
        .select("*")
        .eq("user_id", userID)
        .eq("password", password)
        .single();

      if (error || !user) {
        Swal.fire({
          icon: "error",
          title: "Login failed",
          text: "Invalid credentials. Please try again.",
        });
        return;
      }

      // ✅ Save to context + localStorage
      login(user);
      localStorage.setItem("customUser", JSON.stringify(user));
      localStorage.setItem("user_id", user.user_id);
      setIsLoggedIn(true);

      console.log("✅ User signed in:", {
        user_id: user.user_id,
        uuid: user.id,
        role: user.user_roles,
      });

      // 🔹 Role-based navigation
      const roleRoutes = {
        1: { path: "/Manager", label: "Manager" },
        2: { path: "/Member", label: "Member" },
        3: { path: "/Adviser", label: "Adviser" },
        4: { path: "/Instructor", label: "Admin" },
      };

      const target = roleRoutes[user.user_roles];
      if (target) {
        Swal.fire({
          icon: "success",
          title: "Login successful",
          text: `Welcome ${target.label}`,
          timer: 1500,
          showConfirmButton: false,
        });
        navigate(target.path);
      } else {
        Swal.fire({
          icon: "warning",
          title: "Unknown role",
          text: "Please contact the administrator.",
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Server Error",
        text: "Something went wrong. Please try again later.",
      });
      console.error("❌ SignIn Error:", err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
  const storedUser = localStorage.getItem("customUser");
  if (storedUser) {
    const user = JSON.parse(storedUser);
    const roleRoutes = {
      1: "/Manager/Dashboard",
      2: "/Member/Dashboard",
      3: "/Adviser/Dashboard",
      4: "/Instructor/Dashboard",
    };
    navigate(roleRoutes[user.user_roles] || "/Signin", { replace: true });
  }
}, []);

  // =====================================================
  // 🔹 UI
  // =====================================================
  return (
    <div className="w-full min-h-screen bg-gray-100 flex flex-col">
      <SigninHead />

      <div className="flex flex-col md:flex-row w-full max-w-6xl mx-auto h-full border rounded-lg py-5 px-3 main-bg-color flex-grow">
        <div className="w-full md:w-1/2 p-6 flex items-center justify-center b-rd bg-white">
          <form onSubmit={handleSignIn} className="w-full max-w-md text-center">
            <h2 className="text-2xl font-bold mb-4">Welcome to TaskSphere IT</h2>
            <img src={Logo1} alt="Logo" className="mx-auto mb-6 w-24 h-24" />
            <div className="mb-4 text-left">
              <label htmlFor="userID" className="block font-medium mb-1">
                ID Number
              </label>
              <input
                onChange={(e) => setUserID(e.target.value)}
                value={userID}
                className="w-full p-3 border rounded"
                type="text"
                id="userID"
                placeholder="Enter your ID number"
                required
              />
            </div>

            <div className="mb-2 text-left">
              <label htmlFor="password" className="block font-medium mb-1">
                Password
              </label>
              <input
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                className="w-full p-3 border rounded"
                type="password"
                id="password"
                placeholder="Enter your password"
                required
              />
              <div className="text-right mt-1">
                <button
                  type="button"
                  onClick={() => navigate("/ForgotPassword")}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded main-bg-color"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <div className="w-full md:w-1/2 flex flex-col items-center justify-center main-bg-color text-white rounded-lg p-8 space-y-6">
          <h1 className="text-3xl font-semibold text-center">
            Empowering Collaboration,
            <br />
            Streamlining IT Capstone Success.
          </h1>
          <img src={Logo2} alt="Team" className="w-80 h-auto rounded-lg shadow-md" />
        </div>
      </div>

      <SigninFoot />
    </div>
  );
};

export default Signin;
