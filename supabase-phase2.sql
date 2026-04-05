-- Phase 2: bookings + membership_requests tables
-- Run this entire file in the Supabase SQL editor before cutting over any routes.

-- ─────────────────────────────────────────────
-- 1. Custom RLS helper
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION auth_sitter_id() RETURNS text
  LANGUAGE sql STABLE
  AS $$ SELECT auth.jwt() -> 'user_metadata' ->> 'sitterId' $$;

-- ─────────────────────────────────────────────
-- 2. bookings table
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bookings (
  id                     text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  booking_ref            text UNIQUE NOT NULL,
  sitter_id              text NOT NULL,    -- catSitter Sanity _id
  parent_id              text NOT NULL,    -- catSitter Sanity _id
  start_date             date NOT NULL,
  end_date               date NOT NULL,
  cats                   text[] NOT NULL DEFAULT '{}',
  message                text,
  status                 text NOT NULL DEFAULT 'pending',
  created_at             timestamptz NOT NULL DEFAULT now(),
  notified_at            timestamptz,
  notification_delivered boolean NOT NULL DEFAULT false,
  responded_at           timestamptz,
  response_time_hours    numeric,
  cancellation_reason    text,
  cancelled_by           text,
  cancelled_at           timestamptz
);

CREATE INDEX IF NOT EXISTS bookings_sitter_id_idx ON public.bookings (sitter_id);
CREATE INDEX IF NOT EXISTS bookings_parent_id_idx ON public.bookings (parent_id);
CREATE INDEX IF NOT EXISTS bookings_status_idx     ON public.bookings (status);

-- Enable Realtime (required for Supabase Realtime subscriptions)
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;

-- RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_bookings" ON public.bookings
  FOR SELECT USING (sitter_id = auth_sitter_id() OR parent_id = auth_sitter_id());

CREATE POLICY "insert_own_bookings" ON public.bookings
  FOR INSERT WITH CHECK (parent_id = auth_sitter_id());

CREATE POLICY "update_own_bookings" ON public.bookings
  FOR UPDATE USING (sitter_id = auth_sitter_id() OR parent_id = auth_sitter_id());

-- ─────────────────────────────────────────────
-- 3. membership_requests table
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.membership_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  phone        text,
  email        text,
  message      text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  status       text NOT NULL DEFAULT 'pending'
);

-- No user-facing RLS policies needed — all access is via service role from admin API routes.
-- The join form (public, unauthenticated) also uses service role.
ALTER TABLE public.membership_requests ENABLE ROW LEVEL SECURITY;
