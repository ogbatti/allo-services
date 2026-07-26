import { createHmac, timingSafeEqual } from "node:crypto";

export type AuthTokenPayload = {
  sub: string;
  tenantId: string;
  email: string;
  name: string;
  role: string;
  exp: number;
};

function secret(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.JWT_SECRET ||
    "allo-demo-secret-change-me"
  );
}

function b64url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function fromB64url(input: string): string {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64").toString(
    "utf8",
  );
}

export function signToken(
  payload: Omit<AuthTokenPayload, "exp">,
  ttlSeconds = 60 * 60 * 12,
): string {
  const body: AuthTokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const data = b64url(JSON.stringify(body));
  const sig = createHmac("sha256", secret())
    .update(`${header}.${data}`)
    .digest("base64url");
  return `${header}.${data}.${sig}`;
}

export function verifyToken(token: string): AuthTokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, data, sig] = parts;
  const expected = createHmac("sha256", secret())
    .update(`${header}.${data}`)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(fromB64url(data)) as AuthTokenPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
