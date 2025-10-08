// src/components/Instructor/RoleTransfer.jsx
import React, { useState, useEffect } from "react";
import { FaUserCircle } from "react-icons/fa";
import Swal from "sweetalert2";
import { supabase } from "../../supabaseClient";
import "bootstrap/dist/css/bootstrap.min.css";

const RoleTransfer = () => {
  const [formData, setFormData] = useState({
    lastName: "",
    firstName: "",
    middleName: "",
    idNo: "",
    password: "",
    email: "",
  });

  const [errors, setErrors] = useState({});
  const [currentInstructor, setCurrentInstructor] = useState(null);

  // ✅ Fetch current instructor (user_roles = 4)
  useEffect(() => {
    const fetchInstructor = async () => {
      const { data, error } = await supabase
        .from("user_credentials")
        .select("first_name, last_name, middle_name, user_id")
        .eq("user_roles", 4)
        .single(); // only one instructor

      if (error) {
        console.error("Error fetching instructor:", error);
      } else {
        setCurrentInstructor(data);
      }
    };

    fetchInstructor();
  }, []);

  // ✅ Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" })); // remove red border when typing
  };

  // ✅ Validation checker
  const validateFields = () => {
    const newErrors = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (!value.trim()) newErrors[key] = "Required";
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Handle submit with SweetAlert2 confirmation
  // ✅ Handle submit with SweetAlert2 confirmation
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateFields()) {
    Swal.fire({
      icon: "error",
      title: "Missing Fields",
      text: "Please fill out all fields before enrolling.",
    });
    return;
  }

  const confirm = await Swal.fire({
    title: "Confirm Role Transfer?",
    text: "Are you sure you want to enroll this new instructor?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#5a0d0e",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Yes, Enroll",
  });

  if (confirm.isConfirmed) {
    // ✅ Step 1: Insert new instructor
    const { data, error } = await supabase
      .from("user_credentials")
      .insert([
        {
          user_id: formData.idNo,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
          middle_name: formData.middleName,
          user_roles: 3, // Adviser / New Instructor
          email: formData.email,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error inserting new instructor:", error);
      Swal.fire({
        icon: "error",
        title: "Enrollment Failed",
        text: "An error occurred while enrolling the new instructor.",
      });
      return;
    }

    // ✅ Step 2: Add notification for this newly created instructor
    try {
      const { error: notifError } = await supabase.from("notification").insert([
        {
          user_id: data.id, // 👈 uuid of the newly created account
          title: "You Have Been Assigned as the New Capstone Instructor",
          description: "The current instructor has officially transferred the Capstone advising role to you. You are now designated as the new Capstone Instructor for the group.",
          date: new Date().toISOString(), // timestamp
        },
      ]);

      if (notifError) {
        console.error("Error adding notification:", notifError);
      } else {
        console.log("✅ Notification successfully added!");
      }
    } catch (notifErr) {
      console.error("Notification insert failed:", notifErr);
    }

    // ✅ Step 3: Success alert and reset form
    Swal.fire({
      icon: "success",
      title: "Enrolled Successfully!",
      text: "The new instructor has been added successfully.",
    });

    setFormData({
      lastName: "",
      firstName: "",
      middleName: "",
      idNo: "",
      password: "",
      email: "",
    });
  }
};
  return (
    <div className="container my-4">
      <style>
        {`
          .role-transfer-container {
            font-family: Arial, sans-serif;
            color: #333;
            background-color: #fff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .role-transfer-header {
            display: flex;
            align-items: center;
            font-size: 1.5rem;
            font-weight: bold;
            color: black;
            padding-bottom: 8px;
            border-bottom: 2px solid #5a0d0e;
            margin-bottom: 20px;
          }
          .section-title {
            font-size: 1.2rem;
            font-weight: 600;
            color: #333;
            margin-bottom: 15px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
          }
          .form-group label {
            font-weight: 500;
            color: #555;
          }
          .error-border {
            border-color: red !important;
          }
          .enroll-btn {
            background-color: #5a0d0e;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            font-weight: bold;
            cursor: pointer;
            transition: background-color 0.3s;
          }
          .enroll-btn:hover {
            background-color: #3b0304;
          }
        `}
      </style>

      <div className="role-transfer-container">
        {/* Header */}
        <div className="role-transfer-header">
          <FaUserCircle className="me-2" style={{ color: "black" }} />
          <span>Role Transfer</span>
        </div>

        {/* Current Instructor */}
        <div className="mb-4">
          <h3 className="section-title">Current Capstone Instructor</h3>
          {currentInstructor ? (
            <>
              <p>
                <strong>Name:</strong>{" "}
                {`${currentInstructor.first_name} ${currentInstructor.middle_name || ""} ${currentInstructor.last_name}`}
              </p>
              <p>
                <strong>ID No:</strong> {currentInstructor.user_id}
              </p>
            </>
          ) : (
            <p>Loading current instructor...</p>
          )}
        </div>

        {/* New Instructor */}
        <div>
          <h3 className="section-title">New Capstone Instructor</h3>
          <form onSubmit={handleSubmit}>
            <div className="row mb-3">
              <div className="col-md-4">
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    className={`form-control ${errors.lastName ? "error-border" : ""}`}
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    className={`form-control ${errors.firstName ? "error-border" : ""}`}
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label>Middle Name</label>
                  <input
                    type="text"
                    className={`form-control ${errors.middleName ? "error-border" : ""}`}
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <div className="form-group">
                  <label>ID No</label>
                  <input
                    type="text"
                    className={`form-control ${errors.idNo ? "error-border" : ""}`}
                    name="idNo"
                    value={formData.idNo}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    className={`form-control ${errors.password ? "error-border" : ""}`}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* ✅ Email Field */}
            <div className="row mb-4">
              <div className="col-md-12">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="text"
                    className={`form-control ${errors.email ? "error-border" : ""}`}
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end">
              <button type="submit" className="enroll-btn">
                Enroll
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RoleTransfer;
