import { parse } from "cookie";
import { IncomingMessage } from "http";

export function getSession(req: IncomingMessage) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  const cookies = parse(cookieHeader);
  if (!cookies.session) return null;

  try {
    return JSON.parse(cookies.session);
  } catch {
    return null;
  }
}
