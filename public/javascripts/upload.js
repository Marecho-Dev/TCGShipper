document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("file-upload");
  const dataTable = document.getElementById("data-table");
  const returnAddressInput = document.getElementById("return-address");
  const printLabelsButton = document.getElementById("print-labels");
  const labelContainer = document.getElementById("label-container");
  let shippingData = [];

  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) {
      console.log("No file selected");
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      shippingData = XLSX.utils.sheet_to_json(sheet);

      // Create table
      let tableHTML =
        '<table border="1"><tr><th>Order #</th><th>Name</th><th>Address 1</th><th>Address 2</th><th>City</th><th>State</th><th>Postal Code</th><th>Country</th></tr>';
      shippingData.forEach((row) => {
        tableHTML += `<tr>
            <td>${row["Order #"] || ""}</td>
            <td>${row.FirstName} ${row.LastName}</td>
            <td>${row.Address1 || ""}</td>
            <td>${row.Address2 || ""}</td>
            <td>${row.City || ""}</td>
            <td>${row.State || ""}</td>
            <td>${row.PostalCode || ""}</td>
            <td>${row.Country || ""}</td>
          </tr>`;
      });
      tableHTML += "</table>";

      dataTable.innerHTML = tableHTML;
    };
    reader.readAsArrayBuffer(file);
  });

  printLabelsButton.addEventListener("click", () => {
    const returnAddress = returnAddressInput.value.split("\n");
    if (returnAddress.length < 3 || shippingData.length === 0) {
      alert(
        "Please enter a complete return address (3 lines) and upload a file."
      );
      return;
    }

    labelContainer.innerHTML = "";

    // Use a Set to keep track of processed order numbers
    const processedOrders = new Set();

    shippingData.forEach((row) => {
      if (!row["Order #"] || processedOrders.has(row["Order #"])) return; // Skip if no order number or already processed
      processedOrders.add(row["Order #"]);

      const canvas = document.createElement("canvas");
      canvas.width = 950; // Standard #10 envelope width (9.5 inches * 100)
      canvas.height = 411; // Standard #10 envelope height (4.11 inches * 100)
      const ctx = canvas.getContext("2d");

      // White background
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Return Address
      ctx.fillStyle = "black";
      ctx.font = "14px Arial";
      ctx.fillText(returnAddress[0], 30, 30);
      ctx.fillText(returnAddress[1], 30, 50);
      ctx.fillText(returnAddress[2], 30, 70);

      // Recipient Address
      ctx.font = "bold 16px Arial";
      const recipientName = `${row.FirstName} ${row.LastName}`.toUpperCase();
      const recipientAddress = row.Address1.toUpperCase();
      const recipientCityStateZip =
        `${row.City}, ${row.State} ${row.PostalCode}`.toUpperCase();

      // Adjust centerX to move content slightly to the left
      const centerX = canvas.width / 2 - 50;
      const centerY = canvas.height / 2;

      ctx.fillText(recipientName, centerX, centerY - 20);
      ctx.fillText(recipientAddress, centerX, centerY + 10);
      ctx.fillText(recipientCityStateZip, centerX, centerY + 40);

      labelContainer.appendChild(canvas);
    });

    window.print();
  });
});
