# PlayTama site rules

Read this before building or changing a game. It holds everything a game needs to know about the site; a game session does not need to read the rest of the repo.

## 1. What PlayTama is

- **Small educational games for families.** Learning is the move that wins, never a quiz bolted on. A child who learns the skill should be able to beat an adult.
- **Theme: school meets arcade.** Report cards, grades, recess, notebooks, chunky arcade buttons. Teasing lines like "Pay attention in class." are in tone; nothing hurtful.
- **Audience: international.** UI is in English. Indonesian words are welcome as an artistic choice that shares Indonesian culture (*Main Jempol* = "play thumbs", *Gampang / Sedang / Susah*).
- **Age 6+ is a legal line, not a difficulty cap.** It means no tracking and no personal data. The games themselves can be hard.
- **A match lasts about 5 minutes.**
- **Free for everyone.** No ads, no purchases.

## 2. Hard rules

Break none of these.

1. No ads, trackers, analytics, accounts or personal data.
2. Plain HTML, CSS and JS. No build step, bundler or npm. Libraries come from a CDN at a pinned version.
3. Outside requests only to Google Fonts, Google's Noto emoji, pinned CDN libraries, and the PeerJS broker for online play.
4. A game must still run when opened as a lone file, with or without `window.Tama` and `window.TamaKit`.
5. A player can never be stuck forever. Out of tokens means a message and a link home, where more can be collected.
6. Never renumber or reuse an id in `PASS_IDS` (tama.js). Old Tama Passes depend on them.
7. Never wait on an animation's `.finished`. Start the animation, then wait on a `setTimeout` of the same length. A hidden tab never finishes animations, and online that freezes the other player too.
8. Never write "coming soon". Use neutral wording ("still in the egg", "not yet").
9. Player-facing text says **Tama Tokens**, not coins.
10. The owner commits. Claude never commits and never offers to.

## 3. Where things live

```
jeksitama.github.io/            static site on GitHub Pages
  index.html                    home: egg → games grid → "send me ideas" box → footer
  about.html                    the brand story, Tama Tokens and the Tama Pass explained
  assets/js/tama.js             shared save (window.Tama)
  assets/js/tama-kit.js         shared game pieces (window.TamaKit)
  assets/js/site.js             header, egg logo, Tama Pass panel, footer (site pages only)
  assets/js/games.js            the home page tiles + footer socials
  assets/js/home.js             home page grid and hero egg
  assets/css/site.css           site pages' styles and palette
  assets/fonts/super-trend.ttf  brand display font
  assets/img/egg.svg            favicon
  docs/                         this file, the palette images (GAME_BRIEF.md points here)
  games/<slug>/index.html       one folder per game hosted on the site
```

## 4. How work happens

- **The site file is the main version** of each game.
- **A prototype is a side branch** for testing mechanic changes away from the site. Main Jempol's is `D:\Game Projects\main_jempol\prototype\jempol_hands.html`. Other games may get one. Don't copy between a prototype and the site unless asked.
- **Test locally** from the site root: `python -m http.server 8765` (the "site" entry in `.claude/launch.json`), then open `http://localhost:8765/games/<slug>/`.
- **Also open the game as a lone file** to check it still plays without the site.

## 5. Adding a game

1. Make `games/<slug>/` (lowercase, dashes) with an `index.html`. One file is best; extra assets go in the same folder.
2. Start the page head like this:
   ```html
   <meta charset="utf-8">
   <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
   <title>Game Name · PlayTama</title>
   <meta name="description" content="One sentence about the game.">
   <meta name="theme-color" content="#73d049">
   <link rel="icon" href="../../assets/img/egg.svg" type="image/svg+xml">
   ```
   Don't add `maximum-scale` or `user-scalable=no`; players must be able to zoom.
3. Load the shared save and kit **before** the game's own script. The third line fetches the kit from the live site when the file is opened on its own:
   ```html
   <script src="../../assets/js/tama.js"></script>
   <script src="../../assets/js/tama-kit.js"></script>
   <script>window.TamaKit || document.write('<script src="https://jeksitama.github.io/assets/js/tama-kit.js"><\/script>')</script>
   ```
4. Put `<a href="../../">/PlayTama home/</a>` on the title screen.
5. Add a tile in `assets/js/games.js`: `slug`, `title`, a **one-sentence** `blurb`, `where: "here"`, `href: "games/<slug>/"`, `players`, `learns`, `color` as a palette variable, `emoji` (Noto codepoint + character) or `art` (16:9 image path), and `tag: "Prototype"` while it is one.
6. If the game records plays, wins or a best score, give it the next free number in `PASS_IDS` in `tama.js`.
7. Add the game's stakes and token rules to `about.html` if it uses tokens.

External games (itch.io, Steam, downloads) only need step 5, with `where: "itch"`, `"steam"` or `"download"` and the full URL.

## 6. The shared save: `window.Tama`

Guard it: `const TAMA = window.Tama || null;`. Without it, fall back to `localStorage` under the game's own key.

| Call | What it does |
|---|---|
| `Tama.name()` | The player's name (`"Player"` unless changed). One save per browser, no profiles. |
| `Tama.tokens()` | Current Tama Token balance |
| `Tama.addTokens(n)` | Add, or spend with `n < 0`. Returns `false` and changes nothing if the balance would go below 0. |
| `Tama.setTokens(n)` | Set the balance outright (0 to 65535) |
| `Tama.addScore(slug, { plays, wins, best })` | Headline numbers: `plays` and `wins` add up, `best` keeps the highest. **These travel in the Tama Pass.** |
| `Tama.score(slug)` | Read them back |
| `Tama.save(slug, obj)` / `Tama.load(slug, fallback)` | The game's own detailed data and settings. **Stays on this device.** |
| `Tama.onChange(fn)` | Called when the save changes, in this tab or another |
| `Tama.cheat(code)` | "MORE TOKEN PLEASE" (any spacing or case) adds 10 tokens and returns `true` |

Keep stored numbers small integers (0 to 65535).

## 7. Tama Tokens

The cross-game currency. Nothing about them has real value, so cheating is tolerated.

- **Start:** 20 tokens.
- **Daily bonus:** today the home page gives +1 the first time each game's tile is opened each day. Planned: +10 for the first visit each day, counted from the player's local midnight. Games shouldn't depend on either.
- **Stakes:** the usual entry is 2 tokens per match. Coins fly from each player into a prize pool in the middle; the winner's prize flies from the pool to the winner.
- **When to change the balance:**
  - Read `Tama.tokens()` fresh whenever a screen opens. The player may have loaded a pass or collected tokens in another tab.
  - Take the stake when it is staked.
  - Save the whole prize as soon as the result is known, **before** the coins fly. The chip then counts up as each coin lands.
  - Change the balance by a delta (`addTokens`, or a fresh read plus the change). Never write back a balance the game cached earlier.
- **Refunds:** leaving a match against bots gives the stake back. If the online host leaves, guests get their stake back. A player who leaves an online match forfeits.
- **Broke:** say what's needed and link home (`../../`) to collect more. A lone file with no `window.Tama` may simply refill to 20.

## 8. The game kit: `window.TamaKit`

Shared pieces so every game looks and behaves the same. Copy how Sumpit uses them.

| Call | What it does |
|---|---|
| `TamaKit.bar(el, { sound, onSound(on), onTokens() })` | Puts the **token chip + sound button** at the start of `el`. Returns `{ tokens(n), sound(on), clickable(on) }`. Put the game's exit button after them with `class="tk-chip tk-btn"`. |
| `TamaKit.passCard(el, { btnClass, onTokens(), tokens(), addTokens(n) })` | Fills a card with the **Tama Pass**: name, tokens, the code with COPY, a LOAD box that also takes the cheat. The last two options are for a lone file without `window.Tama`. |
| `TamaKit.pool(el)` | The **prize pool**: a pile of coins drawn in `el`. Returns `{ n, set(n), add(k), take(k), center() }`. |
| `TamaKit.fly(from, to, { delay, duration, onLand })` | One coin flying between two elements or `{x, y}` points. Resolves when it lands (on a timer). |
| `TamaKit.coin("sm")` | A coin as HTML, for text and buttons |

- **Theme** it with CSS variables on `:root`: `--tk-ink`, `--tk-chip`, `--tk-font`, `--tk-coin-font`, `--tk-gold`, `--tk-gold-d`. Kit rules are plain class selectors, so a game's element resets don't break them and any id or two-class rule still overrides them.
- **Stand-ins:** if the kit can't load, keep the game playable with small stand-ins (`const KIT = window.TamaKit || {…}`). A stand-in must only **add** elements, never replace the contents of `el`: the game's own exit button lives there.

## 9. Screens and controls

- **Top bar.** Top right: the kit's token chip and sound button. Then an exit button. During a match it says what leaving costs ("🏳️ Back out") and asks before leaving.
- **Menu.** Big buttons for the ways to play (PLAY, PLAY A FRIEND or WITH FRIENDS), then plain text links with a wavy underline: `/how to play/`, `/settings/`, `/PlayTama home/`. A setup control such as table size may sit with the buttons.
- **How to play** opens by itself on the first visit only, and not when the player arrives by invite link. It stays reachable from the menu.
- **Settings** go in a popup or screen, not on the menu, and survive a reload.
- **Bot strength**, if the game has it: a setting named **Gampang / Sedang / Susah**, default Gampang. A game doesn't have to have it (Main Jempol has none).
- **Tama Pass:** on the menu, tapping the token chip opens `TamaKit.passCard` in the game's own style. During a match the chip only shows the count.
- **Cheat code:** "MORE TOKEN PLEASE" in any Tama Pass box gives 10 tokens, on the home page and in every game.
- **Debug drawing:** when grabbing or dropping is fiddly, add a settings switch that draws the grab and drop areas.
- **Input:** the whole game plays by touch and by mouse; add keyboard where it makes sense.

## 10. Sound

- Sound effects are made in code with the Web Audio API; no audio files are needed.
- Today each game saves its own sound on/off in `Tama.save(slug)`. It must survive a reload.
- Planned: one shared setting for all games, with **music** and **sound effects** switched separately. Neither game has music yet.
- Vibration follows the sound setting.

## 11. Look and feel

- **Fonts:** display font **Super Trend** (free for personal and commercial use): `@font-face { font-family: "Super Trend"; src: url("../../assets/fonts/super-trend.ttf"); }`. Body text in Nunito from Google Fonts.
- **Palette:** red `#fe6767`, green `#73d049`, blue `#68c1ff`, pink `#fe94de`, orange `#fea046`, purple `#aa88ff`, yellow `#ffdb33`, grey `#666666`. Ink `#2b2b2b` on cream `#fffaf0`. Text on a palette colour is always dark ink.
- **Shapes:** thick dark outlines and a chunky drop shadow (`0 5px 0` ink).
- **Own style allowed:** a game can keep its own art style (Main Jempol uses a school notebook), as long as the token coin and home link stay readable.
- **Dark mode:** site pages follow `prefers-color-scheme`. Games may, but don't have to.
- **Emoji:** use them generously. Prefer Google's animated Noto emoji (CC BY 4.0): `https://fonts.gstatic.com/s/e/notoemoji/latest/<codepoint>/512.webp`. Not every emoji is animated, so check the URL loads and fall back to the plain character. The Tama Token is 🪙 `1fa99`.
- **Assets and credits:** use free assets (Noto emoji, Google Fonts, CC0 or CC BY art) and credit them on the game's title screen.
- **Copy:** short and plain. One sentence to describe a game. Players don't need to hear about privacy or who the site is for.

## 12. Phone and access

- Phone first: works at 375 × 667 and in landscape, with no horizontal scroll.
- Pinch-zoom stays allowed.
- Icon-only buttons and every input have a label (`aria-label`).
- Honour `prefers-reduced-motion`: slow or skip decorative motion.
- Tap targets about 44 px; smallest text about 12 px.

## 13. Online multiplayer

GitHub Pages only serves files, so browsers talk to each other directly over WebRTC.

- **PeerJS** at a pinned version (`https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js`) with its free public broker. Load it only when the friends screen is used.
- **The host's browser runs the game** and is the source of truth. Guests send inputs and get state back. The host checks everything a guest sends: only legal moves, numbers clamped, names capped and escaped.
- **Rooms** are a 4-letter code that becomes the host's peer id with a game prefix, e.g. `playtama-mj-ABCD`.
- **Invite links** are the game page with `?join=CODE`. Opening one fills in the code; the friend still presses JOIN. Clear the parameter from the URL afterwards.
- **Leaving:** closing a tab doesn't always close the connection. Send a ping every 2 s both ways, treat 10 s of silence mid-match as leaving, and send a goodbye on `pagehide`.
- **If a friend leaves** mid-match, a bot takes their seat and the match goes on. **If the host leaves,** the room ends and guests get their stake back.
- **Errors:** plain messages for a wrong code, a full table and no connection.
- **Privacy:** players' browsers see each other's public IP address. That is acceptable for friends and family. The friends screen says to share codes only with people you know. Before online play is promoted, switch to relay-only connections (`iceTransportPolicy: "relay"` through a TURN server) so players only see the relay. Never add public rooms without a server.
- About 1 in 10 networks (strict NAT, some mobile carriers) can't connect directly and need a TURN relay anyway.

## 14. Before handing back

- [ ] Plays from `games/<slug>/` on the local server **and** as a lone file, including offline
- [ ] No console errors while loading, playing, leaving and playing again
- [ ] Tokens go down when staked, the prize is saved before the coins fly, and the new balance shows on the home page
- [ ] Tile in `games.js`, `PASS_IDS` entry if it records scores, `about.html` updated if it uses tokens
- [ ] Page head has the title, description, theme-color and favicon; zoom is allowed
- [ ] Menu, top bar, how to play on first visit, settings and Tama Pass follow section 9
- [ ] Works at 375 px wide by touch and by mouse, with no horizontal scroll
- [ ] Reduced motion honoured; buttons and inputs labelled
- [ ] Online: ping, 10 s timeout, pagehide goodbye, bot takeover, host-left refund, invite link
- [ ] No outside requests beyond section 2's list; credits on the title screen
- [ ] A match takes about 5 minutes, and a child who learns the skill can win
