export const metadata = {
  title: 'Community Guidelines | Purrfect Love',
};

export default function GuidelinesPage() {
  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2.5rem 1.5rem 5rem', fontFamily: 'Georgia, serif' }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2C5F4F', marginBottom: '0.5rem', fontFamily: 'var(--font-outfit, sans-serif)' }}>
        Community Guidelines
      </h1>
      <p style={{ fontSize: '0.9rem', color: '#6B6B6B', marginBottom: '2rem' }}>
        Last updated: March 2025
      </p>

      <Section title="1. Respect">
        <p>Treat every member with kindness and respect — whether communicating via the in-site inbox, WhatsApp, email, or in person. Harassment, discrimination, or disrespectful behaviour of any kind will result in immediate removal from the community.</p>
      </Section>

      <Section title="2. Purpose">
        <p>This community exists exclusively to connect cat parents who need a sitter with members willing to help. Do not use it for commercial pet-sitting, unrelated promotions, or spam.</p>
      </Section>

      <Section title="3. Honesty">
        <p>Keep your profile accurate. Your location (Plus Code), availability, and cat information should reflect reality. Inaccurate information wastes everyone's time and erodes trust.</p>
      </Section>

      <Section title="4. Privacy">
        <p>Do not share another member's contact details (phone, email, address) with anyone outside the community. Respect the privacy settings a member has chosen — if they've hidden their contact info, use the in-site inbox.</p>
      </Section>

      <Section title="5. Reporting">
        <p>If you receive an inappropriate message or notice suspicious activity, please report it using the Report button in the inbox or email us at <a href="mailto:support@purrfectlove.org" style={{ color: '#2C5F4F' }}>support@purrfectlove.org</a>. We investigate every report.</p>
      </Section>

      <Section title="6. Volunteer etiquette">
        <p>Sitters are volunteers giving their time freely. Please be considerate: give adequate notice, communicate clearly, and express gratitude. If a sitter cannot help, respect their decision without pressure.</p>
      </Section>

      <Section title="7. No payment">
        <p>Purrfect Love is a free community. Sitters should not charge for their services through this platform. Gratitude gifts (treats, a thank-you note) are always welcome but never expected.</p>
      </Section>

      <Section title="8. Emergency situations">
        <p>If anything goes wrong during a cat-sitting arrangement, contact the sitter or parent directly and immediately. For platform-level concerns, email <a href="mailto:support@purrfectlove.org" style={{ color: '#2C5F4F' }}>support@purrfectlove.org</a>. In a veterinary emergency, contact a vet immediately.</p>
      </Section>

      <Section title="9. Enforcement">
        <p>Violations may result in a warning, suspension, or permanent removal from the community depending on severity. We reserve the right to remove any member without explanation.</p>
      </Section>

      <p style={{ fontSize: '0.875rem', color: '#888', marginTop: '2.5rem', lineHeight: 1.7, borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
        Questions? Email <a href="mailto:support@purrfectlove.org" style={{ color: '#2C5F4F' }}>support@purrfectlove.org</a>
      </p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '1.75rem' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#2C5F4F', marginBottom: '0.5rem', fontFamily: 'var(--font-outfit, sans-serif)' }}>
        {title}
      </h2>
      <div style={{ fontSize: '0.9rem', color: '#4A4A4A', lineHeight: 1.7 }}>
        {children}
      </div>
    </div>
  );
}
