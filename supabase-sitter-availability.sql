-- Migration: move sitter availability out of Sanity into Supabase
-- Run in Supabase SQL editor before deploying the matching code changes.

CREATE TABLE IF NOT EXISTS sitter_availability (
  sitter_id            text PRIMARY KEY,
  availability_default text NOT NULL DEFAULT 'available',
  unavailable_dates    text[] NOT NULL DEFAULT '{}',
  blocked_by_booking   text[] NOT NULL DEFAULT '{}'
);

-- Atomic merge: append new blocked dates without duplicates
CREATE OR REPLACE FUNCTION availability_merge_blocked(p_sitter_id text, p_dates text[])
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO sitter_availability (sitter_id, blocked_by_booking)
  VALUES (p_sitter_id, p_dates)
  ON CONFLICT (sitter_id) DO UPDATE
  SET blocked_by_booking = ARRAY(
    SELECT DISTINCT d FROM unnest(sitter_availability.blocked_by_booking || p_dates) AS d
    ORDER BY d
  );
END;
$$;

-- Atomic unmerge: remove specific dates from blocked list
CREATE OR REPLACE FUNCTION availability_unmerge_blocked(p_sitter_id text, p_dates text[])
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE sitter_availability
  SET blocked_by_booking = ARRAY(
    SELECT d FROM unnest(blocked_by_booking) AS d
    WHERE d <> ALL(p_dates)
    ORDER BY d
  )
  WHERE sitter_id = p_sitter_id;
END;
$$;
