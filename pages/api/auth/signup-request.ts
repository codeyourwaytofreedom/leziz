import type { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";
import { createSignupToken } from "@/lib/signupToken";

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

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const token = createSignupToken({ email, plan, venue, code });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
  });

  const text = `Your Leziz confirmation code: ${code}. It expires in 15 minutes.`;
  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background:#f8fafc; padding:24px;">
      <div style="max-width:520px; margin:0 auto; background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:24px;">
        <h2 style="margin:0 0 12px 0; font-size:22px; color:#0f172a;">Confirm your email</h2>
        <p style="margin:0 0 16px 0; color:#334155;">Use the code below to continue creating your Leziz account. The code expires in 15 minutes.</p>
        <div style="margin:0 0 20px 0; text-align:center;">
          <span style="display:inline-block; padding:14px 18px; border:1px solid #0ea5e9; border-radius:10px; font-size:24px; letter-spacing:3px; color:#0f172a; background:#e0f2fe; font-weight:700;">${code}</span>
        </div>
        <p style="margin:0 0 8px 0; color:#475569;">Didn’t request this? You can ignore this email.</p>
        <p style="margin:0; color:#94a3b8; font-size:12px;">Sent by Leziz • Secure QR menus that speak every language.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from,
      to: email,
      subject: "Confirm your email",
      text,
      html,
    });
    return res.status(200).json({ token });
  } catch (err) {
    console.error("Signup email failed", err);
    return res.status(500).json({ error: "EMAIL_SEND_FAILED" });
  }
}
