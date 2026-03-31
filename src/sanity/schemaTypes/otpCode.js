export default {
  name: 'otpCode',
  title: 'OTP Code',
  type: 'document',
  fields: [
    {
      name: 'phone',
      title: 'Phone',
      type: 'string',
      description: 'Set when logging in via phone (E.164 format)',
    },
    {
      name: 'email',
      title: 'Email',
      type: 'string',
      description: 'Set when logging in via email',
    },
    {
      name: 'code',
      title: 'Code',
      type: 'string',
      validation: Rule => Rule.required(),
    },
    {
      name: 'expiresAt',
      title: 'Expires At',
      type: 'datetime',
      validation: Rule => Rule.required(),
    },
    {
      name: 'attempts',
      title: 'Failed Attempts',
      type: 'number',
      description: 'Incremented on each wrong code guess. Record deleted at 5.',
      initialValue: 0,
    },
  ],
  preview: {
    select: { phone: 'phone', email: 'email', subtitle: 'expiresAt' },
    prepare({ phone, email, subtitle }) {
      return { title: phone || email || 'Unknown', subtitle }
    }
  }
}
