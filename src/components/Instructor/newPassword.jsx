import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Logo1 from "../../assets/img/TaskSphereLogo.png";
import { updateUserPassword } from "../../assets/scripts/forgotPassword";

const NewPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const verifiedEmail = useMemo(
    () => location.state?.email || "",
    [location.state]
  );

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Password validation function
  const validatePassword = (pass) => {
    const errors = [];
    
    if (/\s/.test(pass)) {
      errors.push("Password cannot contain spaces");
    }
    
    if (pass.length < 8) {
      errors.push("Password must be at least 8 characters");
    }
    
    if (!/[A-Z]/.test(pass)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    
    if (!/[a-z]/.test(pass)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    
    if (!/[0-9]/.test(pass)) {
      errors.push("Password must contain at least one number");
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass)) {
      errors.push("Password must contain at least one special character");
    }
    
    return errors;
  };

  // Handle password change with validation
  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setNewPw(newPassword);
    
    if (newPassword) {
      const errors = validatePassword(newPassword);
      if (errors.length > 0) {
        setPasswordError(errors[0]);
      } else {
        setPasswordError("");
      }
    } else {
      setPasswordError("");
    }
  };

  const handleConfirm = async () => {
    if (!verifiedEmail) {
      Swal.fire({
        icon: "error",
        title: "Missing email",
        text: "This page needs the verified email from the previous step.",
        confirmButtonColor: "#611A11",
      });
      navigate("/forgot-password");
      return;
    }
    
    if (!newPw || !confirmPw) {
      Swal.fire({
        icon: "warning",
        title: "Enter both fields",
        text: "Please enter and confirm your new password.",
        confirmButtonColor: "#611A11",
      });
      return;
    }

    // Validate password format
    const passwordErrors = validatePassword(newPw);
    if (passwordErrors.length > 0) {
      Swal.fire({
        icon: "error",
        title: "Invalid Password Format",
        html: passwordErrors.map(err => `• ${err}`).join('<br>'),
        confirmButtonColor: "#611A11",
      });
      return;
    }
    
    if (newPw !== confirmPw) {
      Swal.fire({
        icon: "error",
        title: "Passwords don't match",
        text: "Please make sure both passwords are identical.",
        confirmButtonColor: "#611A11",
      });
      return;
    }

    try {
      setSaving(true);
      await updateUserPassword({ email: verifiedEmail, newPassword: newPw });
      await Swal.fire({
        icon: "success",
        title: "Password updated",
        text: "Your password has been changed successfully.",
        confirmButtonColor: "#611A11",
      });
      navigate("/login");
    } catch (e) {
      console.error("updateUserPassword failed:", e);
      Swal.fire({
        icon: "error",
        title: "Update failed",
        text: e?.message || "Please try again.",
        confirmButtonColor: "#611A11",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#f8f8f8] px-4 select-none">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center border border-neutral-200">
        <img
          src={Logo1}
          alt="DCT Logo"
          className="w-24 h-24 mx-auto mb-4 object-contain pointer-events-none"
          draggable="false"
        />
        <h1 className="text-2xl font-bold text-[#611A11] mb-2">
          TaskSphere IT
        </h1>
        <div className="border-t border-gray-300 my-4"></div>
        <h2 className="text-xl font-semibold text-[#611A11] mb-6">
          Set your New Password
        </h2>

        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          {/* New Password */}
          <div className="text-left">
            <label className="block text-sm font-medium text-[#611A11] mb-2 select-none">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                className={`w-full h-12 px-4 pr-12 text-base bg-white border ${
                  passwordError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-[#611A11] focus:ring-[#611A11]'
                } rounded-md focus:ring-2 focus:outline-none`}
                placeholder="Enter new password"
                aria-label="New password"
                value={newPw}
                onChange={handlePasswordChange}
              />
              <button
                type="button"
                onClick={() => setShowNew((s) => !s)}
                aria-label={showNew ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-md bg-transparent hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#611A11]"
              >
                {showNew ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#611A11"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="pointer-events-none"
                  >
                    <path d="M3 3l18 18" />
                    <path d="M10.58 10.58a2 2 0 0 0 2.84 2.84" />
                    <path d="M16.68 16.68A8.76 8.76 0 0 1 12 18c-5 0-9-6-9-6a16.9 16.9 0 0 1 5.06-5.64" />
                    <path d="M14.12 5.1A9 9 0 0 1 21 12s-.73 1.09-2 2.41" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#611A11"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="pointer-events-none"
                  >
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {passwordError && (
              <p className="mt-1 text-xs text-red-600 select-none">{passwordError}</p>
            )}
            {/* Password Requirements */}
            <div className="mt-2 text-xs text-gray-600 space-y-0.5">
              <p className="font-medium text-gray-700 select-none">Password must contain:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-1 select-none">
                <li className={newPw.length >= 8 ? "text-green-600" : ""}>At least 8 characters</li>
                <li className={/[A-Z]/.test(newPw) ? "text-green-600" : ""}>One uppercase letter</li>
                <li className={/[a-z]/.test(newPw) ? "text-green-600" : ""}>One lowercase letter</li>
                <li className={/[0-9]/.test(newPw) ? "text-green-600" : ""}>One number</li>
                <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPw) ? "text-green-600" : ""}>One special character</li>
                <li className={!/\s/.test(newPw) && newPw ? "text-green-600" : ""}>No spaces</li>
              </ul>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="text-left">
            <label className="block text-sm font-medium text-[#611A11] mb-2 select-none">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                className="w-full h-12 px-4 pr-12 text-base bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-[#611A11] focus:border-[#611A11] focus:outline-none"
                placeholder="Confirm new password"
                aria-label="Confirm new password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-md bg-transparent hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#611A11]"
              >
                {showConfirm ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#611A11"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="pointer-events-none"
                  >
                    <path d="M3 3l18 18" />
                    <path d="M10.58 10.58a2 2 0 0 0 2.84 2.84" />
                    <path d="M16.68 16.68A8.76 8.76 0 0 1 12 18c-5 0-9-6-9-6a16.9 16.9 0 0 1 5.06-5.64" />
                    <path d="M14.12 5.1A9 9 0 0 1 21 12s-.73 1.09-2 2.41" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#611A11"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="pointer-events-none"
                  >
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            disabled={saving || passwordError}
            onClick={handleConfirm}
            className={`w-full py-3 text-white font-medium rounded-md transition-all text-base select-none ${
              saving || passwordError
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#611A11] hover:bg-[#7a2218]"
            }`}
          >
            {saving ? "Saving..." : "Confirm"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewPassword;