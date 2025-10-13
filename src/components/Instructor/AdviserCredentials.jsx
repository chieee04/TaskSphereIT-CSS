import React, { useState, useEffect, useRef } from "react";
import {
  FaDownload,
  FaUserGraduate,
  FaEllipsisV,
  FaEdit,
  FaTrash,
  FaSearch,
  FaKey,
  FaTrashAlt,
  FaSort,
  FaSortUp,
  FaSortDown,
} from "react-icons/fa";
import { supabase } from "../../supabaseClient";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "../Style/Instructor/StudentCredentials.css";
import { exportAdvisersAsPDF } from "../../services/Adviser/AdviserExport";

const MASK = "********";

const AdviserCredentials = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [openDropdown, setOpenDropdown] = useState(null);
  const [openHeaderAction, setOpenHeaderAction] = useState(false);
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState("last_name");
  const [sortDirection, setSortDirection] = useState("asc");

  // Year selection
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const secondYear = selectedYear ? parseInt(selectedYear) + 1 : "";

  // Role toggle: "advisers" | "guest"
  const [roleType, setRoleType] = useState("advisers"); // default advisers

  const MySwal = withReactContent(Swal);

  // Refs
  const headerKebabRef = useRef(null);
  const tableKebabRefs = useRef([]);

  // -------- Helpers --------
  const roleToCode = (rt) => (rt === "guest" ? 5 : 3);

  const generateRandomPassword = () => {
    const len = 8;
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let pwd = "";
    for (let i = 0; i < len; i++)
      pwd += chars[Math.floor(Math.random() * chars.length)];
    return pwd;
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // -------- Data fetchers (depend on roleType) --------
  const fetchAvailableYears = async (rt) => {
    try {
      const { data, error } = await supabase
        .from("user_credentials")
        .select("year")
        .in("user_roles", [roleToCode(rt)]);

      if (error) {
        console.error("Error fetching years:", error);
        return [];
      }

      const uniqueYears = [
        ...new Set(
          (data || [])
            .map((it) => (it.year ? it.year.split("-")[0] : null))
            .filter((y) => y !== null)
        ),
      ].sort((a, b) => b - a);

      return uniqueYears;
    } catch (err) {
      console.error("Error in fetchAvailableYears:", err);
      return [];
    }
  };

  const fetchCredentials = async (year, rt) => {
    setLoading(true);
    try {
      if (!year) {
        setCredentials([]);
        setLoading(false);
        return;
      }
      const academicYear = `${year}-${parseInt(year) + 1}`;
      const { data, error } = await supabase
        .from("user_credentials")
        .select(
          "id, last_name, first_name, middle_name, user_id, password, user_roles, year, hasChanged"
        )
        .eq("year", academicYear)
        .in("user_roles", [roleToCode(rt)])
        .order("last_name", { ascending: true });

      if (error) {
        console.error("Error fetching credentials:", error);
        MySwal.fire("Error", "Failed to load credentials", "error");
        setCredentials([]);
      } else {
        setCredentials(data || []);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      MySwal.fire("Error", "An unexpected error occurred", "error");
      setCredentials([]);
    } finally {
      setLoading(false);
    }
  };

  // -------- Effects --------
  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        headerKebabRef.current &&
        !headerKebabRef.current.contains(event.target)
      ) {
        setOpenHeaderAction(false);
      }
      if (openDropdown !== null) {
        const currentRef = tableKebabRefs.current[openDropdown];
        if (currentRef && !currentRef.contains(event.target)) {
          setOpenDropdown(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  // Initialize years for default role
  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const years = await fetchAvailableYears(roleType);
      setAvailableYears(years);
      if (years.length > 0) {
        setSelectedYear(years[0]);
      } else {
        setSelectedYear("");
        setCredentials([]);
        setLoading(false);
      }
    };
    run();
  }, [roleType]); // when role changes, reload years

  // Fetch credentials when selected year changes
  useEffect(() => {
    if (selectedYear) fetchCredentials(selectedYear, roleType);
  }, [selectedYear, roleType]);

  // -------- Selection --------
  const handleToggleSelect = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = sortedData.map((row) => row.id);
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
        title:
          roleType === "guest" ? "No Guests Selected" : "No Advisers Selected",
        text: "Please select at least one to delete.",
        icon: "info",
        confirmButtonColor: "#3B0304",
      });
      return;
    }

    const entity = roleType === "guest" ? "guest panelist" : "adviser";
    const result = await MySwal.fire({
      title: `Delete ${selectedRows.length} ${entity}${
        selectedRows.length > 1 ? "s" : ""
      }?`,
      text: "This will permanently delete the selected record(s).",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3B0304",
      cancelButtonColor: "#999",
      confirmButtonText: `Yes, delete ${selectedRows.length} ${entity}${
        selectedRows.length > 1 ? "s" : ""
      }!`,
    });

    if (result.isConfirmed) {
      try {
        const { error } = await supabase
          .from("user_credentials")
          .delete()
          .in("id", selectedRows);

        if (error) throw error;

        const updatedCredentials = credentials.filter(
          (row) => !selectedRows.includes(row.id)
        );
        setCredentials(updatedCredentials);
        handleCancelSelection();

        MySwal.fire(
          "Deleted!",
          `${selectedRows.length} ${entity}${
            selectedRows.length > 1 ? "s" : ""
          } have been deleted.`,
          "success"
        );
      } catch (error) {
        console.error("Delete error:", error);
        MySwal.fire("Error", "Failed to delete.", "error");
      }
    }
  };

  const isAllSelected =
    credentials.length > 0 &&
    credentials
      .filter((row) =>
        Object.values(row)
          .join(" ")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      )
      .every((row) => selectedRows.includes(row.id));

  // -------- Edit Row (adviser vs guest) --------
  const handleEditRow = (row, index) => {
    setOpenDropdown(null);

    const isGuest = roleType === "guest";

    // Build modal HTML based on role
    const modalHtml = isGuest
      ? `
      <div style="text-align: left; padding-bottom: 12px; border-bottom: 2px solid #3B0304; display: flex; align-items: center;">
        <h5 style="margin:0; display:flex; align-items:center; gap:10px; font-weight:600; color:#3B0304; font-size:1.1rem;">
          Guest Panelist Details
        </h5>
      </div>
      <div style="padding:1.2rem 1.2rem;">
        <div style="display:flex; flex-direction:column; margin-bottom:1rem;">
          <label for="last_name" style="font-weight:500; margin-bottom:0.3rem; font-size:0.85rem; color:#333; text-align:left;">Last Name</label>
          <input id="last_name" class="swal2-input" value="${
            row.last_name ?? ""
          }" style="border-radius:6px; border:1.5px solid #888; padding:0.5rem 0.75rem; font-size:0.9rem; height:38px; background-color:#fff; margin-left:0;" />
        </div>
        <div style="display:flex; flex-direction:column; margin-bottom:1rem;">
          <label for="first_name" style="font-weight:500; margin-bottom:0.3rem; font-size:0.85rem; color:#333; text-align:left;">First Name</label>
          <input id="first_name" class="swal2-input" value="${
            row.first_name ?? ""
          }" style="border-radius:6px; border:1.5px solid #888; padding:0.5rem 0.75rem; font-size:0.9rem; height:38px; background-color:#fff; margin-left:0;" />
        </div>
        <div style="display:flex; flex-direction:column; margin-bottom:1.5rem;">
          <label for="middle_name" style="font-weight:500; margin-bottom:0.3rem; font-size:0.85rem; color:#333; text-align:left;">Middle Initial</label>
          <input id="middle_name" class="swal2-input" value="${
            row.middle_name ?? ""
          }" style="border-radius:6px; border:1.5px solid #888; padding:0.5rem 0.75rem; font-size:0.9rem; height:38px; background-color:#fff; margin-left:0;" />
        </div>
        <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:0.5rem;">
          <button id="cancel-btn" class="swal2-cancel" type="button" style="border:1.5px solid #3B0304; background-color:#fff; color:#3B0304; font-weight:500; padding:0.5rem 1.8rem; border-radius:6px;">Cancel</button>
          <button id="save-btn" class="swal2-confirm" type="button" style="background-color:#3B0304; color:#fff; font-weight:500; padding:0.5rem 1.8rem; border-radius:6px; border:1.5px solid #3B0304;">Save</button>
        </div>
      </div>
      `
      : `
      <div style="text-align: left; padding-bottom: 12px; border-bottom: 2px solid #3B0304; display: flex; align-items: center;">
        <h5 style="margin:0; display:flex; align-items:center; gap:10px; font-weight:600; color:#3B0304; font-size:1.1rem;">
          Adviser Details
        </h5>
      </div>
      <div style="padding: 1.2rem 1.2rem;">
        <div style="display:flex; flex-direction:column; margin-bottom:1rem;">
          <label for="user_id" style="font-weight:500; margin-bottom:0.3rem; font-size:0.85rem; color:#333; text-align:left;">Adviser ID</label>
          <input id="user_id" class="swal2-input" value="${
            row.user_id ?? ""
          }" style="border-radius:6px; border:1.5px solid #888; padding:0.5rem 0.75rem; font-size:0.9rem; height:38px; background-color:#fff; margin-left:0;" />
        </div>
        <div style="display:flex; flex-direction:column; margin-bottom:1rem; position:relative;">
          <label for="password" style="font-weight:500; margin-bottom:0.3rem; font-size:0.85rem; color:#333; text-align:left;">Password</label>
          <input id="password" class="swal2-input" value="${
            Number(row?.hasChanged) === 1 ? MASK : row.password ?? ""
          }" style="border-radius:6px; border:1.5px solid #888; padding:0.5rem 0.75rem; font-size:0.9rem; height:38px; background-color:#fff; margin-left:0;" />
          <button id="reset-password-btn" type="button" style="position:absolute; right:0; top:100%; margin-top:4px; background:none; border:none; color:#3B0304; font-size:0.8rem; cursor:pointer; font-weight:500; padding:2px 8px;">Reset</button>
        </div>
        <div style="display:flex; flex-direction:column; margin-bottom:1rem;">
          <label for="last_name" style="font-weight:500; margin-bottom:0.3rem; font-size:0.85rem; color:#333; text-align:left;">Last Name</label>
          <input id="last_name" class="swal2-input" value="${
            row.last_name ?? ""
          }" style="border-radius:6px; border:1.5px solid #888; padding:0.5rem 0.75rem; font-size:0.9rem; height:38px; background-color:#fff; margin-left:0;" />
        </div>
        <div style="display:flex; flex-direction:column; margin-bottom:1rem;">
          <label for="first_name" style="font-weight:500; margin-bottom:0.3rem; font-size:0.85rem; color:#333; text-align:left;">First Name</label>
          <input id="first_name" class="swal2-input" value="${
            row.first_name ?? ""
          }" style="border-radius:6px; border:1.5px solid #888; padding:0.5rem 0.75rem; font-size:0.9rem; height:38px; background-color:#fff; margin-left:0;" />
        </div>
        <div style="display:flex; flex-direction:column; margin-bottom:1.5rem;">
          <label for="middle_name" style="font-weight:500; margin-bottom:0.3rem; font-size:0.85rem; color:#333; text-align:left;">Middle Initial</label>
          <input id="middle_name" class="swal2-input" value="${
            row.middle_name ?? ""
          }" style="border-radius:6px; border:1.5px solid #888; padding:0.5rem 0.75rem; font-size:0.9rem; height:38px; background-color:#fff; margin-left:0;" />
        </div>
        <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:0.5rem;">
          <button id="cancel-btn" class="swal2-cancel" type="button" style="border:1.5px solid #3B0304; background-color:#fff; color:#3B0304; font-weight:500; padding:0.5rem 1.8rem; border-radius:6px;">Cancel</button>
          <button id="save-btn" class="swal2-confirm" type="button" style="background-color:#3B0304; color:#fff; font-weight:500; padding:0.5rem 1.8rem; border-radius:6px; border:1.5px solid #3B0304;">Save</button>
        </div>
      </div>
      `;

    MySwal.fire({
      title: "",
      html: modalHtml,
      showConfirmButton: false,
      showCancelButton: false,
      width: "460px",
      customClass: { popup: "custom-swal-popup" },
      didOpen: () => {
        const popup = Swal.getPopup();
        popup.querySelector("#cancel-btn").onclick = () => Swal.close();
        popup.querySelector("#save-btn").onclick = () => Swal.clickConfirm();

        if (!isGuest) {
          const resetBtn = popup.querySelector("#reset-password-btn");
          if (resetBtn) {
            resetBtn.onclick = () => {
              const passwordInput = document.getElementById("password");
              const newPassword = generateRandomPassword();
              passwordInput.value = newPassword;
              MySwal.showValidationMessage(
                `Password has been reset to: ${newPassword}`
              );
            };
          }
        }

        // Nice focus styles
        popup.querySelectorAll("input").forEach((inp) => {
          inp.addEventListener("focus", (e) => {
            e.target.style.borderColor = "#3B0304";
            e.target.style.boxShadow = "0 0 0 2px rgba(59,3,4,0.1)";
          });
          inp.addEventListener("blur", (e) => {
            e.target.style.borderColor = "#888";
            e.target.style.boxShadow = "none";
          });
        });
      },
      preConfirm: () => {
        const first_name =
          document.getElementById("first_name")?.value?.trim() ?? "";
        const last_name =
          document.getElementById("last_name")?.value?.trim() ?? "";
        const middle_name =
          document.getElementById("middle_name")?.value?.trim() ?? "";

        if (!first_name || !last_name) {
          MySwal.showValidationMessage(
            "Please fill out First Name and Last Name."
          );
          return false;
        }
        if (/\d/.test(first_name) || /\d/.test(last_name)) {
          MySwal.showValidationMessage(
            "Numbers in First Name or Last Name are not allowed."
          );
          return false;
        }

        if (isGuest) {
          // Only names
          return { first_name, last_name, middle_name };
        } else {
          const user_id =
            document.getElementById("user_id")?.value?.trim() ?? "";
          const password =
            document.getElementById("password")?.value?.trim() ?? "";

          if (!user_id) {
            MySwal.showValidationMessage("Adviser ID is required.");
            return false;
          }
          if (!password) {
            MySwal.showValidationMessage("Password cannot be empty.");
            return false;
          }

          return { user_id, password, first_name, last_name, middle_name };
        }
      },
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      const payload = result.value;
      const updatePayload = {};

      // Common name fields
      if (payload.first_name !== row.first_name)
        updatePayload.first_name = payload.first_name;
      if (payload.last_name !== row.last_name)
        updatePayload.last_name = payload.last_name;
      if (payload.middle_name !== row.middle_name)
        updatePayload.middle_name = payload.middle_name;

      if (roleType !== "guest") {
        // Adviser-only fields
        if (payload.user_id !== row.user_id)
          updatePayload.user_id = payload.user_id;

        // Password update logic (mask vs real)
        if (payload.password !== MASK && payload.password !== row.password) {
          updatePayload.password = payload.password;
          updatePayload.hasChanged = 0; // admin reset -> reveal again
        }
      }

      if (Object.keys(updatePayload).length === 0) {
        MySwal.fire("No changes", "Nothing to update.", "info");
        return;
      }

      const { error } = await supabase
        .from("user_credentials")
        .update(updatePayload)
        .eq("id", row.id);

      if (error) {
        console.error("Update error:", error);
        MySwal.fire("Error", "Failed to update.", "error");
      } else {
        const updatedRow = { ...row, ...updatePayload };
        const updatedCredentials = [...credentials];
        updatedCredentials[index] = updatedRow;
        setCredentials(updatedCredentials);
        MySwal.fire("Updated!", "Record updated successfully.", "success");
      }
    });
  };

  const handleDelete = async (id) => {
    const entity = roleType === "guest" ? "guest panelist" : "adviser";
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `This ${entity} will be permanently deleted.`,
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
        Swal.fire("Error", "Failed to delete.", "error");
      } else {
        setCredentials(credentials.filter((row) => row.id !== id));
        Swal.fire("Deleted!", "Record has been deleted.", "success");
      }
    }
  };

  const handleResetAllPasswords = () => {
    setOpenHeaderAction(false);
    MySwal.fire({
      title: "Reset All Passwords?",
      text: "This will reset passwords for all advisers to random values.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3B0304",
      cancelButtonColor: "#999",
      confirmButtonText: "Yes, reset all!",
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        const updates = credentials.map((row) => ({
  id: row.id,
  password: generateRandomPassword(),
  hasChanged: 0,
  user_roles: row.user_roles, // 👈 include this line
  year: row.year, // 👈 optional but safe if 'year' is required
}))

        const { error } = await supabase
          .from("user_credentials")
          .upsert(updates);
        if (error) throw error;

        const updatedCredentials = credentials.map((row) => {
          const u = updates.find((x) => x.id === row.id);
          return u ? { ...row, password: u.password, hasChanged: 0 } : row;
        });
        setCredentials(updatedCredentials);

        MySwal.fire(
          "Reset!",
          "All passwords have been reset to random values.",
          "success"
        );
      } catch (error) {
        console.error("Reset all passwords error:", error);
        MySwal.fire("Error", "Failed to reset passwords.", "error");
      }
    });
  };

  // -------- Derived, filter + sort for UI --------
  const filtered = credentials.filter((row) =>
    Object.values(row)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const sortedData = [...filtered].sort((a, b) => {
    let av = a[sortField] || "";
    let bv = b[sortField] || "";
    if (!av && !bv) return 0;
    if (!av) return 1;
    if (!bv) return -1;
    av = String(av).toLowerCase();
    bv = String(bv).toLowerCase();
    return sortDirection === "asc"
      ? av.localeCompare(bv, undefined, { numeric: true })
      : bv.localeCompare(av, undefined, { numeric: true });
  });

  // -------- Render --------
  return (
    <div className="container-fluid px-4 py-3">
      <style>{`
        .table-scroll-area::-webkit-scrollbar { display: none; }
        .enroll-dropdown {
          position: absolute; right: 30px; top: 0; z-index: 20;
          min-width: 100px; padding: 4px 0; margin: 0; list-style: none;
          font-size: 0.9rem; text-align: left; background-color: #fff;
          border: 1px solid #ccc; border-radius: 4px;
          box-shadow: 0 6px 12px rgba(0,0,0,0.175);
        }
        .enroll-dropdown .dropdown-item {
          display: block; width: 100%; padding: 8px 12px; font-weight: 400;
          color: #212529; background-color: transparent; border: 0; cursor: pointer;
        }
        .enroll-dropdown .dropdown-item:hover { background-color: #f8f9fa; }
      `}</style>

      <div className="row">
        <div className="col-12">
          <div
            className="d-flex align-items-center mb-2 student-cred-header"
            style={{ color: "#3B0304" }}
          >
            <FaUserGraduate className="me-2" size={18} />
            <strong>Adviser Credentials</strong>
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
            {/* Export + Year + Role Toggle */}
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
              <div className="d-flex flex-wrap align-items-center gap-3">
                {/* Export (advisers only) */}
                <button
                  className="btn d-flex align-items-center gap-1"
                  onClick={() =>
                    roleType === "advisers"
                      ? exportAdvisersAsPDF(credentials)
                      : MySwal.fire(
                          "Oops",
                          "Export is for advisers only.",
                          "info"
                        )
                  }
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
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f0f0f0")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "white")
                  }
                >
                  <FaDownload size={14} /> Export
                </button>

                {/* School Year */}
                <div className="d-flex align-items-center gap-2">
                  <select
                    className="form-select"
                    style={{
                      width: "150px",
                      height: "38px",
                      borderRadius: "6px",
                      fontSize: "0.85rem",
                      border: "1px solid #ccc",
                    }}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    value={selectedYear}
                    disabled={availableYears.length === 0}
                  >
                    {availableYears.length === 0 ? (
                      <option value="">No years available</option>
                    ) : (
                      availableYears.map((year) => (
                        <option key={year} value={year}>
                          {year}-{parseInt(year) + 1}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Role Radio Buttons */}
                <div className="d-flex align-items-center gap-3">
                  <label
                    className="d-flex align-items-center gap-2"
                    style={{ cursor: "pointer" }}
                  >
                    <input
                      type="radio"
                      name="roleToggle"
                      value="advisers"
                      checked={roleType === "advisers"}
                      onChange={() => setRoleType("advisers")}
                    />
                    <span>Advisers</span>
                  </label>
                  <label
                    className="d-flex align-items-center gap-2"
                    style={{ cursor: "pointer" }}
                  >
                    <input
                      type="radio"
                      name="roleToggle"
                      value="guest"
                      checked={roleType === "guest"}
                      onChange={() => setRoleType("guest")}
                    />
                    <span>Guest Panelist</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Search + header kebab */}
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
              <div className="position-relative">
                <input
                  type="text"
                  placeholder={`Search ${
                    roleType === "guest" ? "guest panelist" : "adviser"
                  }...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-control ps-5"
                  style={{
                    fontSize: "0.9rem",
                    maxWidth: "220px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    height: "38px",
                  }}
                />
                <FaSearch
                  className="position-absolute text-muted"
                  style={{
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "0.85rem",
                  }}
                />
              </div>

              {!isSelectionMode ? (
                <div
                  ref={headerKebabRef}
                  style={{
                    position: "relative",
                    display: "flex",
                    justifyContent: "center",
                    width: "100px",
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
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#f0f0f0")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <FaEllipsisV size={12} />
                  </button>

                  {openHeaderAction && (
                    <ul
                      className="enroll-dropdown"
                      style={{ right: "0", top: "100%", marginTop: "4px" }}
                    >
                      {roleType === "advisers" && (
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
                            <FaKey size={12} style={{ color: "#3B0304" }} />{" "}
                            Reset All Password
                          </button>
                        </li>
                      )}
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
                            color: "#212529",
                          }}
                        >
                          <FaTrashAlt size={12} style={{ color: "#212529" }} />{" "}
                          Delete Multiple
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
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#f0f0f0")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
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
                      cursor:
                        selectedRows.length === 0 ? "not-allowed" : "pointer",
                      color: selectedRows.length === 0 ? "#A0A0A0" : "#3B0304",
                      border: `1.5px solid ${
                        selectedRows.length === 0 ? "#B2B2B2" : "#3B0304"
                      }`,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      selectedRows.length > 0
                        ? (e.currentTarget.style.backgroundColor = "#f0f0f0")
                        : null
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <FaTrash size={12} /> Delete Selected ({selectedRows.length}
                    )
                  </button>
                </div>
              )}
            </div>

            {/* Empty states */}
            {availableYears.length === 0 && !loading ? (
              <div
                className="text-center p-4 border"
                style={{
                  fontSize: "0.9rem",
                  color: "#3B0304",
                  border: "1px solid #B2B2B2",
                  borderRadius: "16px",
                }}
              >
                <strong>NOTE:</strong> No{" "}
                {roleType === "guest" ? "guest panelists" : "adviser"}{" "}
                credentials found in the system.
              </div>
            ) : credentials.length === 0 && !loading ? (
              <div
                className="text-center p-4 border"
                style={{
                  fontSize: "0.9rem",
                  color: "#3B0304",
                  border: "1px solid #B2B2B2",
                  borderRadius: "16px",
                }}
              >
                <strong>NOTE:</strong> No{" "}
                {roleType === "guest" ? "guest panelists" : "adviser"}{" "}
                credentials found for {selectedYear}-{secondYear}.
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md relative">
                <div
                  className="table-scroll-area overflow-x-auto overflow-y-auto"
                  style={{
                    maxHeight: "400px",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                  }}
                >
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        {isSelectionMode && (
                          <th
                            scope="col"
                            className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                            style={{ width: "40px" }}
                          >
                            <input
                              type="checkbox"
                              className="form-checkbox h-4 w-4 text-[#3B0304] border-gray-300 rounded"
                              checked={isAllSelected}
                              onChange={handleSelectAll}
                            />
                          </th>
                        )}
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          NO
                        </th>

                        {/* Sortable name columns */}
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort("last_name")}
                        >
                          <div className="flex items-center gap-1">
                            Last Name
                            {sortField === "last_name" ? (
                              sortDirection === "asc" ? (
                                <FaSortUp size={12} />
                              ) : (
                                <FaSortDown size={12} />
                              )
                            ) : (
                              <FaSort size={12} className="text-gray-400" />
                            )}
                          </div>
                        </th>

                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort("first_name")}
                        >
                          <div className="flex items-center gap-1">
                            First Name
                            {sortField === "first_name" ? (
                              sortDirection === "asc" ? (
                                <FaSortUp size={12} />
                              ) : (
                                <FaSortDown size={12} />
                              )
                            ) : (
                              <FaSort size={12} className="text-gray-400" />
                            )}
                          </div>
                        </th>

                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort("middle_name")}
                        >
                          <div className="flex items-center gap-1">
                            Middle Initial
                            {sortField === "middle_name" ? (
                              sortDirection === "asc" ? (
                                <FaSortUp size={12} />
                              ) : (
                                <FaSortDown size={12} />
                              )
                            ) : (
                              <FaSort size={12} className="text-gray-400" />
                            )}
                          </div>
                        </th>

                        {/* Adviser-only columns */}
                        {roleType === "advisers" && (
                          <>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSort("user_id")}
                            >
                              <div className="flex items-center gap-1">
                                Adviser ID
                                {sortField === "user_id" ? (
                                  sortDirection === "asc" ? (
                                    <FaSortUp size={12} />
                                  ) : (
                                    <FaSortDown size={12} />
                                  )
                                ) : (
                                  <FaSort size={12} className="text-gray-400" />
                                )}
                              </div>
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Password
                            </th>
                          </>
                        )}

                        <th
                          scope="col"
                          className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                          style={{ width: "100px" }}
                        >
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loading ? (
                        <tr>
                          <td
                            colSpan={
                              isSelectionMode
                                ? roleType === "advisers"
                                  ? "9"
                                  : "7"
                                : roleType === "advisers"
                                ? "8"
                                : "6"
                            }
                            className="text-center py-4 text-gray-500"
                          >
                            Loading...
                          </td>
                        </tr>
                      ) : sortedData.length === 0 ? (
                        <tr>
                          <td
                            colSpan={
                              isSelectionMode
                                ? roleType === "advisers"
                                  ? "9"
                                  : "7"
                                : roleType === "advisers"
                                ? "8"
                                : "6"
                            }
                            className="text-center py-4 text-gray-500"
                          >
                            No records match your search.
                          </td>
                        </tr>
                      ) : (
                        sortedData.map((row, index) => {
                          const isSelected = selectedRows.includes(row.id);
                          return (
                            <tr
                              key={row.id}
                              className={
                                isSelected
                                  ? "bg-gray-50"
                                  : "hover:bg-gray-50 transition duration-150"
                              }
                            >
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
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {index + 1}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {row.last_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {row.first_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {row.middle_name}
                              </td>

                              {roleType === "advisers" && (
                                <>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {row.user_id}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {Number(row?.hasChanged) === 1
                                      ? MASK
                                      : row.password}
                                  </td>
                                </>
                              )}

                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center position-relative">
                                {!isSelectionMode && (
                                  <div
                                    ref={(el) =>
                                      (tableKebabRefs.current[index] = el)
                                    }
                                  >
                                    <button
                                      className="text-gray-500 hover:text-[#3B0304] p-1 rounded transition duration-150"
                                      onClick={() =>
                                        setOpenDropdown(
                                          openDropdown === index ? null : index
                                        )
                                      }
                                      style={{
                                        border: "none",
                                        background: "none",
                                      }}
                                    >
                                      <FaEllipsisV size={14} />
                                    </button>

                                    {openDropdown === index && (
                                      <ul
                                        className="enroll-dropdown"
                                        style={{
                                          right: "5px",
                                          top: "50%",
                                          transform: "translateY(-50%)",
                                          marginTop: "0",
                                        }}
                                      >
                                        <li>
                                          <button
                                            className="dropdown-item d-flex align-items-center gap-2"
                                            onClick={() => {
                                              setOpenDropdown(null);
                                              handleEditRow(row, index);
                                            }}
                                          >
                                            <FaEdit
                                              size={12}
                                              style={{ color: "#3B0304" }}
                                            />{" "}
                                            Edit
                                          </button>
                                        </li>
                                        <li>
                                          <button
                                            className="dropdown-item d-flex align-items-center gap-2"
                                            onClick={() => {
                                              setOpenDropdown(null);
                                              handleDelete(row.id);
                                            }}
                                            style={{ color: "#212529" }}
                                          >
                                            <FaTrash
                                              size={12}
                                              style={{ color: "#212529" }}
                                            />{" "}
                                            Delete
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

export default AdviserCredentials;
