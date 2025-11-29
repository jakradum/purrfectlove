import { useFormValue } from 'sanity'

export function OpenToAnyCatNotice() {
  const isOpenToAnyCat = useFormValue(['isOpenToAnyCat'])

  if (!isOpenToAnyCat) {
    return null
  }

  const styles = {
    container: {
      backgroundColor: '#dbeafe',
      border: '1px solid #3b82f6',
      borderRadius: '6px',
      padding: '1rem',
      marginBottom: '1rem'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      marginBottom: '0.5rem'
    },
    icon: {
      fontSize: '1.25rem'
    },
    title: {
      fontWeight: 600,
      color: '#1e40af',
      fontSize: '0.875rem'
    },
    message: {
      color: '#1e3a8a',
      fontSize: '0.8125rem',
      lineHeight: 1.5
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.icon}>🐱</span>
        <span style={styles.title}>Open to Any Cat</span>
      </div>
      <div style={styles.message}>
        This applicant is open to adopting any cat. Use the &quot;Redirect to New Cat&quot; field below to assign a specific cat to this application.
      </div>
    </div>
  )
}
