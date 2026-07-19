import AuthTemplate from '@/components/templates/AuthTemplate';
import LoginForm from '@/components/organisms/LoginForm';

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
