# Vote 2026 — Development Plan

A tiny, read-only, mobile-first results page for the Halloween party ballot box.
Guests vote on paper; the organizer types everything into one Markdown file once;
the page is published to GitHub Pages. A one-off for fun, built to match.

## 1. Architecture

```
ballots.md ──(import ?raw)──▶ src/main.ts parses it ──▶ vite build ──▶ GitHub Pages
```

- **No server, no database, no admin UI, no polling.** The page is static.
- **Data entry** = write `ballots.md`, one ballot per line, then push to `main`.
- Vite inlines the Markdown into the JS bundle (`import md from '../ballots.md?raw'`),
  so the parse code runs in the browser and there is no separate conversion script or JSON file.
- **Checking it** = `npm run dev` and look at the page before pushing. Lines that
  don't parse show up in a red "couldn't read these lines" box at the bottom of the page,
  so mistakes are visible right away.

## 2. Stack

TypeScript + Vite (vanilla-ts template), one CSS file, GitHub Pages via Actions.
Dependencies: `vite`, `typescript`. Nothing else.

## 3. Data format — `ballots.md`

```md
# Halloween 2026 Referendum

## Ballots

21:04 | for | Ban candy corn forever
21:06 | against | the DJ should play Monster Mash again
21:10 | abstain | Should Dave be allowed back
for | Pizza at midnight

## Results

Candy corn | 7 | 2 | 1
Monster Mash | 3 | 5 | 0
```

Rules:
- `# …` sets the page title.
- `## Ballots` / `## Results` switch sections. Blank lines are ignored.
- **Ballot line:** `[time |] position | text`
  - `time` (optional): `HH:mm` as written or estimated. Omit it and the ballot just has no time.
  - `position`: `for`, `against` or `abstain` (case-insensitive; `+`, `-` and `0` work as shorthands).
  - `text`: everything after the separator, kept verbatim, even if it contains `|`.
  - Order in the file = order of the feed (chronological). Ballot numbers `#1, #2…` come from line order.
- **Result line:** `topic | for | against | abstain`, with the counts typed by hand
  (grouping is the organizer's call, not computed).
- Total ballots = number of valid ballot lines (computed).

## 4. File layout

```
ballots.md               # the data
index.html               # shell
src/main.ts              # parse + render (~120 lines)
src/style.css            # mobile-first, dark Halloween palette
vite.config.ts           # base: '/vote-2026/'
.github/workflows/deploy.yml
package.json, tsconfig.json, README.md
```

## 5. Parsing (`parse(md: string)` in `src/main.ts`)

Line-by-line loop with a `section` variable:
- `# x` → title; `## x` → section = lowercased x; blank → skip.
- In `ballots`: split on `|`, trim. If the first part matches `/^\d{1,2}:\d{2}$/`, it's the time.
  The next part must be a valid position, and the text is the rest joined back with `|`.
- In `results`: the last three parts must be non-negative integers; the topic is the rest.
- Anything else → push `{ lineNo, line }` to `errors`.

Returns `{ title, ballots, results, errors }`.

## 6. Page (single column, top to bottom)

1. **Header** — title + big "N ballots cast".
2. **Results** — a card per topic: name, a for/against/abstain stacked bar, and the counts.
   Hidden if there are no results.
3. **Feed** — all ballots in file order: `#12 · 21:06` · FOR/AGAINST/ABSTAIN badge · text.
4. **Errors box** — only if some lines didn't parse (useful in dev, harmless in prod).

Mobile-first: ~16px gutters, max-width ~640px centred on desktop, system fonts,
`overflow-wrap: anywhere` for long text. Position is shown as a text label, not just colour.
All ballot text is rendered via `textContent`, never `innerHTML`.

**TV mode:** opening the page with `?tv` makes it reload every 60 s (the equivalent of
`<meta http-equiv="refresh" content="60">`, but only for the wall screen, so phones
don't reload while someone is scrolling).

**Party-time entry:** `CLAUDE.md` tells an agent how to append ballots and push.

## 7. Deployment

`.github/workflows/deploy.yml` on push to `main`:
`checkout → setup-node → npm ci → npm run build → upload-pages-artifact(dist) → deploy-pages`.
One-time setting: **Settings → Pages → Source: GitHub Actions** (the repo must be public on a free plan).

## 8. Build order (~2 hours)

| # | Task | Done when |
|---|------|-----------|
| 1 | Scaffold Vite vanilla-ts, strip boilerplate, add sample `ballots.md` | `npm run dev` runs |
| 2 | `parse()` + header/total + feed | sample ballots render in order |
| 3 | Result cards + errors box | bad lines show up in red |
| 4 | CSS pass at 375px, then desktop | readable on a phone, no horizontal scroll |
| 5 | Workflow + enable Pages | public URL live with sample data |
| 6 | README: the format rules from §3 | done |
| 7 | After the party: replace the sample with real ballots, check in dev, push | 🎃 |

## 9. Out of scope

Live updates/polling (beyond TV mode), public submission, accounts, auth, admin UI, database,
comments/reactions, analytics, automatic grouping, tests.
