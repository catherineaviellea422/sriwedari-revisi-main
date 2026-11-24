import { Role } from './types';

export interface SessionPayload {
  id: string;
  name: string;
  email: string;
  role: Role;
  expiresAt: number;
}

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  'sriwedari-keraton-surakarta-secret-2026-production-grade';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getHmacKey(): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
}

/**
 * Edge-safe token verifier untuk Next.js Middleware (tanpa fs/path/database).
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [base64Payload, sigPart] = parts;
    const key = await getHmacKey();
    const sigBytes = base64UrlDecode(sigPart);

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes as unknown as BufferSource,
      textEncoder.encode(base64Payload)
    );
    if (!isValid) return null;

    const payload: SessionPayload = JSON.parse(
      textDecoder.decode(base64UrlDecode(base64Payload))
    );
    if (!payload.expiresAt || Date.now() > payload.expiresAt) return null;
    return payload;
  } catch {
    return null;
  }
}
