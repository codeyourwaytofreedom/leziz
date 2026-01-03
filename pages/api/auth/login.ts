import type { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "@/lib/mongodb";

import bcrypt from "bcryptjs";
import { serialize } from "cookie";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) return res.status(400).json({ error: "Missing email or password" });

  const db = await getDb();
  const user = await db.collection("users").findOne({ email: email.toLowerCase().trim() });

  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const sessionValue = JSON.stringify({
    userId: String(user._id),
    role: user.role,
    venueId: user.venueId,
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
