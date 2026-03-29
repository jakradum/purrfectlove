export default {
  name: 'otpCode',
  title: 'OTP Code',
  type: 'document',
  fields: [
    { name: "phone", title: "Phone", type: 'string', validation: Rule => Rule.required() },
    { name: 'code', title: 'Code', type: 'string', validation: Rule => Rule.required() },
    { name: 'expiresAt', title: 'Expires At', type: 'datetime', validation: Rule => Rule.required() },
  ],
  preview: {
    select: { title: 'phone', subtitle: 'expiresAt' }
  }
}
