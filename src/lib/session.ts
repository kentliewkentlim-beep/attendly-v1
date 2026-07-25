/**
 * Signed session tokens.
 *
 * Previously the session cookie held the raw user id, so anyone who learned
 * another user's id (they appear in URLs like /admin/employee/[id]) could set
 * the cookie themselves and become that user. The cookie is now a signed,
 * expiring token that the server can verify but nobody else can forge.
 *
 * Token format:  <userId>.<expiryMs>.<hmacSha256Base64Url>
 * The signature covers "<userId>.<expiryMs>", so neither part can be edited.
 *
 * Uses Web Crypto (not node:crypto) so the same code runs in both the Node
 * server runtime and the Edge runtime that middleware.ts executes in.
 */

const encoder = new TextEncoder();

/** 7 days by default, 30 days when the user ticks "remember me". */
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const SESSION_TTL_REMEMBER_MS = 30 * 24 * 60 * 60 * 1000;

export const SESSION_COOKIE = "session";

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET is missing or too short (needs >= 32 characters). " +
        "Generate one with `openssl rand -base64 48` and set it in .env.local " +
        "for local dev and in the Vercel project environment variables for production."
    );
  }
  return secret;
}

const keyCache = new Map<string, Promise<CryptoKey>>();

function getKey(secret: string): Promise<CryptoKey> {
  let key = keyCache.get(secret);
  if (!key) {
    key = crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );
    keyCache.set(secret, key);
  }
  return key;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array | null {
  try {
    const padding = (4 - (value.length % 4)) % 4;
    const base64 =
      value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(padding);
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

/** Create a signed token for this user. Returns the cookie value. */
export async function signSession(
  userId: string,
  ttlMs: number = SESSION_TTL_MS
): Promise<string> {
  const payload = `${userId}.${Date.now() + ttlMs}`;
  const key = await getKey(getSecret());
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  );
  return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
}

/**
 * Verify a token. Returns the user id when the signature is valid and the
 * token has not expired, otherwise null. Never throws on malformed input —
 * callers treat null as "not logged in".
 */
export async function verifySession(
  token: string | undefined | null
): Promise<string | null> {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [userId, expiryRaw, signatureRaw] = parts;
  if (!userId || !expiryRaw || !signatureRaw) return null;

  const expiry = Number(expiryRaw);
  if (!Number.isFinite(expiry) || Date.now() > expiry) return null;

  const signature = fromBase64Url(signatureRaw);
  if (!signature) return null;

  try {
    const key = await getKey(getSecret());
    // crypto.subtle.verify compares in constant time.
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      signature as unknown as BufferSource,
      encoder.encode(`${userId}.${expiry}`)
    );
    return valid ? userId : null;
  } catch {
    return null;
  }
}
