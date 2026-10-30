# Agent notes

This repo is a static results page for a Halloween party vote. The only file that changes
during the party is `ballots.md`. Its format is described in `README.md`.

When asked to add ballots:
- Append them to the end of the `## Ballots` section, one per line, in the order given.
  Never reorder or edit existing ballots unless asked.
- Keep the ballot text exactly as given (spelling, casing, punctuation).
- Time: use the time the user gives. Otherwise use the current time in the party's
  local timezone (ask once if you don't know it, since the container clock is UTC).
- When asked to update results, edit the `## Results` lines (`topic | for | against | abstain`).
- Run `npm run build` (it must pass), then commit to `main` and push.
  GitHub Pages redeploys in about a minute.
