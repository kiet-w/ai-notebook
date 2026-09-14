import * as dns from 'dns';
import * as net from 'net';
import * as http from 'http';
import * as https from 'https';

export function isPrivateIp(ip: string): boolean {
  if (net.isIPv6(ip)) {
    return (
      ip === '::1' ||
      ip.startsWith('fe80:') ||
      ip.startsWith('fc00:') ||
      ip.startsWith('fd')
    );
  }
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4) return false;
  return (
    parts[0] === 10 ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168) ||
    parts[0] === 127 ||
    parts[0] === 169 ||
    parts[0] === 0
  );
}

export type DnsLookupFunction = (
  hostname: string,
  options: dns.LookupOptions,
  callback: (
    err: NodeJS.ErrnoException | null,
    address: string | dns.LookupAddress[],
    family: number,
  ) => void,
) => void;

export function createSafeLookup(
  lookupFn: DnsLookupFunction = dns.lookup,
): DnsLookupFunction {
  return (hostname, options, callback) => {
    lookupFn(hostname, options, (err, address, family) => {
      if (err) return callback(err, address, family);
      const ip =
        typeof address === 'string' ? address : (address[0]?.address ?? '');
      if (ip && isPrivateIp(ip)) {
        return callback(new Error('SSRF blocked: private IP detected'), '', 0);
      }
      callback(null, address, family);
    });
  };
}

export const safeLookup = createSafeLookup(dns.lookup);
export const safeHttpAgent = new http.Agent({ lookup: safeLookup });
export const safeHttpsAgent = new https.Agent({ lookup: safeLookup });
