import { hashPassword, verifyPassword } from '../utils/password.util';

describe('Password Utils', () => {
  it('should hash a password and verify it correctly', async () => {
    const password = 'mySecretPassword123!';
    const hash = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash).not.toEqual(password);

    const isValid = await verifyPassword(hash, password);
    expect(isValid).toBe(true);

    const isInvalid = await verifyPassword(hash, 'wrongPassword');
    expect(isInvalid).toBe(false);
  });
});
