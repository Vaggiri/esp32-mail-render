import admin from "firebase-admin";
import nodemailer from "nodemailer";

// FIREBASE CONFIG FROM ENV VAR
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DB_URL
});

// Realtime Database reference
const db = admin.database();
const mailRef = db.ref("/mail");

// Gmail SMTP transport
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

async function processMail(data) {
  if (!data || !data.to || !data.subject || !data.body) return;

  const mailOptions = {
    from: `"ESP32 Health Monitor" <${process.env.GMAIL_USER}>`,
    to: data.to,
    subject: data.subject,
    text: data.body,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Email sent to:", data.to);
    await mailRef.remove();
  } catch (err) {
    console.error("❌ Error sending email:", err);
  }
}

console.log("🔥 Render server active — listening for /mail changes...");
mailRef.on("value", async (snap) => {
  const data = snap.val();
  if (data) await processMail(data);
});
