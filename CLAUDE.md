# Axionia — working notes for Claude

Read **`docs/PROJECT_STATE.md`** before doing anything. It carries where the
project stands, what's open, and the invariants. This file is loaded
automatically at the start of every session; that one has the substance.

## What each document is for

Added 2026-08-27, because stale documents kept being discovered mid-task rather
than at the start. **If work makes one of these wrong, fix it in the same
commit** — a doc that reads as current and isn't costs more than no doc at all.

| File | Holds | Wins over |
|---|---|---|
| `docs/PROJECT_STATE.md` | Where things stand, what's open, standing decisions and their falsifiers | Anything except the model and brand tokens |
| `docs/FINANCIAL_MODEL.md` | Headline extract of the operating model | Nothing — the workbook wins |
| `docs/MARKET_STATS.md` | Every external statistic on a public surface, with source and retrieval date | Any number quoted from memory |
| `docs/EXPOSURE_MODEL.md` | Spec for the population exposure model. Nothing built yet | — |
| `docs/PAID_REVIEW_DESIGN.md` | The paid engagement's human-review design | — |
| `docs/REVIEW_2026-08-27.md` | The live work queue for the public site | — |
| `docs/REVIEW_2026-08-09.md` | Prior full review. Historical | — |
| `axionia_brand_tokens.md` (project knowledge) | Fonts, colour, semantic scale, logo | Everything, including this repo |

**No number reaches a public surface without a row in `MARKET_STATS.md`.** That
file also carries a *Checked and rejected* section — read it before quoting a
figure someone remembers.

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
- **Run no git command that writes.** Anything that takes a lock is off limits:
  `add`, `commit`, `reset`, `checkout`, `stash`, `restore`. See *Why git writes
  are banned* for what happens when you try.
- **`git status` counts as a write.** It refreshes the index, which takes
  `index.lock` — so a bare `git status` leaves a lock behind exactly like
  `git add` does. This file used to list it as safe and that was wrong; it cost
  Tom a manual `rm` mid-session. Use **`git status --porcelain --no-optional-locks`**,
  or better, `git diff --stat` and `git log`, which never touch the index.
  `git diff`, `log` and `show` are genuinely read-only.
- **Never print secrets.** Describe a key by shape or decoded role, not value.

## Why git writes are banned

The agent sandbox mounts the repo but cannot unlink files under `.git`. Git
takes a lock, fails, and then cannot clean up after itself — so a single
`git add` or `git reset` leaves `index.lock`, `HEAD.lock` and
`refs/heads/main.lock` behind. Every command Tom runs afterwards dies with
"Another git process seems to be running", and the only fix is him deleting
the locks by hand. This has already cost one session. Leave the working tree
dirty and unstaged; Tom's `git add` is the first git write that happens.

If it happens anyway, the recovery is:

```bash
cd ~/Desktop/axionia-site
rm -f .git/HEAD.lock .git/refs/heads/main.lock .git/index.lock
find .git/objects -name 'tmp_obj*' -delete
```

## Handing off a change

Write the commit message to `COMMIT_MSG.txt` in the repo root, then give Tom
this block. `-F` and not `-m`: a multi-line `-m` string pasted into an
interactive shell strands it at `dquote>` waiting for a closing quote, which
swallows every command after it. That is the second thing that cost a session.
Nothing multi-line should ever touch the shell.

```bash
cd ~/Desktop/axionia-site
npm run build
git add path/to/one.tsx path/to/two.tsx
git commit -F COMMIT_MSG.txt
git push
rm COMMIT_MSG.txt
```

`git add` names every file touched, explicitly. No `-A`, no `.` — the list is
the change's manifest and Tom reads it before running it.

`npm run build` is Tom's to run. It does not finish inside the agent sandbox's
command timeout, so don't attempt it there and don't report it as passing.
`npx tsc --noEmit` does run in the sandbox and is the gate you own.

The message in `COMMIT_MSG.txt` follows the house style:

- **Subject in the imperative, one line, no full stop.** What the change makes
  true, not what was done to the code — "Make page one survive being printed".
- **Body is prose in short paragraphs.** No bullets, no `-` lists, no
  Co-Authored-By or generated-with trailers.
- **Name the fault, then the fix, in that order.** Each paragraph takes one
  fault: what was wrong, the mechanism that made it wrong, what replaced it.
  Numbers where they exist — `9px arrives at 5.3px`, not `too small`.
- **Say what the change did NOT touch** when that's the reassuring part, as its
  own closing line. "No content changed."

## The report page IS the PDF

There is no export step. `/reports/[id]` printed from the browser is the
artifact a client receives, so any change to that page is a change to the
deliverable and has to be reasoned about in paged media as well as on screen.
Four things bite, and all four have bitten:

- **`sticky` and `fixed` have no meaning in print.** A positioned element lands
  wherever the scroll position left it, on top of whatever is underneath. New
  chrome gets `data-print-hide`, which `globals.css` hides.
- **`md:` resolves against the PRINT viewport,** which can fall below 768px.
  Anything that must not stack in the PDF needs a `print:` variant alongside
  the `md:` one.
- **`break-inside: avoid` is a request, not a guarantee.** An element taller
  than a page is split anyway, at a line nobody chose. Apply it to blocks that
  actually fit — a chart cell, a table row — never to a whole section that runs
  long.
- **The SVG viewBox is the unit, not the pixel.** Scaling a chart down without
  giving it its own viewBox shrinks the labels past legibility. See the note in
  `MixMap.tsx`.

Verify by printing to PDF and reading pages one and two. There is no headless
Chrome in the agent sandbox, so this check belongs to Tom — say so plainly
rather than claiming a layout is fixed sight unseen.

## Tom is testing in production

Accepted explicitly. It means a broken commit is visible at axionia.com within a
minute, so run the checks above before committing rather than after.
