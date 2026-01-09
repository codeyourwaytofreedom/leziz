import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();

  const session = getSession(req);
  if (!session || session.role !== "bigboss") {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }

  const { email, password, venueId } = req.body as {
    email?: string;
    password?: string;
    venueId?: string;
  };

  const normalizedEmail = email?.trim().toLowerCase();
  if (
    !normalizedEmail ||
    !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail)
  ) {
    return res.status(400).json({ error: "INVALID_EMAIL" });
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

  if (!venueId || !ObjectId.isValid(venueId)) {
    return res.status(400).json({ error: "INVALID_VENUE_ID" });
  }

  const db = await getDb();

  const existing = await db
    .collection("users")
    .findOne({ email: normalizedEmail });
  if (existing) {
    return res.status(409).json({ error: "EMAIL_EXISTS" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date();

  const insert = await db.collection("users").insertOne({
    email: normalizedEmail,
    passwordHash,
    role: "owner",
    venueId: new ObjectId(venueId),
    createdAt: now,
  });

  return res.status(200).json({ ok: true, userId: insert.insertedId.toString() });
}
