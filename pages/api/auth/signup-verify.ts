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
    return res.status(400).json({ error: "MISSING_FIELDS" });
  }

  const payload = verifySignupToken(token);
  if (!payload) {
    return res.status(400).json({ error: "INVALID_TOKEN" });
  }

  if (payload.code !== code) {
    return res.status(400).json({ error: "INCORRECT_CODE" });
  }

  const email = payload.email?.trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: "INVALID_EMAIL" });
  }

  const venueName =
    typeof payload.venue === "string" ? payload.venue.trim() : "";
  if (!venueName) {
    return res.status(400).json({ error: "INVALID_VENUE" });
  }

  const passwordOk =
    typeof password === "string" &&
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password);
  if (!passwordOk) {
    return res
      .status(400)
      .json({ error: "WEAK_PASSWORD" });
  }

  const db = await getDb();
  const existing = await db.collection("users").findOne({ email });
  if (existing) {
    return res.status(409).json({ error: "EMAIL_EXISTS" });
  }

  const now = new Date();
  const passwordHash = await bcrypt.hash(password, 10);
  const venueInsert = await db.collection("venues").insertOne({
    name: venueName,
    langs: ["en", "de"],
    defaultLang: "en",
    menu: { categories: [] },
    menuConfig: {
      withImages: false,
      menuBackgroundColor: "#0f172a",
      currency: "€",
      menuImage: "fastFood",
    },
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
