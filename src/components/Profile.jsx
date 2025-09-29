import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { FaUserCircle } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchCurrentUser = async () => {
    try {
      const customUser = JSON.parse(localStorage.getItem("customUser"));
      console.log("🔍 Loaded from localStorage:", customUser);

      const userId = customUser?.id;          // Supabase UID
      const userNameId = customUser?.user_id; // for Manager/Adviser/Member
      const hasRole = !!customUser?.user_roles;

      if (!userId && !userNameId) {
        console.error("❌ Walang valid user sa localStorage");
        setLoading(false);
        return;
      }

      let user = null;

      if (hasRole) {
        // 👉 Manager / Member / Adviser → fetch from user_credentials
        let query = supabase
          .from("user_credentials")
          .select("user_id, first_name, last_name, middle_name, user_roles");

        if (userNameId) {
          query = query.eq("user_id", userNameId);
        } else if (userId) {
          query = query.eq("id", userId);
        }

        const { data, error } = await query.single();
        if (error || !data) {
          console.error("❌ Error fetching user info:", error);
          setLoading(false);
          return;
        }
        user = data;
      } else {
        // 👉 Instructor → fetch from Supabase Auth
        const { data: authUser, error } = await supabase.auth.getUser();
        if (error || !authUser?.user) {
          console.error("❌ Error fetching instructor from auth:", error);
          setLoading(false);
          return;
        }
        user = { 
          user_id: authUser.user.email, 
          email: authUser.user.email, 
          user_roles: 4 
        };
      }

      console.log("✅ User fetched:", user);
      setUserData(user);
    } catch (err) {
      console.error("❌ Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchCurrentUser();
}, []);


  
  

  if (loading) return <p style={{ textAlign: "center", marginTop: "50px" }}>Loading profile...</p>;
  if (!userData) return <p style={{ textAlign: "center", marginTop: "50px" }}>User not found</p>;

  const roleMap = {
    1: "Project Manager",
    2: "Member",
    3: "Adviser",
    4: "IT Instructor"
  };

  return (
    <div className="container my-4">
      <style>
        {`
          .profile-container {
            font-family: Arial, sans-serif;
            color: #333;
            background-color: #fff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .profile-header {
            display: flex;
            align-items: center;
            font-size: 1.5rem;
            font-weight: bold;
            color: black;
            padding-bottom: 8px;
            border-bottom: 2px solid #5a0d0e;
            margin-bottom: 20px;
          }
          .profile-main-content {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
          .profile-top-row {
            display: flex;
            justify-content: space-between;
            gap: 40px;
          }
          .profile-picture-wrapper {
            width: 25%;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
          }
          .update-button-wrapper {
            width: 75%;
            display: flex;
            justify-content: flex-end;
            align-items: flex-start;
          }
          .section-title {
            font-size: 1.2rem;
            font-weight: 600;
            color: #333;
            margin-bottom: 10px;
          }
          .profile-image-box {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            border: 2px solid #5a0d0e;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            margin-bottom: 20px;
          }
          .profile-image-box svg {
            color: #5a0d0e;
            width: 80px;
            height: 80px;
          }
          .details-sections-wrapper {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            width: 100%;
          }
          .details-column {
            display: flex;
            flex-direction: column;
            width: 48%;
          }
          .details-column h3 {
            font-size: 1.1rem;
            font-weight: bold;
            color: #333;
            margin-bottom: 15px;
            padding-bottom: 5px;
            border-bottom: 1px solid #ccc;
          }
          .form-group {
            margin-bottom: 15px;
          }
          .form-group label {
            display: block;
            font-size: 0.9rem;
            font-weight: 500;
            color: #555;
            margin-bottom: 5px;
          }
          .form-control {
            width: 80%;
            max-width: 300px;
            padding: 8px 12px;
            border: 1px solid #ccc;
            border-radius: 4px;
            font-size: 1rem;
            background-color: white;
          }
          .form-control:read-only {
            background-color: white;
            cursor: not-allowed;
          }
          .forgot-password-link-container {
            width: 80%;
            max-width: 300px;
            display: flex;
            justify-content: flex-end;
          }
          .forgot-password-link {
            font-size: 0.8rem;
            color: #5a0d0e;
            text-decoration: none;
            font-weight: bold;
            margin-top: 5px;
          }
          .update-btn {
            background-color: #5a0d0e;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            font-weight: bold;
            cursor: pointer;
            transition: background-color 0.3s;
          }
          .update-btn:hover {
            background-color: #3b0304;
          }
        `}
      </style>

      <div className="profile-container">
        {/* Profile Header */}
        <div className="profile-header">
          <FaUserCircle className="me-2" style={{ color: "black" }} />
          <span>Profile</span>
        </div>

        {/* Main Content Area */}
        <div className="profile-main-content">
          <div className="profile-top-row">
            {/* Left Section: Profile Picture */}
            <div className="profile-picture-wrapper">
              <h3 className="section-title">Profile Picture</h3>
              <div className="profile-image-box">
                <FaUserCircle />
              </div>
            </div>

            {/* Right Side: Update Profile Button */}
            <div className="update-button-wrapper">
              <button className="update-btn d-flex align-items-center">
                <FaUserCircle className="me-2" />
                Update Profile
              </button>
            </div>
          </div>

          {/* Details Section */}
          <div className="details-sections-wrapper">
            {/* Personal Details Column */}
            <div className="details-column">
              <h3 className="section-title">Personal Details</h3>
              <div className="form-group">
                <label>Last Name</label>
                <input type="text" className="form-control" value={userData.last_name} readOnly />
              </div>
              <div className="form-group">
                <label>First Name</label>
                <input type="text" className="form-control" value={userData.first_name} readOnly />
              </div>
              <div className="form-group">
                <label>Middle Name</label>
                <input type="text" className="form-control" value={userData.middle_name || ""} readOnly />
              </div>
              <div className="form-group">
                <label>Role</label>
                <input
                  type="text"
                  className="form-control"
                  value={roleMap[userData.user_roles] || "Unknown"}
                  readOnly
                />
              </div>
            </div>

            {/* Security Account Column */}
            <div className="details-column">
              <h3 className="section-title">Security Account</h3>
              <div className="form-group">
                <label>ID NO</label>
                <input type="text" className="form-control" value={userData.user_id} readOnly />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" className="form-control" value="********" readOnly />
                <div className="forgot-password-link-container">
                  <a href="#" className="forgot-password-link">Forgot Password</a>
                </div>
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" className="form-control" value=""/*{userData.email}*/ readOnly />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
