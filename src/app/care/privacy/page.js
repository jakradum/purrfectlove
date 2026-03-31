export const metadata = {
  title: 'Privacy Policy | Purrfect Love',
  description: 'How Purrfect Love collects, uses, and protects your personal data.',
};

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <a
        href="/care"
        style={{ display: 'inline-block', marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--hunter-green)', textDecoration: 'none', fontWeight: 600 }}
      >
        ← Back
      </a>

      <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--hunter-green)', marginBottom: '0.5rem' }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '1.5rem' }}>
          Last updated: March 2026
        </p>
        <p style={{ color: 'var(--text-light)', lineHeight: 1.7, marginBottom: 0 }}>
          Purrfect Love is a members-only cat sitting community. We take your privacy seriously and
          only collect the information we need to run the community.
        </p>
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--hunter-green)', marginBottom: '1rem' }}>
          What we collect
        </h2>
        <ul style={{ color: 'var(--text-light)', lineHeight: 1.8, paddingLeft: '1.25rem', margin: 0 }}>
          <li>Your name</li>
          <li>Email address</li>
          <li>Phone number</li>
          <li>Approximate location (Plus Code — a short geographic code, not your exact address)</li>
          <li>Availability dates you choose to share</li>
          <li>Information about your cats that you voluntarily add to your profile</li>
        </ul>
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--hunter-green)', marginBottom: '1rem' }}>
          Why we collect it
        </h2>
        <p style={{ color: 'var(--text-light)', lineHeight: 1.7, margin: 0 }}>
          We use your information solely to operate the Purrfect Love community: to create and manage
          your member profile, to help cat owners find nearby sitters (and vice versa), and to send
          you one-time login codes (OTPs) so you can sign in securely without a password.
        </p>
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--hunter-green)', marginBottom: '1rem' }}>
          How we send login codes
        </h2>
        <p style={{ color: 'var(--text-light)', lineHeight: 1.7, margin: 0 }}>
          OTP codes are sent via SMS using <strong>Twilio</strong> and via email using <strong>Resend</strong>.
          These third-party services receive only your phone number or email address, and only for the
          purpose of delivering your login code. They do not receive any other information about you.
        </p>
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--hunter-green)', marginBottom: '1rem' }}>
          About location data
        </h2>
        <p style={{ color: 'var(--text-light)', lineHeight: 1.7, margin: 0 }}>
          Your location is stored as a Plus Code — an approximate geographic code that represents a
          small area rather than a precise address. We use this only to help match you with nearby
          members of the community. Your exact address is never stored or shared.
        </p>
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--hunter-green)', marginBottom: '1rem' }}>
          How long we keep your data
        </h2>
        <p style={{ color: 'var(--text-light)', lineHeight: 1.7, margin: 0 }}>
          We keep your data for as long as your account is active. If you delete your account, all
          your personal data is permanently and irreversibly removed from our systems within 30 days.
        </p>
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--hunter-green)', marginBottom: '1rem' }}>
          Your rights
        </h2>
        <p style={{ color: 'var(--text-light)', lineHeight: 1.7, marginBottom: '0.75rem' }}>
          You have the right to access, correct, or delete any personal data we hold about you.
          This applies to all members, including those in the EU (under GDPR) and India.
        </p>
        <p style={{ color: 'var(--text-light)', lineHeight: 1.7, margin: 0 }}>
          To request access to your data, a correction, or deletion of your account, email us at{' '}
          <a
            href="mailto:privacy@purrfectlove.org"
            style={{ color: 'var(--hunter-green)', textDecoration: 'underline' }}
          >
            privacy@purrfectlove.org
          </a>
          . You can also delete your account directly from your profile page.
        </p>
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--hunter-green)', marginBottom: '1rem' }}>
          What we do not do
        </h2>
        <p style={{ color: 'var(--text-light)', lineHeight: 1.7, margin: 0 }}>
          We do not sell your data. We do not share your data with advertisers. We do not use your
          information for any purpose other than running the Purrfect Love community.
        </p>
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--hunter-green)', marginBottom: '1rem' }}>
          Questions?
        </h2>
        <p style={{ color: 'var(--text-light)', lineHeight: 1.7, margin: 0 }}>
          If you have any questions about this policy, reach out at{' '}
          <a
            href="mailto:privacy@purrfectlove.org"
            style={{ color: 'var(--hunter-green)', textDecoration: 'underline' }}
          >
            privacy@purrfectlove.org
          </a>
          .
        </p>
      </div>
    </div>
  );
}
