import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { FaUserCircle, FaSave, FaTimes } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
 
const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
 
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
          console.log("🔄 Fetching from user_credentials with user_id:", userNameId);
 
          const { data, error } = await supabase
            .from("user_credentials")
            .select("user_id, first_name, last_name, middle_name, user_roles, password")
            .eq("user_id", userNameId)
            .single();
 
          if (error) {
            console.error("❌ Error fetching user info:", error);
            setLoading(false);
            return;
          }
 
          user = {
            ...data,
            // For non-instructors, use user_id as email since there's no email column
            email: data.user_id
          };
        } else {
          // 👉 Instructor → fetch from Supabase Auth
          console.log("🔄 Fetching instructor from auth");
          const { data: authUser, error } = await supabase.auth.getUser();
          if (error || !authUser?.user) {
            console.error("❌ Error fetching instructor from auth:", error);
            setLoading(false);
            return;
          }
          user = { 
            user_id: authUser.user.email, 
            email: authUser.user.email, 
            user_roles: 4,
            first_name: authUser.user.user_metadata?.first_name || "",
            last_name: authUser.user.user_metadata?.last_name || "",
            middle_name: authUser.user.user_metadata?.middle_name || "",
            password: "" // Instructors don't have password in user_credentials
          };
        }
 
        console.log("✅ User fetched:", user);
        setUserData(user);
        setFormData(user);
      } catch (err) {
        console.error("❌ Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };
 
    fetchCurrentUser();
  }, []);
 
  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset form data
      setFormData(userData);
    }
    setIsEditing(!isEditing);
  };
 
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
 
  const handleSave = async () => {
    setSaving(true);
    try {
      const customUser = JSON.parse(localStorage.getItem("customUser"));
      const hasRole = !!customUser?.user_roles;
      const userRole = userData.user_roles;
 
      if (hasRole && (userRole === 2 || userRole === 3 || userRole === 1)) {
        // Member (2), Adviser (3), or Project Manager (1) - update in user_credentials
        const updates = {};
 
        // For non-instructors, user_id serves as both username and email
        if (formData.email && formData.email !== userData.email) {
          updates.user_id = formData.email; // Update user_id since it's used as email
        }
 
        // Update names if they are editable (only for certain roles)
        if ((userRole === 2 || userRole === 3) && formData.first_name !== userData.first_name) {
          updates.first_name = formData.first_name;
        }
 
        if ((userRole === 2 || userRole === 3) && formData.last_name !== userData.last_name) {
          updates.last_name = formData.last_name;
        }
 
        if ((userRole === 2 || userRole === 3) && formData.middle_name !== userData.middle_name) {
          updates.middle_name = formData.middle_name;
        }
 
        // Update password if provided
        if (formData.newPassword) {
          updates.password = formData.newPassword;
        }
 
        if (Object.keys(updates).length > 0) {
          const { error } = await supabase
            .from("user_credentials")
            .update(updates)
            .eq("user_id", userData.user_id); // Use original user_id for lookup
 
          if (error) throw error;
 
          // If user_id was updated, update localStorage
          if (updates.user_id) {
            const updatedCustomUser = {
              ...customUser,
              user_id: updates.user_id
            };
            localStorage.setItem("customUser", JSON.stringify(updatedCustomUser));
          }
        }
      } else if (userRole === 4) {
        // Instructor (4) - update all data in auth and user_metadata
        const updateData = {
          email: formData.email,
        };
 
        // Only include data that has changed
        if (formData.first_name !== userData.first_name) {
          updateData.data = {
            ...updateData.data,
            first_name: formData.first_name
          };
        }
        if (formData.last_name !== userData.last_name) {
          updateData.data = {
            ...updateData.data,
            last_name: formData.last_name
          };
        }
        if (formData.middle_name !== userData.middle_name) {
          updateData.data = {
            ...updateData.data,
            middle_name: formData.middle_name
          };
        }
 
        const { error } = await supabase.auth.updateUser(updateData);
        if (error) throw error;
 
        // Update password separately if provided
        if (formData.newPassword) {
          const { error: passwordError } = await supabase.auth.updateUser({
            password: formData.newPassword
          });
 
          if (passwordError) throw passwordError;
        }
      }
 
      // Update local state with new data
      const updatedUserData = {
        ...formData,
        // If user_id was updated, use the new user_id
        user_id: formData.email || userData.user_id
      };
 
      setUserData(updatedUserData);
      setIsEditing(false);
      alert("Profile updated successfully!");
 
    } catch (error) {
      console.error("❌ Error updating profile:", error);
      alert("Error updating profile: " + error.message);
    } finally {
      setSaving(false);
    }
  };
 
  if (loading) return <p style={{ textAlign: "center", marginTop: "50px" }}>Loading profile...</p>;
  if (!userData) return <p style={{ textAlign: "center", marginTop: "50px" }}>User not found</p>;
 
  const roleMap = {
    1: "Project Manager",
    2: "Member",
    3: "Adviser",
    4: "IT Instructor"
  };
 
  const isMemberOrAdviser = userData.user_roles === 2 || userData.user_roles === 3;
  const isInstructor = userData.user_roles === 4;
  const isProjectManager = userData.user_roles === 1;
 
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
            gap: 10px;
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
            background-color: #f8f9fa;
            cursor: not-allowed;
          }
          .form-control:focus {
            border-color: #5a0d0e;
            outline: none;
            box-shadow: 0 0 0 0.2rem rgba(90, 13, 14, 0.25);
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
          .update-btn, .save-btn, .cancel-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            font-weight: bold;
            cursor: pointer;
            transition: background-color 0.3s;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .update-btn {
            background-color: #5a0d0e;
            color: white;
          }
          .update-btn:hover {
            background-color: #3b0304;
          }
          .update-btn:disabled {
            background-color: #6c757d;
            cursor: not-allowed;
          }
          .save-btn {
            background-color: #28a745;
            color: white;
          }
          .save-btn:hover {
            background-color: #218838;
          }
          .save-btn:disabled {
            background-color: #6c757d;
            cursor: not-allowed;
          }
          .cancel-btn {
            background-color: #6c757d;
            color: white;
          }
          .cancel-btn:hover {
            background-color: #545b62;
          }
          .edit-note {
            font-size: 0.8rem;
            color: #6c757d;
            margin-top: 5px;
            font-style: italic;
          }
          .error-message {
            color: #dc3545;
            font-size: 0.9rem;
            margin-top: 10px;
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
 
            {/* Right Side: Action Buttons */}
            <div className="update-button-wrapper">
              {!isEditing ? (
                <button 
                  className="update-btn" 
                  onClick={handleEditToggle}
                >
                  <FaUserCircle />
                  Edit Profile
                </button>
              ) : (
                <>
                  <button 
                    className="save-btn" 
                    onClick={handleSave}
                    disabled={saving}
                  >
                    <FaSave />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button className="cancel-btn" onClick={handleEditToggle}>
                    <FaTimes />
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
 
          {/* Details Section */}
          <div className="details-sections-wrapper">
            {/* Personal Details Column */}
            <div className="details-column">
              <h3 className="section-title">Personal Details</h3>
              <div className="form-group">
                <label>Last Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={formData.last_name || ""} 
                  readOnly={!isEditing || (!isInstructor && !isMemberOrAdviser)}
                  onChange={(e) => handleInputChange("last_name", e.target.value)}
                />
                {isEditing && !isInstructor && !isMemberOrAdviser && (
                  <div className="edit-note">Only instructors, members, and advisers can edit this field</div>
                )}
              </div>
              <div className="form-group">
                <label>First Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={formData.first_name || ""} 
                  readOnly={!isEditing || (!isInstructor && !isMemberOrAdviser)}
                  onChange={(e) => handleInputChange("first_name", e.target.value)}
                />
                {isEditing && !isInstructor && !isMemberOrAdviser && (
                  <div className="edit-note">Only instructors, members, and advisers can edit this field</div>
                )}
              </div>
              <div className="form-group">
                <label>Middle Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={formData.middle_name || ""} 
                  readOnly={!isEditing || (!isInstructor && !isMemberOrAdviser)}
                  onChange={(e) => handleInputChange("middle_name", e.target.value)}
                />
                {isEditing && !isInstructor && !isMemberOrAdviser && (
                  <div className="edit-note">Only instructors, members, and advisers can edit this field</div>
                )}
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
                <input 
                  type="text" 
                  className="form-control" 
                  value={formData.user_id || ""} 
                  readOnly 
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input 
                  type="password" 
                  className="form-control" 
                  value={isEditing ? (formData.newPassword || "") : "********"} 
                  readOnly={!isEditing}
                  placeholder={isEditing ? "Enter new password" : ""}
                  onChange={(e) => handleInputChange("newPassword", e.target.value)}
                />
                <div className="forgot-password-link-container">
                  <a href="#" className="forgot-password-link">Forgot Password</a>
                </div>
              </div>
              <div className="form-group">
                <label>Username/Email</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={formData.email || ""} 
                  readOnly={!isEditing}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
                {isEditing && (
                  <div className="edit-note">This serves as both username and email</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
 
export default Profile;