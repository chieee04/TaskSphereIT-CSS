import Swal from "sweetalert2";
import { supabase } from "../supabaseClient";
import "sweetalert2/dist/sweetalert2.min.css";

export const showChangePasswordModal = async () => {
  const customUser = JSON.parse(localStorage.getItem("customUser"));
  if (!customUser?.user_id) {
    Swal.fire("Error", "User not found. Please log in again.", "error");
    return;
  }

  const { data: user, error } = await supabase
    .from("user_credentials")
    .select("password")
    .eq("user_id", customUser.user_id)
    .single();

  if (error || !user) {
    Swal.fire("Error", "Failed to fetch user data.", "error");
    return;
  }

  Swal.fire({
    title: "",
    html: `
      <div style="text-align: left; padding-bottom: 12px; border-bottom: 2px solid #3B0304; display: flex; align-items: center;">
        <h5 style="margin: 0; display: flex; align-items: center; gap: 10px; font-weight: 600; color: #3B0304; font-size: 1.1rem;">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#3B0304" viewBox="0 0 16 16">
            <path d="M8 0a5 5 0 0 1 5 5v2h1a1 1 0 0 1 1 1v7a1 
              1 0 0 1-1 1H2a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h1V5a5 
              5 0 0 1 5-5zm3 5a3 3 0 0 0-6 0v2h6V5z"/>
          </svg>
          Change Password
        </h5>
      </div>

      <div style="padding: 1.2rem 1.2rem;">
        <div style="display: flex; flex-direction: column; margin-bottom: 1rem;">
          <label for="oldPassword" style="font-weight: 500; margin-bottom: 0.3rem; font-size: 0.85rem; color: #333;">Old Password</label>
          <input id="oldPassword" type="password" class="swal2-input"
            placeholder="Enter old password"
            style="border-radius: 6px; border: 1.5px solid #888; padding: 0.5rem 0.75rem; font-size: 0.9rem; width: 100%; height: 38px; margin-left: 0;" />
        </div>

        <div style="display: flex; flex-direction: column; margin-bottom: 1rem;">
          <label for="newPassword" style="font-weight: 500; margin-bottom: 0.3rem; font-size: 0.85rem; color: #333;">New Password</label>
          <input id="newPassword" type="password" class="swal2-input"
            placeholder="Enter new password"
            style="border-radius: 6px; border: 1.5px solid #888; padding: 0.5rem 0.75rem; font-size: 0.9rem; width: 100%; height: 38px; margin-left: 0;" />
        </div>

        <div style="display: flex; flex-direction: column; margin-bottom: 1.5rem;">
          <label for="confirmPassword" style="font-weight: 500; margin-bottom: 0.3rem; font-size: 0.85rem; color: #333;">Confirm New Password</label>
          <input id="confirmPassword" type="password" class="swal2-input"
            placeholder="Re-enter new password"
            style="border-radius: 6px; border: 1.5px solid #888; padding: 0.5rem 0.75rem; font-size: 0.9rem; width: 100%; height: 38px; margin-left: 0;" />
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 0.5rem;">
          <button id="cancel-btn" class="swal2-cancel"
            style="border: 1.5px solid #3B0304; background-color: #fff; color: #3B0304; font-weight: 500; padding: 0.5rem 1.8rem; border-radius: 6px; cursor: pointer; transition: all 0.2s; font-size: 0.85rem;">
            Cancel
          </button>
          <button id="confirm-btn" class="swal2-confirm"
            style="background-color: #3B0304; color: #fff; font-weight: 500; padding: 0.5rem 1.8rem; border-radius: 6px; cursor: pointer; transition: all 0.2s; font-size: 0.85rem; border: 1.5px solid #3B0304;">
            Confirm
          </button>
        </div>
      </div>
    `,
    showConfirmButton: false,
    showCancelButton: false,
    width: "460px",
    didOpen: () => {
      const popup = Swal.getPopup();
      const cancelBtn = popup.querySelector("#cancel-btn");
      const confirmBtn = popup.querySelector("#confirm-btn");

      cancelBtn.onclick = () => Swal.close();
      confirmBtn.onclick = async () => {
        const oldPass = document.getElementById("oldPassword").value.trim();
        const newPass = document.getElementById("newPassword").value.trim();
        const confirmPass = document.getElementById("confirmPassword").value.trim();

        // 1️⃣ Empty fields
        if (!oldPass || !newPass || !confirmPass) {
          Swal.showValidationMessage("Please fill out all password fields.");
          return;
        }

        // 2️⃣ Check old password
        if (oldPass !== user.password) {
          Swal.showValidationMessage("Old password not match.");
          return;
        }

        // 3️⃣ Check new password match
        if (newPass !== confirmPass) {
          Swal.showValidationMessage("New Password Not Match");
          return;
        }

        // 4️⃣ Update password in Supabase
        const { error: updateError } = await supabase
          .from("user_credentials")
          .update({ password: newPass })
          .eq("user_id", customUser.user_id);

        if (updateError) {
          Swal.fire("Error", "Failed to update password.", "error");
          return;
        }

        Swal.fire("Password Updated!!", "Your password has been successfully changed.", "success");
      };
    },
  });
};
