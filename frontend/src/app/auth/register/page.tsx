import type { Metadata } from 'next';
import AuthTemplate from '@/components/templates/auth/AuthTemplate';
import RegisterForm from '@/components/organisms/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Sign Up - Secondary Brain',
  description: 'Create an account to start organizing your thoughts with AI.',
};

export default function RegisterPage() {
  return (
    <AuthTemplate type="register">
      <RegisterForm />
    </AuthTemplate>
  );
}

