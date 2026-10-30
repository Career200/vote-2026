# Vote 2026 — Development Plan

A read-only, mobile-first results site for the Halloween party ballot box.
Guests vote on paper; the organizer types ballots in; visitors watch the feed.

## 1. Architecture (the whole thing)

```
data/ballots.json ──(git push / GitHub web editor)──▶ GitHub Actions
                                                          │ validate + build
                                                          ▼
                                       GitHub Pages: index.html + app.js + data.json
                                                          ▲
                              browser polls data.json every 30 s
```

- **No server, no database, no admin UI.** The data is one JSON file in this repo.
- **Data entry** = edit `data/ballots.json` (locally, or on a phone via github.com's
  file editor) and commit. A deploy takes ~1 minute.
- **Updates** = the page re-fetches `data.json` every 30 s (cache-busted) and re-renders.
- **Safety net** = the build validates the JSON; a malformed edit fails CI and the
  last good version stays live.

Why this over a backend with an admin form: zero hosting, zero auth to build, free,
and the git history doubles as an audit log of every entry. The cost is a ~1 min
publish delay and hand-editing JSON — acceptable for one evening and one editor.

## 2. Stack

| Concern  | Choice                                   |
|----------|------------------------------------------|
| Language | TypeScript (strict)                      |
| Build    | Vite (vanilla-ts template), no framework |
| Styling  | One hand-written CSS file                |
| Hosting  | GitHub Pages via GitHub Actions          |
| Tests    | None beyond the data validator + `tsc`   |

Dependencies: `vite`, `typescript`. Nothing else.

## 3. Data format

`data/ballots.json` — the single source of truth:

```json
{
  "title": "Halloween 2026 Referendum",
  "ballots": [
    { "id": 1, "at": "2026-10-31T21:04", "text": "Ban candy corn forever", "vote": "for" },
    { "id": 2, "at": "2026-10-31T21:06", "text": "the DJ should play Monster Mash again", "vote": "against" }
  ],
  "results": [
    { "topic": "Candy corn", "for": 7, "against": 2, "abstain": 1, "note": "ballots 1, 4, 9…" }
  ]
}
```

- `id` — sequential integer, unique. Lets results reference ballots and keeps order stable.
- `at` — local time the ballot was cast/collected (`YYYY-MM-DDTHH:mm`), entered by hand.
  Displayed as-is (e.g. "21:04"); no timezone conversion.
- `text` — original wording, verbatim. Rendered with `textContent` (never as HTML).
- `vote` — `"for" | "against" | "abstain"`.
- `results` — fully manual aggregation. Counts are typed in, not computed, because grouping
  free-form text is the organizer's judgement call. `note` is optional.

Total ballot count = `ballots.length` (computed, never typed).

## 4. File layout

```
index.html               # shell: header, total, results, feed
src/main.ts              # fetch + render + poll (~120 lines)
src/types.ts             # Ballot, Result, Data types
src/style.css            # mobile-first styles, dark Halloween palette
data/ballots.json        # the data (edited by hand)
scripts/validate.ts      # checks data/ballots.json; copies it to public/data.json
.github/workflows/deploy.yml
vite.config.ts           # base: '/vote-2026/'
package.json, tsconfig.json, README.md
```

## 5. Page design (single page, top to bottom)

1. **Header** — title + "N ballots cast" (large number) + "updated 21:14" stamp.
2. **Results** — one card per `results` entry: topic, a horizontal stacked bar
   (for / against / abstain), and the three counts. Hidden if `results` is empty.
3. **Feed** — every ballot, **newest first**, as a compact row:
   `#12 · 21:06` · position badge (FOR / AGAINST / ABSTAIN) · the text.

Mobile-first: single column, ~16 px gutters, max-width ~640 px centred on desktop.
Position is conveyed by label text, not colour alone. System font stack, no web fonts.
Long unbroken text wraps (`overflow-wrap: anywhere`).

## 6. Client behaviour (`src/main.ts`)

- `load()` → `fetch('data.json?t=' + Date.now(), { cache: 'no-store' })` → validate shape
  loosely → `render(data)`.
- `setInterval(load, 30_000)`; also reload on `visibilitychange` when the tab becomes visible.
- Skip re-render if the response text is identical to the last one (avoids scroll jumps).
- On fetch error: keep showing the last good data, show a small "offline — retrying" note.
- Render by building DOM nodes with `textContent`; no `innerHTML` with user text.

## 7. Validation script (`scripts/validate.ts`)

Run with `node --experimental-strip-types` (Node ≥ 22.6) or `tsx`; called by `npm run build`.

Fails the build if:
- JSON doesn't parse;
- a ballot is missing a field, has an unknown `vote`, empty `text`, or a malformed `at`;
- `id`s are duplicated;
- a result has non-integer / negative counts.

Warns (doesn't fail) if a result's counts sum to more than the total ballots.
On success, writes `public/data.json` so Vite ships it at the site root.

## 8. Deployment

`.github/workflows/deploy.yml`, on push to `main`:
`checkout → setup-node 22 → npm ci → npm run build → upload-pages-artifact(dist) → deploy-pages`.

One-time repo setting: **Settings → Pages → Source: GitHub Actions.**
Note: GitHub Pages on a private repo needs a paid plan; make the repo public or use
Cloudflare Pages / Netlify with the same build command.

## 9. Build order (est. 3–4 hours total)

| # | Task | Done when |
|---|------|-----------|
| 1 | Scaffold Vite vanilla-ts, strip boilerplate, add `types.ts` | `npm run dev` shows a blank page |
| 2 | Write `data/ballots.json` with ~10 sample ballots + 2 results | file exists |
| 3 | `validate.ts` + wire into `build` script | bad JSON fails `npm run build` |
| 4 | `main.ts`: fetch + render header/total and feed | feed shows samples, newest first |
| 5 | Results cards with stacked bars | cards render; hidden when empty |
| 6 | Polling, visibility reload, no-op on unchanged data, error note | editing the JSON in dev updates page within 30 s |
| 7 | CSS pass on a 375 px viewport, then desktop | readable on phone, no horizontal scroll |
| 8 | Deploy workflow + enable Pages | public URL live |
| 9 | Clear sample data, set real title, smoke-test an edit from a phone | edit → live in ~1 min |
| 10 | README: "how to add a ballot" in 5 lines | done |

## 10. Party-night workflow

1. Collect a batch of ballots from the box.
2. Open `data/ballots.json` on github.com (pencil icon), append entries with the next `id`s.
3. Commit directly to `main`. Check the Actions tab goes green (~1 min).
4. Every so often, update `results` counts as themes emerge.
5. Show the site on a TV/projector — it refreshes itself.

Tip: batch entries (every 10–15 ballots) rather than one commit per ballot.

## 11. Explicitly out of scope

Public submission, accounts, auth, admin UI, database, comments/reactions, sharing,
analytics, automatic grouping/NLP, websockets/live push, i18n, edit history UI, tests
beyond validation.

## 12. If the 1-minute delay turns out to be annoying (only then)

Swap the data source for a published Google Sheet CSV (or a Gist raw URL) fetched
directly by the client; the render code stays the same — only `load()` changes.
