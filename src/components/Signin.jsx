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

  // Hard lock page scroll (belt-and-suspenders)
  useEffect(() => {
    const prevDoc = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevDoc;
      document.body.style.overflow = prevBody;
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
      const { data: user, error } = await supabase
        .from("user_credentials")
        .select("*")
        .eq("user_id", userID)
        .eq("password", password)
        .single();

      if (error || !user) {
        Swal.fire({ icon: "error", title: "Login failed", text: "Invalid credentials. Please try again." });
        return;
      }

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
        Swal.fire({ icon: "warning", title: "Unknown role", text: "Please contact the administrator." });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Server Error", text: "Something went wrong. Please try again later." });
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
    // Lock the page height; no scroll
    <div className="h-screen w-full bg-neutral-100 flex flex-col overflow-hidden">
      <SigninHead />

      {/* Main fills remaining height; internal overflow hidden */}
      <main className="flex-1 bg-white flex flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <div className="mx-auto h-full w-full max-w-[1200px] px-6 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            {/* Left: taller login card */}
            <div className="flex justify-start">
              <div className="w-full max-w-[440px] rounded-xl border border-neutral-200 bg-white p-8 shadow-sm min-h-[640px]">
                <h2 className="text-center text-[32px] md:text-[34px] font-extrabold leading-8 text-[#611A11]">
                  Welcome to
                  <br />
                  <span className="text-[32px] md:text-[34px] font-extrabold">TaskSphere IT</span>
                </h2>

                <img
                  src={Logo1}
                  alt="TaskSphere icon"
                  className="mx-auto mt-5 h-[150px] w-[150px] object-contain"
                />

                <form onSubmit={handleSignIn} className="mt-8 space-y-6">
                  <div>
                    <label htmlFor="userID" className="mb-1 block text-sm font-semibold text-neutral-700">
                      Username
                    </label>
                    <input
                      id="userID"
                      type="text"
                      value={userID}
                      onChange={(e) => setUserID(e.target.value)}
                      className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-[#611A11] focus:ring-1 focus:ring-[#611A11]"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="mb-1 block text-sm font-semibold text-neutral-700">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-[#611A11] focus:ring-1 focus:ring-[#611A11]"
                      required
                    />
                    <div className="mt-1 text-right">
                      <button
                        type="button"
                        onClick={() => navigate("/ForgotPassword")}
                        className="text-[11px] font-medium text-black hover:underline focus:outline-none bg-transparent p-0 m-0"
                      >
                        Forgot Password
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 w-full rounded-full bg-[#611A11] py-2 text-sm font-semibold text-white shadow hover:opacity-95 active:opacity-90 disabled:opacity-60"
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </button>
                </form>
              </div>
            </div>

            {/* Right: seal + headline */}
            <div className="flex flex-col items-center justify-center text-center">
              <img src={Logo2} alt="CCS Seal" className="h-32 w-32 md:h-36 md:w-36 object-contain" />
              <p className="mt-6 text-[30px] md:text-[34px] font-semibold leading-tight text-neutral-800">
                A Task Management System for
                <br />
                Capstone Project Development
              </p>
            </div>
          </div>
        </div>
      </main>

      <SigninFoot />
    </div>
  );
};

export default Signin;
