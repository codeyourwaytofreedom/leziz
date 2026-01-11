import type { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "@/lib/mongodb";
import { getRequestIp, loginEmailLimiter, loginIpLimiter } from "@/lib/rateLimit";

import bcrypt from "bcryptjs";
import { serialize } from "cookie";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    return res.status(400).json({ error: "MISSING_CREDENTIALS" });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const ip = getRequestIp(req);
  if (loginIpLimiter) {
    const ipLimit = await loginIpLimiter.limit(ip);
    if (!ipLimit.success) {
      return res.status(429).json({ error: "RATE_LIMITED" });
    }
  }

  const passwordOk =
    typeof password === "string" &&
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail) || !passwordOk) {
    return res.status(401).json({ error: "INVALID_CREDENTIALS" });
  }

  if (loginEmailLimiter) {
    const emailLimit = await loginEmailLimiter.limit(normalizedEmail);
    if (!emailLimit.success) {
      return res.status(429).json({ error: "RATE_LIMITED" });
    }
  }

  const db = await getDb();
  const user = await db.collection("users").findOne({ email: normalizedEmail });

  if (!user) return res.status(401).json({ error: "INVALID_CREDENTIALS" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "INVALID_CREDENTIALS" });

  const sessionValue = JSON.stringify({
    userId: String(user._id),
    role: user.role,
    venueId: user.venueId,
    status: user.status ?? null,
  });

  res.setHeader(
    "Set-Cookie",
    serialize("session", sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    })
  );

  return res.status(200).json({
    ok: true,
    role: user.role ?? null,
    venueId: user.venueId ?? null,
  });
}
