import LoginForm from '@/components/Care/LoginForm';

export const metadata = {
  title: 'Mitglieder-Login | Purrfect Love Community',
  description: 'Melde dich bei der Purrfect Love Community an.',
};

export default function DeLoginPage() {
  return <LoginForm locale="de" loginRedirect="/de/care" />;
}
