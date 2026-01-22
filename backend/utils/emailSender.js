import nodemailer from 'nodemailer';
import Logger from './logger.js';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // IMPORTANT: Must be a 16-character Google App Password
  },
});

/**
 * Sends a verification email to a new user, dynamically building the link.
 * @param {string} email - The recipient's email address.
 * @param {string} name - The recipient's name.
 * @param {string} verificationToken - The unique token for email verification.
 * @param {string} origin - The origin URL of the request (e.g., 'https://tenant.example.com').
 */
const sendVerificationEmail = async (email, name, verificationToken, origin) => {
  let frontendUrl;
  const rootDomain = process.env.ROOT_DOMAIN;

  // --- Dynamic URL Logic ---
  // In production, validate the origin against the root domain for security.
  if (process.env.NODE_ENV === 'production' && origin && rootDomain && origin.endsWith(rootDomain)) {
    frontendUrl = origin;
  } else {
    // For development or if origin is missing, use a fallback from .env or a default.
    frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  }

  const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}`;

  const mailOptions = {
    from: `"Momentum Manager" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Email Address for Momentum Manager',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f4f7f9;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0,0,0,0.05);
          }
          .header {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            padding: 40px 20px;
            text-align: center;
          }
          .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -0.5px;
          }
          .content {
            padding: 40px;
            color: #334155;
            line-height: 1.6;
          }
          .content h2 {
            color: #0f172a;
            font-size: 24px;
            margin-top: 0;
            margin-bottom: 20px;
          }
          .content p {
            font-size: 16px;
            margin-bottom: 30px;
          }
          .cta-container {
            text-align: center;
            margin: 40px 0;
          }
          .cta-button {
            display: inline-block;
            padding: 16px 36px;
            font-size: 16px;
            font-weight: 600;
            color: #ffffff !important;
            background-color: #2563eb;
            text-decoration: none;
            border-radius: 12px;
            transition: background-color 0.2s;
            box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
          }
          .cta-button:hover {
            background-color: #1d4ed8;
          }
          .footer {
            padding: 30px;
            text-align: center;
            background-color: #f8fafc;
            border-top: 1px solid #e2e8f0;
          }
          .footer p {
            font-size: 13px;
            color: #64748b;
            margin: 5px 0;
          }
          .trouble {
            font-size: 12px;
            color: #94a3b8;
            margin-top: 20px;
            word-break: break-all;
          }
          @media only screen and (max-width: 600px) {
            .container {
              margin: 0;
              border-radius: 0;
              width: 100% !important;
            }
            .content {
              padding: 30px 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Momentum Manager</h1>
          </div>
          <div class="content">
            <h2>Welcome, ${name}!</h2>
            <p>Thank you for choosing Momentum Manager. We're excited to have you on board! To get started and secure your account, please verify your email address by clicking the button below.</p>
            <div class="cta-container">
              <a href="${verificationLink}" class="cta-button">Verify Your Email</a>
            </div>
            <p>If you didn't create an account with us, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Momentum Manager. All rights reserved.</p>
            <p>Empowering your workflow, one task at a time.</p>
            <div class="trouble">
              If you're having trouble clicking the button, copy and paste this URL into your browser:<br/>
              <a href="${verificationLink}" style="color: #2563eb;">${verificationLink}</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    Logger.info(`Verification email sent successfully to [${email}] for origin [${frontendUrl}]`);
  } catch (error) {
    Logger.error(`Error sending verification email to [${email}]:`, error);
  }
};

export {
  sendVerificationEmail,
};
