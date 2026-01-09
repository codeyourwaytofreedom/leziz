import type { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "micro";
import { getStripeClient } from "@/lib/stripe";

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
    case "checkout.session.completed":
      // TODO: mark account as paid/active using event.data.object
      break;
    default:
      break;
  }

  return res.status(200).json({ received: true });
}
