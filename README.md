# 🎃 Halloween Referendum

Read-only results page for the party ballot box. All data lives in [`ballots.md`](ballots.md).
Every push to `main` rebuilds the site on GitHub Pages (~1 min).

## Adding ballots

One ballot per line under `## Ballots`:

```
21:04 | for | Ban candy corn forever
against | the DJ should play Monster Mash again
```

- `time |` is optional (`HH:mm`).
- Position: `for`, `against`, `abstain` (or `+`, `-`, `0`).
- Text is kept verbatim, `|` included.
- The feed shows ballots in file order, numbered `#1, #2…`.

Results go under `## Results` as `topic | for | against | abstain`, counted by hand.
The `# ` heading is the page title.

Lines that can't be read show up in a red box at the bottom of the page.

## Running locally

```
npm install
npm run dev
```

## TV mode

Open the page with `?tv` (e.g. `…/vote-2026/?tv`) and it reloads every minute.

## One-time setup

Repo **Settings → Pages → Source: GitHub Actions**.
