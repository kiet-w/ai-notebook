import AuthTemplate from '@/components/templates/AuthTemplate';
import RegisterForm from '@/components/organisms/RegisterForm';

export default function RegisterPage() {
  return (
    <AuthTemplate 
      title="Create an account" 
      subtitle="Start organizing your thoughts with AI."
      type="register"
    >
      <RegisterForm />
    </AuthTemplate>
  );
}
