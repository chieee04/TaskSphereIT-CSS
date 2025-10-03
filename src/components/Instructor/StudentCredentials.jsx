import React, { useState, useEffect, useRef } from "react";
import { FaDownload, FaUserGraduate, FaEllipsisV, FaEdit, FaTrash, FaSearch, FaKey, FaTrashAlt } from "react-icons/fa";
import { supabase } from "../../supabaseClient";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "../Style/Instructor/StudentCredentials.css";
import { exportStudentsAsPDF } from "../../services/Adviser/StudentExport";
 
const StudentCredentials = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [openDropdown, setOpenDropdown] = useState(null);
  const [openHeaderAction, setOpenHeaderAction] = useState(false);
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const MySwal = withReactContent(Swal);
 
  // Refs for detecting outside clicks
  const headerKebabRef = useRef(null);
  const tableKebabRefs = useRef([]);
 
  const filteredData = credentials.filter((row) =>
    Object.values(row)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );
 
  // Function to generate random password
  const generateRandomPassword = () => {
    const length = 8;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };
 
  // Selection functions
  const handleToggleSelect = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };
 
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = filteredData.map((row) => row.id);
      setSelectedRows(allIds);
    } else {
      setSelectedRows([]);
    }
  };
 
  const handleStartMultipleDelete = () => {
    setIsSelectionMode(true);
    setSelectedRows([]);
    setOpenHeaderAction(false);
  };
 
  const handleCancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedRows([]);
  };
 
  const handleDeleteSelected = async () => {
    if (selectedRows.length === 0) {
      MySwal.fire({
        title: "No Students Selected",
        text: "Please select at least one student to delete.",
        icon: "info",
        confirmButtonColor: "#3B0304",
      });
      return;
    }
 
    const result = await MySwal.fire({
      title: `Delete ${selectedRows.length} Student${selectedRows.length > 1 ? 's' : ''}?`,
      text: "This will permanently delete the selected student(s).",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3B0304",
      cancelButtonColor: "#999",
      confirmButtonText: `Yes, delete ${selectedRows.length} student${selectedRows.length > 1 ? 's' : ''}!`,
    });
 
    if (result.isConfirmed) {
      try {
        const { error } = await supabase
          .from("user_credentials")
          .delete()
          .in("id", selectedRows);
 
        if (error) throw error;
 
        // Remove deleted students from local state
        const updatedCredentials = credentials.filter((row) => !selectedRows.includes(row.id));
        setCredentials(updatedCredentials);
 
        // Exit selection mode
        handleCancelSelection();
 
        MySwal.fire("Deleted!", `${selectedRows.length} student${selectedRows.length > 1 ? 's' : ''} have been deleted.`, "success");
      } catch (error) {
        console.error("Delete error:", error);
        MySwal.fire("Error", "Failed to delete students.", "error");
      }
    }
  };
 
  const isAllSelected = filteredData.length > 0 && filteredData.every((row) => selectedRows.includes(row.id));
 
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close header kebab menu
      if (headerKebabRef.current && !headerKebabRef.current.contains(event.target)) {
        setOpenHeaderAction(false);
      }
 
      // Close table row kebab menus
      if (openDropdown !== null) {
        const currentRef = tableKebabRefs.current[openDropdown];
        if (currentRef && !currentRef.contains(event.target)) {
          setOpenDropdown(null);
        }
      }
    };
 
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdown]);
 
  const handleEditRow = (row, index) => {
    setOpenDropdown(null);
 
    MySwal.fire({
      title: "",
      html: `
        <div style="text-align: left; padding-bottom: 12px; border-bottom: 2px solid #3B0304; display: flex; align-items: center;">
          <h5 style="margin: 0; display: flex; align-items: center; gap: 10px; font-weight: 600; color: #3B0304; font-size: 1.1rem;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#3B0304" viewBox="0 0 16 16">
              <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.254 7.465.707.708l-3 3-1.646-1.647a.5.5 0 0 1 0-.708l3-3z"/>
              <path d="m14.207 2.5l-.707.707L13.5 3.707l.707-.707.646.646a.5.5 0 0 1 0 .708l-3 3-.707.707-.707-.707.707-.707 3-3 .707.707.646-.646a.5.5 0 0 1 0-.708l-3-3z"/>
            </svg>
            Student Details
          </h5>
        </div>
 
        <div style="padding: 1.2rem 1.2rem;">
          <!-- User ID -->
          <div style="display: flex; flex-direction: column; margin-bottom: 1rem;">
            <label for="user_id" style="font-weight: 500; margin-bottom: 0.3rem; font-size: 0.85rem; color: #333; text-align: left;">User ID</label>
            <input id="user_id" class="swal2-input" value="${row.user_id}" placeholder=""
              style="border-radius: 6px; border: 1.5px solid #888; padding: 0.5rem 0.75rem; font-size: 0.9rem; text-align: left; width: 100%; height: 38px; background-color: #fff; margin-left: 0;" />
          </div>
 
          <!-- Password -->
          <div style="display: flex; flex-direction: column; margin-bottom: 1rem; position: relative;">
            <label for="password" style="font-weight: 500; margin-bottom: 0.3rem; font-size: 0.85rem; color: #333; text-align: left;">Password</label>
            <input id="password" class="swal2-input" value="${row.password}" placeholder=""
              style="border-radius: 6px; border: 1.5px solid #888; padding: 0.5rem 0.75rem; font-size: 0.9rem; text-align: left; width: 100%; height: 38px; background-color: #fff; margin-left: 0;" />
            <button id="reset-password-btn" type="button"
              style="
                position: absolute;
                right: 0;
                top: 100%;
                margin-top: 4px;
                background: none;
                border: none;
                color: #3B0304;
                font-size: 0.8rem;
                cursor: pointer;
                font-weight: 500;
                padding: 2px 8px;
                transition: all 0.2s;
              ">
              Reset
            </button>
          </div>
 
          <!-- Last Name -->
          <div style="display: flex; flex-direction: column; margin-bottom: 1rem;">
            <label for="last_name" style="font-weight: 500; margin-bottom: 0.3rem; font-size: 0.85rem; color: #333; text-align: left;">Last Name</label>
            <input id="last_name" class="swal2-input" value="${row.last_name}" placeholder=""
              style="border-radius: 6px; border: 1.5px solid #888; padding: 0.5rem 0.75rem; font-size: 0.9rem; text-align: left; width: 100%; height: 38px; background-color: #fff; margin-left: 0;" />
          </div>
 
          <!-- First Name -->
          <div style="display: flex; flex-direction: column; margin-bottom: 1rem;">
            <label for="first_name" style="font-weight: 500; margin-bottom: 0.3rem; font-size: 0.85rem; color: #333; text-align: left;">First Name</label>
            <input id="first_name" class="swal2-input" value="${row.first_name}" placeholder=""
              style="border-radius: 6px; border: 1.5px solid #888; padding: 0.5rem 0.75rem; font-size: 0.9rem; text-align: left; width: 100%; height: 38px; background-color: #fff; margin-left: 0;" />
          </div>
 
          <!-- Middle Name -->
          <div style="display: flex; flex-direction: column; margin-bottom: 1.5rem;">
            <label for="middle_name" style="font-weight: 500; margin-bottom: 0.3rem; font-size: 0.85rem; color: #333; text-align: left;">Middle Name</label>
            <input id="middle_name" class="swal2-input" value="${row.middle_name}" placeholder=""
              style="border-radius: 6px; border: 1.5px solid #888; padding: 0.5rem 0.75rem; font-size: 0.9rem; text-align: left; width: 100%; height: 38px; background-color: #fff; margin-left: 0;" />
          </div>
 
          <!-- Buttons -->
          <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 0.5rem;">
            <button id="cancel-btn" class="swal2-cancel" type="button"
              style="border: 1.5px solid #3B0304; background-color: #fff; color: #3B0304; font-weight: 500; padding: 0.5rem 1.8rem; border-radius: 6px; cursor: pointer; transition: all 0.2s; font-size: 0.85rem;">
              Cancel
            </button>
            <button id="save-btn" class="swal2-confirm" type="button"
              style="background-color: #3B0304; color: #fff; font-weight: 500; padding: 0.5rem 1.8rem; border-radius: 6px; cursor: pointer; transition: all 0.2s; font-size: 0.85rem; border: 1.5px solid #3B0304;">
              Save
            </button>
          </div>
        </div>
      `,
      showConfirmButton: false,
      showCancelButton: false,
      width: "460px",
      customClass: {
        popup: 'custom-swal-popup',
      },
      didOpen: () => {
        const popup = Swal.getPopup();
 
        // Cancel button functionality
        popup.querySelector('#cancel-btn').onclick = () => {
          Swal.close();
        };
 
        // Save button functionality
        popup.querySelector('#save-btn').onclick = () => {
          Swal.clickConfirm();
        };
 
        // Reset password button functionality
        popup.querySelector('#reset-password-btn').onclick = () => {
          const passwordInput = document.getElementById('password');
          const newPassword = generateRandomPassword();
          passwordInput.value = newPassword;
          MySwal.showValidationMessage(`Password has been reset to: ${newPassword}`);
        };
 
        // Hover effects
        popup.querySelector('#cancel-btn').addEventListener('mouseenter', (e) => {
          e.target.style.backgroundColor = '#f8f8f8';
        });
        popup.querySelector('#cancel-btn').addEventListener('mouseleave', (e) => {
          e.target.style.backgroundColor = '#fff';
        });
        popup.querySelector('#save-btn').addEventListener('mouseenter', (e) => {
          e.target.style.backgroundColor = '#2a0203';
          e.target.style.borderColor = '#2a0203';
        });
        popup.querySelector('#save-btn').addEventListener('mouseleave', (e) => {
          e.target.style.backgroundColor = '#3B0304';
          e.target.style.borderColor = '#3B0304';
        });
 
        // Reset button hover effects
        popup.querySelector('#reset-password-btn').addEventListener('mouseenter', (e) => {
          e.target.style.color = '#2a0203';
          e.target.style.textDecoration = 'underline';
        });
        popup.querySelector('#reset-password-btn').addEventListener('mouseleave', (e) => {
          e.target.style.color = '#3B0304';
          e.target.style.textDecoration = 'none';
        });
 
        // Add focus effects to inputs
        const inputs = popup.querySelectorAll('input');
        inputs.forEach(input => {
          input.addEventListener('focus', (e) => {
            e.target.style.borderColor = '#3B0304';
            e.target.style.boxShadow = '0 0 0 2px rgba(59, 3, 4, 0.1)';
          });
          input.addEventListener('blur', (e) => {
            e.target.style.borderColor = '#888';
            e.target.style.boxShadow = 'none';
          });
        });
      },
      preConfirm: () => {
        const user_id = document.getElementById("user_id").value;
        const password = document.getElementById("password").value;
        const first_name = document.getElementById("first_name").value;
        const last_name = document.getElementById("last_name").value;
 
        if (!user_id || !password || !first_name || !last_name) {
          MySwal.showValidationMessage(
            'Please fill out all required fields (User ID, Password, First Name, Last Name).'
          );
          return false;
        }
 
        // Number check
        if (/\d/.test(first_name) || /\d/.test(last_name)) {
          MySwal.showValidationMessage('Numbers in First Name or Last Name are not allowed.');
          return false;
        }
 
        return {
          user_id,
          password,
          first_name,
          last_name,
          middle_name: document.getElementById("middle_name").value,
        };
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        const updatedData = { ...row, ...result.value };
        const { error } = await supabase
          .from("user_credentials")
          .update(updatedData)
          .eq("id", row.id);
 
        if (error) {
          console.error("Update error:", error);
          MySwal.fire("Error", "Failed to update student.", "error");
        } else {
          const updatedCredentials = [...credentials];
          updatedCredentials[index] = updatedData;
          setCredentials(updatedCredentials);
          MySwal.fire("Updated!", "Student updated successfully.", "success");
        }
      }
    });
  };
 
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This student will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3B0304",
      cancelButtonColor: "#999",
      confirmButtonText: "Yes, delete it!",
    });
 
    if (result.isConfirmed) {
      const { error } = await supabase
        .from("user_credentials")
        .delete()
        .eq("id", id);
 
      if (error) {
        console.error("Delete error:", error);
        Swal.fire("Error", "Failed to delete student.", "error");
      } else {
        setCredentials(credentials.filter((row) => row.id !== id));
        Swal.fire("Deleted!", "Student has been deleted.", "success");
      }
    }
  };
 
  const handleResetAllPasswords = () => {
    setOpenHeaderAction(false);
    MySwal.fire({
      title: "Reset All Passwords?",
      text: "This will reset passwords for all students to random values.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3B0304",
      cancelButtonColor: "#999",
      confirmButtonText: "Yes, reset all!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Generate new random passwords for all students
          const updates = credentials.map(student => ({
            id: student.id,
            password: generateRandomPassword()
          }));
 
          // Update all passwords in the database
          const { error } = await supabase
            .from("user_credentials")
            .upsert(updates);
 
          if (error) throw error;
 
          // Update local state
          const updatedCredentials = credentials.map(student => ({
            ...student,
            password: updates.find(u => u.id === student.id)?.password || student.password
          }));
          setCredentials(updatedCredentials);
 
          MySwal.fire("Reset!", "All passwords have been reset to random values.", "success");
        } catch (error) {
          console.error("Reset all passwords error:", error);
          MySwal.fire("Error", "Failed to reset passwords.", "error");
        }
      }
    });
  };
 
  useEffect(() => {
    const fetchCredentials = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_credentials")
        .select("id, last_name, first_name, middle_name, user_id, password, user_roles")
        .in("user_roles", [1, 2]);
 
      if (error) {
        console.error("Error fetching:", error);
      } else {
        setCredentials(data);
      }
      setLoading(false);
    };
 
    fetchCredentials();
  }, []);
 
  return (
    <div className="container-fluid px-4 py-3">
      {/* Scrollbar Fix for Webkit (Chrome/Safari) */}
      <style>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .table-scroll-area::-webkit-scrollbar {
          display: none;
        }
        /* Style for the custom dropdown menu */
        .enroll-dropdown {
          position: absolute;
          right: 30px;
          top: 0;
          z-index: 20;
          min-width: 100px;
          padding: 4px 0;
          margin: 0;
          list-style: none;
          font-size: 0.9rem;
          text-align: left;
          background-color: #fff;
          border: 1px solid #ccc;
          border-radius: 4px;
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.175);
        }
        .enroll-dropdown .dropdown-item {
          display: block;
          width: "100%";
          padding: 8px 12px;
          clear: both;
          font-weight: 400;
          color: #212529;
          text-align: inherit;
          white-space: nowrap;
          background-color: transparent;
          border: 0;
          cursor: pointer;
        }
        .enroll-dropdown .dropdown-item:hover {
          background-color: #f8f9fa;
        }
      `}</style>
 
      <div className="row">
        <div className="col-12">
          <div className="d-flex align-items-center mb-2 student-cred-header" style={{color: '#3B0304'}}>
            <FaUserGraduate className="me-2" size={18} />
            <strong>Student Credentials</strong>
          </div>
 
          <div
            style={{
              height: "1.5px",
              backgroundColor: "#3B0304",
              width: "calc(100% + 50px)",
              marginLeft: "-16px",
              borderRadius: "50px",
              marginBottom: "1.5rem",
            }}
          />
 
          <div className="col-12 col-md-12 col-lg-12">
            {/* Export Button */}
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
              <div className="d-flex flex-wrap align-items-center gap-2">
                <button
                  className="btn d-flex align-items-center gap-1"
                  onClick={() => exportStudentsAsPDF(credentials)}
                  style={{
                    border: "1.5px solid #3B0304",
                    color: "#3B0304",
                    padding: "6px 12px",
                    backgroundColor: "white",
                    fontWeight: "500",
                    fontSize: "0.85rem",
                    borderRadius: "6px",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                >
                  <FaDownload size={14} /> Export
                </button>
              </div>
            </div>
 
            {/* Search and Kebab Menu Row */}
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
              <div className="position-relative">
                <input
                  type="text"
                  placeholder="Search student..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-control ps-5"
                  style={{
                    fontSize: "0.9rem",
                    maxWidth: "200px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    height: "38px",
                  }}
                />
                <FaSearch 
                  className="position-absolute text-muted" 
                  style={{ left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "0.85rem" }} 
                />
              </div>
 
              {/* Conditional Delete Buttons */}
              {!isSelectionMode ? (
                <div 
                  ref={headerKebabRef}
                  style={{ 
                    position: "relative", 
                    display: "inline-block",
                    width: "100px",
                    display: "flex",
                    justifyContent: "center"
                  }}
                >
                  <button
                    className="btn d-flex align-items-center gap-1 text-[#3B0304]"
                    onClick={() => setOpenHeaderAction(!openHeaderAction)}
                    style={{
                      fontSize: "0.85rem",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      backgroundColor: "transparent",
                      fontWeight: "500",
                      border: "none",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <FaEllipsisV size={12} />
                  </button>
 
                  {openHeaderAction && (
                    <ul className="enroll-dropdown" style={{ right: "0", top: "100%", marginTop: "4px" }}>
                      <li>
                        <button
                          className="dropdown-item d-flex align-items-center gap-2"
                          onClick={handleResetAllPasswords}
                          style={{
                            background: "none",
                            border: "none",
                            width: "100%",
                            padding: "8px 12px",
                            textAlign: "left",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                          }}
                        >
                          <FaKey size={12} style={{ color: '#3B0304' }} /> Reset All Password
                        </button>
                      </li>
                      <li>
                        <button
                          className="dropdown-item d-flex align-items-center gap-2"
                          onClick={handleStartMultipleDelete}
                          style={{
                            background: "none",
                            border: "none",
                            width: "100%",
                            padding: "8px 12px",
                            textAlign: "left",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            color: '#212529',
                          }}
                        >
                          <FaTrashAlt size={12} style={{ color: '#212529' }} /> Delete Multiple
                        </button>
                      </li>
                    </ul>
                  )}
                </div>
              ) : (
                <div className="d-flex align-items-center gap-2">
                  <button
                    className="btn"
                    onClick={handleCancelSelection}
                    style={{
                      fontSize: "0.85rem",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: "1.5px solid #B2B2B2",
                      backgroundColor: "transparent",
                      color: "#3B0304",
                      fontWeight: "500",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn d-flex align-items-center gap-1"
                    onClick={handleDeleteSelected}
                    disabled={selectedRows.length === 0}
                    style={{
                      fontSize: "0.85rem",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      backgroundColor: "transparent",
                      fontWeight: "500",
                      cursor: selectedRows.length === 0 ? "not-allowed" : "pointer",
                      color: selectedRows.length === 0 ? "#A0A0A0" : "#3B0304",
                      border: `1.5px solid ${selectedRows.length === 0 ? "#B2B2B2" : "#3B0304"}`,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => (selectedRows.length > 0 ? (e.currentTarget.style.backgroundColor = "#f0f0f0") : null)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <FaTrash size={12} /> Delete Selected ({selectedRows.length})
                  </button>
                </div>
              )}
            </div>
 
            {credentials.length === 0 && !loading ? (
              <div
                className="text-center p-4 border"
                style={{
                  fontSize: "0.9rem",
                  color: "#3B0304",
                  border: "1px solid #B2B2B2",
                  borderRadius: "16px",
                }}
              >
                <strong>NOTE:</strong> No student credentials found in the system.
              </div>
            ) : (
              // --- Student Credentials Table Section ---
              <div className="bg-white rounded-lg shadow-md relative">
                {/* Table Body with Scrolling */}
                <div 
                  className="table-scroll-area overflow-x-auto overflow-y-auto"
                  style={{ maxHeight: '400px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                > 
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        {/* Checkbox Header (Conditional) */}
                        {isSelectionMode && (
                          <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: "40px" }}>
                            <input
                              type="checkbox"
                              className="form-checkbox h-4 w-4 text-[#3B0304] border-gray-300 rounded"
                              checked={isAllSelected}
                              onChange={handleSelectAll}
                            />
                          </th>
                        )}
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NO</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Middle Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Password</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '100px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loading ? (
                        <tr>
                          <td colSpan={isSelectionMode ? "8" : "7"} className="text-center py-4 text-gray-500">
                            Loading...
                          </td>
                        </tr>
                      ) : filteredData.length === 0 ? (
                        <tr>
                          <td colSpan={isSelectionMode ? "8" : "7"} className="text-center py-4 text-gray-500">
                            No students match your search.
                          </td>
                        </tr>
                      ) : (
                        filteredData.map((row, index) => {
                          const isSelected = selectedRows.includes(row.id);
                          return (
                            <tr key={row.id} className={isSelected ? "bg-gray-50" : "hover:bg-gray-50 transition duration-150"}>
                              {/* Checkbox Cell (Conditional) */}
                              {isSelectionMode && (
                                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                                  <input
                                    type="checkbox"
                                    className="form-checkbox h-4 w-4 text-[#3B0304] border-gray-300 rounded"
                                    checked={isSelected}
                                    onChange={() => handleToggleSelect(row.id)}
                                  />
                                </td>
                              )}
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.last_name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.first_name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.middle_name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.user_id}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.password}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center position-relative">
                                {/* Action Button only visible when not in selection mode */}
                                {!isSelectionMode && (
                                  <div ref={el => tableKebabRefs.current[index] = el}>
                                    <button
                                      className="text-gray-500 hover:text-[#3B0304] p-1 rounded transition duration-150"
                                      onClick={() => setOpenDropdown(openDropdown === index ? null : index)}
                                      style={{border: 'none', background: 'none'}}
                                    >
                                      <FaEllipsisV size={14} />
                                    </button>
 
                                    {/* Detached Dropdown Menu */}
                                    {openDropdown === index && (
                                      <ul className="enroll-dropdown" style={{ right: '5px', top: '50%', transform: 'translateY(-50%)', marginTop: '0' }}>
                                        <li>
                                          <button
                                            className="dropdown-item d-flex align-items-center gap-2"
                                            onClick={() => {
                                              setOpenDropdown(null);
                                              handleEditRow(row, index);
                                            }}
                                          >
                                            <FaEdit size={12} style={{ color: '#3B0304' }} /> Edit
                                          </button>
                                        </li>
                                        <li>
                                          <button
                                            className="dropdown-item d-flex align-items-center gap-2"
                                            onClick={() => {
                                              setOpenDropdown(null);
                                              handleDelete(row.id);
                                            }}
                                            style={{ color: '#212529' }}
                                          >
                                            <FaTrash size={12} style={{ color: '#212529' }} /> Delete
                                          </button>
                                        </li>
                                      </ul>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
 
export default StudentCredentials;