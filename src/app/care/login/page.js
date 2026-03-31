import LoginForm from '@/components/Care/LoginForm';

export const metadata = {
  title: 'Member Login | Cat Sitting Network',
  description: 'Log in to the Purrfect Love cat sitting member portal.',
};

export default function LoginPage() {
  return <LoginForm loginRedirect="/care" />;
}
