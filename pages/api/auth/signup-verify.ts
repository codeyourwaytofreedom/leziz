import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { verifySignupToken } from "@/lib/signupToken";
import { getDb } from "@/lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }

  const { code, token, password } = req.body || {};
  if (!code || !token || !password) {
    return res.status(400).json({ error: "Missing code, token, or password" });
  }

  const payload = verifySignupToken(token);
  if (!payload) {
    return res.status(400).json({ error: "Invalid or expired token" });
  }

  if (payload.code !== code) {
    return res.status(400).json({ error: "Incorrect code" });
  }

  const email = payload.email?.trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: "Invalid email" });
  }

  const venueName =
    typeof payload.venue === "string" ? payload.venue.trim() : "";
  if (!venueName) {
    return res.status(400).json({ error: "Invalid venue name" });
  }

  if (typeof password !== "string" || password.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters" });
  }

  const db = await getDb();
  const existing = await db.collection("users").findOne({ email });
  if (existing) {
    return res.status(409).json({ error: "Email already exists" });
  }

  const now = new Date();
  const passwordHash = await bcrypt.hash(password, 10);
  const venueInsert = await db.collection("venues").insertOne({
    name: venueName,
    langs: ["en", "de"],
    defaultLang: "en",
    menu: { categories: [] },
    createdAt: now,
  });

  const publicToken = randomBytes(8).toString("hex");
  await db.collection("public_tokens").insertOne({
    token: publicToken,
    venueId: venueInsert.insertedId,
    venueName,
    active: true,
    createdAt: now,
  });

  await db.collection("users").insertOne({
    email,
    passwordHash,
    role: "owner",
    venueId: venueInsert.insertedId,
    status: "pending",
    plan: payload.plan,
    createdAt: now,
  });

  return res.status(200).json({ ok: true, email, plan: payload.plan });
}
