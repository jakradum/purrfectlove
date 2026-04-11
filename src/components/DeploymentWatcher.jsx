'use client';

import { useEffect, useRef } from 'react';

const POLL_INTERVAL = 60 * 60 * 1000; // 1 hour

export default function DeploymentWatcher() {
  const bootId = useRef(null);

  useEffect(() => {
    // Capture the build ID that was in the page when it loaded
    bootId.current = window.__NEXT_DATA__?.buildId ?? null;
    if (!bootId.current) return;

    async function check() {
      try {
        const res = await fetch('/api/build-id', { cache: 'no-store' });
        if (!res.ok) return;
        const { buildId } = await res.json();
        if (buildId && buildId !== 'unknown' && buildId !== bootId.current) {
          window.location.reload();
        }
      } catch { /* network blip — ignore */ }
    }

    // Poll every hour
    const interval = setInterval(check, POLL_INTERVAL);

    // Also check when user returns to the tab
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return null;
}
