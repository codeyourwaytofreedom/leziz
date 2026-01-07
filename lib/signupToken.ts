import crypto from "crypto";

export type SignupTokenPayload = {
  email: string;
  plan: string;
  venue: string;
  code: string;
  exp: number;
  iat: number;
};

function getSecret() {
  return process.env.SIGNUP_SECRET || "dev-signup-secret";
}

function sign(payload: SignupTokenPayload) {
  const base = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", getSecret()).update(base).digest("base64url");
  return `${base}.${sig}`;
}

function verifySignature(token: string) {
  const [base, sig] = token.split(".");
  if (!base || !sig) return null;
  const expected = crypto.createHmac("sha256", getSecret()).update(base).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(base, "base64url").toString()) as SignupTokenPayload;
    return payload;
  } catch {
    return null;
  }
}

export function createSignupToken(data: Omit<SignupTokenPayload, "exp" | "iat"> & { exp?: number }) {
  const now = Date.now();
  const exp = data.exp ?? now + 2 * 60 * 1000; // 2 minutes
  return sign({ ...data, iat: now, exp });
}

export function verifySignupToken(token: string) {
  const payload = verifySignature(token);
  if (!payload) return null;
  if (payload.exp < Date.now()) return null;
  return payload;
}
