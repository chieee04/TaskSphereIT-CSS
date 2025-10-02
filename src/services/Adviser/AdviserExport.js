import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; 
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

export const exportAdvisersAsPDF = async (credentials) => {
  if (!credentials || credentials.length === 0) {
    Swal.fire("No Data", "There are no adviser accounts to export.", "warning");
    return;
  }

  const result = await MySwal.fire({
    title: "Are you sure?",
    text: "Do you want to export the adviser accounts?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes, Export",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#3B0304",
  });

  if (result.isConfirmed) {
    try {
      const doc = new jsPDF();
      doc.setFontSize(14);
      doc.text("ADVISER ACCOUNTS", 14, 15);

      const tableColumn = [
        "No",
        "Last Name",
        "First Name",
        "Middle Name",
        "Adviser ID",
        "Password",
      ];
      const tableRows = [];

      credentials.forEach((row, index) => {
        const rowData = [
          index + 1,
          row.last_name,
          row.first_name,
          row.middle_name || "",
          row.user_id,
          row.password,
        ];
        tableRows.push(rowData);
      });

      // ✅ gamitin autoTable function
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 25,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [59, 3, 4] },
      });

      doc.save("AdviserAccounts.pdf");
      Swal.fire(
        "Exported!",
        "Adviser accounts have been downloaded.",
        "success"
      );
    } catch (error) {
      console.error("Export error:", error);
      Swal.fire("Error", "Failed to export adviser accounts.", "error");
    }
  }
};
