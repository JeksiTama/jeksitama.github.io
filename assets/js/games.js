/* The games grid. Order here = order on the page.
 *
 * where:  "here"     — plays on this site (href is a folder under /games/)   → green button
 *         "itch"     — opens on itch.io                                      → red button
 *         "steam"    — opens on Steam                                        → blue button
 *         "download" — a file to download and play offline                   → purple button
 * emoji:  [Noto codepoint, character] for the animated tile art (see https://googlefonts.github.io/noto-emoji-animation/)
 * art:    optional image path that replaces the emoji, e.g. "games/foo/thumb.png" (16:9)
 * color:  tile background, from the palette in assets/css/site.css
 * tag:    optional small label on the tile, e.g. "Prototype"
 * Opening any game from its tile gives 2 Tama Tokens (Tama.VISIT_BONUS), once a day per game.
 */
window.TAMA_GAMES = [
  {
    slug: "main-jempol",
    title: "Main Jempol",
    blurb: "Guess how many thumbs go up, and bluff everyone at the table.",
    where: "here",
    href: "games/main-jempol/",
    players: "👥 2–4 players",
    learns: "🧠 Counting & bluffing",
    tag: "Prototype",
    emoji: ["1f44d", "👍"],
    color: "var(--yellow)",
  },
  {
    slug: "sumpit",
    title: "Sumpit",
    blurb: "Basically super chopsticks: tap, split and snap to knock out both of your opponent's hands.",
    where: "here",
    href: "games/sumpit/",
    players: "👥 2 players",
    learns: "🧠 Adding & number bonds",
    tag: "Prototype",
    emoji: ["270c_fe0f", "✌️"],
    color: "var(--purple)",
  },
  {
    slug: "cerdas-cermat",
    title: "Cerdas Cermat",
    blurb: "Smart & Sharp: five questions a day, and every right answer earns Tama Tokens.",
    where: "here",
    href: "games/cerdas-cermat/",
    players: "👤 1 player",
    learns: "🧠 General knowledge",
    tag: "Prototype",
    emoji: ["1f9e0", "🧠"],
    color: "var(--green)",
  },
  {
    slug: "free-the-biscuits",
    title: "Free the Biscuits",
    blurb: "Add up just enough coins to break the box without burning the biscuits.",
    where: "itch",
    href: "https://playtama.itch.io/free-the-biscuits",
    players: "👤 1 player",
    learns: "🪙 Adding coins",
    emoji: ["1f36a", "🍪"],
    color: "var(--orange)",
  },
  {
    slug: "daily-digits",
    title: "Daily Digits",
    blurb: "Use nine numbers to make today's date, with a new puzzle every day.",
    where: "itch",
    href: "https://playtama.itch.io/daily-digits",
    players: "👤 1 player",
    learns: "➗ Arithmetic",
    emoji: ["1f4af", "💯"],
    color: "var(--blue)",
  },
];

/* Footer links. Leave href empty to show the icon greyed out. */
window.TAMA_SOCIALS = [
  { name: "itch.io",   icon: "itch-io",    href: "" },   // https://playtama.itch.io
  { name: "YouTube",   icon: "youtube",    href: "" },
  { name: "TikTok",    icon: "tiktok",     href: "" },
  { name: "Instagram", icon: "instagram",  href: "" },
  { name: "X",         icon: "x",          href: "" },
  { name: "Discord",   icon: "discord",    href: "" },
  { name: "Facebook",  icon: "facebook-f", href: "" },
];
