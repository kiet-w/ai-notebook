import AuthTemplate from '@/components/templates/auth/AuthTemplate';
import LoginForm from '@/components/organisms/auth/LoginForm';

export default function LoginPage() {
  return (
    <AuthTemplate 
      title="Welcome back" 
      subtitle="Enter your credentials to access your workspace."
      type="login"
    >
      <LoginForm />
    </AuthTemplate>
  );
}
