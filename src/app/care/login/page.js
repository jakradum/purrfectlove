import LoginForm from '@/components/Care/LoginForm';

export const metadata = {
  title: 'Member Login | Purrfect Love Community',
  description: 'Log in to the Purrfect Love Community.',
};

export default function LoginPage() {
  return <LoginForm loginRedirect="/care" />;
}
