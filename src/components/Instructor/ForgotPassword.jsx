import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo1 from "../../assets/img/TaskSphereLogo.png";

import Swal from "sweetalert2";
import { showOTP, fetchAdminEmail } from "../../assets/scripts/forgotPassword";
import { sendOtpEmail } from "../../assets/scripts/email";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const navigate = useNavigate();

  // 6-digit OTP helper (000000–999999, always 6 chars)
  const generateOtp = () =>
    String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");

  const handleResetPassword = async (e) => {
    e.preventDefault();

    const entered = (email || "").trim();
    if (!entered) {
      Swal.fire({
        icon: "warning",
        title: "Enter your email",
        text: "Please provide the email you registered with.",
        confirmButtonColor: "#611A11",
      });
      return;
    }

    try {
      setSending(true);

      // 1) Check if admin
      const isAdminEmail = await fetchAdminEmail(entered);
      if (!isAdminEmail) {
        await Swal.fire({
          icon: "error",
          title: "Not an admin email",
          text: "Only admin accounts can reset a password here.",
          confirmButtonColor: "#611A11",
        });
        return;
      }

      // 2) Generate OTP
      const otp = generateOtp();
      const fullName = ""; // fill if you have it (optional)

      // 3) Send OTP email
      await sendOtpEmail({ email: entered, fullName, otp });

      // 4) Notify
      await Swal.fire({
        icon: "success",
        title: "OTP sent",
        html: `We've sent a 6-digit code to <b>${entered}</b>.`,
        confirmButtonColor: "#611A11",
        allowOutsideClick: false,
        allowEscapeKey: false,
      });

      // 5) Open your 6-box OTP modal and verify there
      showOTP({
        email: entered,
        expectedOtp: otp,
        onConfirm: async (code, { expected }) => {
          if (String(code) === String(expected)) {
            navigate("/NewPassword", { state: { email: entered } });
            return true; // ✅ close the Swal
          }
          alert("failed");
          return false; // ❌ keep it open for retry
        },
        onResend: async () => {
          const newOtp = generateOtp();
          await sendOtpEmail({ email: entered, fullName: "", otp: newOtp });
          return newOtp; // updates expected code inside the Swal
        },
      });
    } catch (err) {
      console.error("ForgotPassword error:", err);
      Swal.fire({
        icon: "error",
        title: "Something went wrong",
        text: err?.message || "Please try again in a moment.",
        confirmButtonColor: "#611A11",
      });
    } finally {
      setSending(false);
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
          Forgot Password?
        </h1>
        <p className="text-gray-700 text-sm mb-6 leading-relaxed">
          No worries! To reset your password, we'll send a one-time password
          (OTP) to your registered email address. Please check your inbox and
          follow the instructions to continue.
        </p>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="text-left">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1 select-none"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin1@gmail.com"
              className="w-full p-3 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-[#611A11] focus:border-[#611A11] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className={`w-full py-3 text-white font-medium rounded-md transition-all select-none ${
              sending
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#611A11] hover:bg-[#7a2218]"
            }`}
          >
            {sending ? "Sending OTP..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;