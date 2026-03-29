export default {
  name: 'contactShare',
  type: 'document',
  title: 'Contact Share',
  fields: [
    { name: 'sharer', type: 'reference', to: [{ type: 'catSitter' }] },
    { name: 'recipient', type: 'reference', to: [{ type: 'catSitter' }] },
    { name: 'emailShared', type: 'boolean', initialValue: false },
    { name: 'whatsappShared', type: 'boolean', initialValue: false },
    { name: 'sharedAt', type: 'datetime' },
  ],
}
