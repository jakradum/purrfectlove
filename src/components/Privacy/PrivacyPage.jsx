import styles from './PrivacyPage.module.css';
import Breadcrumb from '@/components/Breadcrumb';

const breadcrumbItems = [
  { href: '/', label: 'Home' },
  { label: 'How We Protect Your Data' },
];

const items = [
  {
    title: 'No password to steal',
    body: 'You log in with a one-time code sent to your email. Nothing stored, nothing to leak.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    title: 'Your contact details are shared at the right time',
    body: 'Phone and email only go to your confirmed booking party, 2 days before the sit starts.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        <path d="M16 11l1.5 1.5L20 10" />
      </svg>
    ),
  },
  {
    title: 'Delete your data',
    body: 'You can request a profile deletion and our team will act on it and notify you once done. We permanently delete your records.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v6M14 11v6" />
        <path d="M9 6V4h6v2" />
      </svg>
    ),
  },
  {
    title: 'End-to-end encrypted',
    body: 'This site uses HTTPS encryption. Your data lives on secure EU servers — we chose our infrastructure specifically to keep European data in Europe.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    title: 'Approved members only',
    body: 'We keep a human layer of security by ensuring someone known to one of us is let in. This is not a public forum.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
  },
  {
    title: 'We never record your personal details',
    body: 'We track how people use the platform to improve it — but we never record your messages, contact information, or personal details.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <main className={styles.main}>
      {/* Decorative blobs */}
      <div className={styles.blobTopRight} aria-hidden="true" />
      <div className={styles.blobBottomLeft} aria-hidden="true" />

      <div className={styles.container}>
        <Breadcrumb items={breadcrumbItems} />

        <header className={styles.header}>
          <h1 className={styles.heading}>How safe is your data?</h1>
          <p className={styles.subheading}>In plain language, this is what happens.</p>
        </header>

        <ol className={styles.list}>
          {items.map((item, i) => (
            <li key={i} className={styles.item}>
              <div className={styles.iconColumn}>
                <div className={styles.iconCircle}>{item.icon}</div>
                {i < items.length - 1 && <div className={styles.line} aria-hidden="true" />}
              </div>
              <div className={styles.content}>
                <h2 className={styles.itemTitle}>{item.title}</h2>
                <p className={styles.itemBody}>{item.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <Breadcrumb items={breadcrumbItems} />
      </div>
    </main>
  );
}
