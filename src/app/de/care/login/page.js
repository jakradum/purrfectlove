import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import LoginForm from '@/components/Care/LoginForm';

export const metadata = {
  title: 'Mitglieder-Login | Purrfect Love Community',
  description: 'Melde dich bei der Purrfect Love Community an.',
};

export default async function DeLoginPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/de/care');

  return <LoginForm locale="de" loginRedirect="/de/care" />;
}
