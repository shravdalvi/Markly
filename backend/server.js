// require('dotenv').config();
// const express = require('express');
// const cors    = require('cors');
// const twilio  = require('twilio');

// require("dotenv").config();
// const twilio = require("twilio");

// const client = twilio(
//   process.env.TWILIO_ACCOUNT_SID,
//   process.env.TWILIO_AUTH_TOKEN
// );

// await client.messages.create({
//   from: "whatsapp:+14155238886", // sandbox number
//   to: "whatsapp:+919082888285",
//   body: "Hello! Your system is working 🚀",
// });

// const app  = express();
// const PORT = process.env.PORT || 5000;

// app.use(cors());
// app.use(express.json());

// app.get('/', (req, res) => {
//   res.json({ status: 'Backend is running ✅' });
// });

// // POST /api/send-sms
// app.post('/api/send-sms', async (req, res) => {
//   const { phoneNumber, customMessage } = req.body;

//   if (!phoneNumber || !customMessage) {
//     return res.status(400).json({ success: false, message: 'Missing data' });
//   }

//   try {
//     const client = twilio(
//       process.env.TWILIO_ACCOUNT_SID,
//       process.env.TWILIO_AUTH_TOKEN
//     );

//     // Format phone number (ensure + is included if it's missing, though front-end should pass +)
//     const toPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

//     const message = await client.messages.create({
//       messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID || 'MG4775968e35e79a6e2e03b9502524f775',
//       to: toPhone,
//       body: customMessage,
//     });

//     console.log("✅ SMS sent:", message.sid);

//     res.json({
//       success: true,
//       message: 'SMS sent successfully',
//       sid: message.sid
//     });

//   } catch (err) {
//     console.log("❌ ERROR:", err.message);

//     res.status(500).json({
//       success: false,
//       message: err.message
//     });
//   }
// });

// // ✅ Test route to verify the new messaging service configuration
// app.get('/test-sms', async (req, res) => {
//   try {
//     const client = twilio(
//       process.env.TWILIO_ACCOUNT_SID,
//       process.env.TWILIO_AUTH_TOKEN
//     );

//     const message = await client.messages.create({
//       messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID || 'MG4775968e35e79a6e2e03b9502524f775',
//       to: '+919082888285', // Default test number from user request
//       body: 'Ahoy 👋 - Testing Markly Notification System!',
//     });

//     console.log("✅ Test SMS sent:", message.sid);
//     res.send(`Test SMS Sent ✅ (SID: ${message.sid})`);

//   } catch (err) {
//     console.log("❌ ERROR:", err.message);
//     res.status(500).send("Error: " + err.message);
//   }
// });

// app.listen(PORT, () => {
//   console.log(`🚀 Backend running on http://localhost:${PORT}`);
// });

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const twilio = require("twilio");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

/* =========================
   TWILIO CLIENT (ONLY ONCE)
========================= */
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/* =========================
   ROOT CHECK
========================= */
app.get("/", (req, res) => {
  res.json({ status: "Backend is running ✅" });
});

/* =========================
   SEND SMS
========================= */
app.post("/api/send-sms", async (req, res) => {
  const { phoneNumber, customMessage } = req.body;

  if (!phoneNumber || !customMessage) {
    return res.status(400).json({
      success: false,
      message: "Missing phoneNumber or message",
    });
  }

  try {
    const toPhone = phoneNumber.startsWith("+")
      ? phoneNumber
      : `+${phoneNumber}`;

    const message = await client.messages.create({
      messagingServiceSid:
        process.env.TWILIO_MESSAGING_SERVICE_SID ||
        "MG4775968e35e79a6e2e03b9502524f775",
      to: toPhone,
      body: customMessage,
    });

    console.log("✅ SMS sent:", message.sid);

    res.json({
      success: true,
      sid: message.sid,
    });
  } catch (err) {
    console.log("❌ SMS ERROR:", err.message);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* =========================
   SEND ATTENDANCE EMAIL
========================= */
const nodemailer = require("nodemailer");

app.post("/api/send-attendance", async (req, res) => {
  const { toEmail, ccEmail, subject, body, csvData, filename } = req.body;

  if (!toEmail || !csvData) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER || "markly.app.demo@gmail.com", 
        pass: process.env.EMAIL_PASS || "replace_with_app_password",
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER || "markly.app.demo@gmail.com",
      to: toEmail,
      cc: ccEmail,
      subject: subject,
      text: body,
      attachments: [
        {
          filename: filename || "attendance.csv",
          content: csvData,
          contentType: "text/csv",
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.messageId);
    res.json({ success: true, messageId: info.messageId });
  } catch (err) {
    console.log("❌ Email ERROR:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* =========================
   SEND WHATSAPP MESSAGE
========================= */
app.post("/api/send-whatsapp", async (req, res) => {
  const { phoneNumber, message } = req.body;

  if (!phoneNumber || !message) {
    return res.status(400).json({
      success: false,
      message: "Missing phoneNumber or message",
    });
  }

  try {
    const toPhone = phoneNumber.startsWith("+")
      ? phoneNumber
      : `+${phoneNumber}`;

    const msg = await client.messages.create({
      from: "whatsapp:+14155238886",
      to: `whatsapp:${toPhone}`,
      body: message,
    });

    console.log("✅ WhatsApp sent:", msg.sid);

    res.json({
      success: true,
      sid: msg.sid,
    });
  } catch (err) {
    console.log("❌ WhatsApp ERROR:", err.message);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});
/* =========================
   TEST WHATSAPP
========================= */
app.get("/test-whatsapp", async (req, res) => {
  try {
    const msg = await client.messages.create({
      from: "whatsapp:+14155238886",
      to: "whatsapp:+919082888285",
      body: "Hello Shravani 👋 WhatsApp is working!",
    });

    res.send("WhatsApp sent ✅ " + msg.sid);
  } catch (err) {
    console.log(err.message);
    res.status(500).send(err.message);
  }
});

/* =========================
   TEST SMS
========================= */
app.get("/test-sms", async (req, res) => {
  try {
    const message = await client.messages.create({
      messagingServiceSid:
        process.env.TWILIO_MESSAGING_SERVICE_SID ||
        "MG4775968e35e79a6e2e03b9502524f775",
      to: "+919082888285",
      body: "Testing Markly SMS 🚀",
    });

    res.send("SMS sent ✅ " + message.sid);
  } catch (err) {
    console.log(err.message);
    res.status(500).send(err.message);
  }
});

/* =========================
   START SERVER
========================= */
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});