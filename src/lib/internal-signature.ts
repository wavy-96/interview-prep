import { createHmac, timingSafeEqual } from "crypto";

const ALG = "sha256";

/**
 * Sign a request body for internal API calls.
 * Use with X-Internal-Signature header.
 */
export function signInternalPayload(body: string, secret: string): string {
  return createHmac(ALG, secret).update(body).digest("hex");
}

/**
 * Verify X-Internal-Signature for internal API routes.
 * Rejects unsigned or invalid requests.
 */
export function verifyInternalSignature(
  body: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature?.trim() || !secret?.trim()) return false;
  const expected = signInternalPayload(body, secret);
  if (signature.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
