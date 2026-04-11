import nodemailer from 'nodemailer';

export const sendEmail = async (options) => {
  // Create a reusable transporter using Gmail SMTP
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `WardWatch Registration <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  await transporter.sendMail(mailOptions);
};

export const sendVerificationEmail = async (email, otpCode) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #1a365d; text-align: center;">Welcome to WardWatch!</h2>
      <p style="text-align: center;">To secure your account, please verify your email address. Your 6-digit confirmation code is:</p>
      
      <div style="background-color: #f3f4f6; margin: 20px 0; padding: 20px; text-align: center; border-radius: 8px;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2563eb;">${otpCode}</span>
      </div>
      
      <p style="text-align: center; color: #666; font-size: 14px;">This code will expire in 15 minutes.</p>
      <br />
      <p style="text-align: center; color: #999; font-size: 12px;">If you didn't request this code, please ignore this email securely.</p>
    </div>
  `;

  await sendEmail({
    email,
    subject: 'Action Required: Verify your WardWatch Email Address',
    html,
  });
};
