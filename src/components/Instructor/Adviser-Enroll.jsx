import React, { useState } from "react";
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
} from "react-icons/fa";
import "../Style/Instructor/Enroll-Member.css";
 
const Adviser = () => {
  const MySwal = withReactContent(Swal);
  const [importedData, setImportedData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDropdown, setOpenDropdown] = useState(null);
 
  const handleDownload = () => {
    const sampleData = [
      {
        user_id: "ADV-2025-0001",
        password: "adviser123",
        first_name: "Pedro",
        last_name: "Santos",
        middle_name: "Reyes",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "user_credentials");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([wbout], { type: "application/octet-stream" }),
      "Capstone_Advisers_Template.xlsx"
    );
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
 
      const processedData = jsonData.map((row) => ({
        id: uuidv4(),
        user_id: row.user_id || "",
        password: row.password || "",
        first_name: row.first_name || "",
        last_name: row.last_name || "",
        middle_name: row.middle_name || "",
      }));
 
      setImportedData(processedData);
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
        user_roles: 3, // Adviser role
      }));
 
      const { error } = await supabase.from("user_credentials").insert(dataToInsert);
 
      if (error) throw error;
 
      MySwal.fire("Success", "Adviser data uploaded successfully!", "success");
      setImportedData([]);
    } catch (err) {
      console.error("Upload error:", err.message);
      MySwal.fire("Error", err.message, "error");
    }
  };
 
  const handleEditRow = (row, index) => {
    MySwal.fire({
      title: "",
      html: `
        <div style="text-align: left; padding-bottom: 10px; border-bottom: 2px solid #3B0304; display: flex; align-items: center; justify-content: space-between;">
        <h5 style="margin: 0; display: flex; align-items: center; gap: 10px; font-weight: 600;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#3B0304" viewBox="0 0 16 16">
            <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.254 7.465.707.708l-3 3-1.646-1.647a.5.5 0 0 1 0-.708l3-3z"/>
            <path d="m14.207 2.5l-.707.707L13.5 3.707l.707-.707.646.646a.5.5 0 0 1 0 .708l-3 3-.707.707-.707-.707.707-.707 3-3 .707.707.646-.646a.5.5 0 0 1 0-.708l-3-3z"/>
          </svg>
          Adviser Details
        </h5>
        <button type="button" class="swal2-close" aria-label="Close this dialog" style="font-size: 1.5rem;">×</button>
      </div>
 
      <div style="padding: .9rem;margin-right: 3rem;">
 
        <!-- Row 1 -->
        <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
          <div style="display: flex; flex-direction: column; flex: 1;">
            <label for="user_id" style="font-weight: 500; margin-bottom: 0.25rem; margin-right: 3rem;">Adviser ID</label>
            <input id="user_id" class="swal2-input" value="${row.user_id}" placeholder="Adviser ID"
              style="border-radius: 8px; border: 1px solid #ccc; padding: 0.5rem 0.75rem; font-size: 1rem; text-align: left; width: 100%;" />
          </div>
          <div style="display: flex; flex-direction: column; flex: 1;">
            <label for="password" style="font-weight: 500; margin-bottom: 0.25rem; margin-right: 3rem;">Password</label>
            <input id="password" class="swal2-input" value="${row.password}" placeholder="Password"
              style="border-radius: 8px; border: 1px solid #ccc; padding: 0.5rem 0.75rem; font-size: 1rem; text-align: left; width: 100%;" />
          </div>
        </div>
 
        <!-- Row 2 -->
        <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
          <div style="display: flex; flex-direction: column; flex: 1;">
            <label for="first_name" style="font-weight: 500; margin-bottom: 0.25rem; margin-left: 1.3rem;">First Name</label>
            <input id="first_name" class="swal2-input" value="${row.first_name}" placeholder="First Name"
              style="border-radius: 8px; border: 1px solid #ccc; padding: 0.5rem 0.75rem; font-size: 1rem; text-align: left; width: 100%;" />
          </div>
          <div style="display: flex; flex-direction: column; flex: 1;">
            <label for="last_name" style="font-weight: 500; margin-bottom: 0.25rem; margin-left: 1.4rem;">Last Name</label>
            <input id="last_name" class="swal2-input" value="${row.last_name}" placeholder="Last Name"
              style="border-radius: 8px; border: 1px solid #ccc; padding: 0.5rem 0.75rem; font-size: 1rem; text-align: left; width: 100%;" />
          </div>
          <div style="display: flex; flex-direction: column; flex: 1;">
            <label for="middle_name" style="font-weight: 500; margin-bottom: 0.25rem; margin-left: 1.8rem;">Middle Name</label>
            <input id="middle_name" class="swal2-input" value="${row.middle_name}" placeholder="Middle Name"
              style="border-radius: 8px; border: 1px solid #ccc; padding: 0.5rem 0.75rem; font-size: 1rem; text-align: left; width: 100%;" />
          </div>
        </div>
          <div style="display: flex; justify-content: flex-end; gap: 1rem;">
            <button id="cancel-btn" class="swal2-cancel" style="border: 1px solid #3B0304; background-color: #fff; color: #000; font-weight: 500; padding: 0.5rem 1.5rem; border-radius: 8px; cursor: pointer;">Cancel</button>
            <button id="save-btn" class="swal2-confirm" style="background-color: #3B0304; color: #fff; font-weight: 500; padding: 0.5rem 1.5rem; border-radius: 8px; cursor: pointer;">Save</button>
          </div>
        </div>
      `,
      showConfirmButton: false,
      showCancelButton: false,
      customClass: {
        popup: 'custom-swal-popup',
      },
      didOpen: () => {
        const popup = Swal.getPopup();
        popup.querySelector('.swal2-close').onclick = () => Swal.close();
        popup.querySelector('#save-btn').onclick = () => {
          Swal.clickConfirm();
        };
        popup.querySelector('#cancel-btn').onclick = () => {
          Swal.close();
        };
      },
      preConfirm: () => {
        return {
          user_id: document.getElementById("user_id").value,
          password: document.getElementById("password").value,
          first_name: document.getElementById("first_name").value,
          last_name: document.getElementById("last_name").value,
          middle_name: document.getElementById("middle_name").value,
        };
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
    MySwal.fire({
      title: "Are you sure?",
      text: "This will remove the adviser from the list.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedData = importedData.filter((_, i) => i !== index);
        setImportedData(updatedData);
        MySwal.fire("Deleted!", "Adviser removed.", "success");
      }
    });
  };
 
  const handleCancel = () => {
    setImportedData([]);
    setSearchTerm("");
    MySwal.fire("Cancelled", "Import cancelled.", "info");
  };
 
  const filteredData = importedData.filter((row) => {
    const userId = (row.user_id ?? "").toLowerCase();
    const firstName = (row.first_name ?? "").toLowerCase();
    const lastName = (row.last_name ?? "").toLowerCase();
    const middleName = (row.middle_name ?? "").toLowerCase();
 
    return (
      userId.includes(searchTerm.toLowerCase()) ||
      firstName.includes(searchTerm.toLowerCase()) ||
      lastName.includes(searchTerm.toLowerCase()) ||
      middleName.includes(searchTerm.toLowerCase())
    );
  });
 
  return (
    <div className="container-fluid px-4 py-3">
      <div className="row">
        <div className="col-12">
          <div className="d-flex align-items-center mb-2 enroll-header">
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
 
        <div className="col-12 col-md-10 col-lg-9">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <button
                className="btn"
                onClick={handleDownload}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  border: "1.5px solid #3B0304",
                  color: "#3B0304",
                  padding: "4px 10px",
                  backgroundColor: "white",
                  fontWeight: "500",
                  fontSize: "0.85rem",
                  borderRadius: "6px",
                }}
              >
                <FaDownload size={14} /> Download
              </button>
 
              <label
                className="btn mb-0"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  border: "1.5px solid #3B0304",
                  color: "#3B0304",
                  padding: "4px 10px",
                  backgroundColor: "white",
                  fontWeight: "500",
                  fontSize: "0.85rem",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                <FaUpload size={14} /> Import
                <input
                  type="file"
                  hidden
                  accept=".xlsx,.xls"
                  onChange={handleImport}
                />
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
                      padding: "4px 12px",
                      borderRadius: "6px",
                      border: "1.5px solid #3B0304",
                      backgroundColor: "transparent",
                      color: "#3B0304",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#3B0304";
                      e.currentTarget.style.color = "white";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "#3B0304";
                    }}
                  >
                    Save
                  </button>
 
                  <button
                    className="btn"
                    onClick={handleCancel}
                    style={{
                      fontSize: "0.85rem",
                      padding: "4px 12px",
                      borderRadius: "6px",
                      border: "1.5px solid #3B0304",
                      backgroundColor: "transparent",
                      color: "#3B0304",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#3B0304";
                      e.currentTarget.style.color = "white";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "#3B0304";
                    }}
                  >
                    Cancel
                  </button>
                </>
              )}
 
              <button
                className="btn"
                style={{
                  border: "1.5px solid #3B0304",
                  color: "#3B0304",
                  padding: "4px 12px",
                  backgroundColor: "white",
                  fontWeight: "500",
                  fontSize: "0.85rem",
                  borderRadius: "6px",
                  whiteSpace: "nowrap",
                }}
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
              <strong>NOTE:</strong> Please download the template to input the
              required adviser information. Once completed, import the file to
              proceed with enrolling the advisers into the system.
            </div>
          ) : (
            <div className="enroll-table">
              <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                <input
                  type="text"
                  placeholder="Search adviser..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-control"
                  style={{
                    fontSize: "0.9rem",
                    maxWidth: "160px",
                  }}
                />
 
                <button
                  className="btn"
                  style={{
                    border: "1.5px solid #3B0304",
                    color: "#3B0304",
                    padding: "4px 12px",
                    backgroundColor: "transparent",
                    fontWeight: "500",
                    fontSize: "0.85rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Delete Selected
                </button>
              </div>
 
              <table
                className="table table-sm align-middle mb-0"
                style={{
                  borderCollapse: "collapse",
                  width: "100%",
                }}
              >
                <thead style={{ backgroundColor: "#f8f8f8" }}>
                  <tr>
                    <th>NO</th>
                    <th>Adviser ID</th>
                    <th>Password</th>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Middle Name</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row, index) => (
                    <tr
                      key={row.id}
                      style={{
                        backgroundColor: index % 2 === 0 ? "#F0F0F0" : "white",
                      }}
                    >
                      <td>{index + 1}</td>
                      <td>{row.user_id}</td>
                      <td>{row.password}</td>
                      <td>{row.first_name}</td>
                      <td>{row.last_name}</td>
                      <td>{row.middle_name}</td>
                      <td style={{ position: "relative" }}>
                        <button
                          className="btn btn-sm enroll-action-btn"
                          onClick={() =>
                            setOpenDropdown(openDropdown === index ? null : index)
                          }
                          style={{
                            fontSize: "0.9rem",
                            padding: "2px 6px",
                            borderRadius: "4px",
                          }}
                        >
                          <FaEllipsisV />
                        </button>
                        {openDropdown === index && (
                          <ul className="enroll-dropdown">
                            <li>
                              <button
                                className="dropdown-item"
                                onClick={() => handleEditRow(row, index)}
                              >
                                ✏️ Edit
                              </button>
                            </li>
                            <li>
                              <button
                                className="dropdown-item text-danger"
                                onClick={() => handleDeleteRow(index)}
                              >
                                🗑 Delete
                              </button>
                            </li>
                          </ul>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
 
export default Adviser;