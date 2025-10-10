import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../../supabaseClient";
import { FaFileAlt, FaSearch, FaCalendarAlt, FaClock, FaChevronDown } from "react-icons/fa";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
 
const MySwal = withReactContent(Swal);
 
export default function AdviserManuResult() {
  const [schedules, setSchedules] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [customUser, setCustomUser] = useState(null);
  const [search, setSearch] = useState("");
 
  const tableWrapperRef = useRef(null);
 
  const PERCENTAGE_OPTIONS = Array.from({ length: 21 }, (_, i) => i * 5);
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
            verdic: s.verdic ?? 1,
          }))
        );
      }
    };
    fetchData();
  }, []);
 
  // File handlers
  const handleFileClick = async (sched) => {
    if (!customUser) return;
 
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
        const filePath = `${sched.id}/${Date.now()}_${cleanName}`;
 
        try {
          const { error: uploadError } = await supabase.storage
            .from("manuscripts")
            .upload(filePath, file, { cacheControl: "3600", upsert: false });
 
          if (uploadError) throw uploadError;
 
          await supabase
            .from("user_manuscript_sched")
            .update({
              file_uploaded: cleanName,
              file_url: filePath,
            })
            .eq("id", sched.id);
 
          setSchedules((prev) =>
            prev.map((s) =>
              s.id === sched.id
                ? { ...s, file_uploaded: cleanName, file_url: filePath }
                : s
            )
          );
 
          Swal.fire("Success", "File uploaded successfully!", "success");
        } catch (err) {
          
          Swal.fire("Error", "Upload failed!", "error");
        }
      };
      input.click();
    } else if (action === false && sched.file_url) {
      const { data: publicUrlData } = supabase.storage
        .from("manuscripts")
        .getPublicUrl(sched.file_url);
 
      window.open(publicUrlData.publicUrl, "_blank");
    } else if (!action && sched.file_uploaded) {
      try {
        if (sched.file_url) {
          const { error: removeError } = await supabase.storage
            .from("manuscripts")
            .remove([sched.file_url]);
 
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
      
    }
  };
 
  const getGroupName = (id) => {
    const person = accounts.find((a) => a.id === id);
    return person ? person.group_name || "Unknown Team" : "Unknown Team";
  };
 
  // Filtering
  const filteredSchedules = schedules.filter((sched) => {
    const teamName = getGroupName(sched.manager_id);
    const searchText = search.toLowerCase();
    return (
      teamName.toLowerCase().includes(searchText) ||
      (sched.date || "").toLowerCase().includes(searchText) ||
      (sched.time || "").toLowerCase().includes(searchText) ||
      (sched.file_uploaded || "").toLowerCase().includes(searchText)
    );
  });
 
  return (
    <div className="p-6">
      <style>{`
        .table-scroll-area::-webkit-scrollbar {
          display: none;
        }
        .section-title {
          font-weight: 600;
          color: #3B0304;
          display: flex;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .divider {
          height: 1.5px;
          background-color: #3B0304;
          width: calc(100% + 50px);
          margin-left: -16px;
          border-radius: 50px;
          margin-bottom: 1.5rem;
          border: none;
        }
        .search-input-container {
          position: relative;
          width: 100%;
          max-width: 250px;
        }
        .search-input {
          width: 100%;
          padding: 7px 12px 7px 35px;
          border: 1px solid #B2B2B2;
          border-radius: 6px;
          background-color: white;
          color: #3B0304;
          font-size: 0.85rem;
          box-shadow: none;
          transition: border-color 0.2s;
          height: 34px;
        }
        .search-input:focus {
          outline: none;
          border-color: #3B0304;
        }
        .search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #B2B2B2;
          font-size: 0.85rem;
        }
        .tasks-table th {
          background-color: #f8f9fa !important;
          font-weight: 600 !important;
          color: #3B0304 !important;
          text-transform: uppercase;
          font-size: 0.75rem;
          padding: 12px 6px !important;
          white-space: nowrap;
          text-align: center;
        }
        .tasks-table td {
          padding: 8px 6px !important;
          font-size: 0.875rem;
          color: #495057;
          border-bottom: 1px solid #dee2e6;
          vertical-align: middle;
          text-align: center;
        }
        .tasks-table tbody tr:hover {
          background-color: #f8f9fa;
        }
        .dropdown-control-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
          vertical-align: middle;
          min-width: 120px;
        }
        .dropdown-icon-chevron {
          position: absolute;
          right: 6px;
          pointer-events: none;
          font-size: 0.75rem;
          z-index: 2;
        }
        .percentage-select, .status-select {
          border: 1px solid #ccc !important;
          background-color: white !important;
          color: #3B0304 !important;
          border-radius: 4px !important;
          padding: 4px 20px 4px 6px !important;
          font-size: 0.85rem !important;
          appearance: none !important;
          cursor: pointer;
          width: 100%;
        }
        .percentage-select:focus, .status-select:focus {
          outline: 1px solid #3B0304;
        }
        .file-button {
          background: none;
          border: 1px solid #3B0304;
          color: #3B0304;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.85rem;
          transition: background-color 0.2s;
        }
        .file-button:hover {
          background-color: #f0f0f0;
        }
        .center-content-flex {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          height: 100%;
        }
      `}</style>
 
      <h1 className="section-title">
        <FaFileAlt /> Manuscript &raquo; Results
      </h1>
      <hr className="divider" />
 
      {/* Control Block - Only Search */}
      <div className="flex justify-between items-start mb-6 gap-4">
        <div className="search-input-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
 
      {/* Table Container */}
      <div ref={tableWrapperRef} className="bg-white rounded-lg shadow-md relative">
        <div
          className="table-scroll-area overflow-x-auto overflow-y-auto max-h-96"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <table className="tasks-table min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th>NO</th>
                <th>TEAM</th>
                <th>DUE DATE</th>
                <th>TIME</th>
                <th>PLAGIARISM</th>
                <th>AI</th>
                <th>FILE UPLOADED</th>
                <th>VERDICT</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSchedules.map((sched, idx) => {
                const teamName = getGroupName(sched.manager_id);
 
                return (
                  <tr key={sched.id}>
                    <td>{idx + 1}.</td>
                    <td>{teamName}</td>
                    <td>
                      <div className="center-content-flex">
                        <FaCalendarAlt size={14} style={{ color: '#3B0304' }} />
                        {sched.date
                          ? new Date(sched.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "N/A"}
                      </div>
                    </td>
                    <td>
                      <div className="center-content-flex">
                        <FaClock size={14} style={{ color: '#3B0304' }} />
                        {sched.time || "N/A"}
                      </div>
                    </td>
                    <td>
                      <div className="dropdown-control-wrapper">
                        <select
                          value={sched.plagiarism}
                          onChange={(e) =>
                            updateField(sched.id, "plagiarism", parseInt(e.target.value))
                          }
                          className="percentage-select"
                        >
                          {PERCENTAGE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}%
                            </option>
                          ))}
                        </select>
                        <FaChevronDown className="dropdown-icon-chevron" style={{ color: '#3B0304' }} />
                      </div>
                    </td>
                    <td>
                      <div className="dropdown-control-wrapper">
                        <select
                          value={sched.ai}
                          onChange={(e) =>
                            updateField(sched.id, "ai", parseInt(e.target.value))
                          }
                          className="percentage-select"
                        >
                          {PERCENTAGE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}%
                            </option>
                          ))}
                        </select>
                        <FaChevronDown className="dropdown-icon-chevron" style={{ color: '#3B0304' }} />
                      </div>
                    </td>
                    <td>
                      <button
                        className="file-button"
                        onClick={() => handleFileClick(sched)}
                      >
                        {sched.file_uploaded ? sched.file_uploaded : "[File]"}
                      </button>
                    </td>
                    <td>
                      <div className="dropdown-control-wrapper">
                        <select
                          value={sched.verdic || 1}
                          onChange={(e) =>
                            updateField(sched.id, "verdic", parseInt(e.target.value))
                          }
                          className="status-select"
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <FaChevronDown className="dropdown-icon-chevron" style={{ color: '#3B0304' }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredSchedules.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-gray-500">
                    No schedules found for you as adviser.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}