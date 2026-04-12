'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import posthog from 'posthog-js'

export default function PostHogPageView() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname || !posthog.__loaded) return
    posthog.capture('$pageview', { $current_url: window.location.href })
  }, [pathname])

  return null
}
