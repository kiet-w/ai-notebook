import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from '../LoginForm';
import { api } from '@/utils/api';
import { I18nProvider } from '@/i18n';

// Mock the API module
jest.mock('@/utils/api', () => ({
  api: {
    login: jest.fn(),
  },
}));

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const renderLoginForm = (locale: 'en' | 'vi' = 'en') => {
  localStorage.setItem('secondary_brain_locale', locale);
  return render(
    <I18nProvider>
      <LoginForm />
    </I18nProvider>
  );
};

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders login form with email and password fields in English', () => {
    renderLoginForm('en');
    
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders login form in Vietnamese when locale is vi', () => {
    renderLoginForm('vi');

    expect(screen.getByLabelText(/địa chỉ email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mật khẩu/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /đăng nhập/i })).toBeInTheDocument();
  });

  it('shows error message on failed login', async () => {
    const mockError = { response: { data: { message: 'Invalid credentials' } } };
    (api.login as jest.Mock).mockRejectedValue(mockError);

    renderLoginForm('en');

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'wrongpassword');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('calls api.login with correct credentials and redirects on success', async () => {
    (api.login as jest.Mock).mockResolvedValue({ accesToken: 'test-token' });

    renderLoginForm('en');

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(api.login).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('disables submit button while loading', async () => {
    (api.login as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ accesToken: 'test-token' }), 100))
    );

    renderLoginForm('en');

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitButton);

    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign in/i })).not.toBeDisabled();
    }, { timeout: 200 });
  });

  it('shows generic error message when API error has no message', async () => {
    (api.login as jest.Mock).mockRejectedValue({});

    renderLoginForm('en');

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/login failed/i)).toBeInTheDocument();
    });
  });
});
