import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

const allowedLanguages = ["en", "tr", "de", "fr", "es", "it"] as const;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { venueId, languages } = req.body as {
    venueId?: string;
    languages?: string[];
  };

  if (!venueId || !Array.isArray(languages)) {
    return res.status(400).json({ error: "INVALID_LANGUAGES" });
  }

  const normalized = languages
    .map((lang) => (typeof lang === "string" ? lang.trim().toLowerCase() : ""))
    .filter(Boolean);

  const unique: string[] = [];
  for (const lang of normalized) {
    if (!allowedLanguages.includes(lang as (typeof allowedLanguages)[number])) {
      return res.status(400).json({ error: "INVALID_LANGUAGES" });
    }
    if (!unique.includes(lang)) unique.push(lang);
  }

  if (unique.length === 0) {
    return res.status(400).json({ error: "INVALID_LANGUAGES" });
  }

  const db = await getDb();
  await db.collection("venues").updateOne(
    { _id: new ObjectId(venueId) },
    {
      $set: {
        langs: unique,
        defaultLang: unique[0],
      },
    }
  );

  return res.status(200).json({ ok: true });
}
