import React, { useState } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import Logo1 from "../../assets/img/Dct-Logo.png";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const MySwal = withReactContent(Swal);

  const handleResetPassword = (e) => {
    e.preventDefault();

    if (!email) return;

    // 🔹 Trigger the SweetAlert OTP popup
    MySwal.fire({
      title: "",
      html: `
        <div style="text-align: center;">
          <p style="font-size: 0.9rem; color: #333; margin-bottom: 1rem;">
            We've sent a One-Time Password (OTP) to your registered email.<br/>
            Please check your inbox (and spam folder) and enter it below.
          </p>

          <div id="otp-inputs" style="display: flex; justify-content: center; gap: 8px; margin-bottom: 12px;">
            ${Array(6)
              .fill(0)
              .map(
                (_, i) =>
                  `<input id="otp-${i}" type="text" maxlength="1" 
                    style="width: 38px; height: 38px; text-align: center; font-size: 18px;
                    border: 1.5px solid #ccc; border-radius: 6px; outline: none;"
                    oninput="if(this.value.length===1) document.getElementById('otp-${i + 1}')?.focus()" />`
              )
              .join("")}
          </div>

          <a id="resend" href="#" style="color: #800000; font-size: 0.85rem; text-decoration: none;">Resend</a>
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: "Confirm",
      confirmButtonColor: "#3B0304",
      focusConfirm: false,
      customClass: {
        confirmButton: "rounded-md py-2 px-4 font-medium",
      },
      didOpen: () => {
        // auto focus first input
        const firstInput = Swal.getPopup().querySelector("#otp-0");
        if (firstInput) firstInput.focus();

        // Handle Resend click
        const resendLink = Swal.getPopup().querySelector("#resend");
        resendLink.onclick = (e) => {
          e.preventDefault();
          Swal.showLoading();
          setTimeout(() => {
            Swal.hideLoading();
            Swal.showValidationMessage("✅ New OTP sent to your email!");
            setTimeout(() => Swal.resetValidationMessage(), 2000);
          }, 1500);
        };
      },
      preConfirm: () => {
        const otp = Array.from({ length: 6 })
          .map((_, i) => document.getElementById(`otp-${i}`).value)
          .join("");

        if (otp.length < 6) {
          Swal.showValidationMessage("Please enter the complete 6-digit OTP.");
          return false;
        }

        return otp;
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const enteredOtp = result.value;
        console.log("Entered OTP:", enteredOtp);

        // 🔹 Simulate OTP verification
        MySwal.fire({
          icon: "success",
          title: "OTP Verified!",
          text: "You can now reset your password.",
          confirmButtonColor: "#3B0304",
        });
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#f8f8f8] px-4">
      <div className="bg-white border-4 border-[#3B0304] rounded-2xl shadow-md p-8 w-full max-w-md text-center">
        {/* LOGO */}
        <img
          src={Logo1}
          alt="DCT Logo"
          className="w-24 h-24 mx-auto mb-4 object-contain"
        />

        {/* HEADING */}
        <h1 className="text-2xl font-bold text-[#3B0304] mb-2">
          Forgot Password?
        </h1>

        {/* INSTRUCTION */}
        <p className="text-gray-700 text-sm mb-6 leading-relaxed">
          No worries! To reset your password, we'll send a one-time password
          (OTP) to your registered email address. Please check your inbox and
          follow the instructions to continue.
        </p>

        {/* FORM */}
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="text-left">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin1@gmail.com"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#3B0304] focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-[#3B0304] text-white font-medium rounded-md hover:bg-[#2a0203] transition-all"
          >
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
