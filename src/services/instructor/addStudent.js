import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

export const openAddStudent = async () => {
  return MySwal.fire({
    title: "",
    html: `
      <div style="text-align: left; padding-bottom: 6px; border-bottom: 2px solid #3B0304; margin-bottom: 0.8rem;">
        <h5 style="margin: 0; font-weight: 600; color: #3B0304; font-size: 1rem;">
          Student Details
        </h5>
      </div>

      <div style="padding: 0; max-width: 600px; margin: 0 auto;">
        <!-- Row 1 -->
        <div style="display: flex; gap: 0.6rem; margin-bottom: 0.8rem;">
          <input id="user_id" class="swal2-input" placeholder="Student ID" 
            style="flex:1; height: 38px; margin:0;" />
          <input id="password" class="swal2-input" placeholder="Password" 
            style="flex:1; height: 38px; margin:0;" />
        </div>

        <!-- Row 2 -->
        <div style="display: flex; gap: 0.6rem; margin-bottom: 1rem;">
          <input id="first_name" class="swal2-input" placeholder="First Name" 
            style="flex:1; height: 38px; margin:0;" />
          <input id="last_name" class="swal2-input" placeholder="Last Name" 
            style="flex:1; height: 38px; margin:0;" />
          <input id="middle_name" class="swal2-input" placeholder="Middle Name" 
            style="flex:1; height: 38px; margin:0;" />
        </div>

        <!-- Buttons -->
        <div style="display: flex; justify-content: center; gap: 1rem;">
          <button id="cancel-btn"
            style="border: 1px solid #3B0304; background-color: #fff; color: #000; font-weight: 500; padding: 0.4rem 1.4rem; border-radius: 6px; cursor:pointer;">
            Cancel
          </button>
          <button id="confirm-btn"
            style="background-color: #3B0304; color: #fff; font-weight: 500; padding: 0.4rem 1.4rem; border-radius: 6px; cursor:pointer;">
            Confirm
          </button>
        </div>
      </div>
    `,
    width: "600px", // ✅ control overall width
    showConfirmButton: false,
    showCloseButton: false,
    didOpen: () => {
      const popup = Swal.getPopup();
      popup.querySelector("#cancel-btn").onclick = () => Swal.close();
      popup.querySelector("#confirm-btn").onclick = () => {
        Swal.clickConfirm();
      };
    },
    preConfirm: () => {
      const user_id = document.getElementById("user_id").value.trim();
      const password = document.getElementById("password").value.trim();
      const first_name = document.getElementById("first_name").value.trim();
      const last_name = document.getElementById("last_name").value.trim();
      const middle_name = document.getElementById("middle_name").value.trim();

      if (!user_id || !password || !first_name || !last_name) {
        MySwal.showValidationMessage(
          "Please fill out all required fields (ID, Password, First, Last Name)."
        );
        return false;
      }

      if (/\d/.test(first_name) || /\d/.test(last_name)) {
        MySwal.showValidationMessage(
          "Numbers in First Name or Last Name are not allowed."
        );
        return false;
      }

      return { user_id, password, first_name, last_name, middle_name };
    },
  });
};
