import type { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "micro";
import { getStripeClient } from "@/lib/stripe";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { randomBytes } from "crypto";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "MISSING_WEBHOOK_SECRET" });
  }

  const stripe = getStripeClient();
  const sig = req.headers["stripe-signature"];
  if (!sig || Array.isArray(sig)) {
    return res.status(400).json({ error: "MISSING_SIGNATURE" });
  }

  let event;
  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    console.error("Stripe webhook signature error", err);
    return res.status(400).json({ error: "INVALID_SIGNATURE" });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as {
        client_reference_id?: string | null;
        customer_email?: string | null;
        customer?: string | null;
        subscription?: string | null;
        metadata?: Record<string, string>;
      };
      const refId = session.client_reference_id || session.metadata?.userId || null;
      const email = session.customer_email?.trim().toLowerCase();
      const db = await getDb();

      let user =
        refId && ObjectId.isValid(refId)
          ? await db.collection("users").findOne({ _id: new ObjectId(refId) })
          : null;
      if (!user && email) {
        user = await db.collection("users").findOne({ email });
      }
      if (!user) break;
      if (user.status === "active") break;

      let venueId = user.venueId;
      if (!venueId) {
        const venueName =
          typeof user.venueName === "string" && user.venueName.trim()
            ? user.venueName.trim()
            : "Venue";
        const now = new Date();
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
        venueId = venueInsert.insertedId;
      }

      await db.collection("users").updateOne(
        { _id: user._id },
        {
          $set: {
            status: "active",
            ...(venueId ? { venueId } : {}),
            ...(session.customer ? { stripeCustomerId: session.customer } : {}),
            ...(session.subscription
              ? { stripeSubscriptionId: session.subscription }
              : {}),
          },
        }
      );
      break;
    }
    default:
      break;
  }

  return res.status(200).json({ received: true });
}
