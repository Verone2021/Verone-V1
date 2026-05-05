-- BO-MSG-008: Ajoute contrainte UNIQUE explicite sur gmail_watch_state.email_address
--
-- Contexte : supabase-js/.upsert({ onConflict: 'email_address' }) passe
-- on_conflict=email_address à PostgREST. Certaines versions de PostgREST
-- refusent l'upsert quand seule une PK existe sans UNIQUE distinct, retournant
-- "Could not find a constraint or index matching your request".
-- Cette migration ajoute la contrainte UNIQUE pour rendre l'upsert fiable.
--
-- Idempotent : IF NOT EXISTS protège contre une double application.

ALTER TABLE public.gmail_watch_state
  ADD CONSTRAINT gmail_watch_state_email_address_unique
  UNIQUE (email_address);
