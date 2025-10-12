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
        const newRow = { id: uuidv4(), ...result.value }; // includes role
        setImportedData((prev) => [...prev, newRow]);
        MySwal.fire("Added!", "New record added successfully.", "success");
      }
    });
  };

  // --- Add Adviser (Updated to match Add Student modal design) ---
  // --- Add Adviser / Guest Panel (UI with role toggle) ---
  const handleAddAdviser = async () => {
    MySwal.fire({
      title: "",
      html: `
      <div style="text-align:left;padding-bottom:12px;border-bottom:2px solid #3B0304;display:flex;align-items:center;">
        <h5 style="margin:0;display:flex;align-items:center;gap:10px;font-weight:600;color:#3B0304;font-size:1.1rem;">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#3B0304" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
          </svg>
          Add Adviser
        </h5>
      </div>

      <!-- Role Radios -->
      <div style="padding:1.2rem 1.2rem 0.4rem 1.2rem;">
        <div style="display:flex;gap:16px;align-items:center;margin-bottom:0.75rem;">
          <label style="display:flex;align-items:center;gap:6px;">
            <input type="radio" name="roleType" value="adviser" checked />
            <span>Adviser</span>
          </label>
          <label style="display:flex;align-items:center;gap:6px;">
            <input type="radio" name="roleType" value="guest" />
            <span>Guest Panel</span>
          </label>
        </div>
      </div>

      <!-- Adviser-only fields -->
      <div id="adviser-only" style="padding:0 1.2rem;">
        <div style="display:flex;flex-direction:column;margin-bottom:0.9rem;">
          <label for="user_id" style="font-weight:500;margin-bottom:0.3rem;font-size:0.85rem;color:#333;">Adviser ID</label>
          <input id="user_id" class="swal2-input"
            style="border-radius:6px;border:1.5px solid #888;padding:0.5rem 0.75rem;font-size:0.9rem;height:38px;background-color:#fff;margin-left:0;" />
        </div>
        <div style="display:flex;flex-direction:column;margin-bottom:0.9rem;">
          <label for="password" style="font-weight:500;margin-bottom:0.3rem;font-size:0.85rem;color:#333;">Password</label>
          <input id="password" class="swal2-input" type="password"
            style="border-radius:6px;border:1.5px solid #888;padding:0.5rem 0.75rem;font-size:0.9rem;height:38px;background-color:#fff;margin-left:0;" />
        </div>
      </div>

      <!-- Common: Name fields (shown for both roles) -->
      <div id="name-fields" style="padding:0 1.2rem;">
        <div style="display:flex;flex-direction:column;margin-bottom:0.9rem;">
          <label for="last_name" style="font-weight:500;margin-bottom:0.3rem;font-size:0.85rem;color:#333;">Last Name</label>
          <input id="last_name" class="swal2-input"
            style="border-radius:6px;border:1.5px solid #888;padding:0.5rem 0.75rem;font-size:0.9rem;height:38px;background-color:#fff;margin-left:0;" />
        </div>
        <div style="display:flex;flex-direction:column;margin-bottom:0.9rem;">
          <label for="first_name" style="font-weight:500;margin-bottom:0.3rem;font-size:0.85rem;color:#333;">First Name</label>
          <input id="first_name" class="swal2-input"
            style="border-radius:6px;border:1.5px solid #888;padding:0.5rem 0.75rem;font-size:0.9rem;height:38px;background-color:#fff;margin-left:0;" />
        </div>
        <div style="display:flex;flex-direction:column;margin-bottom:1.2rem;">
          <label for="middle_name" style="font-weight:500;margin-bottom:0.3rem;font-size:0.85rem;color:#333;">Middle Initial</label>
          <input id="middle_name" class="swal2-input"
            style="border-radius:6px;border:1.5px solid #888;padding:0.5rem 0.75rem;font-size:0.9rem;height:38px;background-color:#fff;margin-left:0;" />
        </div>
      </div>

      <!-- Buttons -->
      <div style="display:flex;justify-content:flex-end;gap:1rem;margin:0.4rem 1.2rem 1.2rem 1.2rem;">
        <button id="cancel-btn" class="swal2-cancel"
          style="border:1.5px solid #3B0304;background-color:#fff;color:#3B0304;font-weight:500;padding:0.5rem 1.8rem;border-radius:6px;cursor:pointer;font-size:0.85rem;">
          Cancel
        </button>
        <button id="enroll-btn" class="swal2-confirm"
          style="background-color:#3B0304;color:#fff;font-weight:500;padding:0.5rem 1.8rem;border-radius:6px;cursor:pointer;font-size:0.85rem;border:1.5px solid #3B0304;">
          Enroll
        </button>
      </div>
    `,
      showConfirmButton: false,
      showCancelButton: false,
      width: "460px",
      customClass: { popup: "custom-swal-popup" },

      didOpen: () => {
        const popup = Swal.getPopup();

        const adviserOnly = popup.querySelector("#adviser-only");
        const radios = popup.querySelectorAll('input[name="roleType"]');
        const adviserIdInput = popup.querySelector("#user_id");
        const passwordInput = popup.querySelector("#password");

        // --- Adviser ID constraints (numeric only, max 9) ---
        adviserIdInput.setAttribute("maxlength", "9");
        const validationMsg = document.createElement("div");
        validationMsg.style.color = "red";
        validationMsg.style.fontSize = "0.8rem";
        validationMsg.style.marginTop = "0.4rem";
        validationMsg.style.textAlign = "left";
        validationMsg.style.display = "none";
        adviserIdInput.parentNode.appendChild(validationMsg);

        adviserIdInput.addEventListener("input", (e) => {
          const cleaned = e.target.value.replace(/[^0-9]/g, "");
          if (e.target.value !== cleaned) {
            e.target.value = cleaned;
            validationMsg.textContent =
              "Only numbers are allowed for Adviser ID.";
            validationMsg.style.display = "block";
          } else {
            validationMsg.style.display = "none";
          }
          if (cleaned.length > 9) {
            e.target.value = cleaned.slice(0, 9);
            validationMsg.textContent = "Adviser ID can only be 9 digits long.";
            validationMsg.style.display = "block";
          }
        });

        // --- Toggle UI when role changes ---
        const applyRole = () => {
          const role =
            popup.querySelector('input[name="roleType"]:checked')?.value ??
            "adviser";

          if (role === "adviser") {
            adviserOnly.style.display = "block";
          } else {
            adviserOnly.style.display = "none";
            // clear & hide any validation residuals
            validationMsg.style.display = "none";
          }
        };
        radios.forEach((r) => r.addEventListener("change", applyRole));
        applyRole(); // initial

        // Buttons
        popup.querySelector("#cancel-btn").onclick = () => Swal.close();
        popup.querySelector("#enroll-btn").onclick = () => Swal.clickConfirm();

        // Minor focus styling
        popup.querySelectorAll("input").forEach((inp) => {
          inp.addEventListener("focus", (e) => {
            e.target.style.borderColor = "#3B0304";
            e.target.style.boxShadow = "0 0 0 2px rgba(59, 3, 4, 0.1)";
          });
          inp.addEventListener("blur", (e) => {
            e.target.style.borderColor = "#888";
            e.target.style.boxShadow = "none";
          });
        });
      },

      /*preConfirm: () => {
        const role =
          document.querySelector('input[name="roleType"]:checked')?.value ??
          "adviser";

        const payload = {
          role,
          user_id: document.getElementById("user_id")?.value || "",
          password: document.getElementById("password")?.value || "",
          first_name: document.getElementById("first_name")?.value || "",
          last_name: document.getElementById("last_name")?.value || "",
          middle_name: document.getElementById("middle_name")?.value || "",
        };

        // Minimal validation per role (you can expand later)
        if (role === "adviser") {
          if (
            !payload.user_id ||
            !payload.password ||
            !payload.first_name ||
            !payload.last_name
          ) {
            MySwal.showValidationMessage(
              "Please fill Adviser ID, Password, First Name, and Last Name."
            );
            return false;
          }
          if (/\d/.test(payload.first_name) || /\d/.test(payload.last_name)) {
            MySwal.showValidationMessage("Names cannot contain numbers.");
            return false;
          }
        } else {
          // guest panel: only names required
          if (!payload.first_name || !payload.last_name) {
            MySwal.showValidationMessage(
              "Please fill First Name and Last Name."
            );
            return false;
          }
          if (/\d/.test(payload.first_name) || /\d/.test(payload.last_name)) {
            MySwal.showValidationMessage("Names cannot contain numbers.");
            return false;
          }
        }

        return payload; // delivered to .then
      },*/
      preConfirm: () => {
        const role = (
          document.querySelector("input[name='roleType']:checked")?.value ||
          "adviser"
        ).toLowerCase();

        const user_id = document.getElementById("user_id")?.value?.trim() || "";
        const password =
          document.getElementById("password")?.value?.trim() || "";
        const first_name =
          document.getElementById("first_name")?.value?.trim() || "";
        const last_name =
          document.getElementById("last_name")?.value?.trim() || "";
        const middle_name =
          document.getElementById("middle_name")?.value?.trim() || "";

        // Shared validations
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

        // Adviser-only requirements
        if (role === "adviser") {
          if (!user_id || !password) {
            MySwal.showValidationMessage(
              "Adviser ID and Password are required for Advisers."
            );
            return false;
          }
        }

        return {
          role, // <-- keep this
          user_id, // may be empty for guest
          password, // may be empty for guest
          first_name,
          last_name,
          middle_name,
        };
      },
    }).then((result) => {
      if (!result.isConfirmed) return;

      // You said “functionality later”, so we only push into the temporary list for now
      const incoming = result.value; // { role, user_id, password, first_name, last_name, middle_name }

      const newRow = {
        id: uuidv4(),
        user_id: incoming.user_id,
        password: incoming.password,
        first_name: incoming.first_name,
        last_name: incoming.last_name,
        middle_name: incoming.middle_name,
        role: incoming.role, // "adviser" | "guest"
      };

      setImportedData((prev) => [...prev, newRow]);
      MySwal.fire(
        "Added!",
        `${
          incoming.role === "guest" ? "Guest panelist" : "Adviser"
        } added successfully.`,
        "success"
      );
    });
  };

  // --- Core Functionality (Import/Download/Upload) ---
  const handleDownload = () => {
    const wsData = [
      [
        "PASTE HERE : FULL NAME (LastN, FirstN, MiddleI)",
        "", // Spacer
        "ID Number",
        "Password",
        "Last Name",
        "First Name",
        "Middle Initial",
      ],
      ["", "", "", "", "", "", ""],
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // ✅ Column width setup
    ws["!cols"] = [
      { wch: 45 }, // A - Full Name
      { wch: 5 }, // B - Spacer
      { wch: 15 }, // C - ID
      { wch: 15 }, // D - Password
      { wch: 18 }, // E - Last Name
      { wch: 18 }, // F - First Name
      { wch: 15 }, // G - Middle Initial
    ];

    // ✅ Apply parsing formulas (rows 2–500)
    for (let row = 2; row <= 500; row++) {
      // Last Name (E)
      ws[`E${row}`] = {
        t: "s",
        f: `=IF(A${row}="","",TRIM(LEFT(A${row},FIND(",",A${row})-1)))`,
      };

      // First Name (F)
      ws[`F${row}`] = {
        t: "s",
        f: `=IF(A${row}="","",
        TRIM(
          IF(
            ISERROR(FIND(",",A${row},FIND(",",A${row})+1)),
            IF(
              ISERROR(FIND(" ",TRIM(MID(A${row},FIND(",",A${row})+1,LEN(A${row}))))),
              TRIM(MID(A${row},FIND(",",A${row})+1,LEN(A${row}))),
              TRIM(LEFT(TRIM(MID(A${row},FIND(",",A${row})+1,LEN(A${row}))),FIND("☀",SUBSTITUTE(TRIM(MID(A${row},FIND(",",A${row})+1,LEN(A${row})))," ","☀",LEN(TRIM(MID(A${row},FIND(",",A${row})+1,LEN(A${row}))))-LEN(SUBSTITUTE(TRIM(MID(A${row},FIND(",",A${row})+1,LEN(A${row})))," ",""))))-1))
            ),
            TRIM(MID(A${row},FIND(",",A${row})+1,FIND(",",A${row},FIND(",",A${row})+1)-FIND(",",A${row})-1))
          )
        )
      )`,
      };

      // Middle Initial (G)
      ws[`G${row}`] = {
        t: "s",
        f: `=IF(A${row}="","",
        IF(
          ISERROR(FIND(",",A${row},FIND(",",A${row})+1)),
          IF(
            LEN(TRIM(RIGHT(A${row},LEN(A${row})-FIND("☀",SUBSTITUTE(A${row}," ","☀",LEN(A${row})-LEN(SUBSTITUTE(A${row}," ","")))))))<=3,
            TRIM(SUBSTITUTE(TRIM(RIGHT(A${row},LEN(A${row})-FIND("☀",SUBSTITUTE(A${row}," ","☀",LEN(A${row})-LEN(SUBSTITUTE(A${row}," ","")))))),".","")),
            ""
          ),
          TRIM(SUBSTITUTE(MID(A${row},FIND(",",A${row},FIND(",",A${row})+1)+1,LEN(A${row})),".",""))
        )
      )`,
      };
    }

    // ✅ Workbook setup
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Adviser_Template");
    ws["!ref"] = "A1:G500";
    wb.Workbook = { CalcPr: { fullCalcOnLoad: true } };

    // ✅ Save file
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([wbout], { type: "application/octet-stream" }),
      "adviser_template.xlsx"
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
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      // ✅ Process imported Excel rows
      const processedData = jsonData
        .filter((row) => row["ID Number"] || row["Last Name"]) // skip empty
        .map((row) => ({
          id: uuidv4(),
          user_id: row["ID Number"] ? String(row["ID Number"]).trim() : "",
          password: row["Password"] ? String(row["Password"]).trim() : "",
          first_name: row["First Name"] ? String(row["First Name"]).trim() : "",
          last_name: row["Last Name"] ? String(row["Last Name"]).trim() : "",
          middle_name: row["Middle Initial"]
            ? String(row["Middle Initial"]).trim()
            : "",
        }));

      // ✅ Validation: numeric characters in names
      const invalidRow = processedData.find(
        (r) => /\d/.test(r.first_name) || /\d/.test(r.last_name)
      );
      if (invalidRow) {
        MySwal.fire({
          title: "Invalid Name Format",
          text: "Names cannot contain numbers.",
          icon: "warning",
          confirmButtonColor: "#3B0304",
        });
        return;
      }

      // ✅ Validation: duplicate IDs
      const idCounts = processedData.reduce((acc, r) => {
        const id = r.user_id;
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
        return;
      }

      // ✅ Import ready
      setImportedData(processedData);
      setSelectedRows([]);
      setSearchTerm("");
    };

    reader.readAsArrayBuffer(file);
  };

  const handleUpload = async () => {
    if (importedData.length === 0) {
      MySwal.fire(
        "No Data",
        "Please add advisers/guest panels first.",
        "warning"
      );
      return;
    }

    // 1) Build academic year options
    const currentYear = new Date().getFullYear();
    const maxFutureYears = 1;
    const yearOptions = [];
    for (let i = 0; i <= maxFutureYears; i++) {
      const start = currentYear + i;
      yearOptions.push(`${start}-${start + 1}`);
    }

    // 2) Ask for year
    const { value: selectedYear } = await MySwal.fire({
      title: `
      <div style="color:#3B0304; font-weight:600; font-size:1.1rem;">
        Select Academic Year
      </div>`,
      html: `
      <div style="max-width: 100%; margin-top: 1rem;">
        <select id="year-select" style="
          width: 100%;
          padding: 10px 12px;
          border-radius: 6px;
          border: 1.5px solid #888;
          font-size: 0.9rem;
          text-align: center;
          background-color: #fff;
          color: #333;
          appearance: none;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        " onfocus="this.style.borderColor='#3B0304'; this.style.boxShadow='0 0 0 2px rgba(59,3,4,0.15)';"
           onblur="this.style.borderColor='#888'; this.style.boxShadow='none';">
          ${yearOptions
            .map(
              (y) =>
                `<option value="${y}" ${
                  y.startsWith(String(currentYear)) ? "selected" : ""
                }>${y}</option>`
            )
            .join("")}
        </select>
      </div>`,
      showCancelButton: true,
      confirmButtonColor: "#3B0304",
      cancelButtonColor: "#999",
      confirmButtonText: "Confirm",
      cancelButtonText: "Cancel",
      focusConfirm: false,
      width: "350px",
      background: "#fff",
      customClass: { popup: "custom-swal-popup" },
      didOpen: () => {
        const select = document.getElementById("year-select");
        if (select) {
          select.style.width = "100%";
          select.style.display = "block";
        }
      },
      preConfirm: () => {
        const year = document.getElementById("year-select").value;
        if (!year) {
          MySwal.showValidationMessage("Please select a year first.");
          return false;
        }
        return year;
      },
    });

    if (!selectedYear) {
      MySwal.fire("Cancelled", "Enrollment was cancelled.", "info");
      return;
    }

    // 3) Build rows with correct user_roles (3 = Adviser, 5 = Guest Panel)
    const normalizeRole = (v) =>
      (v ?? "adviser").toString().trim().toLowerCase().replace(/\s+/g, "");

    try {
      const rows = importedData.map((r) => {
        const norm = normalizeRole(r.role);
        const isGuest = norm.includes("guest"); // matches "guest", "guestpanel", etc.

        return {
          user_id: isGuest ? r.user_id || null : (r.user_id ?? "").trim(),
          password: isGuest ? r.password || null : (r.password ?? "").trim(),
          first_name: (r.first_name ?? "").trim(),
          last_name: (r.last_name ?? "").trim(),
          middle_name: (r.middle_name ?? "").trim(),
          user_roles: isGuest ? 5 : 3, // ✅ correct mapping
          year: selectedYear,
        };
      });

      const { error } = await supabase.from("user_credentials").insert(rows);
      if (error) throw error;

      MySwal.fire(
        "Success",
        `Saved ${rows.length} record(s) for ${selectedYear}.`,
        "success"
      );
      setImportedData([]);
      setSelectedRows([]);
    } catch (err) {
      console.error("Upload error:", err);
      MySwal.fire("Error", err.message || "Upload failed.", "error");
    }
  };

  // --- Edit Row (Updated to match Add Adviser modal design) ---
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
            Edit Adviser
          </h5>
        </div>
 
        <div style="padding: 1.2rem 1.2rem;">
          <!-- Adviser ID -->
          <div style="display: flex; flex-direction: column; margin-bottom: 1rem;">
            <label for="user_id" style="font-weight: 500; margin-bottom: 0.3rem; font-size: 0.85rem; color: #333; text-align: left;">Adviser ID</label>
            <input id="user_id" class="swal2-input" value="${row.user_id}" placeholder=""
              style="border-radius: 6px; border: 1.5px solid #888; padding: 0.5rem 0.75rem; font-size: 0.9rem; text-align: left; width: 100%; height: 38px; background-color: #fff; margin-left: 0;" />
          </div>
 
          <!-- Password -->
          <div style="display: flex; flex-direction: column; margin-bottom: 1rem;">
            <label for="password" style="font-weight: 500; margin-bottom: 0.3rem; font-size: 0.85rem; color: #333; text-align: left;">Password</label>
            <input id="password" class="swal2-input" value="${row.password}" placeholder=""
              style="border-radius: 6px; border: 1.5px solid #888; padding: 0.5rem 0.75rem; font-size: 0.9rem; text-align: left; width: 100%; height: 38px; background-color: #fff; margin-left: 0;" />
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
 
          <!-- Middle Initial -->
          <div style="display: flex; flex-direction: column; margin-bottom: 1.5rem;">
            <label for="middle_name" style="font-weight: 500; margin-bottom: 0.3rem; font-size: 0.85rem; color: #333; text-align: left;">Middle Initial</label>
            <input id="middle_name" class="swal2-input" value="${row.middle_name}" placeholder=""
              style="border-radius: 6px; border: 1.5px solid #888; padding: 0.5rem 0.75rem; font-size: 0.9rem; text-align: left; width: 100%; height: 38px; background-color: #fff; margin-left: 0;" />
          </div>
 
          <!-- Buttons -->
          <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 0.5rem;">
            <button id="cancel-btn" class="swal2-cancel"
              style="border: 1.5px solid #3B0304; background-color: #fff; color: #3B0304; font-weight: 500; padding: 0.5rem 1.8rem; border-radius: 6px; cursor: pointer; transition: all 0.2s; font-size: 0.85rem;">
              Cancel
            </button>
            <button id="save-btn" class="swal2-confirm"
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
        popup: "custom-swal-popup",
      },
      didOpen: () => {
        const popup = Swal.getPopup();

        const adviserIdInput = popup.querySelector("#user_id");
        adviserIdInput.setAttribute("maxlength", "9");

        // 🔹 Create inline validation message element
        const validationMessage = document.createElement("div");
        validationMessage.style.color = "red";
        validationMessage.style.fontSize = "0.8rem";
        validationMessage.style.marginTop = "0.4rem";
        validationMessage.style.textAlign = "left";
        validationMessage.style.display = "none";
        adviserIdInput.parentNode.appendChild(validationMessage);

        adviserIdInput.addEventListener("input", (e) => {
          let value = e.target.value;

          // Auto-remove non-numeric characters
          const cleanedValue = value.replace(/[^0-9]/g, "");
          if (value !== cleanedValue) {
            e.target.value = cleanedValue;
            validationMessage.textContent =
              "Only numbers are allowed for Adviser ID.";
            validationMessage.style.display = "block";
          } else {
            validationMessage.style.display = "none";
          }

          // Enforce max length of 9 digits
          if (cleanedValue.length > 9) {
            e.target.value = cleanedValue.slice(0, 9);
            validationMessage.textContent =
              "Adviser ID can only be 9 digits long.";
            validationMessage.style.display = "block";
          }
        });
        // Cancel button functionality
        popup.querySelector("#cancel-btn").onclick = () => {
          Swal.close();
        };

        // Save button functionality
        popup.querySelector("#save-btn").onclick = () => {
          Swal.clickConfirm();
        };

        // Hover effects
        popup
          .querySelector("#cancel-btn")
          .addEventListener("mouseenter", (e) => {
            e.target.style.backgroundColor = "#f8f8f8";
          });
        popup
          .querySelector("#cancel-btn")
          .addEventListener("mouseleave", (e) => {
            e.target.style.backgroundColor = "#fff";
          });
        popup.querySelector("#save-btn").addEventListener("mouseenter", (e) => {
          e.target.style.backgroundColor = "#2a0203";
          e.target.style.borderColor = "#2a0203";
        });
        popup.querySelector("#save-btn").addEventListener("mouseleave", (e) => {
          e.target.style.backgroundColor = "#3B0304";
          e.target.style.borderColor = "#3B0304";
        });

        // Add focus effects to inputs
        const inputs = popup.querySelectorAll("input");
        inputs.forEach((input) => {
          input.addEventListener("focus", (e) => {
            e.target.style.borderColor = "#3B0304";
            e.target.style.boxShadow = "0 0 0 2px rgba(59, 3, 4, 0.1)";
          });
          input.addEventListener("blur", (e) => {
            e.target.style.borderColor = "#888";
            e.target.style.boxShadow = "none";
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
            "Please fill out all required fields (Adviser ID, Password, First Name, Last Name)."
          );
          return false;
        }

        // Number check
        if (/\d/.test(first_name) || /\d/.test(last_name)) {
          MySwal.showValidationMessage(
            "Numbers in First Name or Last Name are not allowed."
          );
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

  const isAllSelected =
    filteredData.length > 0 &&
    filteredData.every((row) => selectedRows.includes(row.id));

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
          <div
            className="d-flex align-items-center mb-2 enroll-header"
            style={{ color: "#3B0304" }}
          >
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
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f0f0f0")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "white")
                }
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
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f0f0f0")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "white")
                }
              >
                <FaUpload size={14} /> Import
                <input
                  type="file"
                  hidden
                  accept=".xlsx,.xls"
                  onChange={handleImport}
                  onClick={(e) => (e.target.value = null)}
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
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: "1.5px solid #3B0304",
                      backgroundColor: "#3B0304",
                      color: "white",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "opacity 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.opacity = "0.9")
                    }
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
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#f0f0f0")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
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
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f0f0f0")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "white")
                }
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
              <strong>NOTE:</strong> Please download the template to input the
              required adviser information. Once completed, import the file to
              proceed with enrolling the advisers into the system.
            </div>
          ) : (
            // --- Enrollment Table Section ---
            <div
              className="bg-white rounded-lg shadow-md relative"
              ref={tableWrapperRef}
            >
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
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#f0f0f0")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
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
                        color:
                          selectedRows.length === 0 ? "#A0A0A0" : "#3B0304",
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
                      <FaTrash size={12} /> Delete Selected
                    </button>
                  </div>
                )}
              </div>

              {/* Table Body with Scrolling */}
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
                      {/* Checkbox Header (Conditional) */}
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
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Adviser ID
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Password
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        First Name
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Last Name
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Middle Initial
                      </th>
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
                    {filteredData.map((row, index) => {
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {importedData.indexOf(row) + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {row.user_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {row.password}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {row.first_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {row.last_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {row.middle_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center position-relative">
                            {/* Action Button only visible when not in selection mode */}
                            {!isSelectionMode && (
                              <button
                                className="text-gray-500 hover:text-[#3B0304] p-1 rounded transition duration-150"
                                onClick={() => handleToggleDropdown(index)}
                                style={{ border: "none", background: "none" }}
                              >
                                <FaEllipsisV size={14} />
                              </button>
                            )}

                            {/* Detached Dropdown Menu */}
                            {openDropdown === index && !isSelectionMode && (
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
                                    onClick={() => handleEditRow(row, index)}
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
                                    className="dropdown-item d-flex align-items-center gap-2 text-danger"
                                    onClick={() => handleDeleteRow(index)}
                                  >
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
                        <td
                          colSpan={isSelectionMode ? "9" : "8"}
                          className="text-center py-4 text-gray-500"
                        >
                          No advisers match your search.
                        </td>
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
