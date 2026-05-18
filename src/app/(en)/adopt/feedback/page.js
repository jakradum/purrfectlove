import { notFound } from 'next/navigation'
import { client } from '@/lib/sanity'
import FeedbackForm from '@/components/Adopt/FeedbackForm'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Adoption Feedback — Purrfect Love',
  robots: { index: false, follow: false },
}

export default async function FeedbackPage({ searchParams }) {
  const { token } = await searchParams

  if (!token) {
    notFound()
  }

  const application = await client.fetch(
    `*[_type == "application" && feedbackToken == $token][0]{ _id, feedbackSubmittedAt, feedbackLocale }`,
    { token }
  )

  if (!application) {
    notFound()
  }

  return (
    <FeedbackForm
      token={token}
      applicationId={application._id}
      feedbackSubmittedAt={application.feedbackSubmittedAt ?? null}
      locale={application.feedbackLocale ?? 'en'}
    />
  )
}
