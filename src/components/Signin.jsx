// src/components/Signin.jsx
import React, { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
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
  const { setIsLoggedIn } = useOutletContext();
  const { login } = UserAuth();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // =====================================================
      // 🔹 Unified Login for All Roles (Admin / Manager / Member / Adviser)
      // =====================================================
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

      // =====================================================
      // 🔹 Role-based navigation (1=Manager, 2=Member, 3=Adviser, 4=Admin)
      // =====================================================
      if (user.user_roles === 1) {
        Swal.fire({
          icon: "success",
          title: "Login successful",
          text: "Welcome Manager",
          timer: 1500,
          showConfirmButton: false,
        });
        navigate("/Manager");
      } else if (user.user_roles === 2) {
        Swal.fire({
          icon: "success",
          title: "Login successful",
          text: "Welcome Member",
          timer: 1500,
          showConfirmButton: false,
        });
        navigate("/Member");
      } else if (user.user_roles === 3) {
        Swal.fire({
          icon: "success",
          title: "Login successful",
          text: "Welcome Adviser",
          timer: 1500,
          showConfirmButton: false,
        });
        navigate("/Adviser");
      } else if (user.user_roles === 4) {
        Swal.fire({
          icon: "success",
          title: "Login successful",
          text: "Welcome Admin",
          timer: 1500,
          showConfirmButton: false,
        });
        navigate("/Instructor");
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

  return (
    <div className="w-full min-h-screen bg-gray-100 flex flex-col">
      {/* HEADER */}
      <SigninHead />

      {/* MAIN CONTENT */}
      <div className="flex flex-col md:flex-row w-full max-w-6xl mx-auto h-full border rounded-lg py-5 px-3 main-bg-color flex-grow">
        {/* LEFT: Sign In Form */}
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
  {/* Forgot Password Button */}
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

        {/* RIGHT: Info Panel */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center main-bg-color text-white rounded-lg p-8 space-y-6">
          <h1 className="text-3xl font-semibold text-center">
            Empowering Collaboration,
            <br />
            Streamlining IT Capstone Success.
          </h1>
          <img src={Logo2} alt="Team" className="w-80 h-auto rounded-lg shadow-md" />
        </div>
      </div>

      {/* FOOTER */}
      <SigninFoot />
    </div>
  );
};

export default Signin;
