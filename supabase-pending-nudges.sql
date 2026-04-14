-- Migration: add reminder tracking columns for pending booking nudges cron
-- Run this in Supabase SQL editor before deploying the pending-booking-nudges cron.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS reminder_24h_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_48h_sent_at timestamptz;

-- Optional: index on status + notified_at so the hourly cron query is fast
CREATE INDEX IF NOT EXISTS idx_bookings_pending_notified
  ON public.bookings (status, notified_at)
  WHERE status = 'pending' AND notified_at IS NOT NULL;
