import type { NextApiRequest, NextApiResponse } from "next";
import { getBaseUrl, getStripeClient } from "@/lib/stripe";

const priceMap = {
  silver: process.env.STRIPE_PRICE_SILVER,
  gold: process.env.STRIPE_PRICE_GOLD,
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }

  const { plan, email } = req.body || {};
  if (!plan || !email) {
    return res.status(400).json({ error: "MISSING_FIELDS" });
  }

  const priceId = priceMap[plan as keyof typeof priceMap];
  if (!priceId) {
    return res.status(400).json({ error: "INVALID_PLAN" });
  }

  const stripe = getStripeClient();
  const baseUrl = process.env.STRIPE_BASE_URL || getBaseUrl(req);
  const successUrl = `${baseUrl}/checkout/success`;
  const cancelUrl = `${baseUrl}/signup?plan=${encodeURIComponent(plan)}`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { plan },
    });

    if (!session.url) {
      return res.status(500).json({ error: "MISSING_CHECKOUT_URL" });
    }
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error", err);
    return res
      .status(500)
      .json({ error: "CHECKOUT_SESSION_CREATE_FAILED" });
  }
}
