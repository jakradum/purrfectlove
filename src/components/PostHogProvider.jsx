'use client'

import { useEffect } from 'react'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import posthog from 'posthog-js'

export default function PostHogProvider({ children, sitterId, name, locale, isTeamMember }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!key) return
    if (posthog.__loaded) return // already initialised
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
      capture_pageview: false, // handled by PostHogPageView
      persistence: 'localStorage+cookie',
    })
  }, [])

  useEffect(() => {
    if (!sitterId || !posthog.__loaded) return
    posthog.identify(sitterId, {
      name,
      locale,
      is_team_member: isTeamMember ?? false,
    })
  }, [sitterId, name, locale, isTeamMember])

  return <PHProvider client={posthog}>{children}</PHProvider>
}
