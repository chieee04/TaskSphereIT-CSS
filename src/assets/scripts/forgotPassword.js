import { supabase } from "../../supabaseClient";
import Swal from "sweetalert2";

export const fetchAdminEmail = async (email) => {
  const entered = String(email || "").trim();
  if (!entered) return false;

  try {
    const { data, error } = await supabase
      .from("user_credentials")
      .select("id")
      .eq("user_roles", 4)
      .ilike("email", entered)
      .maybeSingle();

    return !!data;
  } catch (e) {
    console.error("fetchAdminEmail exception:", e);
    return false;
  }
};

export function showOTP({
  email = "",
  expectedOtp = "",
  onConfirm,
  onResend,
} = {}) {
  let currentOtp = String(expectedOtp || "");

  const html = `
    <div style="font-size:16px; line-height:1.5; color:#222; margin-bottom:16px; text-align:left;">
      We've sent a One-Time Password (OTP) to your registered email.<br/>
      <span style="opacity:.8">Please check your inbox (and spam folder) and enter it below.</span>
    </div>

    <div style="display:flex; gap:8px; justify-content:center; margin:18px 0;">
      ${Array.from({ length: 6 })
        .map(
          (_, i) => `
        <input class="otp-input" inputmode="numeric" maxlength="1"
          style="
            width:48px; height:48px; border-radius:8px; border:1px solid #d1d5db;
            text-align:center; font-size:22px; font-weight:700; outline:none;
            background:#f3f4f6;
          " aria-label="OTP digit ${i + 1}" />
      `
        )
        .join("")}
    </div>

    <div style="text-align:center; margin:8px 0 0;">
      <button id="otp-resend-btn" type="button"
        style="background:none;border:none;color:#7f1d1d;font-weight:600;cursor:pointer;">
        Resend
      </button>
    </div>
  `;

  const readCode = () => {
    const nodes = Array.from(
      document.querySelectorAll(".swal2-container .otp-input")
    );
    return nodes.map((i) => (i.value || "").trim()).join("");
  };

  return Swal.fire({
    title: "Enter the 6-digit OTP",
    html,
    focusConfirm: false,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showCancelButton: true,
    confirmButtonText: "Confirm",
    confirmButtonColor: "#3B0304",
    reverseButtons: true,
    didOpen: () => {
      const container = Swal.getHtmlContainer();
      const inputs = Array.from(container.querySelectorAll(".otp-input"));
      const resendBtn = container.querySelector("#otp-resend-btn");

      // Focus first box
      inputs[0]?.focus();

      // Digit-only, auto-advance, backspace nav, paste
      inputs.forEach((inp, idx) => {
        inp.addEventListener("input", (e) => {
          const v = (e.target.value || "").replace(/\D/g, "").slice(0, 1);
          e.target.value = v;
          if (v && idx < inputs.length - 1) inputs[idx + 1].focus();
        });

        inp.addEventListener("keydown", (e) => {
          if (e.key === "Backspace" && !inp.value && idx > 0)
            inputs[idx - 1].focus();
          if (e.key === "ArrowLeft" && idx > 0) inputs[idx - 1].focus();
          if (e.key === "ArrowRight" && idx < inputs.length - 1)
            inputs[idx + 1].focus();
          if (e.key === "Enter") Swal.clickConfirm();
        });

        inp.addEventListener("paste", (e) => {
          const data = (e.clipboardData.getData("text") || "")
            .replace(/\D/g, "")
            .slice(0, 6);
          if (!data) return;
          e.preventDefault();
          for (let i = 0; i < inputs.length; i++)
            inputs[i].value = data[i] || "";
          inputs[Math.min(data.length, inputs.length) - 1]?.focus();
        });
      });

      // Resend
      resendBtn?.addEventListener("click", async () => {
        if (typeof onResend !== "function") return;
        resendBtn.disabled = true;
        try {
          const newOtp = await onResend();
          if (newOtp) currentOtp = String(newOtp);
          // Clear inputs after resend
          inputs.forEach((i) => (i.value = ""));
          inputs[0]?.focus();
          // Small toast inside Swal
          Swal.showValidationMessage(""); // clear
          const msg = document.createElement("div");
          msg.style.cssText = "margin-top:8px;color:#065f46;font-weight:600;";
          msg.textContent = "A new OTP has been sent.";
          const content = Swal.getHtmlContainer();
          content.appendChild(msg);
          setTimeout(() => msg.remove(), 2000);
        } catch (e) {
          Swal.showValidationMessage("Failed to resend OTP. Please try again.");
          console.error("Resend failed:", e);
        } finally {
          resendBtn.disabled = false;
        }
      });
    },
    preConfirm: async () => {
      const code = readCode();
      if (!/^\d{6}$/.test(code)) {
        Swal.showValidationMessage("Please enter a valid 6-digit code.");
        return false; // keep dialog open
      }

      if (typeof onConfirm === "function") {
        try {
          // If onConfirm returns true => success; false => failed/keep open
          const ok = await onConfirm(code, { expected: currentOtp, email });
          if (!ok) {
            Swal.showValidationMessage("Incorrect code. Please try again.");
            return false; // keep dialog open
          }
        } catch (e) {
          console.error("onConfirm error:", e);
          Swal.showValidationMessage("Something went wrong. Please try again.");
          return false; // keep dialog open
        }
      }
      // returning nothing / true allows Swal to close
      return true;
    },
  });
}

export const updateUserPassword = async ({ email, newPassword }) => {
  const entered = String(email || "").trim();
  if (!entered) throw new Error("Email is required");
  if (!newPassword) throw new Error("New password is required");

  const { data, error } = await supabase
    .from("user_credentials")
    .update({
      password: newPassword,
    })
    .eq("email", entered)
    .eq("user_roles", 4)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message || "Failed to update password");
  if (!data) throw new Error("Admin account not found");

  return true;
};
