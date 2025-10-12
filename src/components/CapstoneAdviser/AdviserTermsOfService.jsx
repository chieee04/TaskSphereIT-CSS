// src/pages/Adviser/TermsOfService.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { supabase } from "../../supabaseClient";
import Header from "../Header";
import Footer from "../Footer";

const AdviserTermsOfService = () => {
  const [choice, setChoice] = useState("");
  const navigate = useNavigate();

  // check if logged in
  useEffect(() => {
    const storedUser = localStorage.getItem("customUser");
    if (!storedUser) {
      navigate("/Signin");
    }
  }, [navigate]);
  
  const handleSave = async () => {
    const storedUser = localStorage.getItem("customUser");
    if (!storedUser) {
      navigate("/Signin");
      return;
    }

    const user = JSON.parse(storedUser);

    if (choice === "accept") {
      Swal.fire({
        icon: "success",
        title: "Terms Accepted",
        text: "Thank you for accepting the terms of service.",
        timer: 1500,
        showConfirmButton: false,
      });

      // OPTIONAL: Update Supabase record (if you track agreement)
      await supabase
        .from("user_credentials")
        .update({ terms_accepted: true })
        .eq("id", user.id);

      navigate("/Adviser/Dashboard");
    } 
    else if (choice === "decline") {
      Swal.fire({
        icon: "warning",
        title: "Terms Declined",
        text: "You must accept the Terms of Service to continue.",
        timer: 1500,
        showConfirmButton: false,
      });

      // log out
      localStorage.removeItem("customUser");
      localStorage.removeItem("user_id");
      navigate("/Signin", { replace: true });
    } 
    else {
      Swal.fire({
        icon: "info",
        title: "No Selection",
        text: "Please select Accept or Decline before saving.",
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-grow flex flex-col items-center justify-center p-6">
        <div className="bg-white shadow-lg rounded-lg p-8 max-w-3xl w-full">
          <h1 className="text-3xl font-bold mb-4 text-center">
            Terms of Service
          </h1>

          <div className="text-gray-700 leading-relaxed space-y-4 max-h-96 overflow-y-auto p-4 border rounded">
            {/* ✳️ Your terms content here */}
            <p>
              Welcome to the TaskSphere IT platform. By using this system, you
              agree to comply with the institutional guidelines for managing,
              evaluating, and monitoring IT Capstone projects.
            </p>
            <p>
              Advisers are expected to uphold academic integrity, maintain
              confidentiality of student works, and ensure fair evaluation
              across all teams.
            </p>
            <p>
              Any misuse of this system, unauthorized sharing of data, or
              violation of confidentiality policies may result in account
              suspension or disciplinary action.
            </p>
            <p>
              Continued use of the platform signifies your acceptance of these
              terms and all future updates communicated through official
              channels.
            </p>
            <p>
              Please read carefully and select whether you accept or decline the
              Terms of Service below.
            </p>
          </div>

          <div className="mt-6 text-center space-x-6">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="tos"
                value="accept"
                checked={choice === "accept"}
                onChange={(e) => setChoice(e.target.value)}
                className="mr-2"
              />
              Accept
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="tos"
                value="decline"
                checked={choice === "decline"}
                onChange={(e) => setChoice(e.target.value)}
                className="mr-2"
              />
              Decline
            </label>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded"
            >
              Save
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdviserTermsOfService;
