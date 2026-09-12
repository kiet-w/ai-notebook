import type { Metadata } from 'next';
import AuthTemplate from '@/components/templates/auth/AuthTemplate';
import LoginForm from '@/components/organisms/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Sign In - Secondary Brain',
  description: 'Sign in to access your workspace in Secondary Brain.',
};

export default function LoginPage() {
  return (
    <AuthTemplate type="login">
      <LoginForm />
    </AuthTemplate>
  );
}

