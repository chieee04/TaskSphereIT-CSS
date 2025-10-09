import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Logo1 from "../../assets/img/Dct-Logo.png";
import { updateUserPassword } from "../../assets/scripts/forgotPassword";

const NewPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Email comes from the previous step via router state
  const verifiedEmail = useMemo(
    () => location.state?.email || "",
    [location.state]
  );

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    if (!verifiedEmail) {
      Swal.fire({
        icon: "error",
        title: "Missing email",
        text: "This page needs the verified email from the previous step.",
        confirmButtonColor: "#3B0304",
      });
      navigate("/forgot-password"); // send them back to start the flow correctly
      return;
    }
    if (!newPw || !confirmPw) {
      Swal.fire({
        icon: "warning",
        title: "Enter both fields",
        text: "Please enter and confirm your new password.",
        confirmButtonColor: "#3B0304",
      });
      return;
    }
    if (newPw !== confirmPw) {
      Swal.fire({
        icon: "error",
        title: "Passwords don’t match",
        text: "Please make sure both passwords are identical.",
        confirmButtonColor: "#3B0304",
      });
      return;
    }
    if (newPw.length < 8) {
      Swal.fire({
        icon: "warning",
        title: "Weak password",
        text: "Use at least 8 characters.",
        confirmButtonColor: "#3B0304",
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
        confirmButtonColor: "#3B0304",
      });
      navigate("/login");
    } catch (e) {
      console.error("updateUserPassword failed:", e);
      Swal.fire({
        icon: "error",
        title: "Update failed",
        text: e?.message || "Please try again.",
        confirmButtonColor: "#3B0304",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#f8f8f8] px-4">
      <div className="bg-white border-4 border-[#3B0304] rounded-2xl shadow-md p-8 w-full max-w-md text-center">
        <img
          src={Logo1}
          alt="DCT Logo"
          className="w-24 h-24 mx-auto mb-4 object-contain"
        />
        <h1 className="text-2xl font-bold text-[#3B0304] mb-2">
          TaskSphere IT
        </h1>
        <div className="border-t border-gray-300 my-4"></div>
        <h2 className="text-xl font-semibold text-[#3B0304] mb-6">
          Set your New Password
        </h2>

        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          {/* New Password */}
          <div className="text-left">
            <label className="block text-sm font-medium text-[#3B0304] mb-3">
              New Password
            </label>
            <div className="relative flex justify-center">
              <input
                type={showNew ? "text" : "password"}
                className="w-full h-12 px-4 pr-12 text-lg border-2 border-[#3B0304] rounded-md focus:ring-2 focus:ring-[#3B0304] focus:border-[#3B0304] focus:outline-none"
                style={{
                  boxShadow: "inset 0 1px 3px rgba(59, 3, 4, 0.1)",
                  backgroundColor: "white",
                }}
                placeholder="Enter new password"
                aria-label="New password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowNew((s) => !s)}
                aria-label={showNew ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-md bg-transparent hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3B0304]"
              >
                {showNew ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#3B0304"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 3l18 18" />
                    <path d="M10.58 10.58a2 2 0 0 0 2.84 2.84" />
                    <path d="M16.68 16.68A8.76 8.76 0 0 1 12 18c-5 0-9-6-9-6a16.9 16.9 0 0 1 5.06-5.64" />
                    <path d="M14.12 5.1A9 9 0 0 1 21 12s-.73 1.09-2 2.41" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#3B0304"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="text-left">
            <label className="block text-sm font-medium text-[#3B0304] mb-3">
              Confirm Password
            </label>
            <div className="relative flex justify-center">
              <input
                type={showConfirm ? "text" : "password"}
                className="w-full h-12 px-4 pr-12 text-lg border-2 border-[#3B0304] rounded-md focus:ring-2 focus:ring-[#3B0304] focus:border-[#3B0304] focus:outline-none"
                style={{
                  boxShadow: "inset 0 1px 3px rgba(59, 3, 4, 0.1)",
                  backgroundColor: "white",
                }}
                placeholder="Confirm new password"
                aria-label="Confirm new password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-md bg-transparent hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3B0304]"
              >
                {showConfirm ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#3B0304"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 3l18 18" />
                    <path d="M10.58 10.58a2 2 0 0 0 2.84 2.84" />
                    <path d="M16.68 16.68A8.76 8.76 0 0 1 12 18c-5 0-9-6-9-6a16.9 16.9 0 0 1 5.06-5.64" />
                    <path d="M14.12 5.1A9 9 0 0 1 21 12s-.73 1.09-2 2.41" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#3B0304"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
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
            disabled={saving}
            onClick={handleConfirm}
            className={`w-full py-3 text-white font-medium rounded-md transition-all text-lg ${
              saving
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#3B0304] hover:bg-[#2a0203]"
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
