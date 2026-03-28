import LoginForm from '@/components/Care/LoginForm';

export const metadata = {
  title: 'Mitglieder-Login | Katzensitting Netzwerk',
  description: 'Melde dich beim Purrfect Love Katzensitting-Portal an.',
};

export default function DeLoginPage() {
  return <LoginForm locale="de" loginRedirect="/de/care" />;
}
