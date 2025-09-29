// Adviser.jsx
import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { v4 as uuidv4 } from "uuid";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { supabase } from "../../supabaseClient";
import {
  FaDownload,
  FaUpload,
  FaUserGraduate,
  FaEllipsisV,
  FaEdit,
  FaTrash,
  FaSearch,
} from "react-icons/fa";
// Assuming this file contains generic Bootstrap/CSS overrides, keeping import for now
import "../Style/Instructor/Enroll-Member.css";
import { openAddAdviser } from "../../services/instructor/addAdviser";


const MySwal = withReactContent(Swal);

const Adviser = () => {
  const [importedData, setImportedData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const tableWrapperRef = useRef(null);

  // --- Utility Functions for Dropdown ---
  const handleToggleDropdown = (index) => {
    setOpenDropdown(openDropdown === index ? null : index);
  };

  // --- Utility Functions for Selection ---
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

  // Function to start the selection mode
  const handleStartSelection = () => {
    setIsSelectionMode(true);
    setSelectedRows([]);
  };

  // Function to cancel selection mode
  const handleCancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedRows([]);
  };

  const handleDeleteSelected = () => {
    if (selectedRows.length === 0) {
      MySwal.fire({
        title: "No Advisers Selected",
        icon: "info",
        confirmButtonColor: "#3B0304",
      });
      return;
    }

    MySwal.fire({
      title: `Delete ${selectedRows.length} Advisers?`,
      text: "This will remove the advisers from the list before final upload.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3B0304",
      cancelButtonColor: "#999",
      confirmButtonText: "Yes, delete them!",
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedData = importedData.filter((row) => !selectedRows.includes(row.id));
        setImportedData(updatedData);

        handleCancelSelection();

        MySwal.fire("Deleted!", `${selectedRows.length} advisers removed.`, "success");
      }
    });
  };

  // --- Add Adviser (inline SweetAlert modal) ---
  const handleAddAdviser = async () => {
    const result = await MySwal.fire({
      title: "",
      html: `
        <div style="text-align: left; padding-bottom: 6px; border-bottom: 2px solid #3B0304; margin-bottom: 0.8rem;">
          <h5 style="margin: 0; font-weight: 600; color: #3B0304; font-size: 1rem;">Adviser Details</h5>
        </div>

        <div style="padding: 0; max-width: 600px; margin: 0 auto;">
          <div style="display: flex; gap: 0.6rem; margin-bottom: 0.8rem;">
            <input id="user_id" class="swal2-input" placeholder="Adviser ID" style="flex:1; height: 38px; margin:0;" />
            <input id="password" class="swal2-input" placeholder="Password" style="flex:1; height: 38px; margin:0;" />
          </div>

          <div style="display: flex; gap: 0.6rem; margin-bottom: 1rem;">
            <input id="first_name" class="swal2-input" placeholder="First Name" style="flex:1; height: 38px; margin:0;" />
            <input id="last_name" class="swal2-input" placeholder="Last Name" style="flex:1; height: 38px; margin:0;" />
            <input id="middle_name" class="swal2-input" placeholder="Middle Name" style="flex:1; height: 38px; margin:0;" />
          </div>

          <div style="display: flex; justify-content: center; gap: 1rem;">
            <button id="cancel-btn" style="border: 1px solid #3B0304; background-color: #fff; color: #000; font-weight: 500; padding: 0.4rem 1.4rem; border-radius: 6px; cursor:pointer;">Cancel</button>
            <button id="confirm-btn" style="background-color: #3B0304; color: #fff; font-weight: 500; padding: 0.4rem 1.4rem; border-radius: 6px; cursor:pointer;">Confirm</button>
          </div>
        </div>
      `,
      width: "600px",
      showConfirmButton: false,
      showCloseButton: false,
      didOpen: () => {
        const popup = Swal.getPopup();
        popup.querySelector("#cancel-btn").onclick = () => Swal.close();
        popup.querySelector("#confirm-btn").onclick = () => Swal.clickConfirm();
      },
      preConfirm: () => {
        const user_id = document.getElementById("user_id").value.trim();
        const password = document.getElementById("password").value.trim();
        const first_name = document.getElementById("first_name").value.trim();
        const last_name = document.getElementById("last_name").value.trim();
        const middle_name = document.getElementById("middle_name").value.trim();

        if (!user_id || !password || !first_name || !last_name) {
          MySwal.showValidationMessage("Please fill out all required fields (ID, Password, First, Last Name).");
          return false;
        }

        if (/\d/.test(first_name) || /\d/.test(last_name)) {
          MySwal.showValidationMessage("Numbers in First Name or Last Name are not allowed.");
          return false;
        }

        return { user_id, password, first_name, last_name, middle_name };
      },
    });

    if (result.isConfirmed && result.value) {
      const newAdviser = {
        id: uuidv4(),
        ...result.value,
      };
      setImportedData((prev) => [...prev, newAdviser]);
      MySwal.fire("Added!", "New adviser added successfully.", "success");
    }
  };

  // --- Core Functionality (Import/Download/Upload) ---
  const handleDownload = () => {
    const sampleData = [
      {
        user_id: "ADV2025001",
        password: "password123",
        first_name: "Maria",
        last_name: "Reyes",
        middle_name: "Lopez",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "user_credentials");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), "advisers_template.xlsx");
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // 1️⃣ Check for numbers in first or last name
      const invalidRow = jsonData.find(
        (row) => /\d/.test(row.first_name || "") || /\d/.test(row.last_name || "")
      );

      if (invalidRow) {
        MySwal.fire({
          title: "Invalid Name",
          text: "Numbers in First Name or Last Name are not allowed. Import cancelled.",
          icon: "warning",
          confirmButtonColor: "#3B0304",
        });
        return; // Stop import
      }

      // 2️⃣ Check for duplicate user_id in the imported file
      const idCounts = jsonData.reduce((acc, row) => {
        const id = row.user_id ? String(row.user_id).trim() : "";
        if (id) acc[id] = (acc[id] || 0) + 1;
        return acc;
      }, {});

      const duplicateId = Object.keys(idCounts).find((id) => idCounts[id] > 1);

      if (duplicateId) {
        MySwal.fire({
          title: "Duplicate ID",
          text: `Adviser ID "${duplicateId}" is duplicated. Import cancelled.`,
          icon: "warning",
          confirmButtonColor: "#3B0304",
        });
        return; // Stop import
      }

      // If all valid, process data
      const processedData = jsonData.map((row) => {
        const firstName = row.first_name || "";
        const lastName = row.last_name || "";

        return {
          id: uuidv4(),
          user_id: row.user_id ? String(row.user_id).replace(/\D/g, "") : "",
          password: row.password || "",
          first_name: firstName,
          last_name: lastName,
          middle_name: row.middle_name || "",
        };
      });

      setImportedData(processedData);
      setSelectedRows([]);
      setSearchTerm("");
    };

    reader.readAsArrayBuffer(file);
  };

  const handleUpload = async () => {
    if (importedData.length === 0) {
      MySwal.fire("No Data", "Please import advisers first.", "warning");
      return;
    }

    try {
      const dataToInsert = importedData.map((row) => ({
        user_id: row.user_id,
        password: row.password,
        first_name: row.first_name,
        last_name: row.last_name,
        middle_name: row.middle_name,
        user_roles: 3, // Advisers
      }));

      const { error } = await supabase.from("user_credentials").insert(dataToInsert);
      if (error) throw error;

      MySwal.fire("Success", "Adviser data uploaded successfully!", "success");
      setImportedData([]);
      setSelectedRows([]);
    } catch (err) {
      console.error("Upload error:", err.message);
      MySwal.fire("Error", err.message, "error");
    }
  };

  // --- Edit Row (inline SweetAlert edit modal, mirrors Enroll.jsx style but Adviser) ---
  const handleEditRow = (row, index) => {
    setOpenDropdown(null);

    MySwal.fire({
      title: "",
      html: `
       <div style="text-align: left; padding-bottom: 10px; border-bottom: 2px solid #3B0304; display: flex; align-items: center; justify-content: space-between;">
          <h5 style="margin: 0; display: flex; align-items: center; gap: 10px; font-weight: 600; color: #3B0304;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#3B0304" viewBox="0 0 16 16">
              <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.254 7.465.707.708l-3 3-1.646-1.647a.5.5 0 0 1 0-.708l3-3z"/>
              <path d="m14.207 2.5l-.707.707L13.5 3.707l.707-.707.646.646a.5.5 0 0 1 0 .708l-3 3-.707.707-.707-.707.707-.707 3-3 .707.707.646-.646a.5.5 0 0 1 0-.708l-3-3z"/>
            </svg>
            Adviser Details
          </h5>
        </div>

        <div style="padding: .9rem; margin-right: 0;">

          <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
            <div style="display: flex; flex-direction: column; flex: 1;">
              <input id="user_id" class="swal2-input" value="${row.user_id}" placeholder="Adviser ID"
                style="border-radius: 8px; border: 1px solid #ccc; padding: 0.5rem 0.75rem; font-size: 1rem; text-align: left; width: 100%;" />
            </div>
            <div style="display: flex; flex-direction: column; flex: 1;">
              <input id="password" class="swal2-input" value="${row.password}" placeholder="Password"
                style="border-radius: 8px; border: 1px solid #ccc; padding: 0.5rem 0.75rem; font-size: 1rem; text-align: left; width: 100%;" />
            </div>
          </div>

          <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
            <div style="display: flex; flex-direction: column; flex: 1;">
              <input id="first_name" class="swal2-input" value="${row.first_name}" placeholder="First Name"
                style="border-radius: 8px; border: 1px solid #ccc; padding: 0.5rem 0.75rem; font-size: 1rem; text-align: left; width: 100%;" />
            </div>
            <div style="display: flex; flex-direction: column; flex: 1;">
              <input id="last_name" class="swal2-input" value="${row.last_name}" placeholder="Last Name"
                style="border-radius: 8px; border: 1px solid #ccc; padding: 0.5rem 0.75rem; font-size: 1rem; text-align: left; width: 100%;" />
            </div>
            <div style="display: flex; flex-direction: column; flex: 1;">
              <input id="middle_name" class="swal2-input" value="${row.middle_name}" placeholder="Middle Name"
                style="border-radius: 8px; border: 1px solid #ccc; padding: 0.5rem 0.75rem; font-size: 1rem; text-align: left; width: 100%;" />
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 1rem;">
            <button id="cancel-btn" class="swal2-cancel"
              style="border: 1px solid #3B0304; background-color: #fff; color: #000; font-weight: 500; padding: 0.5rem 1.5rem; border-radius: 8px; cursor: pointer;">
              Cancel
            </button>
            <button id="save-btn" class="swal2-confirm"
              style="background-color: #3B0304; color: #fff; font-weight: 500; padding: 0.5rem 1.5rem; border-radius: 8px; cursor: pointer;">
              Save
            </button>
          </div>
        </div>
      `,
      showConfirmButton: false,
      showCancelButton: false,
      customClass: {
        popup: "custom-swal-popup",
      },
      didOpen: () => {
        const popup = Swal.getPopup();
        // remove any default close button bindings (we didn't include it)
        popup.querySelector("#save-btn").onclick = () => {
          Swal.clickConfirm();
        };
        popup.querySelector("#cancel-btn").onclick = () => {
          Swal.close();
        };
        popup.querySelector("#cancel-btn").addEventListener("mouseenter", (e) => (e.target.style.backgroundColor = "#f0f0f0"));
        popup.querySelector("#cancel-btn").addEventListener("mouseleave", (e) => (e.target.style.backgroundColor = "#fff"));
        popup.querySelector("#save-btn").addEventListener("mouseenter", (e) => (e.target.style.opacity = "0.9"));
        popup.querySelector("#save-btn").addEventListener("mouseleave", (e) => (e.target.style.opacity = "1"));
      },
      preConfirm: () => {
        const user_id = document.getElementById("user_id").value.trim();
        const password = document.getElementById("password").value.trim();
        const first_name = document.getElementById("first_name").value.trim();
        const last_name = document.getElementById("last_name").value.trim();
        const middle_name = document.getElementById("middle_name").value.trim();

        if (!user_id || !password || !first_name || !last_name) {
          MySwal.showValidationMessage('Please fill out all required fields (ID, Password, First, Last Name).');
          return false;
        }

        if (/\d/.test(first_name) || /\d/.test(last_name)) {
          MySwal.showValidationMessage('Numbers in First Name or Last Name are not allowed.');
          return false;
        }

        return { user_id, password, first_name, last_name, middle_name };
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedData = [...importedData];
        updatedData[index] = { ...row, ...result.value };
        setImportedData(updatedData);
        MySwal.fire("Updated!", "Adviser updated successfully.", "success");
      }
    });
  };

  const handleDeleteRow = (index) => {
    setOpenDropdown(null);

    MySwal.fire({
      title: "Are you sure?",
      text: "This will remove the adviser from the list.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      confirmButtonColor: "#3B0304",
      cancelButtonColor: "#999",
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedData = importedData.filter((_, i) => i !== index);
        const deletedId = importedData[index].id;
        setSelectedRows((prev) => prev.filter((id) => id !== deletedId));

        setImportedData(updatedData);
        MySwal.fire("Deleted!", "Adviser removed.", "success");
      }
    });
  };

  const handleCancel = () => {
    setImportedData([]);
    setSelectedRows([]);
    setSearchTerm("");
    MySwal.fire("Cancelled", "Import cancelled.", "info");
  };

  // --- Filtering ---
  const filteredData = importedData.filter((row) => {
    const userId = String(row.user_id ?? "").toLowerCase();
    const firstName = String(row.first_name ?? "").toLowerCase();
    const lastName = String(row.last_name ?? "").toLowerCase();
    const middleName = String(row.middle_name ?? "").toLowerCase();

    return (
      userId.includes(searchTerm.toLowerCase()) ||
      firstName.includes(searchTerm.toLowerCase()) ||
      lastName.includes(searchTerm.toLowerCase()) ||
      middleName.includes(searchTerm.toLowerCase())
    );
  });

  const isAllSelected = filteredData.length > 0 && filteredData.every((row) => selectedRows.includes(row.id));

  // --- Render ---
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
          width: 100%;
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
          <div className="d-flex align-items-center mb-2 enroll-header" style={{ color: "#3B0304" }}>
            <FaUserGraduate className="me-2" size={18} />
            <strong>Enroll » Advisers</strong>
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
        </div>

        <div className="col-12 col-md-12 col-lg-12">
          {/* Top Control Buttons */}
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <button
                className="btn d-flex align-items-center gap-1"
                onClick={handleDownload}
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
                <FaDownload size={14} /> Download
              </button>

              <label
                className="btn d-flex align-items-center gap-1 mb-0"
                style={{
                  border: "1.5px solid #3B0304",
                  color: "#3B0304",
                  padding: "6px 12px",
                  backgroundColor: "white",
                  fontWeight: "500",
                  fontSize: "0.85rem",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
              >
                <FaUpload size={14} /> Import
                <input type="file" hidden accept=".xlsx,.xls" onChange={handleImport} onClick={(e) => (e.target.value = null)} />
              </label>
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              {importedData.length > 0 && (
                <>
                  <button
                    className="btn"
                    onClick={handleUpload}
                    style={{
                      fontSize: "0.85rem",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: "1.5px solid #3B0304",
                      backgroundColor: "#3B0304",
                      color: "white",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "opacity 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    Save & Enroll ({importedData.length})
                  </button>

                  <button
                    className="btn"
                    onClick={handleCancel}
                    style={{
                      fontSize: "0.85rem",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: "1.5px solid #3B0304",
                      backgroundColor: "transparent",
                      color: "#3B0304",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    Cancel Import
                  </button>
                </>
              )}

              {/* Add Adviser Button */}
              <button
                className="btn"
                style={{
                  border: "1.5px solid #3B0304",
                  color: "#3B0304",
                  padding: "6px 12px",
                  backgroundColor: "white",
                  fontWeight: "500",
                  fontSize: "0.85rem",
                  borderRadius: "6px",
                  whiteSpace: "nowrap",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                onClick={handleAddAdviser}
              >
                + Add Adviser
              </button>
            </div>
          </div>

          {importedData.length === 0 ? (
            <div
              className="text-center p-4 border"
              style={{
                fontSize: "0.9rem",
                color: "#3B0304",
                border: "1px solid #B2B2B2",
                borderRadius: "16px",
              }}
            >
              <strong>NOTE:</strong> Please download the template to input the required adviser information. Once completed, import the file to proceed with enrolling the advisers into the system.
            </div>
          ) : (
            // --- Enrollment Table Section ---
            <div className="bg-white rounded-lg shadow-md relative" ref={tableWrapperRef}>
              {/* Table Controls (Search and Delete Selected) */}
              <div className="d-flex justify-content-between align-items-center p-3 flex-wrap gap-2">
                <div className="position-relative">
                  <input
                    type="text"
                    placeholder="Search adviser..."
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
                  <FaSearch className="position-absolute text-muted" style={{ left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "0.85rem" }} />
                </div>

                {/* Conditional Delete Buttons */}
                {!isSelectionMode ? (
                  <button
                    className="btn d-flex align-items-center gap-1 text-[#3B0304] border-[#3B0304]"
                    onClick={handleStartSelection}
                    style={{
                      fontSize: "0.85rem",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      backgroundColor: "transparent",
                      fontWeight: "500",
                      border: `1.5px solid #3B0304`,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <FaTrash size={12} /> Delete
                  </button>
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
                      <FaTrash size={12} /> Delete Selected
                    </button>
                  </div>
                )}
              </div>

              {/* Table Body with Scrolling */}
              <div className="table-scroll-area overflow-x-auto overflow-y-auto" style={{ maxHeight: "400px", scrollbarWidth: "none", msOverflowStyle: "none" }}>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      {/* Checkbox Header (Conditional) */}
                      {isSelectionMode && (
                        <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: "40px" }}>
                          <input type="checkbox" className="form-checkbox h-4 w-4 text-[#3B0304] border-gray-300 rounded" checked={isAllSelected} onChange={handleSelectAll} />
                        </th>
                      )}
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NO</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adviser ID</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Password</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Middle Name</th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: "100px" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((row, index) => {
                      const isSelected = selectedRows.includes(row.id);
                      return (
                        <tr key={row.id} className={isSelected ? "bg-gray-50" : "hover:bg-gray-50 transition duration-150"}>
                          {/* Checkbox Cell (Conditional) */}
                          {isSelectionMode && (
                            <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                              <input type="checkbox" className="form-checkbox h-4 w-4 text-[#3B0304] border-gray-300 rounded" checked={isSelected} onChange={() => handleToggleSelect(row.id)} />
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{importedData.indexOf(row) + 1}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.user_id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.password}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.first_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.last_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.middle_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center position-relative">
                            {/* Action Button only visible when not in selection mode */}
                            {!isSelectionMode && (
                              <button className="text-gray-500 hover:text-[#3B0304] p-1 rounded transition duration-150" onClick={() => handleToggleDropdown(index)} style={{ border: "none", background: "none" }}>
                                <FaEllipsisV size={14} />
                              </button>
                            )}

                            {/* Detached Dropdown Menu */}
                            {openDropdown === index && !isSelectionMode && (
                              <ul className="enroll-dropdown" style={{ right: "5px", top: "50%", transform: "translateY(-50%)", marginTop: "0" }}>
                                <li>
                                  <button className="dropdown-item d-flex align-items-center gap-2" onClick={() => handleEditRow(row, index)}>
                                    <FaEdit size={12} style={{ color: "#3B0304" }} /> Edit
                                  </button>
                                </li>
                                <li>
                                  <button className="dropdown-item d-flex align-items-center gap-2 text-danger" onClick={() => handleDeleteRow(index)}>
                                    <FaTrash size={12} /> Delete
                                  </button>
                                </li>
                              </ul>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredData.length === 0 && (
                      <tr>
                        <td colSpan={isSelectionMode ? "9" : "8"} className="text-center py-4 text-gray-500">No advisers match your search.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Adviser;
