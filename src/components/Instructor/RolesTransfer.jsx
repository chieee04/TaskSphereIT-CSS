// src/components/Instructor/RoleTransfer.jsx
import React, { useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";

const RoleTransfer = () => {
  const [formData, setFormData] = useState({
    lastName: "",
    firstName: "",
    middleName: "",
    idNo: "",
    password: "",
    effectiveDate: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitted data:", formData);
    // 👉 dito mo ilalagay API call (Supabase/Backend)
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
          <p>
            <strong>Name:</strong> Anderson F Dashiell
          </p>
          <p>
            <strong>ID No:</strong> 458639581
          </p>
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
                    className="form-control"
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
                    className="form-control"
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
                    className="form-control"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-8">
                <div className="form-group">
                  <label>ID No</label>
                  <input
                    type="text"
                    className="form-control"
                    name="idNo"
                    value={formData.idNo}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    className="form-control"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="row mb-4">
              <div className="col-md-6">
                <div className="form-group">
                  <label>Effective Date</label>
                  <input
                    type="date"
                    className="form-control"
                    name="effectiveDate"
                    value={formData.effectiveDate}
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
