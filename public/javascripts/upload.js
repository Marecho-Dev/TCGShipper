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
      const scale = 2;
      canvas.width = 950 * scale; // Standard #10 envelope width (9.5 inches * 100)
      canvas.height = 411 * scale; // Standard #10 envelope height (4.11 inches * 100)
      canvas.style.width = "950px";
      canvas.style.height = "411px";
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      ctx.textRendering = "optimizeLegibility";

      // Scale everything
      ctx.scale(scale, scale);

      // White background
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width / scale, canvas.height / scale);

      // Return Address
      ctx.fillStyle = "black";
      ctx.font = "bold 14px Arial";
      ctx.textBaseLine = "top";

      ctx.fillText(returnAddress[0], 30, 30);
      ctx.fillText(returnAddress[1], 30, 50);
      ctx.fillText(returnAddress[2], 30, 70);
      returnAddress.forEach((line, index) => {
        ctx.fillText(line, 30, 30 + index * 20);
      });
      // Recipient Address
      ctx.font = "bold 16px Arial";
      const recipientName = `${row.FirstName} ${row.LastName}`.toUpperCase();
      const recipientAddress = row.Address1.toUpperCase();
      const recipientCityStateZip =
        `${row.City}, ${row.State} ${row.PostalCode}`.toUpperCase();

      const centerX = 475 - 200; // Adjust this value to move text left or right
      const centerY = 205; // Adjust this value to move text up or down

      ctx.fillText(recipientName, centerX, centerY);
      ctx.fillText(recipientAddress, centerX, centerY + 30);
      ctx.fillText(recipientCityStateZip, centerX, centerY + 60);

      ctx.strokeStyle = "black";
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, canvas.width / scale, canvas.height / scale);

      labelContainer.appendChild(canvas);
    });

    window.print();
  });
});
