import admin from "firebase-admin";
import { Resend } from "resend";

// ------- FIREBASE CONFIG FROM ENV -------
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
const databaseURL = process.env.FIREBASE_DB_URL;

// ------- MAIL CONFIG -------
const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: databaseURL
});

const db = admin.database();
const mailRef = db.ref("/mail");

// Send mail using Resend
async function sendMail(data) {
  try {
    const result = await resend.emails.send({
      from: "ESP32 Health Monitor <alerts@esp32mail.dev>",
      to: data.to,
      subject: data.subject,
      text: data.body
    });

    console.log("✅ Email sent:", result.id);
    await mailRef.remove();
  } catch (err) {
    console.error("❌ Email error:", err);
  }
}

console.log("🔥 Render server online — watching /mail...");

// Listen for new mail node
mailRef.on("value", async (snap) => {
  const data = snap.val();
  if (data && data.to && data.subject && data.body) {
    console.log("📨 Mail triggered:", data);
    await sendMail(data);
  }
});
