# Vote 2026 — Plan (as built)

A tiny, read-only, mobile-first results page (Russian UI) for the Halloween party ballot box.
Guests vote on paper; the organizer (or an agent on their behalf) types ballots into one
Markdown file during the party; the page is published to GitHub Pages. A one-off for fun,
built to match.

## Architecture

```
ballots.md ──(import ?raw)──▶ src/main.ts parses + renders ──▶ vite build ──▶ GitHub Pages
```

- No server, no database, no admin UI, no online voting. Static page only.
- Data entry = edit `ballots.md` and push to `main`; Actions redeploys in about a minute.
- Visitors reload to see new data. `?tv` reloads every 60 s for a wall screen.
- Lines that don't parse show in a red box on the page.

Stack: TypeScript + Vite (no framework), one CSS file. Dependencies: `vite`, `typescript`.

## Data model (`ballots.md`, full rules in README)

- `# title`, `> notice` lines, then ballots `HH:mm | [!]position | text`.
- `## Topic` headings group the ballots under them. The organizer groups by meaning
  during input. Counts are computed. A card appears for topics with 2 or more ballots.
- `!` flips a ballot's position for its topic's count. The feed keeps the original.
- The feed is sorted by time (morning times count as after midnight) and numbered in that order.
- `---` splits real data (above) from example data (below, rendered under a
  "Пример" divider, dimmed).

## Page (top to bottom)

1. Title, big "N бюллетеней в урне" (real ballots only, with Russian plurals).
2. Notice box: "Results are grouped by hand during the evening, about 2 hours behind the ballot box."
3. Real results cards (topic, stacked bar, counts, ballot numbers) and the real feed.
4. Dashed divider + "Пример" label, then the example rendered the same way, dimmed.
5. Error box, if any.

All ballot text is rendered via `textContent`, never `innerHTML`.

## Files

```
ballots.md               # the data
index.html, src/main.ts, src/style.css
vite.config.ts           # base: '/vote-2026/'
.github/workflows/deploy.yml
README.md                # format rules
CLAUDE.md                # how an agent adds ballots during the party
```

## Out of scope

Online voting, accounts, auth, admin UI, database, live push, comments/reactions,
analytics, automatic grouping, a language switch, tests.
