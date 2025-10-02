import React, { useState, useEffect } from "react";
import { FaDownload, FaUserGraduate, FaEllipsisV } from "react-icons/fa";
import { supabase } from "../../supabaseClient";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "../Style/Instructor/StudentCredentials.css";
import { exportStudentsAsPDF } from "../../services/Adviser/StudentExport";
 
const StudentCredentials = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [openDropdownRow, setOpenDropdownRow] = useState(null);
  const [openHeaderAction, setOpenHeaderAction] = useState(false);
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const MySwal = withReactContent(Swal);
 
  const filteredData = credentials.filter((row) =>
    Object.values(row)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );
 
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
            Student Details
          </h5>
          <button type="button" class="swal2-close" aria-label="Close this dialog" style="font-size: 1.5rem;">×</button>
        </div>
 
        <div style="padding: .9rem; margin-right: 3rem;">
 
          <!-- Row 1 -->
          <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
            <div style="display: flex; flex-direction: column; flex: 1;">
              <label for="user_id" style="font-weight: 500; margin-bottom: 0.25rem;">Student ID</label>
              <input id="user_id" class="swal2-input" value="${row.user_id}" placeholder="Student ID" style="border-radius: 8px; border: 1px solid #ccc; padding: 0.5rem 0.75rem; font-size: 1rem; width: 100%;" />
            </div>
            <div style="display: flex; flex-direction: column; flex: 1; position: relative;">
              <label for="password" style="font-weight: 500; margin-bottom: 0.25rem;">Password</label>
              <input id="password" class="swal2-input" value="${row.password}" placeholder="Password" style="border-radius: 8px; border: 1px solid #ccc; padding: 0.5rem 0.75rem; font-size: 1rem; width: 100%;" />
              <button id="reset-password-btn"
                style="
                  position: relative;
                  left: 90px;
                  background:none;
                  border:none;
                  color:#3B0304;
                  font-size:0.85rem;
                  cursor:pointer;
                  font-weight:500;
                ">
                Reset
              </button>
            </div>
          </div>
 
          <!-- Row 2 -->
          <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
            <div style="display: flex; flex-direction: column; flex: 1;">
              <label for="first_name" style="font-weight: 500; margin-bottom: 0.25rem;">First Name</label>
              <input id="first_name" class="swal2-input" value="${row.first_name}" placeholder="First Name" style="border-radius: 8px; border: 1px solid #ccc; padding: 0.5rem 0.75rem; font-size: 1rem; width: 100%;" />
            </div>
            <div style="display: flex; flex-direction: column; flex: 1;">
              <label for="last_name" style="font-weight: 500; margin-bottom: 0.25rem;">Last Name</label>
              <input id="last_name" class="swal2-input" value="${row.last_name}" placeholder="Last Name" style="border-radius: 8px; border: 1px solid #ccc; padding: 0.5rem 0.75rem; font-size: 1rem; width: 100%;" />
            </div>
            <div style="display: flex; flex-direction: column; flex: 1;">
              <label for="middle_name" style="font-weight: 500; margin-bottom: 0.25rem;">Middle Name</label>
              <input id="middle_name" class="swal2-input" value="${row.middle_name}" placeholder="Middle Name" style="border-radius: 8px; border: 1px solid #ccc; padding: 0.5rem 0.75rem; font-size: 1rem; width: 100%;" />
            </div>
          </div>
 
          <!-- Buttons -->
          <div style="display: flex; justify-content: flex-end; gap: 1rem;">
            <button id="cancel-btn" class="swal2-cancel" style="border: 1px solid #3B0304; background-color: #fff; color: #000; font-weight: 500; padding: 0.5rem 1.5rem; border-radius: 8px; cursor: pointer;">
              Cancel
            </button>
            <button id="save-btn" class="swal2-confirm" style="background-color: #3B0304; color: #fff; font-weight: 500; padding: 0.5rem 1.5rem; border-radius: 8px; cursor: pointer;">
              Save
            </button>
          </div>
        </div>
      `,
      showConfirmButton: false,
      showCancelButton: false,
      customClass: { popup: "custom-swal-popup" },
      didOpen: () => {
        const popup = Swal.getPopup();
        popup.querySelector(".swal2-close").onclick = () => Swal.close();
        popup.querySelector("#save-btn").onclick = () => {
          Swal.clickConfirm();
        };
        popup.querySelector("#cancel-btn").onclick = () => {
          Swal.close();
        };
        // NOTE: Reset button is purely visual for now (no function)
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
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
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
      <div className="row">
        <div className="col-12 col-md-10 col-lg-9">
          <div className="d-flex align-items-center mb-2 student-cred-header">
            <FaUserGraduate className="me-2" size={18} />
            <strong>Student Credentials</strong>
          </div>
 
          <div
            style={{
              height: "1.5px",
              backgroundColor: "#3B0304",
              width: "calc(100% + 340px)",
              marginLeft: "-16px",
              borderRadius: "50px",
              marginBottom: "1.5rem",
            }}
          />
 
          <button
            className="btn mb-3"
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
            onClick={() => exportStudentsAsPDF(credentials)}
          >
            <FaDownload size={14} /> Export
          </button>
 
          <div className="student-cred-table">
            <table className="table table-sm align-middle mb-0">
              <thead style={{ backgroundColor: "#f8f8f8" }}>
                <tr>
                  <th colSpan="5" style={{ padding: "10px 12px", textAlign: "left" }}>
                    <input
                      type="text"
                      placeholder="Search student..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="form-control"
                      style={{ fontSize: "0.9rem", maxWidth: "200px" }}
                    />
                  </th>
                  <th colSpan="2" style={{ textAlign: "right", padding: "10px 12px" }}>
                    <div style={{ position: "relative", display: "inline-block" }}>
                      <button
                        className="btn btn-sm"
                        onClick={() => setOpenHeaderAction(!openHeaderAction)}
                        style={{
                          backgroundColor: "transparent",
                          color: "#3B0304",
                          padding: "4px 8px",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        <FaEllipsisV />
                      </button>
                      {openHeaderAction && (
                        <ul
                          className="dropdown-menu show"
                          style={{
                            position: "absolute",
                            top: "100%",
                            right: 0,
                            zIndex: 10,
                            backgroundColor: "white",
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                            padding: "0",
                            margin: "4px 0 0 0",
                            minWidth: "160px",
                          }}
                        >
                          <li>
                            <button
                              className="dropdown-item"
                              onClick={() => setOpenHeaderAction(false)}
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
                              Reset All Password
                            </button>
                          </li>
                          <li>
                            <button
                              className="dropdown-item text-danger"
                              onClick={() => setOpenHeaderAction(false)}
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
                              Delete Selected
                            </button>
                          </li>
                        </ul>
                      )}
                    </div>
                  </th>
                </tr>
                <tr>
                  <th>NO</th>
                  <th>Last Name</th>
                  <th>First Name</th>
                  <th>Middle Name</th>
                  <th>Student ID</th>
                  <th>Password</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center text-muted">
                      Loading...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center text-muted">
                      No records available
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row, idx) => (
                    <tr
                      key={row.id}
                      style={{
                        backgroundColor: idx % 2 === 0 ? "#F0F0F0" : "white",
                      }}
                    >
                      <td>{idx + 1}</td>
                      <td>{row.last_name}</td>
                      <td>{row.first_name}</td>
                      <td>{row.middle_name}</td>
                      <td>{row.user_id}</td>
                      <td>{row.password}</td>
                      <td style={{ position: "relative" }}>
                        <button
                          className="btn btn-sm"
                          onClick={() =>
                            setOpenDropdownRow(openDropdownRow === idx ? null : idx)
                          }
                          style={{
                            background: "transparent",
                            color: "#3B0304",
                            padding: "2px 6px",
                            border: "none",
                            fontSize: "0.9rem",
                          }}
                        >
                          <FaEllipsisV />
                        </button>
                        {openDropdownRow === idx && (
                          <ul
                            className="dropdown-menu show"
                            style={{
                              position: "absolute",
                              top: "100%",
                              right: 0,
                              zIndex: 10,
                              backgroundColor: "white",
                              border: "1px solid #ccc",
                              borderRadius: "4px",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                              padding: "0",
                              margin: "4px 0 0 0",
                              minWidth: "120px",
                            }}
                          >
                            <li>
                              <button
                                className="dropdown-item"
                                onClick={() => {
                                  setOpenDropdownRow(null);
                                  handleEditRow(row, idx);
                                }}
                                style={{
                                  background: "none",
                                  border: "none",
                                  width: "100%",
                                  padding: "8px 12px",
                                  textAlign: "left",
                                  fontSize: "0.85rem",
                                  cursor: "pointer",
                                }}
                              >
                                ✏️ Edit
                              </button>
                            </li>
                            <li>
                              <button
                                className="dropdown-item text-danger"
                                onClick={() => {
                                  setOpenDropdownRow(null);
                                  handleDelete(row.id);
                                }}
                                style={{
                                  background: "none",
                                  border: "none",
                                  width: "100%",
                                  padding: "8px 12px",
                                  textAlign: "left",
                                  fontSize: "0.85rem",
                                  cursor: "pointer",
                                }}
                              >
                                🗑 Delete
                              </button>
                            </li>
                          </ul>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
 
export default StudentCredentials;