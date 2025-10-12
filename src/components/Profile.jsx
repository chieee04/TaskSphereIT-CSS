import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import {
  FaUserCircle,
  FaSave,
  FaTimes,
  FaLock,
  FaEnvelope,
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import Swal from "sweetalert2";
import { showChangePasswordModal } from "../services/profile";

const BUCKET = "user-images"; // <- your working bucket

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  // Image selection/preview (local only; no upload until Save)
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  // Latest avatar url from DB (user_images_url)
  const [avatarUrl, setAvatarUrl] = useState("");

  // ✅ Load current user and profile + latest avatar
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const customUser = JSON.parse(localStorage.getItem("customUser"));
        if (!customUser?.user_id) {
          console.error("❌ Walang valid user sa localStorage");
          setLoading(false);
          return;
        }

        // Fetch core profile
        const { data, error } = await supabase
          .from("user_credentials")
          .select(
            "user_id, first_name, last_name, middle_name, user_roles, password, email"
          )
          .eq("user_id", customUser.user_id)
          .single();

        if (error) throw error;
        setUserData(data);
        setFormData(data);

        // Fetch latest avatar (if any)
        const { data: imgRow, error: imgErr } = await supabase
          .from("user_images_url")
          .select("id, imageUrl")
          .eq("user_key", customUser.user_id)
          .order("id", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!imgErr && imgRow?.imageUrl) {
          setAvatarUrl(imgRow.imageUrl);
        }
      } catch (err) {
        console.error("❌ Error fetching user:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  // Cleanup any blob preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleEditToggle = () => {
    if (isEditing) {
      // Canceling edit: reset fields and image selection
      setFormData(userData);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
      setSelectedImageFile(null);
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Validate and preview selected image (local only)
  const handleImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];

    if (!allowedTypes.includes(file.type)) {
      Swal.fire({
        icon: "error",
        title: "Invalid file type",
        text: "Please select a PNG, JPG, or JPEG image.",
      });
      e.target.value = "";
      return;
    }

    if (file.size > MAX_SIZE) {
      Swal.fire({
        icon: "error",
        title: "File too large",
        text: "Maximum allowed size is 5MB.",
      });
      e.target.value = "";
      return;
    }

    // Good: set preview
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setSelectedImageFile(file);
  };

  const triggerFileDialog = () => {
    const input = document.getElementById("profile-image-input");
    if (input) input.click();
  };

  // --- Helpers for Storage path handling ---
  const getStoragePathFromPublicUrl = (publicUrl) => {
    // Supabase public URL format:
    // https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
    try {
      const marker = `/object/public/${BUCKET}/`;
      const idx = publicUrl.indexOf(marker);
      if (idx === -1) return null;
      return publicUrl.substring(idx + marker.length);
    } catch {
      return null;
    }
  };

  const deleteStorageObjectByPublicUrl = async (publicUrl) => {
    const path = getStoragePathFromPublicUrl(publicUrl);
    if (!path) return; // nothing to delete
    // Try remove; ignore "not found" errors
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error && !/not found/i.test(error.message)) {
      throw error;
    }
  };

  // Upload selected image to Supabase Storage (stable name) and return public URL
  // Stable name ensures there's only one object per user, so old file won't pile up.
  const uploadImageAndGetUrl = async (file, userId) => {
    const ext =
      file.name.split(".").pop()?.toLowerCase() ||
      (file.type === "image/jpeg" ? "jpg" : "png");

    // Stable object name per user: user-<id>.<ext>
    const objectPath = `user-${userId}.${ext}`;

    // Upload (upsert to replace if exists)
    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, file, {
        cacheControl: "0",
        upsert: true,
        contentType: file.type || `image/${ext}`,
      });

    if (uploadErr) throw uploadErr;

    const { data: pub } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(objectPath);
    const publicUrl = pub?.publicUrl;
    if (!publicUrl)
      throw new Error("Failed to get public URL for uploaded image.");
    return publicUrl;
  };

  // Update the latest row if exists, otherwise insert a new one
  const upsertImageRow = async (userId, imageUrl) => {
    const { data: latest, error: fetchErr } = await supabase
      .from("user_images_url")
      .select("id")
      .eq("user_key", userId)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchErr) throw fetchErr;

    if (latest?.id) {
      const { error: updErr } = await supabase
        .from("user_images_url")
        .update({ imageUrl })
        .eq("id", latest.id);
      if (updErr) throw updErr;
    } else {
      const { error: insErr } = await supabase
        .from("user_images_url")
        .insert([{ user_key: userId, imageUrl }]);
      if (insErr) throw insErr;
    }
  };

  // ✅ Save changes (text fields + optional image REPLACEMENT)
  const handleSave = async () => {
    if (!userData) return;

    setSaving(true);
    try {
      const updates = {};
      ["first_name", "last_name", "middle_name"].forEach((field) => {
        if (formData[field] !== userData[field])
          updates[field] = formData[field];
      });

      // 1) If there are name changes, update user_credentials first
      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from("user_credentials")
          .update(updates)
          .eq("user_id", userData.user_id);

        if (error) throw error;

        const updatedUser = { ...userData, ...updates };
        localStorage.setItem("customUser", JSON.stringify(updatedUser));
        setUserData(updatedUser);
      }

      // 2) If an image was selected, delete previous file (if any), then upload & update table
      if (selectedImageFile) {
        // Delete old object if we have a URL stored (ignore not-found)
        if (avatarUrl) {
          try {
            await deleteStorageObjectByPublicUrl(avatarUrl);
          } catch (delErr) {
            // If delete fails for reasons other than not-found, surface but continue
            console.warn(
              "⚠️ Could not delete previous image:",
              delErr?.message || delErr
            );
          }
        }

        // Upload new image (stable name), get public URL
        const imageUrl = await uploadImageAndGetUrl(
          selectedImageFile,
          userData.user_id
        );

        // Update or insert row in user_images_url
        await upsertImageRow(userData.user_id, imageUrl);

        // Reflect in UI
        setAvatarUrl(imageUrl);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl("");
        setSelectedImageFile(null);
      }

      // Feedback if nothing changed at all
      if (Object.keys(updates).length === 0 && !selectedImageFile) {
        Swal.fire({
          icon: "info",
          title: "No changes",
          text: "Nothing to save.",
        });
        setIsEditing(false);
        setSaving(false);
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Profile updated",
        text: "Your changes have been saved.",
      });

      setIsEditing(false);
    } catch (error) {
      const msg = String(error?.message || "").toLowerCase();
      if (
        msg.includes("row level security") ||
        msg.includes("row-level security")
      ) {
        Swal.fire({
          icon: "error",
          title: "Permission blocked",
          text: "RLS is blocking this action. Ensure INSERT/UPDATE on user_images_url and INSERT/DELETE on storage.objects for bucket 'user-image' are allowed.",
        });
      } else {
        console.error("❌ Error updating profile:", error);
        Swal.fire({
          icon: "error",
          title: "Update failed",
          text: error.message || "Something went wrong.",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="loading-container">
        <div className="spinner-border text-custom-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Loading profile...</p>
      </div>
    );

  if (!userData)
    return (
      <div className="error-container">
        <p>User not found</p>
      </div>
    );

  const roleMap = {
    1: "Project Manager",
    2: "Member",
    3: "Adviser",
    4: "IT Instructor",
  };

  const canEdit = [1, 2, 3, 4].includes(userData.user_roles);

  return (
    <div className="profile-page-container">
      <style>{`
        .profile-page-container {
          min-height: 100vh;
          background: #ffffff;
          padding: 15px;
        }

        .profile-container {
          font-family: 'Inter', Arial, sans-serif;
          color: #333;
          background-color: #fff;
          padding: 0;
          border-radius: 8px;
          max-width: 800px;
          margin: 0 auto;
        }

        .profile-header {
          display: flex;
          align-items: center;
          font-size: 1.3rem;
          font-weight: 700;
          color: #5a0d0e;
          padding-bottom: 10px;
          border-bottom: 2px solid #5a0d0e;
          margin-bottom: 20px;
        }

        .profile-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 20px;
        }

        .profile-main-section {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 20px;
          align-items: start;
        }

        .profile-picture-section {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          border: 1px solid #e9ecef;
          text-align: center;
        }

        .profile-picture {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: #5a0d0e;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 10px;
          border: 3px solid #7a1d1e;
          overflow: hidden;
        }

        .profile-picture img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-picture-icon {
          color: white;
          font-size: 2.2rem;
        }

        .profile-role {
          color: #5a0d0e;
          font-weight: 600;
          font-size: 0.95rem;
          margin-bottom: 8px;
        }

        .profile-name {
          color: #333;
          font-weight: 500;
          font-size: 0.9rem;
        }

        .upload-hint {
          font-size: 0.75rem;
          color: #6c757d;
          margin-top: 6px;
        }

        .btn-upload {
          background-color: transparent;
          color: #5a0d0e;
          border: 1px solid #5a0d0e;
          padding: 6px 12px;
          font-size: 0.8rem;
          height: 32px;
          border-radius: 6px;
          margin-top: 10px;
        }
        .btn-upload:hover {
          background-color: #5a0d0e;
          color: #fff;
        }

        .profile-details {
          background: #fff;
          border-radius: 8px;
          padding: 20px;
          border: 1px solid #e9ecef;
        }

        .section-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #5a0d0e;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 1px solid #f0f0f0;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-label {
          font-weight: 600;
          color: #333;
          margin-bottom: 5px;
          display: block;
          font-size: 0.85rem;
        }

        .form-control {
          border: 1px solid #e9ecef;
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 0.9rem;
          transition: all 0.3s ease;
          background: #fff;
          height: 38px;
        }

        .form-control:focus {
          border-color: #5a0d0e;
          box-shadow: 0 0 0 0.2rem rgba(90, 13, 14, 0.1);
        }

        .form-control:read-only {
          background-color: #f8f9fa;
          cursor: not-allowed;
          color: #6c757d;
        }

        .form-control.editing {
          background-color: #fff;
          cursor: text;
          color: #333;
        }

        .security-section {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          margin-top: 15px;
        }

        .security-item {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 15px;
          padding: 12px;
          background: white;
          border-radius: 6px;
          border: 1px solid #e9ecef;
        }

        .security-icon {
          color: #5a0d0e;
          font-size: 1rem;
          min-width: 20px;
        }

        .security-content { flex: 1; }

        .security-label {
          font-weight: 600;
          color: #333;
          font-size: 0.85rem;
        }

        .security-value {
          color: #6c757d;
          font-size: 0.9rem;
        }

        .password-field {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .password-display {
          flex: 1;
          color: #6c757d;
          font-family: monospace;
          letter-spacing: 1px;
          font-size: 0.9rem;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid #f0f0f0;
        }

        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.9rem;
          height: 36px;
        }

        .btn-update {
          background-color: #5a0d0e;
          color: white;
        }
        .btn-update:hover {
          background-color: #7a1d1e;
          transform: translateY(-1px);
        }

        .btn-save {
          background-color: #5a0d0e;
          color: white;
        }
        .btn-save:hover {
          background-color: #7a1d1e;
          transform: translateY(-1px);
        }

        .btn-cancel {
          background-color: #6c757d;
          color: white;
        }
        .btn-cancel:hover {
          background-color: #545b62;
          transform: translateY(-1px);
        }

        .btn-change-password {
          background-color: transparent;
          color: #5a0d0e;
          border: 1px solid #5a0d0e;
          padding: 6px 12px;
          font-size: 0.8rem;
          height: 32px;
        }
        .btn-change-password:hover {
          background-color: #5a0d0e;
          color: white;
        }

        .loading-container, .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
        }

        .text-custom-primary { color: #5a0d0e; }

        @media (max-width: 768px) {
          .profile-page-container { padding: 10px; }
          .profile-main-section { grid-template-columns: 1fr; gap: 15px; }
          .form-grid { grid-template-columns: 1fr; gap: 12px; }
          .action-buttons { flex-direction: column; }
          .btn { width: 100%; justify-content: center; }
          .profile-picture-section, .profile-details { padding: 15px; }
        }

        @media (max-width: 480px) {
          .profile-header { font-size: 1.1rem; margin-bottom: 15px; }
          .section-title { font-size: 1rem; margin-bottom: 12px; }
          .security-section { padding: 15px; }
          .security-item { padding: 10px; margin-bottom: 12px; }
        }
      `}</style>

      <div className="profile-container">
        <div className="profile-header">
          <FaUserCircle className="me-2" />
          <span>Profile</span>
        </div>

        <div className="profile-content">
          <div className="profile-main-section">
            {/* Profile Picture Section */}
            <div className="profile-picture-section">
              <div className="profile-picture">
                {previewUrl ? (
                  <img src={previewUrl} alt="Selected profile" />
                ) : avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" />
                ) : (
                  <FaUserCircle className="profile-picture-icon" />
                )}
              </div>

              <div className="profile-role">
                {roleMap[userData.user_roles] || "Unknown Role"}
              </div>
              <div className="profile-name">
                {userData.first_name} {userData.last_name}
              </div>

              {/* Hidden file input */}
              <input
                id="profile-image-input"
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                style={{ display: "none" }}
                onChange={handleImagePick}
              />

              {/* Upload button only in edit mode */}
              {isEditing && (
                <>
                  <button
                    className="btn-upload"
                    type="button"
                    onClick={triggerFileDialog}
                  >
                    Upload Image
                  </button>
                  <div className="upload-hint">PNG/JPG only • Max 5MB</div>
                </>
              )}
            </div>

            {/* Profile Details Section */}
            <div className="profile-details">
              {/* Personal Details Section */}
              <div>
                <h3 className="section-title">Personal Details</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input
                      type="text"
                      className={`form-control ${isEditing ? "editing" : ""}`}
                      value={formData.last_name || ""}
                      readOnly={!isEditing}
                      onChange={(e) =>
                        handleInputChange("last_name", e.target.value)
                      }
                      placeholder="Enter last name"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">First Name</label>
                    <input
                      type="text"
                      className={`form-control ${isEditing ? "editing" : ""}`}
                      value={formData.first_name || ""}
                      readOnly={!isEditing}
                      onChange={(e) =>
                        handleInputChange("first_name", e.target.value)
                      }
                      placeholder="Enter first name"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Middle Name</label>
                    <input
                      type="text"
                      className={`form-control ${isEditing ? "editing" : ""}`}
                      value={formData.middle_name || ""}
                      readOnly={!isEditing}
                      onChange={(e) =>
                        handleInputChange("middle_name", e.target.value)
                      }
                      placeholder="Enter middle name"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <input
                      type="text"
                      className="form-control"
                      value={roleMap[userData.user_roles] || "Unknown"}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* Security Account Section */}
              <div className="security-section">
                <h3 className="section-title">Security Account</h3>

                <div className="security-item">
                  <FaLock className="security-icon" />
                  <div className="security-content">
                    <div className="security-label">ID NO</div>
                    <div className="security-value">
                      {userData.user_id || "N/A"}
                    </div>
                  </div>
                </div>

                <div className="security-item">
                  <FaLock className="security-icon" />
                  <div className="security-content">
                    <div className="security-label">Password</div>
                    <div className="password-field">
                      <span className="password-display">••••••••</span>
                      <button
                        className="btn btn-change-password"
                        type="button"
                        onClick={showChangePasswordModal}
                      >
                        Change Password
                      </button>
                    </div>
                  </div>
                </div>

                <div className="security-item">
                  <FaEnvelope className="security-icon" />
                  <div className="security-content">
                    <div className="security-label">Email</div>
                    <input
                      type="email"
                      className="form-control"
                      value={userData.email || ""}
                      readOnly
                      placeholder="No email provided"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                {!isEditing ? (
                  <button
                    className="btn btn-update"
                    onClick={handleEditToggle}
                    disabled={!canEdit}
                  >
                    Update Profile
                  </button>
                ) : (
                  <>
                    <button
                      className="btn btn-save"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      <FaSave />
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      className="btn btn-cancel"
                      onClick={handleEditToggle}
                    >
                      <FaTimes />
                      Cancel
                    </button>
                  </>
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
