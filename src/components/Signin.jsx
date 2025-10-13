import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useOutletContext } from "react-router-dom";
import Swal from "sweetalert2";
import Logo1 from "../assets/img/TaskSphereLogo.png";
import Logo2 from "../assets/img/Dct-Logo.png";
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

  // Lock scroll on mount
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Route guard
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
    } else {
      const allowed = ["/", "/Signin", "/signin"];
      if (!allowed.includes(location.pathname)) navigate("/Signin", { replace: true });
      window.history.pushState(null, "", window.location.href);
      window.onpopstate = () => window.history.pushState(null, "", window.location.href);
    }
  }, [location, navigate]);

  const handleSignIn = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    // Step 1: Fetch user credentials
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

    // Step 2: Get active instructor's year
    const { data: instructorYearData, error: instructorError } = await supabase
      .from("user_credentials")
      .select("year")
      .eq("user_roles", 4)
      .not("year", "is", null)
      .limit(1);

    const activeInstructorYear = instructorYearData?.[0]?.year || null;

    // Step 3: Apply year-based login restriction
    if (user.user_roles !== 4) {
      if (!activeInstructorYear) {
        Swal.fire({
          icon: "error",
          title: "Login Restricted",
          text: "System year is not yet set by the instructor. Please try again later.",
        });
        return;
      }
      if (user.year !== activeInstructorYear) {
        Swal.fire({
          icon: "error",
          title: "Access Denied",
          text: `You are not allowed to log in. Active academic year is ${activeInstructorYear}.`,
        });
        return;
      }
    }

    // Step 4: Proceed with login if all checks passed
    login(user);
    localStorage.setItem("customUser", JSON.stringify(user));
    localStorage.setItem("user_id", user.user_id);
    setIsLoggedIn(true);

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
  }, [navigate]);

  return (
    <div className="h-screen w-full bg-white flex flex-col overflow-hidden select-none fixed inset-0">
      {/* Fixed Header */}
      <div className="flex-none">
        <SigninHead />
      </div>

      {/* Main Content - Completely locked, content scales to fit */}
      <main className="flex-1 flex items-center justify-center px-2 sm:px-3 lg:px-4 overflow-hidden">
        <div className="w-full max-w-6xl h-full flex items-center justify-center">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-3 sm:gap-4 md:gap-6 lg:gap-8 xl:gap-10 w-full max-h-full">
            
            {/* Left: Login Card */}
            <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
              <div className="w-full max-w-[300px] xs:max-w-[320px] sm:max-w-[340px] md:max-w-[360px] lg:max-w-[380px] rounded-lg sm:rounded-xl border border-neutral-200 bg-white p-3 sm:p-4 md:p-5 shadow-sm">
                <h2 className="text-center text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-[#611A11] mb-0.5">
                  Welcome to
                </h2>
                <h2 className="text-center text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-[#611A11] mb-2 sm:mb-3 md:mb-4">
                  TaskSphere IT
                </h2>

                <img
                  src={Logo1}
                  alt="TaskSphere icon"
                  className="mx-auto h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 lg:h-18 lg:w-18 object-contain mb-2 sm:mb-3 md:mb-4 pointer-events-none"
                  draggable="false"
                />

                <form onSubmit={handleSignIn} className="space-y-2 sm:space-y-2.5 md:space-y-3">
                  <div>
                    <label htmlFor="userID" className="block text-[10px] xs:text-xs sm:text-sm font-semibold text-neutral-700 mb-0.5 sm:mb-1">
                      Username
                    </label>
                    <input
                      id="userID"
                      type="text"
                      value={userID}
                      onChange={(e) => setUserID(e.target.value)}
                      className="w-full rounded-md sm:rounded-lg border border-neutral-300 bg-white px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base text-black outline-none focus:border-[#611A11] focus:ring-1 sm:focus:ring-2 focus:ring-[#611A11]/20"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-[10px] xs:text-xs sm:text-sm font-semibold text-neutral-700 mb-0.5 sm:mb-1">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-md sm:rounded-lg border border-neutral-300 bg-white px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base text-black outline-none focus:border-[#611A11] focus:ring-1 sm:focus:ring-2 focus:ring-[#611A11]/20"
                      required
                    />
                    <div className="mt-0.5 sm:mt-1 text-right">
                      <button
                        type="button"
                        onClick={() => navigate("/ForgotPassword")}
                        className="text-[10px] xs:text-xs sm:text-sm font-medium text-[#611A11] hover:underline focus:outline-none bg-transparent p-0 m-0 cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-md sm:rounded-lg bg-[#611A11] py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm md:text-base font-semibold text-white shadow hover:bg-[#7a2218] active:bg-[#4a140e] disabled:opacity-60 transition-colors mt-1.5 sm:mt-2 md:mt-3 cursor-pointer"
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </button>
                </form>
              </div>
            </div>

            {/* Right: Seal and Description */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center text-center mt-2 sm:mt-3 lg:mt-0">
              <img 
                src={Logo2} 
                alt="CCS Seal" 
                className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-24 lg:w-24 xl:h-28 xl:w-28 object-contain pointer-events-none" 
                draggable="false"
              />
              <p className="mt-1.5 sm:mt-2 md:mt-3 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-semibold text-neutral-800 leading-tight px-3 sm:px-4">
                A Task Management System for<br />Capstone Project Development
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Footer */}
      <div className="flex-none">
        <SigninFoot />
      </div>
    </div>
  );
};

export default Signin;