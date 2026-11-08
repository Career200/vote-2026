# Agent notes: entering ballots during the party

This repo is a static results page (Russian UI) for a Halloween party vote. The organizer
collects paper ballots and sends them to you during the party as photos or typed text.
You transcribe them into `ballots.md`, push, and GitHub Pages republishes in about a minute.
The format of `ballots.md` is described in `README.md`. Only edit `ballots.md`: never touch
the site code, styles or workflow during the party.

The organizer is busy and on a phone. The goal: **one short round-trip per batch**, without
losing precision. Think before writing, ask what matters, propose defaults so that "ок" is
always a valid answer.

## Each ballot on paper

A ballot has free-form text (what the guest votes on) and a position: FOR / AGAINST / ABSTAIN
(За / Против / Воздержался). The ballots have no time written on them.

## Per batch

1. **Sync first:** `git pull --rebase origin main`.
2. **Read the input.** Transcribe each ballot's text verbatim. Keep the spelling, mistakes,
   casing, punctuation, emoji and language. Don't correct or translate anything.
   - Line breaks on paper become spaces, unless they clearly separate thoughts.
   - Crossed-out text is left out.
   - An illegible word: give your best guess and ask. If it's still unresolved, write `[неразборчиво]`.
   - A voter's own signature or name, if someone signs the ballot, is never recorded. The vote is secret.
     Names that are part of the question itself ("Пускать ли Диму") are kept.
3. **Determine the position.** If it's missing, unclear, or several are marked, ask.
   Don't guess the position from the text.
4. **Propose grouping.** For each ballot, suggest an existing `## topic` with the same meaning,
   a new topic, or no topic.
   - Topic names are short Russian propositions that За/Против answer, e.g.
     «Запретить конфеты-кукурузу».
   - If a ballot means the opposite of its topic's wording ("KEEP candy corn" under
     «Запретить конфеты-кукурузу»), propose `!` (counted with the opposite position).
   - When in doubt, prefer no topic over a forced match. The organizer decides; you propose.
5. **Time:** the time of the organizer's message, in the party's local timezone (ask once per
   session if you don't know it; the container clock is UTC). All ballots in a batch get the
   same time unless the organizer says otherwise.
6. **Show one compact draft and wait.** List every ballot (number, position, verbatim text,
   proposed topic, `!` if any), then the questions, numbered and each with a default answer.
   Keep it scannable on a phone. Example:

   ```
   Пачка 21:40, 4 бюллетеня:
   1. ЗА — «Пицца ровно в полночь» → без темы
   2. ПРОТИВ — «монстр мэш хватит» → «Ещё раз Monster Mash» (новая тема, вместе с №4)
   3. ЗА — «ОСТАВИТЬ конфеты-кукурузу» → «Запретить конфеты-кукурузу», с !
   4. ЗА — «ещё монстр мэш!!!» → «Ещё раз Monster Mash»
   Вопросы:
   а) №1: «полночь» или «полнолуние»? (по умолчанию: полночь)
   Ответьте «ок» или поправки.
   ```

7. **Apply the answer.** Terse corrections like "2 против", "3 без темы", "а: полнолуние" are
   enough. Anything not corrected stays as proposed.
8. **Write** to `ballots.md`. Real ballots go above the `---` line, under their topic headings,
   or above the first heading for no topic. Never put real ballots below `---`.
9. **Check:** run `npm run build`; it must pass. Make sure the red "не принятые к учёту" box
   would be empty (every line you added parses).
10. **Commit and push** to `main`. Message: `Бюллетени: +N (HH:mm)`.
11. **Confirm in one or two lines:** how many were added, the total, new topics, and that the
    site updates in about a minute.

## Astral mail (the second party, 7 November 2026)

The first party (31 October) is closed. Ballots from the second party, a week later, are
"delivered by astral mail" and are entered like any other ballot, with two differences:

- Every one of them gets the date prefix `7.11`: `7.11 22:15 | за | text`. Use `7.11` for the
  whole night, including times after midnight (the page shows those as 8 November).
  Without the prefix a ballot would be counted as one from the first party.
- They go under the same `## topic` headings as before (new topics are fine too).

After each mail batch, the two hand-entered statistics lines (`% Число бюллетеней, содержащих
обсценную лексику` and `% Число языков волеизъявления (…)`) may be out of date. Propose the
updated numbers in the draft, as questions with defaults. Everything else in the statistics is computed.

## Rules

- **Never** reorder, edit or delete existing ballots unless asked. Moving ballots between topics,
  renaming or merging topics is fine when asked, and goes through the same draft → "ок" step.
- **Duplicates:** if a ballot looks identical to one already entered (same text and position,
  e.g. the same photo sent twice), ask before adding it.
- **Example section:** with the first real batch, ask once whether to delete everything below
  `---` (the example). Don't delete it without a yes.
- **Skipping confirmation:** if the organizer says to skip it (e.g. "без подтверждения"),
  write batches with no open questions directly and report afterwards. Still ask whenever
  something is genuinely unclear.
- Reply in the language the organizer writes in.
- If the build fails, fix the data line, not the code.
