import express from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { sendMail } from "../lib/mailer.js";

const router = express.Router();

const limiter = rateLimit({ windowMs: 60 * 1000, max: 5, standardHeaders: true });

router.post("/", limiter, async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(1).max(120),
      email: z.string().email(),
      subject: z.string().min(1).max(200),
      message: z.string().min(1).max(5000),
    });
    const { name, email, subject, message } = schema.parse(req.body);
    const inbox = process.env.CONTACT_INBOX || process.env.EMAIL_USER;

    await sendMail({
      to: inbox,
      replyTo: email,
      subject: `[NoteShare contact] ${subject}`,
      text: `From: ${name} <${email}>\n\n${message}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px">
          <h2>New contact message</h2>
          <p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
          <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
          <hr>
          <pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(message)}</pre>
        </div>`,
    });

    // Also send the sender a confirmation copy.
    await sendMail({
      to: email,
      subject: "We received your message — NoteShare",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px">
          <h2>Thanks for reaching out, ${escapeHtml(name)}!</h2>
          <p>We received your message and will get back to you shortly.</p>
          <blockquote style="border-left:3px solid #ddd;padding:8px 14px;color:#555">${escapeHtml(message)}</blockquote>
          <p style="color:#999;font-size:12px">— The NoteShare team</p>
        </div>`,
    });

    res.json({ ok: true });
  } catch (e) { next(e); }
});

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

export default router;