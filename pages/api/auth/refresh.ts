import type { NextApiRequest, NextApiResponse } from "next";
import { serialize } from "cookie";
import { ObjectId } from "mongodb";

import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }

  const session = getSession(req);
  if (!session?.userId || !ObjectId.isValid(session.userId)) {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }

  const db = await getDb();
  const user = await db
    .collection("users")
    .findOne({ _id: new ObjectId(session.userId) });
  if (!user) {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }

  const sessionValue = JSON.stringify({
    userId: String(user._id),
    role: user.role,
    venueId: user.venueId ?? null,
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
    status: user.status ?? null,
  });
}
