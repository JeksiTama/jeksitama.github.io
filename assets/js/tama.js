/* PlayTama shared save: Tama Tokens, scores and the Tama Pass.
 *
 * One save per browser, kept in localStorage under one key. No accounts,
 * no server. Any page on the site can include this file and call window.Tama.
 * See docs/GAME_BRIEF.md for the API games are meant to use.
 */
(function () {
  "use strict";

  const KEY = "playtama.save";
  const START_TOKENS = 20;
  const MAX16 = 65535;
  // Numeric ids used inside the Tama Pass. Never reuse or renumber an id.
  const PASS_IDS = { "main-jempol": 1, "sumpit": 2 };

  const listeners = new Set();
  const today = () => new Date().toISOString().slice(0, 10);
  const clamp16 = n => Math.max(0, Math.min(MAX16, Math.floor(+n || 0)));
  const fresh = () => ({ name: "Player", tokens: START_TOKENS, scores: {}, data: {}, visits: {} });

  // Memory fallback when storage is blocked (private mode, some embeds).
  let memory = null;
  function read() {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(KEY)); } catch {}
    if (!s && memory) s = memory;
    if (!s || typeof s.tokens !== "number") s = migrate();
    return Object.assign(fresh(), s);
  }
  function write(s) {
    memory = s;
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
    listeners.forEach(fn => { try { fn(); } catch {} });
  }
  function update(fn) { const s = read(); const r = fn(s); write(s); return r; }

  // First visit: carry over anything the old standalone Main Jempol saved.
  function migrate() {
    const s = fresh();
    try {
      const t = +localStorage.getItem("mj_tokens"); if (t) s.tokens = clamp16(t);
      const m = JSON.parse(localStorage.getItem("mj_stats"));
      if (m && m.lift) { s.data["main-jempol"] = m; s.scores["main-jempol"] = { plays: m.matches || 0, wins: (m.places || [])[0] || 0, best: 0 }; }
    } catch {}
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
    return s;
  }

  // ---------- Tama Pass (hex code, GameShark style) ----------
  // Layout: ver, tokens(2), count, then per game: id, plays(2), wins(2), best(2); then crc16(2).
  // Bytes are XOR-scrambled so the code doesn't read as plain numbers. Not security, just a bit of mystery.
  function crc16(bytes) {
    let c = 0xffff;
    for (const b of bytes) { c ^= b << 8; for (let i = 0; i < 8; i++) c = c & 0x8000 ? ((c << 1) ^ 0x1021) & 0xffff : (c << 1) & 0xffff; }
    return c;
  }
  function scramble(bytes) {
    let k = 0x5a;
    return bytes.map((b, i) => { k = (k * 37 + 11 + i) & 0xff; return b ^ k; });
  }
  const u16 = n => [(n >> 8) & 0xff, n & 0xff];

  function encodePass(s) {
    const games = Object.entries(PASS_IDS).filter(([slug]) => {
      const sc = s.scores[slug]; return sc && (sc.plays || sc.wins || sc.best);
    });
    const b = [1, ...u16(clamp16(s.tokens)), games.length];
    for (const [slug, id] of games) {
      const sc = s.scores[slug];
      b.push(id, ...u16(clamp16(sc.plays)), ...u16(clamp16(sc.wins)), ...u16(clamp16(sc.best)));
    }
    b.push(...u16(crc16(b)));
    const hex = scramble(b).map(x => x.toString(16).toUpperCase().padStart(2, "0")).join("");
    return hex.match(/.{1,4}/g).join(" ");
  }

  function decodePass(code) {
    const hex = String(code || "").toUpperCase().replace(/[^0-9A-F]/g, "");
    if (hex.length < 12 || hex.length % 2) return { ok: false, error: "That code looks too short." };
    const b = scramble(hex.match(/../g).map(h => parseInt(h, 16)));
    const body = b.slice(0, -2), crc = (b[b.length - 2] << 8) | b[b.length - 1];
    if (crc16(body) !== crc) return { ok: false, error: "That code doesn't add up. Check each character." };
    if (body[0] !== 1) return { ok: false, error: "That code is from a newer PlayTama." };
    const byId = Object.fromEntries(Object.entries(PASS_IDS).map(([s, i]) => [i, s]));
    const out = { tokens: (body[1] << 8) | body[2], scores: {} };
    let i = 4;
    for (let g = 0; g < body[3]; g++, i += 7) {
      if (i + 7 > body.length) return { ok: false, error: "That code is cut short." };
      const slug = byId[body[i]];
      if (slug) out.scores[slug] = { plays: (body[i + 1] << 8) | body[i + 2], wins: (body[i + 3] << 8) | body[i + 4], best: (body[i + 5] << 8) | body[i + 6] };
    }
    return { ok: true, save: out };
  }

  // ---------- public API ----------
  const Tama = {
    START_TOKENS,

    name() { return read().name; },
    rename(name) { name = String(name || "").trim().slice(0, 16); if (name) update(s => { s.name = name; }); },

    tokens() { return read().tokens; },
    setTokens(n) { update(s => { s.tokens = clamp16(n); }); },
    // returns false (and changes nothing) if it would take the balance below zero
    addTokens(n) { return update(s => { if (s.tokens + n < 0) return false; s.tokens = clamp16(s.tokens + n); return true; }); },

    // headline numbers that travel in the Tama Pass: plays and wins add up, best keeps the highest
    score(slug) { return Object.assign({ plays: 0, wins: 0, best: 0 }, read().scores[slug]); },
    addScore(slug, { plays = 0, wins = 0, best = 0 } = {}) {
      update(s => {
        const sc = Object.assign({ plays: 0, wins: 0, best: 0 }, s.scores[slug]);
        s.scores[slug] = { plays: clamp16(sc.plays + plays), wins: clamp16(sc.wins + wins), best: clamp16(Math.max(sc.best, best)) };
      });
    },

    // a game's own detailed save; stays in this browser only
    load(slug, fallback = null) { const d = read().data[slug]; return d === undefined ? fallback : d; },
    save(slug, value) { update(s => { s.data[slug] = value; }); },

    // one free token per game per day for visiting it
    canCollect(slug) { return read().visits[slug] !== today(); },
    collect(slug) {
      return update(s => { if (s.visits[slug] === today()) return false; s.visits[slug] = today(); s.tokens = clamp16(s.tokens + 1); return true; });
    },

    // cheat: "MORE TOKEN PLEASE" typed into any Tama Pass box gives 10 tokens (letters only, so never a real pass code)
    isCheat(code) { return /^MORETOKENS?(PLE)?PLEASE$/.test(String(code || "").toUpperCase().replace(/[^A-Z]/g, "")); },
    cheat(code) { if (!this.isCheat(code)) return false; update(s => { s.tokens = clamp16(s.tokens + 10); }); return true; },

    // Tama Pass
    passCode() { return encodePass(read()); },
    checkPass: decodePass,
    // replaces tokens and scores with the pass contents
    usePass(code) {
      const r = decodePass(code);
      if (r.ok) update(s => { s.tokens = r.save.tokens; s.scores = Object.assign({}, s.scores, r.save.scores); });
      return r;
    },

    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  };

  window.addEventListener("storage", e => { if (e.key === KEY) listeners.forEach(fn => { try { fn(); } catch {} }); });
  window.Tama = Tama;
})();
