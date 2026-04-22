'use client';

import { useRouter } from 'next/navigation';
import Navbar from '@/components/navbar';

export default function CareLocaleNav({ locale, siteUrl }) {
  const router = useRouter();

  const handleLocaleChange = (newLocale) => {
    document.cookie = `pl_portal_locale=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    router.refresh();
  };

  return (
    <Navbar
      locale={locale}
      siteUrl={siteUrl}
      onLocaleChange={handleLocaleChange}
    />
  );
}
