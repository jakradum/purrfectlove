import Link from 'next/link'
import styles from './Care.module.css'

export default function IncompleteProfileGate() {
  return (
    <div className={styles.pageWide} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center', maxWidth: '420px', padding: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '0.75rem' }}>
          Complete your profile to join the community
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          Finish all the mandatory fields — this will help us help you!
        </p>
        <Link href="/profile" className={styles.btn} style={{ display: 'inline-block', width: 'auto', padding: '0.6rem 1.5rem', textDecoration: 'none' }}>
          Set up profile
        </Link>
      </div>
    </div>
  )
}
