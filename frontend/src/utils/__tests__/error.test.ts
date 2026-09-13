import { parseApiError } from '../error';

describe('parseApiError', () => {
  it('should parse array message from NestJS ValidationPipe', () => {
    const mockError = {
      response: {
        status: 400,
        data: {
          statusCode: 400,
          message: ['email must be an email', 'password should not be empty'],
          error: 'Bad Request',
        },
      },
    };

    const parsed = parseApiError(mockError);
    expect(parsed.statusCode).toBe(400);
    expect(parsed.message).toBe('email must be an email, password should not be empty');
    expect(parsed.errors).toEqual(['email must be an email', 'password should not be empty']);
  });

  it('should parse single string message from API', () => {
    const mockError = {
      response: {
        status: 401,
        data: {
          statusCode: 401,
          message: 'Invalid credentials',
        },
      },
    };

    const parsed = parseApiError(mockError);
    expect(parsed.statusCode).toBe(401);
    expect(parsed.message).toBe('Invalid credentials');
  });

  it('should fall back to axios error message if no response data', () => {
    const mockError = {
      message: 'Network Error',
    };

    const parsed = parseApiError(mockError);
    expect(parsed.statusCode).toBe(500);
    expect(parsed.message).toBe('Network Error');
  });

  it('should fall back to fallbackMessage for empty error objects', () => {
    const parsed = parseApiError({}, 'Fallback message');
    expect(parsed.statusCode).toBe(500);
    expect(parsed.message).toBe('Fallback message');
  });

  it('should fall back to fallbackMessage for non-object errors', () => {
    const parsed = parseApiError(null, 'Unknown error');
    expect(parsed.statusCode).toBe(500);
    expect(parsed.message).toBe('Unknown error');
  });
});
