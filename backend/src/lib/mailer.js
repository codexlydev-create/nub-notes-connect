import nodemailer from "nodemailer";

let cachedTransport = null;

export function getTransport() {
  if (cachedTransport) return cachedTransport;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error("EMAIL_USER and EMAIL_APP_PASSWORD must be set in backend/.env");
  }
  cachedTransport = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  return cachedTransport;
}

export async function sendMail({ to, subject, html, text, replyTo }) {
  const transport = getTransport();
  const from = `NoteShare <${process.env.EMAIL_USER}>`;
  return transport.sendMail({ from, to, subject, html, text, replyTo });
}

export function otpEmailHtml({ code, purpose }) {
  const purposeLabel =
    purpose === "signup" ? "verify your account" :
    purpose === "reset" ? "reset your password" :
    "sign in";
  return `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px">
    <h2 style="margin:0 0 12px;color:#111">NoteShare verification code</h2>
    <p style="color:#444;line-height:1.5">Use this code to ${purposeLabel}. It expires in 10 minutes.</p>
    <div style="font-size:32px;font-weight:700;letter-spacing:6px;background:#f5f3ff;color:#5b21b6;padding:16px;text-align:center;border-radius:10px;margin:16px 0">${code}</div>
    <p style="color:#888;font-size:12px">If you didn't request this, you can safely ignore this email.</p>
  </div>`;
}