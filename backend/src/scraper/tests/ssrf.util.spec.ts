import {
  isPrivateIp,
  createSafeLookup,
  DnsLookupFunction,
} from '../utils/ssrf.util';
import * as dns from 'dns';

describe('SSRF Utils', () => {
  describe('isPrivateIp', () => {
    it('should detect IPv4 private addresses', () => {
      expect(isPrivateIp('127.0.0.1')).toBe(true);
      expect(isPrivateIp('10.0.0.1')).toBe(true);
      expect(isPrivateIp('172.16.0.1')).toBe(true);
      expect(isPrivateIp('172.31.255.255')).toBe(true);
      expect(isPrivateIp('192.168.1.1')).toBe(true);
      expect(isPrivateIp('169.254.1.1')).toBe(true);
      expect(isPrivateIp('0.0.0.0')).toBe(true);
    });

    it('should detect IPv6 private/loopback addresses', () => {
      expect(isPrivateIp('::1')).toBe(true);
      expect(isPrivateIp('fe80::1')).toBe(true);
      expect(isPrivateIp('fc00::1')).toBe(true);
      expect(isPrivateIp('fd12::1')).toBe(true);
    });

    it('should allow public addresses', () => {
      expect(isPrivateIp('8.8.8.8')).toBe(false);
      expect(isPrivateIp('1.1.1.1')).toBe(false);
      expect(isPrivateIp('142.250.190.46')).toBe(false);
      expect(isPrivateIp('2606:4700:4700::1111')).toBe(false);
    });

    it('should handle invalid ip strings gracefully', () => {
      expect(isPrivateIp('not-an-ip')).toBe(false);
      expect(isPrivateIp('1.2.3')).toBe(false);
    });
  });

  describe('createSafeLookup', () => {
    const defaultOptions: dns.LookupOptions = { all: false };

    it('should block lookup when DNS resolves to private IP', (done) => {
      const mockDnsLookup: DnsLookupFunction = (
        _h,
        _o,
        cb: (
          err: NodeJS.ErrnoException | null,
          address: string,
          family: number,
        ) => void,
      ) => {
        cb(null, '127.0.0.1', 4);
      };
      const safeLookupFn = createSafeLookup(mockDnsLookup);

      safeLookupFn('localhost', defaultOptions, (err) => {
        expect(err).toBeInstanceOf(Error);
        expect(err?.message).toContain('SSRF blocked');
        done();
      });
    });

    it('should allow lookup when DNS resolves to public IP', (done) => {
      const mockDnsLookup: DnsLookupFunction = (
        _h,
        _o,
        cb: (
          err: NodeJS.ErrnoException | null,
          address: string,
          family: number,
        ) => void,
      ) => {
        cb(null, '93.184.216.34', 4);
      };
      const safeLookupFn = createSafeLookup(mockDnsLookup);

      safeLookupFn('example.com', defaultOptions, (err, address) => {
        expect(err).toBeNull();
        expect(address).toBe('93.184.216.34');
        done();
      });
    });

    it('should pass through DNS errors', (done) => {
      const dnsError = new Error('ENOTFOUND');
      const mockDnsLookup: DnsLookupFunction = (
        _h,
        _o,
        cb: (
          err: NodeJS.ErrnoException | null,
          address: string,
          family: number,
        ) => void,
      ) => {
        cb(dnsError, '', 0);
      };
      const safeLookupFn = createSafeLookup(mockDnsLookup);

      safeLookupFn('invalid.domain', defaultOptions, (err) => {
        expect(err).toBe(dnsError);
        done();
      });
    });
  });
});
