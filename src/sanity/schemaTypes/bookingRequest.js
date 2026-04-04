export default {
  name: 'bookingRequest',
  title: 'Booking Request',
  type: 'document',
  fields: [
    { name: 'sitter', title: 'Sitter', type: 'reference', to: [{ type: 'catSitter' }], validation: Rule => Rule.required() },
    { name: 'parent', title: 'Cat Parent', type: 'reference', to: [{ type: 'catSitter' }], validation: Rule => Rule.required() },
    { name: 'startDate', title: 'Start Date', type: 'date', validation: Rule => Rule.required() },
    { name: 'endDate', title: 'End Date', type: 'date', validation: Rule => Rule.required() },
    {
      name: 'cats',
      title: 'Cats',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Cat names selected by the parent',
    },
    { name: 'bookingRef', title: 'Booking Ref', type: 'string', readOnly: true },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Pending — awaiting sitter response', value: 'pending' },
          { title: 'Confirmed — sitter accepted', value: 'confirmed' },
          { title: 'Declined — sitter said no', value: 'declined' },
          { title: 'Expired — no response within 48 hrs', value: 'expired' },
          { title: 'Cancelled — parent cancelled', value: 'cancelled' },
          { title: 'Completed — sit happened', value: 'completed' },
          { title: 'Unavailable — sitter took another booking', value: 'unavailable' },
          // Legacy value kept so existing documents remain valid
          { title: 'Accepted (legacy)', value: 'accepted' },
        ],
        layout: 'radio',
      },
      initialValue: 'pending',
    },
    { name: 'message', title: 'Message from parent', type: 'text', rows: 3 },
    { name: 'createdAt', title: 'Created At', type: 'datetime', readOnly: true },
    { name: 'cancellationReason', title: 'Cancellation Reason', type: 'text', rows: 3, description: 'Reason provided when the booking was cancelled.' },
    { name: 'cancelledBy', title: 'Cancelled By', type: 'string', options: { list: [{ title: 'Cat Parent', value: 'parent' }, { title: 'Sitter', value: 'sitter' }] }, readOnly: true },
    { name: 'cancelledAt', title: 'Cancelled At', type: 'datetime', readOnly: true },

    // Scoring / response-time tracking
    { name: 'notifiedAt', title: 'Notified At', type: 'datetime', readOnly: true, description: 'Timestamp when the sit-request notification email was sent to the sitter.' },
    { name: 'notificationDelivered', title: 'Notification Delivered', type: 'boolean', initialValue: false, readOnly: true, description: 'Set to true by the Resend webhook when the sitter opens the notification email.' },
    { name: 'respondedAt', title: 'Responded At', type: 'datetime', readOnly: true, description: 'Timestamp when the sitter accepted or declined.' },
    { name: 'responseTimeHours', title: 'Response Time (hours)', type: 'number', readOnly: true, description: 'Hours between notifiedAt and respondedAt. Only written when notificationDelivered is true.' },
  ],
  preview: {
    select: { sitter: 'sitter.username', parent: 'parent.username', ref: 'bookingRef', status: 'status' },
    prepare({ sitter, parent, ref, status }) {
      const statusEmoji = {
        pending: '⏳', confirmed: '✅', accepted: '✅',
        declined: '❌', expired: '⌛', cancelled: '🚫',
        completed: '🏁', unavailable: '🔒',
      }
      return {
        title: `${ref ? `#${ref} · ` : ''}${parent || '?'} → ${sitter || '?'}`,
        subtitle: `${statusEmoji[status] || ''} ${status || 'pending'}`,
      }
    },
  },
}
