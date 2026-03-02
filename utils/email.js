const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  try {
    // 1) Create Transporter with Gmail (or any real SMTP service)
    const transporter = nodemailer.createTransport({
      service: "Gmail", // or use "smtp.gmail.com" with host and port
      auth: {
        user: process.env.EMAIL_USERNAME, // your Gmail address
        pass: process.env.EMAIL_PASSWORD, // your Gmail app password (not account password)
      },
    });

    // 2) Email options
    const mailOptions = {
      from: "Ecommerce Store <fs341483@gmail.com>",
      to: options.email,
      subject: options.subject,
      text: options.message,
    };

    // 3) Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

module.exports = sendEmail;
