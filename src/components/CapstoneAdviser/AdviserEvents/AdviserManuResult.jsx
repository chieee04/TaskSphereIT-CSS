import React, { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";
import eventsIcon from "../../../assets/events-icon.png";
import dueDateIcon from "../../../assets/due-date-icon.png";
import timeIcon from "../../../assets/time-icon.png";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

export default function AdviserManuResult() {
  const [schedules, setSchedules] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [customUser, setCustomUser] = useState(null);

  const PERCENTAGE_OPTIONS = Array.from({ length: 21 }, (_, i) => i * 5);

  // ✅ Updated: Status options
  const STATUS_OPTIONS = [
    { label: "Pending", value: 1 },
    { label: "Passed", value: 2 },
    { label: "Re-Check", value: 3 },
  ];

  useEffect(() => {
    const fetchData = async () => {
      const storedUser = JSON.parse(localStorage.getItem("customUser"));
      if (!storedUser) return;
      setCustomUser(storedUser);

      const adviserId = storedUser.id;

      const { data: accData } = await supabase
        .from("user_credentials")
        .select("*");
      setAccounts(accData || []);

      const { data: schedData, error } = await supabase
        .from("user_manuscript_sched")
        .select("*")
        .eq("adviser_id", adviserId);

      if (!error) {
        setSchedules(
          (schedData || []).map((s) => ({
            ...s,
            plagiarism: s.plagiarism ?? 0,
            ai: s.ai ?? 0,
            verdic: s.verdic ?? 1, // ✅ default Pending
          }))
        );
      }
    };
    fetchData();
  }, []);

  const getName = (id) => {
    const person = accounts.find((a) => a.id === id);
    return person ? `${person.last_name}, ${person.first_name}` : "Unknown";
  };

  // ✅ File Upload/Download/Remove
  const handleFileClick = async (sched) => {
    if (!customUser) return;

    // Adviser lang (role 3) ang pwede mag upload
    const canUpload = customUser.user_roles === 3;

    const { value: action } = await MySwal.fire({
      title: "File Options",
      text: sched.file_uploaded
        ? `Current File: ${sched.file_uploaded}`
        : "No file uploaded yet",
      showCancelButton: true,
      showDenyButton: !!sched.file_uploaded,
      confirmButtonText: "Upload File",
      denyButtonText: "Download",
      cancelButtonText: sched.file_uploaded ? "Remove" : "Close",
      reverseButtons: true,
    });

    // ✅ Upload
    if (action && canUpload) {
      const input = document.createElement("input");
      input.type = "file";
      input.accept =
        "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 50 * 1024 * 1024) {
          Swal.fire("Error", "File too large! Max 50MB.", "error");
          return;
        }

        const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const filePath = `${sched.id}/${Date.now()}_${cleanName}`; // ✅ relative path

        try {
          // Upload file to bucket
          const { error: uploadError } = await supabase.storage
            .from("manuscripts")
            .upload(filePath, file, { cacheControl: "3600", upsert: false });

          if (uploadError) throw uploadError;

          // Save relative path to DB
          await supabase
            .from("user_manuscript_sched")
            .update({
              file_uploaded: cleanName,
              file_url: filePath,
            })
            .eq("id", sched.id);

          // Update UI state
          setSchedules((prev) =>
            prev.map((s) =>
              s.id === sched.id
                ? { ...s, file_uploaded: cleanName, file_url: filePath }
                : s
            )
          );

          Swal.fire("Success", "File uploaded successfully!", "success");
        } catch (err) {
          console.error("Upload error:", err);
          Swal.fire("Error", "Upload failed!", "error");
        }
      };
      input.click();
    }

    // ✅ Download
    else if (action === false && sched.file_url) {
      const { data: publicUrlData } = supabase.storage
        .from("manuscripts")
        .getPublicUrl(sched.file_url);

      window.open(publicUrlData.publicUrl, "_blank");
    }

    // ✅ Remove
    else if (!action && sched.file_uploaded) {
      try {
        if (sched.file_url) {
          const { error: removeError } = await supabase.storage
            .from("manuscripts")
            .remove([sched.file_url]); // ✅ full relative path

          if (removeError) throw removeError;
        }

        await supabase
          .from("user_manuscript_sched")
          .update({ file_uploaded: null, file_url: null })
          .eq("id", sched.id);

        setSchedules((prev) =>
          prev.map((s) =>
            s.id === sched.id ? { ...s, file_uploaded: null, file_url: null } : s
          )
        );

        Swal.fire("Removed", "File removed successfully!", "success");
      } catch (err) {
        console.error("Remove error:", err);
        Swal.fire("Error", "Failed to remove file.", "error");
      }
    }
  };

  const updateField = async (rowId, field, value) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === rowId ? { ...s, [field]: value } : s))
    );
    const { error } = await supabase
      .from("user_manuscript_sched")
      .update({ [field]: value })
      .eq("id", rowId);
    if (error) {
      console.error(`Error updating ${field}:`, error.message);
    }
  };

  return (
    <div className="page-wrapper">
      <h2 className="section-title">
        <img src={eventsIcon} alt="Events Icon" className="icon-image" />
        Manuscript Results
      </h2>
      <hr className="divider" />

      <div className="tasks-container">
        <table className="tasks-table">
          <thead>
            <tr>
              <th>NO</th>
              <th>TEAM</th>
              <th>TITLE</th>
              <th>DUE DATE</th>
              <th>TIME</th>
              <th>PLAGIARISM</th>
              <th>AI</th>
              <th>FILE</th>
              <th>STATUS</th> {/* ✅ Changed header */}
            </tr>
          </thead>
          <tbody>
            {schedules.length > 0 ? (
              schedules.map((sched, idx) => (
                <tr key={sched.id}>
                  <td>{idx + 1}.</td>
                  <td>{getName(sched.manager_id)}</td>
                  <td className="wrap-text">
                    {sched.project_title || "Untitled"}
                  </td>
                  <td>
                    <img
                      src={dueDateIcon}
                      alt="Due Date"
                      className="inline-icon"
                    />
                    {sched.date
                      ? new Date(sched.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "N/A"}
                  </td>
                  <td>
                    <img src={timeIcon} alt="Time" className="inline-icon" />
                    {sched.time || "N/A"}
                  </td>
                  <td>
                    <select
                      value={sched.plagiarism}
                      onChange={(e) =>
                        updateField(
                          sched.id,
                          "plagiarism",
                          parseInt(e.target.value)
                        )
                      }
                    >
                      {PERCENTAGE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}%
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={sched.ai}
                      onChange={(e) =>
                        updateField(sched.id, "ai", parseInt(e.target.value))
                      }
                    >
                      {PERCENTAGE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}%
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleFileClick(sched)}
                    >
                      {sched.file_uploaded ? sched.file_uploaded : "[File]"}
                    </button>
                  </td>
                  <td>
                    <select
                      value={sched.verdic || 1} // ✅ use verdic column
                      onChange={(e) =>
                        updateField(sched.id, "verdic", parseInt(e.target.value))
                      }
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="9"
                  style={{ textAlign: "center", padding: "20px" }}
                >
                  No schedules found for you as adviser.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}