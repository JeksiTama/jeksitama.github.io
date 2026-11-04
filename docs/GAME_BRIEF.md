# PlayTama — brief for a game session

Hand this file to a session that builds or changes **one game**. It is all the site context a game needs; the session does not need to read the rest of the site.

## The brand in one breath
PlayTama makes small **educational games for families**: kids should have a real chance to outwit their parents. Learning is the winning move, not a quiz bolted on. English UI; a few Indonesian words are welcome (e.g. *Main Jempol* = "play thumbs").

## Where things live
```
jeksitama.github.io/            static site on GitHub Pages, no build step
  index.html                    home: egg → games grid → "send me ideas" box → footer
  about.html                    the brand story, Tama Tokens and Tama Pass explained
  assets/js/tama.js             shared save
  assets/js/tama-kit.js         shared game pieces: top bar chips, Tama Pass card, prize pool coins
  assets/js/site.js             header, egg logo, Tama Pass panel, footer (site pages only)
  assets/js/games.js            list of tiles on the home page + footer socials
  docs/color_palette.png        the brand palette
  assets/fonts/super-trend.ttf  brand display font
  games/<slug>/index.html       one folder per game hosted on the site
```
Plain HTML/CSS/JS only. No bundler, no npm. Libraries come from a CDN with a pinned version.

## Adding a game
1. Put it in `games/<slug>/` (lowercase, dashes) with an `index.html`. A single file is best; extra assets go in the same folder.
2. Load the shared save and the game kit **before** your own script (the third line fetches the kit from the live site when the file is opened on its own):
   ```html
   <script src="../../assets/js/tama.js"></script>
   <script src="../../assets/js/tama-kit.js"></script>
   <script>window.TamaKit || document.write('<script src="https://jeksitama.github.io/assets/js/tama-kit.js"><\/script>')</script>
   ```
3. Add a link back home somewhere on the title screen: `<a href="../../">PlayTama home</a>`.
4. Add a tile in `assets/js/games.js` (`slug`, `title`, a **one-sentence** `blurb`, `where: "here"`, `href: "games/<slug>/"`, `players`, `learns`, `color` as a palette variable, and `emoji` for the animated tile art, or `art` for an image path at 16:9).
5. To put the game's numbers in the Tama Pass, give it the next free number in `PASS_IDS` inside `tama.js`. **Never renumber or reuse an id.** Old passes depend on them.

External games (itch, Steam, downloads) only need step 4, with `where: "itch"` / `"steam"` / `"download"` and the full URL. Opening any tile gives the player 1 Tama Token, once a day per game.

## The shared save: `window.Tama`
Write the game so it still runs when `window.Tama` is missing (the file opened on its own). Guard with `const TAMA = window.Tama || null;` and fall back to `localStorage` under your own key.

| Call | What it does |
|---|---|
| `Tama.name()` | the player's name (`"Player"` unless they changed it). There is one save per browser, no profiles. |
| `Tama.tokens()` | current Tama Token balance |
| `Tama.addTokens(n)` | add or spend (`n < 0`); returns `false` and changes nothing if the balance would go below 0 |
| `Tama.setTokens(n)` | set the balance outright (0–65535) |
| `Tama.addScore(slug, { plays, wins, best })` | headline numbers: `plays` and `wins` add up, `best` keeps the highest. **These travel in the Tama Pass.** |
| `Tama.score(slug)` | read them back |
| `Tama.save(slug, obj)` / `Tama.load(slug, fallback)` | the game's own detailed data (habits, settings). **Stays on this device only.** |
| `Tama.onChange(fn)` | called when the save changes (in this tab or another) |
| `Tama.cheat(code)` | the cheat code: if `code` is "MORE TOKEN PLEASE" (any spacing or case), adds 10 tokens and returns `true` |

Rules of thumb:
- Read `Tama.tokens()` fresh when a screen opens. The player may have loaded a Tama Pass in another tab.
- Tokens are the cross-game currency. Spend them for entry or stakes, pay them out for wins. Never make a game unplayable forever: if the player is out, point them at the home page (`../../`) where they can collect more.
- Keep stored numbers small integers (0–65535).

## The game kit: `window.TamaKit`
Shared pieces so every game looks and behaves the same. Main Jempol and Sumpit use it; copy how they do.

| Call | What it does |
|---|---|
| `TamaKit.bar(el, { sound, onSound(on), onTokens() })` | puts the **token chip + sound button** at the start of `el` (top right, same size in every game). Returns `{ tokens(n), sound(on), clickable(on) }`. Put your own exit button after them with `class="tk-chip tk-btn"`. |
| `TamaKit.passCard(el, { btnClass, onTokens() })` | fills a card with the **Tama Pass**: name, tokens, the code with COPY, and a LOAD box that also takes the cheat code. The game styles the card. |
| `TamaKit.pool(el)` | the **token prize pool**: a pile of coins drawn in `el`. Returns `{ n, set(n), add(k), take(k), center() }`. |
| `TamaKit.fly(from, to, { delay, onLand })` | one coin flying between two elements or `{x, y}` points. Resolves when it lands. |
| `TamaKit.coin("sm")` | a coin as HTML, for text and buttons |

Theme it with CSS variables on `:root`: `--tk-ink`, `--tk-chip` (chip background), `--tk-font`, `--tk-coin-font`, `--tk-gold`, `--tk-gold-d`. Kit rules are plain class selectors. That way they survive a game's reset (like `* { padding: 0 }`), and any id or two-class rule in the game still overrides them. If the kit can't load (offline and opened on its own), keep the game playable with small stand-ins (see `const KIT = window.TamaKit || {…}` in either game).

## Conventions every game follows
- **Top bar.** Top right: the kit's token chip and sound button. Top left (or after them): an exit button. In a match it says what leaving costs ("🏳️ Back out").
- **Menu.** Big buttons for the ways to play (PLAY, PLAY A FRIEND or WITH FRIENDS), then plain text links with a wavy underline: `/how to play/`, `/settings/`, `/PlayTama home/`. Show how to play automatically on the first visit only.
- **Settings.** Things like bot difficulty go in a settings popup or screen, not on the menu. Name the bot levels **Gampang / Sedang / Susah**, and default to Gampang.
- **Tama Pass from the token chip.** On the menu, clicking the token chip opens the Tama Pass (`TamaKit.passCard`) in the game's own style. During a match the chip only shows the count.
- **Cheat code.** "MORE TOKEN PLEASE" typed into any Tama Pass box gives 10 tokens. It works on the home page and in every game, because both go through `Tama.cheat`.
- **Token prize pool.** Stakes are coins that fly from each player into a pile in the middle of the table. The winner's prize flies from the pile to the winner. Take the tokens from the save when they're staked, and add the prize to the save as soon as the result is known. While the prize coins are flying, the chip counts up as each one lands.
- **Debug drawing.** When grabbing or dropping is fiddly, add a settings switch that draws the grab and drop areas.
- **Never wait on an animation's `.finished`.** A tab that isn't painted (hidden, or in the background) never finishes animations, so the game would freeze, and online that freezes the other player too. Start the animation, then wait on a `setTimeout` of the same length.

## The Tama Pass
A hex code (GameShark style, groups of 4) holding the tokens and each registered game's `plays / wins / best`. It is XOR-scrambled with a CRC16, which stops typos but not a determined cheater. That's fine: nothing here has real value. Detailed per-game data (`Tama.save`) is **not** in the pass.

## Look and feel
- Display font **Super Trend**: `@font-face { font-family: "Super Trend"; src: url("../../assets/fonts/super-trend.ttf"); }`. Body text in Nunito (Google Fonts).
- Palette: red `#fe6767`, green `#73d049`, blue `#68c1ff`, pink `#fe94de`, orange `#fea046`, purple `#aa88ff`, yellow `#ffdb33`, grey `#666666`. Ink `#2b2b2b` on cream `#fffaf0`. Thick dark outlines and a chunky drop shadow (`0 5px 0` ink). Text on a palette colour is always dark ink.
- Site pages follow the device's dark mode (`prefers-color-scheme`). Games may too, but don't have to.
- Use emoji generously. Prefer Google's animated Noto emoji (CC BY 4.0, credit it): `https://fonts.gstatic.com/s/e/notoemoji/latest/<codepoint>/512.webp`. Not every emoji is animated, so check the URL loads and fall back to the plain character. The Tama Token is 🪙 `1fa99`.
- Use free assets where you can (Noto emoji, Google Fonts, CC0/CC BY art), and credit them in the game.
- Copy is short and plain: one sentence to describe a game. Players don't need to hear about privacy or who the site is "for".
- A game can keep its own art style (Main Jempol uses a school-notebook look). Just keep the home link and the token coin readable.
- Phone first: test at 375 px wide, touch and mouse. No ads, no trackers, no accounts, no personal data. The audience is children.
- Never promise features with "coming soon". Use neutral wording ("still in the egg", "not yet").

## Online multiplayer on GitHub Pages
GitHub Pages only serves files, but browsers can talk to each other directly over **WebRTC**. The usual setup:
- **PeerJS** (`https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js`) with its free public broker for the handshake. The host's browser runs the game and is the source of truth; guests send inputs and get state back.
- Rooms are a short code (e.g. 4 letters) that becomes the host's peer id with a prefix like `playtama-mj-ABCD`.
- About 1 in 10 networks (strict NAT, some mobile carriers) can't connect directly and need a **TURN relay**. Free tiers exist (Cloudflare Calls TURN, Metered); add one once friends report "can't connect".
- If the host leaves, the room ends. Fine for friends-and-family testing; a real server comes later if ever.
- Closing a tab doesn't always close the WebRTC connection. Send a ping every 2 s both ways and treat 10 s of silence mid-match as leaving. Also send a goodbye on `pagehide`.
- If a friend leaves mid-match, a bot takes over their seat and the match goes on. If the host leaves, guests get their stake back.
- Invite links are the game page with `?join=CODE`. Opening one fills in the code, and the friend still presses JOIN.
- Alternative when rooms must outlive the host: Firebase Realtime Database (free tier) as the shared state. It needs a Google project and security rules.

## Checklist before handing back
- [ ] Opens and plays from `games/<slug>/` on a local server (`python -m http.server` in the site root) **and** as a lone file
- [ ] Tokens go up and down correctly, and are visible on the home page after returning
- [ ] Tile added to `games.js`; pass id added if the game records scores
- [ ] Works at 375 px wide; no horizontal scroll
- [ ] No external requests besides fonts and pinned CDN libraries
