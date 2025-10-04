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

  // ✅ Load current user from localStorage and fetch info
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const customUser = JSON.parse(localStorage.getItem("customUser"));
        if (!customUser?.user_id) {
          console.error("❌ Walang valid user sa localStorage");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("user_credentials")
          .select("user_id, first_name, last_name, middle_name, user_roles, password")
          .eq("user_id", customUser.user_id)
          .single();

        if (error) throw error;

        setUserData(data);
        setFormData(data);
      } catch (err) {
        console.error("❌ Error fetching user:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const handleEditToggle = () => {
    if (isEditing) setFormData(userData);
    setIsEditing(!isEditing);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // ✅ Update only user_credentials (no Supabase Auth)
  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = {};

      ["first_name", "last_name", "middle_name", "password", "user_id"].forEach(field => {
        if (formData[field] !== userData[field]) updates[field] = formData[field];
      });

      if (Object.keys(updates).length === 0) {
        alert("No changes made.");
        setSaving(false);
        setIsEditing(false);
        return;
      }

      const { error } = await supabase
        .from("user_credentials")
        .update(updates)
        .eq("user_id", userData.user_id);

      if (error) throw error;

      // ✅ Update localStorage copy
      const updatedUser = { ...userData, ...updates };
      localStorage.setItem("customUser", JSON.stringify(updatedUser));
      setUserData(updatedUser);
      setIsEditing(false);
      alert("✅ Profile updated successfully!");
    } catch (error) {
      console.error("❌ Error updating profile:", error);
      alert("Error updating profile: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return <p style={{ textAlign: "center", marginTop: "50px" }}>Loading profile...</p>;
  if (!userData)
    return <p style={{ textAlign: "center", marginTop: "50px" }}>User not found</p>;

  const roleMap = {
    1: "Project Manager",
    2: "Member",
    3: "Adviser",
    4: "IT Instructor",
  };

  const canEdit = [1, 2, 3, 4].includes(userData.user_roles);

  return (
    <div className="container my-4">
      <style>{`
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
        .update-btn { background-color: #5a0d0e; color: white; }
        .update-btn:hover { background-color: #3b0304; }
        .save-btn { background-color: #28a745; color: white; }
        .save-btn:hover { background-color: #218838; }
        .cancel-btn { background-color: #6c757d; color: white; }
        .cancel-btn:hover { background-color: #545b62; }
        .form-control:read-only {
          background-color: #f8f9fa;
          cursor: not-allowed;
        }
      `}</style>

      <div className="profile-container">
        <div className="profile-header">
          <FaUserCircle className="me-2" style={{ color: "black" }} />
          <span>Profile</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <FaUserCircle size={80} style={{ color: "#5a0d0e" }} />
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            {!isEditing ? (
              <button
                className="update-btn"
                onClick={handleEditToggle}
                disabled={!canEdit}
              >
                Edit Profile
              </button>
            ) : (
              <>
                <button className="save-btn" onClick={handleSave} disabled={saving}>
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

        <div style={{ marginTop: "30px" }}>
          <div className="mb-3">
            <label>First Name</label>
            <input
              type="text"
              className="form-control"
              value={formData.first_name || ""}
              readOnly={!isEditing}
              onChange={(e) => handleInputChange("first_name", e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label>Last Name</label>
            <input
              type="text"
              className="form-control"
              value={formData.last_name || ""}
              readOnly={!isEditing}
              onChange={(e) => handleInputChange("last_name", e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label>Middle Name</label>
            <input
              type="text"
              className="form-control"
              value={formData.middle_name || ""}
              readOnly={!isEditing}
              onChange={(e) => handleInputChange("middle_name", e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label>Role</label>
            <input
              type="text"
              className="form-control"
              value={roleMap[userData.user_roles] || "Unknown"}
              readOnly
            />
          </div>
          <div className="mb-3">
            <label>Username / ID No</label>
            <input
              type="text"
              className="form-control"
              value={formData.user_id || ""}
              readOnly
            />
          </div>
          <div className="mb-3">
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              value={isEditing ? (formData.password || "") : "********"}
              readOnly={!isEditing}
              onChange={(e) => handleInputChange("password", e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
