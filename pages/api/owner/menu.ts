import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";

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

  const { venueId, venueName, menu, menuConfig } = req.body as {
    venueId?: string;
    venueName?: string;
    menu?: Menu;
    menuConfig?: Record<string, unknown>;
  };

  if (!venueId || !menu) {
    return res.status(400).json({ error: "INVALID_PAYLOAD" });
  }

  const session = getSession(req);
  if (!session?.userId) {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }
  if (session.role !== "bigboss") {
    const sessionVenueId = session.venueId ? String(session.venueId) : "";
    if (!sessionVenueId || sessionVenueId !== String(venueId)) {
      return res.status(403).json({ error: "FORBIDDEN" });
    }
  }

  const db = await getDb();

  await db.collection("venues").updateOne(
    { _id: new ObjectId(venueId) },
    {
      $set: {
        ...(venueName ? { name: venueName } : {}),
        menu,
        ...(menuConfig ? { menuConfig } : {}),
      },
    }
  );

  return res.status(200).json({ ok: true });
}
