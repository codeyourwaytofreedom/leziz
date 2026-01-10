import type { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { createSignupToken } from "@/lib/signupToken";
import { getDb } from "@/lib/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }

  const { email, password, plan, venue } = req.body || {};
  if (!email || !password || !venue || !plan) {
    return res.status(400).json({ error: "MISSING_FIELDS" });
  }

  const gmailUser = process.env.MAIL;
  const gmailPass = process.env.PW;
  const from = gmailUser;

  if (!gmailUser || !gmailPass) {
    return res.status(500).json({ error: "EMAIL_NOT_CONFIGURED" });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
  });

  const normalizedEmail = String(email).trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail)) {
    return res.status(400).json({ error: "INVALID_EMAIL" });
  }

  const normalizedVenue = typeof venue === "string" ? venue.trim() : "";
  if (!normalizedVenue) {
    return res.status(400).json({ error: "INVALID_VENUE" });
  }

  const passwordOk =
    typeof password === "string" &&
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password);
  if (!passwordOk) {
    return res.status(400).json({ error: "WEAK_PASSWORD" });
  }

  const db = await getDb();
  const existing = await db.collection("users").findOne({ email: normalizedEmail });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const loginUrl = `${baseUrl}/login`;

  if (existing) {
    const text = `You already have a Leziz account. Please log in here: ${loginUrl}`;
    const html = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background:#f8fafc; padding:24px;">
        <div style="max-width:520px; margin:0 auto; background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:24px;">
          <h2 style="margin:0 0 12px 0; font-size:22px; color:#0f172a;">Log in to Leziz</h2>
          <p style="margin:0 0 16px 0; color:#334155;">An account already exists with this email. Log in to continue.</p>
          <div style="margin:0 0 20px 0; text-align:center;">
            <a href="${loginUrl}" style="display:inline-block; padding:12px 18px; border-radius:10px; background:#0ea5e9; color:#ffffff; text-decoration:none; font-weight:700;">Go to login</a>
          </div>
          <p style="margin:0; color:#94a3b8; font-size:12px;">Sent by Leziz • Secure QR menus that speak every language.</p>
        </div>
      </div>
    `;
    try {
      await transporter.sendMail({
        from,
        to: normalizedEmail,
        subject: "Log in to Leziz",
        text,
        html,
      });
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error("Signup email failed", err);
      return res.status(500).json({ error: "EMAIL_SEND_FAILED" });
    }
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);
  const passwordHash = await bcrypt.hash(password, 10);
  const requestId = randomBytes(16).toString("hex");

  await db.collection("signup_requests").updateOne(
    { email: normalizedEmail },
    {
      $set: {
        requestId,
        email: normalizedEmail,
        plan,
        venueName: normalizedVenue,
        passwordHash,
        createdAt: now,
        expiresAt,
      },
    },
    { upsert: true }
  );

  const token = createSignupToken({ requestId });
  const verifyUrl = `${baseUrl}/signup/verify?token=${encodeURIComponent(
    token
  )}`;

  const text = `Confirm your Leziz account: ${verifyUrl}`;
  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background:#f8fafc; padding:24px;">
      <div style="max-width:520px; margin:0 auto; background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:24px;">
        <h2 style="margin:0 0 12px 0; font-size:22px; color:#0f172a;">Confirm your email</h2>
        <p style="margin:0 0 16px 0; color:#334155;">Click the button below to finish creating your Leziz account. The link expires in 15 minutes.</p>
        <div style="margin:0 0 20px 0; text-align:center;">
          <a href="${verifyUrl}" style="display:inline-block; padding:12px 18px; border-radius:10px; background:#0ea5e9; color:#ffffff; text-decoration:none; font-weight:700;">Confirm email</a>
        </div>
        <p style="margin:0 0 8px 0; color:#475569;">Didn’t request this? You can ignore this email.</p>
        <p style="margin:0; color:#94a3b8; font-size:12px;">Sent by Leziz • Secure QR menus that speak every language.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from,
      to: normalizedEmail,
      subject: "Confirm your email",
      text,
      html,
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Signup email failed", err);
    return res.status(500).json({ error: "EMAIL_SEND_FAILED" });
  }
}
