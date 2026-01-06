import type { NextApiRequest, NextApiResponse } from "next";
import { verifySignupToken } from "@/lib/signupToken";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }

  const { code, token } = req.body || {};
  if (!code || !token) {
    return res.status(400).json({ error: "Missing code or token" });
  }

  const payload = verifySignupToken(token);
  if (!payload) {
    return res.status(400).json({ error: "Invalid or expired token" });
  }

  if (payload.code !== code) {
    return res.status(400).json({ error: "Incorrect code" });
  }

  // TODO: create the user record and redirect to Stripe Checkout
  return res.status(200).json({ ok: true, email: payload.email, plan: payload.plan });
}
