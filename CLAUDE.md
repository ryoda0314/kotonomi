@AGENTS.md

# ことのみ

Read [CONCEPT.md](CONCEPT.md) before adding anything. English words for TOEIC and TOEFL, learned by typing them: met
(typed in sight with its sound, then its sentence typed), recalled from the Japanese a little later in the same round,
and met again days later, further apart each time they are recalled alone. Touch typing comes on the way: the keyboard
on screen is the one in front of the learner (JIS or US), the next key and its finger lit. No scores, no speed (WPM),
no accuracy shown, no streaks, no badges, no timers, no forced review, no multiple choice. The sister apps are
ことのあめ (`../kotono/polylinga`), ことのは (`../kotono/english`), ことのめ (`../kotono/hangul`, whose typing this one
follows), ことのね (`../kotono/hanjaatume`) and ことのえだ (`../kotono/keigo`); this one borrows their look, their accounts
and their way of keeping a record.

## Stack

- Next.js 16 (App Router, Turbopack), React 19, plain CSS modules. Same versions as the sisters. `npm run dev` serves on
  port 3250. No server routes: every page is the client reading static content and the learner's record.
- The learner's record (`State`, `src/lib/record.ts`) is on their device (`src/lib/store.ts`, localStorage key
  `vocab:v1`, every access guarded); signing in is optional. With a ことのあめ account (the same Supabase project, so the
  same accounts) it is also kept in `vc_records`, one row per account (`supabase/migrations/`, RLS: only their own
  row), read and written from the browser as the learner with the anon key (`src/lib/sync.ts`, ことのめ's). The two
  copies are merged, never overwritten (`mergeStates`). Everything of this app's in that project is prefixed `vc_`
  (for the vocabulary, as `vocab:v1`); never touch `pl_`, `kn_`, `en_`, `hg_`, `ke_`, `sh_` or the old app's tables, and
  do not create test users there. Without `NEXT_PUBLIC_SUPABASE_URL`/`_ANON_KEY` the app runs on the device only and
  says so. Small preferences in `src/components/local.ts` (`vocab:` keys); the learner's choices (exam, level, new
  words a round, keyboard) in `src/components/prefs.ts`, on each device (はじめに comes once on each).
- English is said by the device's own voice (`src/components/sound.ts`, speechSynthesis): the one chosen in 設定, else
  the one whose name says it sounds most natural. Nothing is voiced ahead yet.
- How many use it, as ことのね counts it: `src/components/usage.ts` (`countUsage`) sends ことのあめ's `pl_app_ping`
  (`../polylinga/supabase/migrations/20261103000000_app_usage.sql`, `p_app` `kotonomi`) this device's number (made here
  at random, `vocab:device`), whether it was opened from the home screen, and one of `open` (a page of the app loaded:
  `CountOpen` in the app layout, once a load), `learn` (a round of 覚える finished, when `finishRound` keeps it) and
  `say` (a word typed from its meaning in 思い出す, alone or with help, when `recalledWord` keeps it), both in
  `Round.tsx`. A plain fetch with the anon key, never the signed-in client: no account, name, email or word goes. Only
  a production build at `NEXT_PUBLIC_SITE_URL` counts (`countsHere`, `src/lib/usage.ts`); none is set yet, so nothing
  is counted. 設定's 使われ方の数を送る (`vocab:sendUsage`, on until switched off) stops it.

## The core (`src/lib`, pure, tested in `tests/`)

- `keys.ts`: the two keyboards (JIS, US) as rows of keys by code, what each makes with and without Shift, and the
  finger that presses it (the home position; 6 is the right index finger, as Japanese charts have it). `strokeFor(ch,
  layout)`; Shift is pressed by the other hand's little finger. Keys no sentence needs are `extra` (drawn only on a wide
  keyboard). `DRILLS`: キーの場所.
- `typing.ts`: the two ways of typing. 見て打つ: a wrong key goes in nowhere (in `TypeCopy`). 思い出す: every key goes in
  (`pressRecall`), a slip is going off the way once however many keys follow, one slip is forgiven (`SLIPS_FORGIVEN`).
- `record.ts`: per word, the times it was typed in sight (or heard), its sentence typed, recalled alone, recalled only
  with help (`missed`), and `known`. `strengthOf` walks the recalls: recalled alone once rested (`REST`: 1, 1, 3, 7, 16,
  35, 75, 120 days; a day is 20 hours) a step on, recalled early no step, with help back to step 0; a word passed over as
  known starts at step 3. `dueAt`, `isDue`, `stageOf` (知っていた, 出会った, 思い出せた, また思い出せた from step 2,
  身についた from step 4). Only events are kept; nothing derived is stored. `mergeStates` keeps everything either copy
  has (each word's times joined, `known` the earliest, rounds by their time).
- `round.ts`: what a round holds. New words (`inOrder`: the chosen level and up, then the levels below; each list's
  order, TOEIC's and TOEFL's in turns) and words come back (`dueWords`: most overdue first, from any exam, at most
  `MAX_DUE`). `recallOrder`: shuffled, the word met last never first. `againIn`: a word recalled only with help goes
  again `AGAIN_AFTER` words later.
- `practice.ts`: 打つ's picks (words met, those typed least lately first; the next new words fill a round while few are
  met) and キーの場所's sequences.
- `export.ts`: the whole record as one Markdown text for an AI of the learner's choice (学習の記録); no AI call.

## The app

- `/` intro (static). `/app` 覚える (`_learn/`): はじめに once (`Setup.tsx`: exam, level, keyboard — the keyboard read
  from `navigator.keyboard.getLayoutMap` where the browser has it), then rounds (`Round.tsx`, a queue of items):
  出会う (`Meet.tsx`: the word typed in sight, its sound first; 知っている passes it over and the next new word takes
  its place; then its sentence typed with the translation under it, or read and heard when 例文も打つ is off),
  思い出す (`Recall.tsx`: the meaning; 例文で shows the sentence with the word blank and still counts as recalling
  alone, 聞く and 答えを見る do not; a word recalled with help comes again in the round, at most twice), おわり
  (`End.tsx`: new words, words met again, words that will come back in violet).
- `/app/type` 打つ: キーの場所 by row (`/app/type/keys/[row]`, `Drill.tsx`), 語を打つ and 聞いて打つ
  (`WordsRound.tsx`), 例文を打つ (`LinesRound.tsx`). Practice: typing here never changes when a word comes back.
- `/app/me` 自分: the learner's own counts, the words by how they stand (those coming back first, in violet), days;
  `/app/me/settings` (words, typing, sound, the account, the record), `/app/me/export`.
- `/login`: ことのめ's, unchanged in kind (ことのあめ's email and password, or Google once `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
  is set and this app's addresses are among that client's origins). ことのあめでつなぐ (`src/lib/connect.ts`, `APP`
  `kotonomi`): off to ことのあめ's `/connect` (log in or sign up there), back to `/login` with a one-time token in the
  fragment, spent with `verifyOtp` (`signInWithKotonoame`) only when the random state kept on this device before
  leaving comes back with it. ことのあめ sends it only to the addresses in its `src/lib/sisters.ts`: ことのみ has none
  yet (`url: null`), so only localhost until the public address is written there. `SyncOnce` (app layout) merges the
  account's copy in once when the app opens; later saves follow it a moment after (`PUSH_AFTER_MS`), or when the page
  is hidden.
- `components/Keyboard.tsx`: the keyboard on screen. Widths in keys, by a container query: from 560 px the whole
  keyboard, 15 keys across, rows staggered by the keys at their ends; narrower, the keys the sentences need, 12.5
  across, staggered by padding. It takes the keyboard in front of the learner by `key` (ignored while a sheet is open or
  an input has the focus; repeats ignored), lights a key pressed there, and says when Japanese input or Caps Lock is on.
  Keys on screen never take the focus. A key off the way flashes violet and the key wanted is nudged (`miss`,
  `missN`: two animation names taken in turns, so each miss plays again); ⌫ is lit violet when what was typed went off.
  `TypeCopy.tsx` (見て打つ: the character to type shakes and the key pressed stands over it in violet; each word is a
  `nowrap` span so a line breaks only at a space, and the character to type stays inline, shaking by `left` — as an
  inline-block it let lines break inside its word),
  `TypeRecall.tsx` (思い出す: the line shakes at each slip, what went off is violet on violet), `FingerHint.tsx`
  (`FingerHint`; `MissHint`: [z] ではなく [M], 大文字/小文字 named when only the case was off). Once typed, 次へ is the
  button, Enter or the space bar (the space bar is lit with Enter); a phone buzzes at a key off the way (`buzz`).
  `WordSheet.tsx`: その語 over any page (`useOpenWord`).

## Content (`src/content`)

- `words/toeic-{1,2,3}.ts`, `words/toefl-{1,2,3}.ts`: `WordEntry` (`en`, `pos`, `ja`, `ex`, `exJa`, and `form` when the
  sentence holds the word in another form), each list in the order its words come in (a level's themes taking turns). The rules are
  `check.ts`'s: sentences in the ASCII both keyboards type alike (letters, digits, . , ' ? $ % -), the word once in its
  sentence, the Japanese without Latin letters. `index.ts` makes them one list: a word in both exams' lists is one word
  in both, with the sentence of the list it is met in first.
- 思い出す shows only the meaning, so no two words may read alike there (`senseOf`: whole, or in their first sense;
  `tests/content.test.mjs`). Near-synonyms lead with different senses (sufficient 十分な, adequate 適切な).
- While writing a list: `node scripts/check-words.mjs src/content/words/<file>.ts`; then `npm test`. A list is written
  in parts of about 40 entries (one call holding 150 timed out).

## The promotional film (`promo/`)

- Its own Remotion 4 project (its own package.json; left out of the app's tsconfig and eslint), described in
  `promo/README.md`, made the way the sisters' are: the app's screens drawn again beside one plain sentence at a time,
  with Japanese narration by Gemini TTS (`promo/voice/lines.json`), never over an English voice. The app has no voice of
  its own ahead of time, so the film's English (two words and a sentence) is Gemini TTS in another voice.
- It draws the screens from the app's CSS and copy (`promo/src/ui.tsx`, `promo/src/scenes/`) at the width of a computer
  (the tabs in a column, the whole JIS keyboard), and takes the words, `keys.ts` and `typing.ts` from the app itself:
  when the look, the words or the typing change, change the film's drawing too. Every moment is placed from the clips'
  lengths (`promo/src/timeline.ts`).
- In `promo/`: `npm run assets` (the fonts cut to the film's characters), `npm run voice -- --env ../../english/.env.local`
  (`--check` to transcribe), `npm run music`, `npm run render` (to `promo/out/`), `npm run stills -- <frame> ...`.

## Commands

- `npm run dev` / `npm run build` / `npm run lint` / `npm test` (node:test, `tests/*.test.mjs`)
- `npx tsc --noEmit` (run `npx next typegen` first after adding routes)
- `node --env-file=../polylinga/.env.local ../polylinga/scripts/migrate.mjs supabase/migrations/<file>.sql`: apply one
  migration to ことのあめ's database (ことのあめ's runner and connection settings). Not applied yet for `vc_records`.
- `node scripts/check-words.mjs <word files>`
- `python design/make-icons.py`: the icons (Pillow).

## Conventions

- UI copy in `src/lib/i18n/ja.ts`, plain, from the learner's side.
- Colors and type are the sisters' (`src/app/globals.css`): paper, ink, one accent, `--again` violet for what comes
  back and for a key pressed off the way. No gradients, emoji or shadows inside the app; hairlines separate. IBM Plex;
  IBM Plex Mono for what is typed and for the keys; the name in mincho.
- Pure modules imported by tests and scripts use `.ts` extensions in their imports (Node strips types).
- Phone first; from 720 px the tabs become a column on the left (BottomNav, the sisters' CSS).
- The icons are drawn by `design/make-icons.py` (a twig, a blue fruit and a violet one) until the maker chooses a
  picture, as the sisters' are.
