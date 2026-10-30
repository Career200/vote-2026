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

Framing: the protocol of the "Астральная избирательная комиссия, участок № 31". Ballots are
collected by the Духом выборов with a portable ballot box (голосование вне помещения для
голосования). The language is strictly formal; only the subject matter is otherworldly.

1. Header: commission, precinct, title, "ПРОТОКОЛ об итогах волеизъявления", build time
   ("Сведения по состоянию на …", in the visitor's timezone).
2. Notice box (`>` lines): voting is conducted outside the polling station, about 2 h lag.
3. Protocol lines with dotted leaders: number of ballots, number of questions.
4. "Итоги волеизъявления по вопросам": a table per question (За / Против / Воздержались,
   count, %), a thin bar and a violet stamp "Решение принято / не принято". It is accepted
   when За is more than half of all votes, abstentions included.
5. "Реестр бюллетеней": Бюллетень № · time · original text · За / Против / Воздержался(-ась).
6. Signature lines (Председатель комиссии, Дух выборов) and a round violet seal, М.П.
7. Dashed divider + "ОБРАЗЕЦ"; the example is rendered the same way over an "ОБРАЗЕЦ" watermark.
8. Error box, if any.

Style: off-white paper, PT Serif / PT Sans (Google Fonts), indigo accent, violet stamp ink,
a faint moon-and-constellation watermark in the header, light theme only.
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
