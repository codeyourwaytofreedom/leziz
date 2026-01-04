import type { NextApiRequest, NextApiResponse } from "next";
import { randomBytes } from "crypto";

import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();

  const session = getSession(req);
  if (!session || session.role !== "bigboss") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { name, languages, defaultLang } = req.body as {
    name?: string;
    languages?: string[];
    defaultLang?: string;
  };

  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "Name is required" });
  }

  const langsRaw =
    Array.isArray(languages) && languages.length > 0
      ? languages.map((l) => l.trim()).filter(Boolean)
      : ["en", "de", "tr"];

  const primaryLang = (defaultLang || langsRaw[0] || "en").trim();
  const langs = Array.from(
    new Set([primaryLang, ...langsRaw.filter(Boolean)])
  );

  const db = await getDb();

  const now = new Date();
  const insert = await db.collection("venues").insertOne({
    name: name.trim(),
    langs,
    defaultLang: primaryLang,
    menu: { categories: [] },
    createdAt: now,
  });

  const token = randomBytes(8).toString("hex");
  await db.collection("public_tokens").insertOne({
    token,
    venueId: insert.insertedId,
    venueName: name.trim(),
    active: true,
    createdAt: now,
  });

  return res
    .status(200)
    .json({ ok: true, venueId: insert.insertedId.toString(), token });
}
