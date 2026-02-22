import { SignJWT } from "jose";

const TOKEN_TTL = 60;
const SECRET = process.env.REALTIME_TOKEN_SECRET;

export async function createWsToken(userId: string, sessionId: string): Promise<{
  token: string;
  wsUrl: string;
  expiresIn: number;
} | null> {
  if (!SECRET) return null;

  const jti = crypto.randomUUID();
  const token = await new SignJWT({ userId, sessionId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("interview-prep-realtime")
    .setAudience("ws-client")
    .setJti(jti)
    .setExpirationTime(`${TOKEN_TTL}s`)
    .setIssuedAt()
    .sign(new TextEncoder().encode(SECRET));

  const wsUrl =
    process.env.REALTIME_WS_URL ?? "wss://interview-prep-realtime.fly.dev/ws";

  return { token, wsUrl, expiresIn: TOKEN_TTL };
}
