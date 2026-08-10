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
- **Don't commit and don't push.** Tom does both, by hand. Leave the working
  tree dirty and unstaged, and hand him the block below to paste — see
  *Handing off a change*.
- **Never print secrets.** Describe a key by shape or decoded role, not value.

## Handing off a change

Finish by giving Tom one pasteable block in this exact shape — `npm run build`,
an explicit `git add` naming every file touched, the commit, then `git push`:

```bash
cd ~/Desktop/axionia-site
npm run build
git add path/to/one.tsx path/to/two.tsx
git commit -m "Imperative summary line, no full stop
...body..."
git push
```

The message follows the house style:

- **Subject in the imperative, one line, no full stop.** What the change makes
  true, not what was done to the code — "Make page one survive being printed".
- **Body is prose in short paragraphs.** No bullets, no `-` lists, no
  Co-Authored-By or generated-with trailers.
- **Name the fault, then the fix, in that order.** Each paragraph takes one
  fault: what was wrong, the mechanism that made it wrong, what replaced it.
  Numbers where they exist — `9px arrives at 5.3px`, not `too small`.
- **Say what the change did NOT touch** when that's the reassuring part, as its
  own closing line. "No content changed."

## Tom is testing in production

Accepted explicitly. It means a broken commit is visible at axionia.com within a
minute, so run the checks above before committing rather than after.
