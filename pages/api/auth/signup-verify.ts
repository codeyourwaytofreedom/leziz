import type { NextApiRequest, NextApiResponse } from "next";
import { verifySignupToken } from "@/lib/signupToken";
import { getDb } from "@/lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end();
  }

  const token =
    typeof req.query.token === "string" ? req.query.token : null;
  if (!token) return res.status(400).json({ error: "MISSING_TOKEN" });

  const payload = verifySignupToken(token);
  if (!payload) {
    return res.status(400).json({ error: "INVALID_TOKEN" });
  }

  const db = await getDb();
  const request = await db
    .collection("signup_requests")
    .findOne({ requestId: payload.requestId });
  if (!request) {
    return res.status(404).json({ error: "REQUEST_NOT_FOUND" });
  }
  if (request.expiresAt && request.expiresAt < new Date()) {
    return res.status(400).json({ error: "INVALID_TOKEN" });
  }

  const email = String(request.email || "").trim().toLowerCase();
  const plan = String(request.plan || "");
  const venueName = String(request.venueName || "").trim();
  const passwordHash = String(request.passwordHash || "");

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: "INVALID_EMAIL" });
  }
  if (!plan) return res.status(400).json({ error: "MISSING_PLAN" });
  if (!venueName) return res.status(400).json({ error: "INVALID_VENUE" });
  if (!passwordHash) return res.status(400).json({ error: "INVALID_PASSWORD" });

  const existing = await db.collection("users").findOne({ email });
  if (existing) {
    if (existing.status === "active") {
      return res.status(409).json({ error: "ALREADY_ACTIVE" });
    }
    if (existing.status === "pending") {
      return res.status(200).json({ ok: true, email, plan });
    }
    return res.status(400).json({ error: "INVALID_STATUS" });
  }

  const now = new Date();
  await db.collection("users").insertOne({
    email,
    passwordHash,
    role: "owner",
    venueName,
    status: "pending",
    plan,
    createdAt: now,
  });

  await db.collection("signup_requests").deleteOne({
    requestId: payload.requestId,
  });

  return res.status(200).json({ ok: true, email, plan });
}
