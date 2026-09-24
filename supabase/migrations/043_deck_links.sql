-- ============================================================
-- Axionia — migration 043: a record of every share link minted
--
-- Deck links were designed stateless (lib/deckLinks.ts): the token
-- carries its own label, expiry and entity, and verifying one needs
-- no lookup. That is still how access works and this migration does
-- not change it. What statelessness cost was the link itself. Once
-- the copy box closed, the URL existed only in whatever email it was
-- pasted into, so "send Acme their proposal link again" meant
-- minting a second one and leaving the first live and unaccounted
-- for.
--
-- So every mint now writes a row here, and the company hub lists the
-- rows for that company. This is a LOG, not an access control:
-- /deck/* never reads this table, deleting a row revokes nothing,
-- and a link minted before this migration still verifies without a
-- row. Revocation is still DECK_LINK_SECRET / INVESTOR_LINK_SECRET /
-- PROPOSAL_LINK_SECRET rotation, and the hub works out each link's
-- live status by verifying the stored token against the current
-- secret rather than trusting a status column that rotation would
-- silently make wrong.
--
-- ── WHY THE FULL URL IS STORED ──
--
-- The URL is a bearer credential, and storing credentials is usually
-- the thing not to do. Here it is the requirement: the point is to
-- hand the same link back out. A hash would prove a link existed and
-- could never give it back. The table sits behind the same posture
-- as deck_versions (026): RLS on, no permissive policy, reachable
-- only through the service role from staff-gated server code.
--
-- company_id and firm_id mirror the entity signed into the token.
-- They are copied out at mint time so the hub can query by company
-- without decoding every token, and they follow a merge the same way
-- createShareLink does, because the ref was already resolved to the
-- canonical row before signing.
--
-- Run AFTER 042. Safe to re-run.
-- ============================================================

create table if not exists public.deck_links (
  id          uuid primary key default gen_random_uuid(),

  deck        text not null
              check (deck in ('buyer', 'founders', 'investor', 'proposal')),

  -- What was typed into Recipient, after mintDeckLink's sanitiser.
  -- The same string deck_events.link_label records on every open.
  label       text not null,

  company_id  uuid references public.companies(id)     on delete set null,
  firm_id     uuid references public.firms(id)         on delete set null,

  -- Proposal links only. set null rather than cascade: a deleted
  -- version is exactly when you want to see that a link to it went
  -- out, and the hub says so.
  version_id  uuid references public.deck_versions(id) on delete set null,

  url         text not null,
  expires_at  timestamptz not null,

  created_by  uuid references public.profiles(id)      on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists deck_links_company_idx
  on public.deck_links(company_id, created_at desc)
  where company_id is not null;

create index if not exists deck_links_firm_idx
  on public.deck_links(firm_id, created_at desc)
  where firm_id is not null;

alter table public.deck_links enable row level security;

-- 009 sets default privileges for service_role on new tables in
-- public, so this is belt and braces. It costs nothing and it is the
-- line that would have saved a round trip in the "service_role had
-- no grants" episode PROJECT_STATE records.
grant all privileges on public.deck_links to service_role;

comment on table public.deck_links is
  'Log of minted deck share links, so a link can be found and re-sent. '
  'Not read by /deck/*: access is the HMAC, and deleting a row revokes '
  'nothing. Status is derived by re-verifying the stored token.';


-- ────────────────────────────────────────────────────────────
-- VERIFY
-- ────────────────────────────────────────────────────────────
select 'deck_links exists' as check,
       exists (select 1 from information_schema.tables
                where table_schema = 'public'
                  and table_name = 'deck_links') as ok
union all
select 'deck_links has RLS on',
       exists (select 1 from pg_tables
                where schemaname = 'public'
                  and tablename = 'deck_links'
                  and rowsecurity);
