import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

const safeText = (v) => String(v || "").trim();

const drawTemplateClassicBlue = (doc) => {
  const w = doc.page.width;
  const h = doc.page.height;
  doc.rect(0, 0, w, h).fill("#f9fafc");

  // Right blue arcs (approx image style)
  doc
    .path(`M ${w - 180} 0 Q ${w + 10} ${h * 0.3}, ${w - 220} ${h}`)
    .fill("#0ea5e9");
  doc
    .path(`M ${w - 220} 0 Q ${w - 30} ${h * 0.35}, ${w - 250} ${h}`)
    .fill("#38bdf8");
  doc
    .path(`M ${w - 255} 0 Q ${w - 80} ${h * 0.4}, ${w - 275} ${h}`)
    .fill("#7dd3fc");
};

const drawTemplateAcademy = (doc) => {
  const w = doc.page.width;
  const h = doc.page.height;
  doc.rect(0, 0, w, h).fill("#0f6f91");

  doc.circle(120, 80, 80).fill("#f4d35e");
  doc.circle(220, 130, 45).fill("#2d88a7");
  doc.circle(w - 90, h - 90, 70).fill("#2d88a7");
  doc.rect(55, 120, w - 110, h - 220).fill("#f5f7fb");
};

const drawTemplateRibbon = (doc) => {
  const w = doc.page.width;
  const h = doc.page.height;
  doc.rect(0, 0, w, h).fill("#f8fafc");

  doc.polygon([w - 220, 0], [w, 0], [w, 180]).fill("#2563eb");
  doc.polygon([w - 250, 0], [w - 220, 0], [w, 180], [w - 30, 180]).fill(
    "#60a5fa"
  );
  doc.polygon([0, h - 80], [40, h - 120], [40, h - 40]).fill("#e11d48");
};

const drawByTemplate = (doc, templateKey) => {
  if (templateKey === "academy") return drawTemplateAcademy(doc);
  if (templateKey === "ribbon") return drawTemplateRibbon(doc);
  return drawTemplateClassicBlue(doc);
};

export default async function generateCertificate({
  certificateId,
  studentName,
  studentEmail,
  courseTitle,
  issuedOn,
  score,
  verifyUrl,
  templateKey = "classic-blue",
}) {
  const certDir = path.join(process.cwd(), "certificates");
  if (!fs.existsSync(certDir)) fs.mkdirSync(certDir);

  const fileName = `${certificateId}.pdf`;
  const filePath = path.join(certDir, fileName);

  const doc = new PDFDocument({ size: "A4", margin: 0 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  const w = doc.page.width;
  const h = doc.page.height;
  const logoPath = path.join(process.cwd(), "assets", "logo.jpeg");

  drawByTemplate(doc, templateKey);

  // Main white card
  doc.roundedRect(50, 70, w - 100, h - 140, 12).fill("#ffffff");
  doc.roundedRect(50, 70, w - 100, h - 140, 12).lineWidth(1).stroke("#e5e7eb");

  if (fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, w / 2 - 34, 84, { width: 68, height: 68 });
    } catch {
      // logo is optional; continue certificate generation
    }
  }

  doc
    .font("Helvetica-Bold")
    .fontSize(46)
    .fillColor("#1e293b")
    .text("CERTIFICATE", 90, 170, { align: "left" });
  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .fillColor("#1e293b")
    .text("OF ACHIEVEMENT", 90, 225, { align: "left" });

  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor("#1f2937")
    .text("THIS CERTIFICATE IS PROUDLY PRESENTED TO:", 90, 245, {
      align: "left",
    });

  doc
    .font("Times-Italic")
    .fontSize(62)
    .fillColor("#0ea5e9")
    .text(safeText(studentName) || "Student", 90, 285, {
      align: "left",
    });

  doc
    .font("Helvetica")
    .fontSize(16)
    .fillColor("#374151")
    .text(
      `for successfully completing "${safeText(courseTitle) || "Course"}".`,
      90,
      375,
      { width: w - 260 }
    );

  doc
    .font("Helvetica")
    .fontSize(13)
    .fillColor("#4b5563")
    .text(`Issued on: ${safeText(issuedOn)}`, 90, 420);
  if (studentEmail) {
    doc
      .font("Helvetica")
      .fontSize(12)
      .fillColor("#6b7280")
      .text(`Email: ${safeText(studentEmail)}`, 90, 440);
  }
  if (typeof score === "number") {
    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor("#1f2937")
      .text(`Quiz Score: ${score}%`, 90, 460);
  }

  // Signature lines
  doc.moveTo(90, h - 120).lineTo(240, h - 120).stroke("#9ca3af");
  doc.moveTo(w - 270, h - 120).lineTo(w - 120, h - 120).stroke("#9ca3af");
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#1f2937")
    .text("DATE", 140, h - 108);
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#1f2937")
    .text("SIGNATURE", w - 235, h - 108);

  const qrDataUrl = await QRCode.toDataURL(
    verifyUrl || `http://localhost:5000/certificates/${fileName}`,
    { width: 150, margin: 1 }
  );
  const qrBuffer = Buffer.from(
    qrDataUrl.replace(/^data:image\/png;base64,/, ""),
    "base64"
  );
  doc.image(qrBuffer, w - 170, h - 230, { width: 90 });
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#6b7280")
    .text(`ID: ${certificateId}`, w - 190, h - 135, { width: 130, align: "center" });

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  return {
    fileName,
    pdfPath: `/certificates/${fileName}`,
  };
}
