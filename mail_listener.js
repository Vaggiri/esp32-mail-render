import admin from "firebase-admin";
import { Resend } from "resend";
import http from "http";

// -------- HTTP SERVER FOR RENDER --------
const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
  res.writeHead(200, {"Content-Type": "text/plain"});
  res.end("ESP32 Mail Listener is running\n");
}).listen(PORT, () => {
  console.log(`🚀 Web server running on port ${PORT}`);
});

// -------- FIREBASE CONFIG --------
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DB_URL
});

const db = admin.database();
const mailRef = db.ref("/mail");

// -------- RESEND MAIL CONFIG --------
const resend = new Resend(process.env.RESEND_API_KEY);

// -------- SEND EMAIL --------
async function sendMail(data) {
  try {
    const result = await resend.emails.send({
      from: "ESP32 Health Monitor <onboarding@resend.dev>",
      to: data.to,
      subject: data.subject,
      text: data.body
    });

    console.log("✅ Email sent:", result);
    await mailRef.remove();
  } catch (err) {
    console.error("❌ Email error:", err);
  }
}

console.log("🔥 Render server online — watching /mail...");

// -------- FIREBASE LISTENER --------
mailRef.on("value", async (snap) => {
  const data = snap.val();
  if (data && data.to && data.subject && data.body) {
    console.log("📨 Mail triggered:", data);
    await sendMail(data);
  }
});
