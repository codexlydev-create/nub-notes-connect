import express from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import User from "../models/User.js";
import Otp from "../models/Otp.js";
import { signToken, requireAuth } from "../lib/auth.js";
import { sendMail, otpEmailHtml } from "../lib/mailer.js";

const router = express.Router();

const otpLimiter = rateLimit({ windowMs: 60 * 1000, max: 5, standardHeaders: true });

function genCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
function hashCode(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}
function shortToken() {
  return crypto.randomBytes(24).toString("hex");
}

// In-memory store for "OTP verified" tokens used by signup/reset flows.
// Keyed by token, holds { email, purpose, expiresAt }.
const verifiedTokens = new Map();
function issueOtpToken(email, purpose) {
  const token = shortToken();
  verifiedTokens.set(token, { email, purpose, expiresAt: Date.now() + 15 * 60 * 1000 });
  return token;
}
function consumeOtpToken(token, email, purpose) {
  const entry = verifiedTokens.get(token);
  if (!entry) return false;
  if (entry.email !== email || entry.purpose !== purpose) return false;
  if (entry.expiresAt < Date.now()) { verifiedTokens.delete(token); return false; }
  verifiedTokens.delete(token);
  return true;
}

/* -------- send-otp -------- */
router.post("/send-otp", otpLimiter, async (req, res, next) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      purpose: z.enum(["signup", "login", "reset"]),
    });
    const { email, purpose } = schema.parse(req.body);
    const lower = email.toLowerCase();

    if (purpose === "signup") {
      const exists = await User.findOne({ email: lower });
      if (exists) return res.status(409).json({ error: "Account already exists" });
    }
    if (purpose === "reset" || purpose === "login") {
      const exists = await User.findOne({ email: lower });
      if (!exists) return res.status(404).json({ error: "No account with that email" });
    }

    const code = genCode();
    await Otp.deleteMany({ email: lower, purpose, consumed: false });
    await Otp.create({
      email: lower,
      purpose,
      codeHash: hashCode(code),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendMail({
      to: lower,
      subject: `Your NoteShare code: ${code}`,
      html: otpEmailHtml({ code, purpose }),
      text: `Your NoteShare verification code is ${code}. It expires in 10 minutes.`,
    });

    res.json({ ok: true, message: "OTP sent" });
  } catch (e) { next(e); }
});

/* -------- verify-otp -------- */
router.post("/verify-otp", async (req, res, next) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      code: z.string().length(6),
      purpose: z.enum(["signup", "login", "reset"]),
    });
    const { email, code, purpose } = schema.parse(req.body);
    const lower = email.toLowerCase();

    const otp = await Otp.findOne({ email: lower, purpose, consumed: false }).sort({ createdAt: -1 });
    if (!otp) return res.status(400).json({ error: "No OTP requested or it has expired" });
    if (otp.expiresAt < new Date()) return res.status(400).json({ error: "OTP expired, request a new one" });
    if (otp.attempts >= 5) return res.status(429).json({ error: "Too many attempts, request a new code" });

    if (otp.codeHash !== hashCode(code)) {
      otp.attempts += 1; await otp.save();
      return res.status(400).json({ error: "Incorrect code" });
    }
    otp.consumed = true; await otp.save();

    if (purpose === "login") {
      const user = await User.findOne({ email: lower });
      const token = signToken(user);
      return res.json({ ok: true, token, user: user.toPublic() });
    }

    // signup or reset → return a one-shot otpToken used by the next call
    const otpToken = issueOtpToken(lower, purpose);
    return res.json({ ok: true, otpToken });
  } catch (e) { next(e); }
});

/* -------- signup (after verify-otp signup) -------- */
router.post("/signup", async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(2).max(80),
      email: z.string().email(),
      password: z.string().min(6).max(100),
      studentId: z.string().min(2).max(40).optional().default(""),
      otpToken: z.string().min(10),
    });
    const { name, email, password, studentId, otpToken } = schema.parse(req.body);
    const lower = email.toLowerCase();
    if (!consumeOtpToken(otpToken, lower, "signup"))
      return res.status(400).json({ error: "OTP not verified or expired" });
    if (await User.findOne({ email: lower }))
      return res.status(409).json({ error: "Account already exists" });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email: lower, passwordHash, studentId, emailVerified: true });
    const token = signToken(user);
    res.json({ ok: true, token, user: user.toPublic() });
  } catch (e) { next(e); }
});

/* -------- login (password) -------- */
router.post("/login", async (req, res, next) => {
  try {
    const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
    const { email, password } = schema.parse(req.body);
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: "Invalid email or password" });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid email or password" });
    const token = signToken(user);
    res.json({ ok: true, token, user: user.toPublic() });
  } catch (e) { next(e); }
});

/* -------- reset password -------- */
router.post("/reset-password", async (req, res, next) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      newPassword: z.string().min(6).max(100),
      otpToken: z.string().min(10),
    });
    const { email, newPassword, otpToken } = schema.parse(req.body);
    const lower = email.toLowerCase();
    if (!consumeOtpToken(otpToken, lower, "reset"))
      return res.status(400).json({ error: "OTP not verified or expired" });
    const user = await User.findOne({ email: lower });
    if (!user) return res.status(404).json({ error: "No account with that email" });
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ ok: true });
  } catch (e) { next(e); }
});

/* -------- me -------- */
router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user.toPublic() });
});

export default router;