export default {
  name: 'adminAuditLog',
  title: 'Admin Audit Log',
  type: 'document',
  // All fields are written by the API only — Studio is read-only
  fields: [
    { name: 'action', title: 'Action', type: 'string', readOnly: true, description: 'e.g. member_approved, member_rejected, score_adjusted, broadcast_sent, account_deleted, member_synced' },
    { name: 'actorId', title: 'Actor Sanity ID', type: 'string', readOnly: true },
    { name: 'actorEmail', title: 'Actor Email', type: 'string', readOnly: true },
    { name: 'targetId', title: 'Target Sanity ID', type: 'string', readOnly: true },
    { name: 'targetName', title: 'Target Name / Identifier', type: 'string', readOnly: true },
    { name: 'details', title: 'Details (JSON)', type: 'text', rows: 3, readOnly: true },
    { name: 'timestamp', title: 'Timestamp', type: 'datetime', readOnly: true },
  ],
  orderings: [
    { title: 'Newest first', name: 'timestampDesc', by: [{ field: 'timestamp', direction: 'desc' }] },
  ],
  preview: {
    select: { action: 'action', actorEmail: 'actorEmail', targetName: 'targetName', timestamp: 'timestamp' },
    prepare({ action, actorEmail, targetName, timestamp }) {
      const ts = timestamp ? new Date(timestamp).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''
      return {
        title: `${action || 'unknown'} — ${targetName || ''}`,
        subtitle: `${actorEmail || 'system'} · ${ts}`,
      }
    }
  }
}
