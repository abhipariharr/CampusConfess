const nodemailer = require('nodemailer');

function createTransporter() {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  // Dev: log to console
  return nodemailer.createTransport({ jsonTransport: true });
}

async function sendPasswordResetEmail(toEmail, resetLink) {
  const transporter = createTransporter();
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'no-reply@campusconfess.local',
    to:   toEmail,
    subject: 'CampusConfess — Reset Your Password',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:auto;background:#12122a;color:#f1f5f9;border-radius:16px;padding:32px;">
        <h2 style="background:linear-gradient(135deg,#7c3aed,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent">
          CampusConfess
        </h2>
        <p>You requested a password reset. Click the button below — this link expires in <strong>1 hour</strong>.</p>
        <a href="${resetLink}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;padding:12px 28px;border-radius:50px;text-decoration:none;font-weight:600;margin:16px 0;">
          Reset Password
        </a>
        <p style="color:#64748b;font-size:13px;">If you did not request this, ignore this email. Your password will not change.</p>
        <p style="color:#64748b;font-size:12px;">Link: ${resetLink}</p>
      </div>
    `,
  };

  if (!process.env.SMTP_USER) {
    console.log('\n📧 [DEV MODE — No SMTP Configured]');
    console.log(`Password reset link for ${toEmail}:`);
    console.log(resetLink + '\n');
    return;
  }

  await transporter.sendMail(mailOptions);
}

module.exports = { sendPasswordResetEmail };
