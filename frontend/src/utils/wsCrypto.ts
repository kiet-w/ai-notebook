export const WS_MAGIC = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

export function genKey(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

export async function computeSha1(str: string): Promise<Uint8Array> {
  const buf = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest('SHA-1', buf);
  return new Uint8Array(hash);
}

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ');
}

export function toB64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

export async function computeAccept(key: string): Promise<{ concat: string; sha1Hex: string; accept: string }> {
  const concat = key + WS_MAGIC;
  const hashBytes = await computeSha1(concat);
  return { concat, sha1Hex: toHex(hashBytes), accept: toB64(hashBytes) };
}

export function randomMaskKey(): Uint8Array {
  const arr = new Uint8Array(4);
  crypto.getRandomValues(arr);
  return arr;
}

export function xorMask(payload: Uint8Array, mask: Uint8Array): Uint8Array {
  return payload.map((byte, i) => byte ^ mask[i % 4]);
}

export function toHexStr(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ');
}
