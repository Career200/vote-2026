# 🎃 Хэллоуинский референдум

Read-only results page (in Russian) for the party ballot box. All data lives in
[`ballots.md`](ballots.md). Every push to `main` rebuilds the site on GitHub Pages (~1 min).

## `ballots.md` format

```md
# Page title

> Notice shown in an «Информационное сообщение» box (any number of `>` lines).
> ! A line starting with `!` becomes a violet stamp under the notice.

21:40 | за | A ballot that belongs to no topic

## Topic name, in your own words
21:04 | за | Ballot text, verbatim
22:30 | !за | A ballot whose meaning is the opposite of the topic's

---

(everything below this line is shown as an example, under a dashed divider)
```

- **Ballot line:** `HH:mm | position | text`.
  - Time is required: it orders the feed. Times `00:00`–`11:59` count as after midnight.
  - Position is `за`, `против` or `возд` (also `for`, `against`, `abstain` or `+`, `-`, `0`).
  - Text is kept verbatim, `|` included.
- **Topics:** a `## Heading` groups the ballots under it. Ballots above the first heading
  belong to no topic. A topic with 2 or more ballots gets a results card, with counts computed
  automatically. Single-ballot topics show up only in the feed.
- **`!` before the position** flips it for the topic's count (for ↔ against). The feed still
  shows the guest's original position.
- **Feed numbering** (`#1, #2…`) follows time order, not file order.
- **`Испорченные бюллетени: 4`** adds a protocol line with the number of spoiled ballots.
- **`% Label | value`** adds a hand-entered line to «Статистические сведения» (the rest of that section is computed).
- **`---`** separates real data (above) from example data (below). Delete the example part
  whenever you like.
- Lines that can't be read show up in a red box at the bottom of the page.

## Running locally

```
npm install
npm run dev
```

## TV mode

Open the page with `?tv` (e.g. `…/vote-2026/?tv`) and it reloads every minute.

## One-time setup

Repo **Settings → Pages → Source: GitHub Actions**.

## Ballot box front page

`print/ballot-box.pdf` (A4) is rendered from `print/box.html` with headless Chromium
(Playwright `page.pdf()`). The QR code in `src/qr.svg` points at the site and is static, so it never expires.
