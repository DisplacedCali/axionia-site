# Axionia — working notes for Claude

Read **`docs/PROJECT_STATE.md`** before doing anything. It carries where the
project stands, what's open, and the invariants. This file is loaded
automatically at the start of every session; that one has the substance.

## Two repos

- `~/Desktop/axionia-site` — **this one.** The live product on Vercel.
- `~/Desktop/axionia-app` — superseded research agent, reference only. Must not
  write to the database.

## Before you finish any change

```bash
npm run research:dryrun     # if you touched lib/modules/research
npx tsc --noEmit            # always — the only type gate; no ESLint configured
```

## House rules

- **Ask before adding a dependency.** The stack is deliberately thin.
- **Never invent library data.** Benefits, vendors, mandates and segments are
  the product's defensible spine. A plausible-looking fabricated row is worse
  than a missing one. Record the gap instead — see `data/validate.ts`, where
  `BEN029` is an accepted warning rather than a quietly invented benefit.
- **Brand tokens are canonical.** `axionia_brand_tokens.md` in project knowledge
  governs fonts, colour, the semantic scale and the logo. Never redraw the logo.
- **Comments explain *why*.** The what is in the code.
- **Don't push.** Stage and commit; leave `git push` to Tom.
- **Never print secrets.** Describe a key by shape or decoded role, not value.

## Tom is testing in production

Accepted explicitly. It means a broken commit is visible at axionia.com within a
minute, so run the checks above before committing rather than after.
