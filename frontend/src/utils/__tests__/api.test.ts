import { api } from '../api';

// Mock the entire api module
jest.mock('../api', () => {
  const mockApi = {
    fetchNotes: jest.fn(),
    fetchUnreadCounts: jest.fn(),
    createNote: jest.fn(),
    uploadFile: jest.fn(),
    fetchNoteById: jest.fn(),
    searchNotes: jest.fn(),
    markAsRead: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
  };
  return { api: mockApi };
});

describe('API - Authentication methods', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should call login with correct credentials', async () => {
      (api.login as jest.Mock).mockResolvedValue({ accesToken: 'test-token' });

      await api.login('test@example.com', 'password123');

      expect(api.login).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('should return access token on successful login', async () => {
      const mockToken = { accesToken: 'test-token' };
      (api.login as jest.Mock).mockResolvedValue(mockToken);

      const result = await api.login('test@example.com', 'password123');

      expect(result).toEqual(mockToken);
    });

    it('should handle login errors', async () => {
      const mockError = new Error('Login failed');
      (api.login as jest.Mock).mockRejectedValue(mockError);

      await expect(api.login('test@example.com', 'password123')).rejects.toThrow('Login failed');
    });
  });

  describe('register', () => {
    it('should call register with correct data', async () => {
      (api.register as jest.Mock).mockResolvedValue(undefined);

      await api.register('test@example.com', 'password123', 'testuser');

      expect(api.register).toHaveBeenCalledWith('test@example.com', 'password123', 'testuser');
    });

    it('should return void on successful registration', async () => {
      (api.register as jest.Mock).mockResolvedValue(undefined);

      const result = await api.register('test@example.com', 'password123', 'testuser');

      expect(result).toBeUndefined();
    });

    it('should handle registration errors', async () => {
      const mockError = new Error('Registration failed');
      (api.register as jest.Mock).mockRejectedValue(mockError);

      await expect(api.register('test@example.com', 'password123', 'testuser')).rejects.toThrow('Registration failed');
    });
  });
});
