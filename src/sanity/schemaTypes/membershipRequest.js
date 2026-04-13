export default {
  name: 'membershipRequest',
  title: 'Membership Request',
  type: 'document',
  fields: [
    { name: 'name',              title: 'Name',               type: 'string',   readOnly: true },
    { name: 'email',             title: 'Email',              type: 'string',   readOnly: true },
    { name: 'phone',             title: 'Phone',              type: 'string',   readOnly: true },
    { name: 'message',           title: 'Message',            type: 'text',     readOnly: true },
    { name: 'submittedAt',       title: 'Submitted At',       type: 'datetime', readOnly: true },
    { name: 'status',            title: 'Status',             type: 'string',   readOnly: true, description: 'pending | approved | entry_denied' },
    { name: 'supabaseRequestId', title: 'Supabase Request ID', type: 'string',  readOnly: true, description: 'UUID of the row in the Supabase membership_requests table.' },
    // Token stored so the email-link flow can still verify — hidden from Studio UI
    { name: 'approvalToken',     title: 'Approval Token',    type: 'string',   readOnly: true, hidden: true },
    { name: 'tokenExpiresAt',    title: 'Token Expires At',  type: 'datetime', readOnly: true, hidden: true },
  ],
  orderings: [
    { title: 'Newest first', name: 'submittedAtDesc', by: [{ field: 'submittedAt', direction: 'desc' }] },
  ],
  preview: {
    select: { name: 'name', email: 'email', status: 'status', submittedAt: 'submittedAt' },
    prepare({ name, email, status, submittedAt }) {
      const ts = submittedAt
        ? new Date(submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : ''
      const icon = status === 'approved' ? '✅' : status === 'entry_denied' ? '❌' : '⏳'
      return {
        title: name || email || 'Unknown applicant',
        subtitle: `${icon} ${status || 'pending'} · ${ts}`,
      }
    }
  }
}
