-- Migration 0005: remove legacy gamification schema (cost-governor Req 7, Req 8)
--
-- Relocates the `user_profiles` table and the `user_votes` betting columns
-- (wager_amount, odds_at_bet, payout_amount) into an `archive` Postgres schema
-- that is unreachable from `public` and from Drizzle relations (Req 7.7), then
-- drops them from `public` (Req 7.1, 7.2, 7.4).
--
-- The whole migration runs inside a single transaction, so any failure rolls
-- back with schema + data intact (Req 7.5). Every statement is guarded with
-- IF EXISTS / IF NOT EXISTS (and to_regclass / information_schema checks for the
-- relocation copies), so re-applying against an already-clean database is a
-- no-op success (Req 7.6). Plain crowd-vote columns on user_votes and the crowd
-- tally columns on debates are untouched (Req 8).
--
-- NOTE: this file intentionally contains no `--> statement-breakpoint` markers
-- so the drizzle migrator executes it as one atomic script honoring BEGIN/COMMIT.

BEGIN;

-- 1. Archive schema for retained-but-unreachable historical structures (Req 7.7).
CREATE SCHEMA IF NOT EXISTS archive;

-- 2. Relocate user_profiles -> archive.user_profiles_legacy, preserving data.
--    Guarded so it only runs when the source table still exists; the archive
--    copy is created only once (IF NOT EXISTS) to keep re-application a no-op.
DO $$
BEGIN
  IF to_regclass('public.user_profiles') IS NOT NULL
     AND to_regclass('archive.user_profiles_legacy') IS NULL THEN
    CREATE TABLE archive.user_profiles_legacy AS
      SELECT * FROM public.user_profiles;
  END IF;
END $$;

-- 3. Preserve the three betting column values, keyed by user_votes id, into
--    archive.user_votes_betting_legacy. Guarded on the presence of the betting
--    columns so it only runs pre-drop and stays idempotent afterwards.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_votes'
      AND column_name = 'wager_amount'
  ) AND to_regclass('archive.user_votes_betting_legacy') IS NULL THEN
    CREATE TABLE archive.user_votes_betting_legacy AS
      SELECT id AS user_vote_id, wager_amount, odds_at_bet, payout_amount
      FROM public.user_votes;
  END IF;
END $$;

-- 4. Drop the legacy gamification table from the active schema (Req 7.1, 7.4).
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- 5. Drop the betting columns from the active schema, preserving every other
--    user_votes column (Req 7.2, 7.4, Req 8.1/8.2).
ALTER TABLE public.user_votes DROP COLUMN IF EXISTS wager_amount;
ALTER TABLE public.user_votes DROP COLUMN IF EXISTS odds_at_bet;
ALTER TABLE public.user_votes DROP COLUMN IF EXISTS payout_amount;

COMMIT;
