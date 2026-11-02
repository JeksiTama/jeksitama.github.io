# PlayTama — brief for a game session

Hand this file to a session that builds or changes **one game**. It is all the site context a game needs; the session does not need to read the rest of the site.

## The brand in one breath
PlayTama makes small **educational games for families**: kids should have a real chance to outwit their parents. Learning is the winning move, not a quiz bolted on. English UI; a few Indonesian words are welcome (e.g. *Main Jempol* = "play thumbs").

## Where things live
```
jeksitama.github.io/            static site on GitHub Pages, no build step
  index.html                    home: egg → games grid → "send me ideas" box → footer
  about.html                    the brand story, Tama Tokens and Tama Pass explained
  assets/js/tama.js             shared save (the only site file a game uses)
  assets/js/site.js             header, egg logo, Tama Pass panel, footer (site pages only)
  assets/js/games.js            list of tiles on the home page + footer socials
  docs/color_palette.png        the brand palette
  assets/fonts/super-trend.ttf  brand display font
  games/<slug>/index.html       one folder per game hosted on the site
```
Plain HTML/CSS/JS only. No bundler, no npm. Libraries come from a CDN with a pinned version.

## Adding a game
1. Put it in `games/<slug>/` (lowercase, dashes) with an `index.html`. A single file is best; extra assets go in the same folder.
2. Load the shared save **before** your own script: `<script src="../../assets/js/tama.js"></script>`
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

Rules of thumb:
- Read `Tama.tokens()` fresh when a screen opens. The player may have loaded a Tama Pass in another tab.
- Tokens are the cross-game currency. Spend them for entry or stakes, pay them out for wins. Never make a game unplayable forever: if the player is out, point them at the home page (`../../`) where they can collect more.
- Keep stored numbers small integers (0–65535).

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
- Alternative when rooms must outlive the host: Firebase Realtime Database (free tier) as the shared state. It needs a Google project and security rules.

## Checklist before handing back
- [ ] Opens and plays from `games/<slug>/` on a local server (`python -m http.server` in the site root) **and** as a lone file
- [ ] Tokens go up and down correctly, and are visible on the home page after returning
- [ ] Tile added to `games.js`; pass id added if the game records scores
- [ ] Works at 375 px wide; no horizontal scroll
- [ ] No external requests besides fonts and pinned CDN libraries
