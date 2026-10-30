# Agent notes

This repo is a static results page (Russian UI) for a Halloween party vote. The only file
that changes during the party is `ballots.md`. Its format is described in `README.md`.

Real data goes **above** the `---` line; everything below it is example data. Never put
real ballots below `---`. Remove the example part only when asked.

When asked to add ballots:
- Every ballot needs `HH:mm | position | text`. Use the time the user gives. Otherwise use
  the current time in the party's local timezone (ask once if you don't know it, since the
  container clock is UTC).
- Keep the ballot text exactly as given (spelling, casing, punctuation, language).
- Put each ballot under the `## topic` heading the user names. Create a new heading when
  asked. If the user names no topic, put the ballot above the first heading (no topic).
  Don't group ballots on your own judgement; that's the user's call.
- Use `!` before the position only when the user says the ballot counts against the topic.
- Never reorder, edit or delete existing ballots unless asked. Moving a ballot to a
  different topic or merging topics is fine when asked.
- Run `npm run build` (it must pass), then commit to `main` and push.
  GitHub Pages redeploys in about a minute.
