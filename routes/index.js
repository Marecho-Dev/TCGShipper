const express = require("express");
const router = express.Router();
const multer = require("multer");
const xlsx = require("xlsx");
const PDFDocument = require("pdfkit");
const fs = require("fs");

const upload = multer({ dest: "uploads/" });

console.log("Routes file loaded");

router.get("/", function (req, res, next) {
  console.log("GET / route hit");
  res.render("index", { title: "TCGShipper" });
});

router.post("/api/upload", upload.single("file"), (req, res) => {
  console.log("POST /api/upload route hit");
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("File received:", req.file.originalname);

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    console.log("Parsed data:", data);

    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);

    res.json({ message: "File uploaded and parsed successfully", data });
  } catch (error) {
    console.error("Error processing upload:", error);
    res
      .status(500)
      .json({ error: "Error processing file", details: error.message });
  }
});

router.post("/api/generate-labels", (req, res) => {
  const { returnAddress, shippingData } = req.body;

  const doc = new PDFDocument({ size: "letter" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=shipping_labels.pdf"
  );
  doc.pipe(res);

  shippingData.forEach((item, index) => {
    if (index > 0) {
      doc.addPage();
    }
    doc.fontSize(10).text(returnAddress, 30, 30);
    doc.fontSize(12).text(`${item.FirstName} ${item.LastName}`, 200, 100);
    doc.text(item.Address1);
    if (item.Address2) doc.text(item.Address2);
    doc.text(`${item.City}, ${item.State} ${item.PostalCode}`);
    doc.text(item.Country);
  });

  doc.end();
});

module.exports = router;
