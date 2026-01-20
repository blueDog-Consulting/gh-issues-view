// Generate a session ID using Web Crypto API
export function generateSessionId() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Create HMAC signature using Web Crypto API
async function createHmacSignature(message, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(message)
  );

  return Array.from(new Uint8Array(signature), byte =>
    byte.toString(16).padStart(2, '0')
  ).join('');
}

// Create an encrypted session cookie
export async function createSessionCookie(sessionId, secret) {
  const signature = await createHmacSignature(sessionId, secret);

  return `session=${sessionId}.${signature}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`; // 30 days
}

// Verify and extract session ID from cookie
export async function verifySessionCookie(cookie, secret) {
  if (!cookie) return null;

  const match = cookie.match(/session=([^;]+)/);
  if (!match) return null;

  const [sessionId, signature] = match[1].split('.');
  if (!sessionId || !signature) return null;

  const expectedSignature = await createHmacSignature(sessionId, secret);

  if (signature !== expectedSignature) return null;

  return sessionId;
}

// Store session data in KV
export async function storeSession(kv, sessionId, data, expirationTtl = 2592000) {
  await kv.put(`session:${sessionId}`, JSON.stringify(data), {
    expirationTtl // 30 days in seconds
  });
}

// Get session data from KV
export async function getSession(kv, sessionId) {
  const data = await kv.get(`session:${sessionId}`);
  return data ? JSON.parse(data) : null;
}

// Delete session from KV
export async function deleteSession(kv, sessionId) {
  await kv.delete(`session:${sessionId}`);
}
