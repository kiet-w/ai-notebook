import {
  calculateTokenExpiry,
  generateRefreshToken,
  hashToken,
} from '../utils/token.util';

describe('Token Utils', () => {
  describe('hashToken', () => {
    it('should hash a token deterministically with sha256', () => {
      const token = 'sample-refresh-token';
      const hash1 = hashToken(token);
      const hash2 = hashToken(token);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex length
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a random hex string', () => {
      const token1 = generateRefreshToken();
      const token2 = generateRefreshToken();

      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toBe(token2);
      expect(token1).toHaveLength(128); // 64 bytes = 128 hex chars
    });
  });

  describe('calculateTokenExpiry', () => {
    it('should return a date in the future', () => {
      const now = Date.now();
      const expiry = calculateTokenExpiry(7);

      expect(expiry.getTime()).toBeGreaterThan(now);
      const diffDays = (expiry.getTime() - now) / (1000 * 60 * 60 * 24);
      expect(Math.round(diffDays)).toBe(7);
    });
  });
});
