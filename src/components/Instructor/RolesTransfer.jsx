// src/components/Instructor/RoleTransfer.jsx
import React, { useState, useEffect } from "react";
import { FaUserCircle, FaUserTie, FaUserPlus } from "react-icons/fa";
import Swal from "sweetalert2";
import { supabase } from "../../supabaseClient";
import { FaEye, FaEyeSlash } from "react-icons/fa";


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
  const [showPassword, setShowPassword] = useState(false);


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

  // ✅ Password validation pattern
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+]).{8,}$/;

  // Check password validity before confirm alert
  if (!passwordRegex.test(formData.password)) {
    await Swal.fire({
      title: "Invalid Password Format",
      html: `
        <div style="text-align: left; font-size: 0.9rem;">
          <p><strong>Password must include:</strong></p>
          <ul style="margin-left: 1.2rem; margin-top: 0.5rem;">
            <li>Minimum length: 8 characters</li>
            <li>At least one uppercase letter (A–Z)</li>
            <li>At least one lowercase letter (a–z)</li>
            <li>At least one number (0–9)</li>
            <li>At least one special character (!@#$%^&*()_+)</li>
          </ul>
        </div>
      `,
      icon: "warning",
      confirmButtonColor: "#5a0d0e",
      confirmButtonText: "OK",
    });

    // 🔹 Keep the form and focus back on password field
    const passField = document.querySelector('input[name="password"]');
    if (passField) {
      passField.focus();
      passField.style.borderColor = "red";
      setTimeout(() => (passField.style.borderColor = "#888"), 1500);
    }
    return;
  }

  // ✅ Password is valid → proceed to confirmation
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
  // 🔹 Fetch current instructor year first
  const { data: instructorData, error: yearError } = await supabase
    .from("user_credentials")
    .select("year")
    .eq("user_roles", 4)
    .single();

  if (yearError) {
    console.error("Error fetching instructor year:", yearError);
    Swal.fire({
      icon: "error",
      title: "Failed to Fetch Year",
      text: "Could not retrieve the current instructor's year.",
    });
    return;
  }

  const instructorYear = instructorData?.year || null;

  // 🔹 Insert new instructor with same year
  const { data, error } = await supabase
    .from("user_credentials")
    .insert([
      {
        user_id: formData.idNo,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        middle_name: formData.middleName,
        user_roles: 3,
        email: formData.email,
        year: instructorYear, // ✅ copy the same year
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

 // ✅ Insert notification
try {
  // Get current max id first
  const { data: notifData, error: fetchError } = await supabase
    .from("user_notification")
    .select("id")
    .order("id", { ascending: false })
    .limit(1);

  if (fetchError) console.error("Error fetching max id:", fetchError);

  const nextId = notifData?.[0]?.id ? notifData[0].id + 1 : 1;

  const now = new Date();
  const formattedDate = now.toISOString().split("T")[0]; // YYYY-MM-DD
  const formattedTime = now.toTimeString().split(" ")[0]; // HH:mm:ss

  const { error: notifError } = await supabase
    .from("user_notification")
    .insert([
      {
        id: nextId,
        user_id: data.user_id, // use user_id, not data.id
        type: "The current instructor has officially assigned you as the new Capstone Instructor. You now have full access to manage capstone projects.",
        date: formattedDate,
        time: formattedTime,
        title: "You Have Been Assigned as the New Capstone Instructor.",
      },
    ]);
    

if (notifError) {
    console.error("Error adding notification:", notifError);
    Swal.fire({
      icon: "error",
      title: "Notification Failed",
      text: "The instructor was enrolled, but the notification could not be sent.",
      confirmButtonColor: "#d33",
    });
  } else {
    console.log("✅ Notification inserted successfully!");
    await Swal.fire({
      icon: "success",
      title: "Enrollment Successful!",
      text: "The new instructor has been enrolled and notified successfully.",
      confirmButtonColor: "#3085d6",
      confirmButtonText: "OK",
    });
  }
} catch (notifErr) {
  console.error("Notification insert failed:", notifErr);
  Swal.fire({
    icon: "error",
    title: "Notification Error",
    text: "Something went wrong while sending the notification.",
    confirmButtonColor: "#d33",
  });
}
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Main Container */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#5a0d0e] to-[#7a1d1e] px-8 py-6">
            <div className="flex items-center space-x-3 text-white">
              <FaUserCircle className="text-4xl" />
              <h1 className="text-3xl font-bold">Role Transfer</h1>
            </div>
            <p className="text-gray-200 mt-2 ml-12">Transfer capstone instructor responsibilities</p>
          </div>

          <div className="p-8">
            {/* Current Instructor Section */}
            <div className="mb-10">
              <div className="flex items-center space-x-2 mb-4">
                <FaUserTie className="text-2xl text-[#5a0d0e]" />
                <h2 className="text-2xl font-bold text-gray-800">Current Capstone Instructor</h2>
              </div>
              
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border-l-4 border-[#5a0d0e]">
                {currentInstructor ? (
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <span className="text-gray-600 font-semibold min-w-[100px]">Name:</span>
                      <span className="text-gray-900 font-medium">
                        {`${currentInstructor.first_name} ${currentInstructor.middle_name || ""} ${currentInstructor.last_name}`}
                      </span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-gray-600 font-semibold min-w-[100px]">ID No:</span>
                      <span className="text-gray-900 font-medium">{currentInstructor.user_id}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#5a0d0e]"></div>
                    <span className="text-gray-500">Loading current instructor...</span>
                  </div>
                )}
              </div>
            </div>

            {/* New Instructor Section */}
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <FaUserPlus className="text-2xl text-[#5a0d0e]" />
                <h2 className="text-2xl font-bold text-gray-800">New Capstone Instructor</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Fields Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border-2 bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5a0d0e] focus:border-transparent ${
                        errors.lastName 
                          ? "border-red-500 bg-red-50" 
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      placeholder="Enter last name"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-500">This field is required</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border-2 bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5a0d0e] focus:border-transparent ${
                        errors.firstName 
                          ? "border-red-500 bg-red-50" 
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      placeholder="Enter first name"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-500">This field is required</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Middle Initial <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="middleName"
                      value={formData.middleName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border-2 bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5a0d0e] focus:border-transparent ${
                        errors.middleName 
                          ? "border-red-500 bg-red-50" 
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      placeholder="Enter middle name"
                    />
                    {errors.middleName && (
                      <p className="mt-1 text-sm text-red-500">This field is required</p>
                    )}
                  </div>
                </div>

                {/* ID and Password Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      ID Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="idNo"
                      value={formData.idNo}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border-2 bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5a0d0e] focus:border-transparent ${
                        errors.idNo 
                          ? "border-red-500 bg-red-50" 
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      placeholder="Enter ID number"
                    />
                    {errors.idNo && (
                      <p className="mt-1 text-sm text-red-500">This field is required</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
  <input
    type={showPassword ? "text" : "password"}
    name="password"
    value={formData.password}
    onChange={handleChange}
    className={`w-full px-4 py-3 pr-10 rounded-lg border-2 bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5a0d0e] focus:border-transparent ${
      errors.password
        ? "border-red-500 bg-red-50"
        : "border-gray-300 hover:border-gray-400"
    }`}
    placeholder="Enter password"
  />

  {/* 👁️ Eye Toggle Button */}
  <button
    type="button"
    onClick={() => setShowPassword((prev) => !prev)}
    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-[#5a0d0e]"
    tabIndex={-1}
  >
    {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
  </button>

  {errors.password && (
    <p className="mt-1 text-sm text-red-500">This field is required</p>
  )}
</div>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-500">This field is required</p>
                    )}
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border-2 bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5a0d0e] focus:border-transparent ${
                      errors.email 
                        ? "border-red-500 bg-red-50" 
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">This field is required</p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-content-end pt-4">
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-[#5a0d0e] to-[#7a1d1e] text-white font-bold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#5a0d0e] focus:ring-opacity-50"
                  >
                    Enroll New Instructor
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleTransfer;