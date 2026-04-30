
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { to, cc, bcc, subject, message, attachments } = req.body;

    // Create the transporter with the provided credentials
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: "hasibulhaque.info@gmail.com",
        pass: "fbbn dqxg otqj ibld", // App Password
      },
    });

    // Verify connection configuration
    await new Promise((resolve, reject) => {
        transporter.verify(function (error, success) {
            if (error) {
                console.error("SMTP Connection Error:", error);
                reject(error);
            } else {
                console.log("SMTP Server is ready");
                resolve(success);
            }
        });
    });

    // Send the email
    await transporter.sendMail({
      from: `"AI Registrar" <hasibulhaque.info@gmail.com>`,
      to,
      cc,
      bcc,
      subject,
      text: message,
      attachments: attachments ? attachments.map(att => ({
        filename: att.filename,
        content: att.content,
        encoding: 'base64'
      })) : []
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Email API Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}