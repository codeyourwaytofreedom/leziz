import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

type LocalizedText = string | Record<string, string>;

type MenuItem = {
  id: string;
  name: LocalizedText;
  price: number;
  description?: LocalizedText;
  ingredients?: LocalizedText[];
};

type Category = {
  id: string;
  title: LocalizedText;
  items: MenuItem[];
};

type Menu = {
  categories: Category[];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { venueId, venueName, menu } = req.body as {
    venueId?: string;
    venueName?: string;
    menu?: Menu;
  };

  if (!venueId || !menu) return res.status(400).json({ error: "Invalid payload" });

  const db = await getDb();

  await db.collection("venues").updateOne(
    { _id: new ObjectId(venueId) },
    {
      $set: {
        ...(venueName ? { name: venueName } : {}),
        menu,
      },
    }
  );

  return res.status(200).json({ ok: true });
}
