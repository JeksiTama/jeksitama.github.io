/* PlayTama game kit: the pieces every game on the site shares, so they look and behave the same everywhere.
 *
 *   <script src="../../assets/js/tama.js"></script>
 *   <script src="../../assets/js/tama-kit.js"></script>
 *
 * - TamaKit.bar(el, opts)       the Tama Token chip + sound button, top right (same size in every game)
 * - TamaKit.passCard(el, opts)  fills a card with the Tama Pass: name, tokens, code, load box (+ the cheat)
 * - TamaKit.pool(el)            the token prize pool: a pile of coins in the middle of the table
 * - TamaKit.fly(from, to, opts) one coin flying between two points (for stakes going in and prizes going out)
 * - TamaKit.coin(cls)           a coin as HTML ("sm" for the small one in text and chips)
 *
 * Theme it from the game's CSS with the --tk-* variables below. Kit rules are plain class selectors: they beat a game's
 * element resets (like * { padding: 0 }), and any id or two-class rule in the game still overrides them.
 */
(function () {
  "use strict";
  const Tama = window.Tama;   // tama.js loads first
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const CSS = `
:root{--tk-ink:#2b2b2b;--tk-chip:#fff;--tk-font:"Space Mono",ui-monospace,monospace;--tk-coin-font:"Super Trend",system-ui,sans-serif;--tk-gold:#f4b821;--tk-gold-d:#b9800e}
.tk-bar{display:flex;gap:6px;align-items:center;font-family:var(--tk-font);font-size:12px;font-weight:700;color:var(--tk-ink)}
.tk-chip{font:inherit;color:inherit;background:var(--tk-chip);border:2px solid var(--tk-ink);border-radius:999px;padding:3px 10px;box-shadow:2px 2px 0 var(--tk-ink);
  display:inline-flex;align-items:center;gap:6px;white-space:nowrap;cursor:default;margin:0}
.tk-chip.tk-btn{border-radius:8px;padding:3px 8px;cursor:pointer}
.tk-chip.tk-click{cursor:pointer}
.tk-chip:disabled{cursor:default}
.tk-coin{width:30px;height:30px;border-radius:50%;background:radial-gradient(circle at 38% 34%,#ffe58a,var(--tk-gold) 55%,var(--tk-gold-d));border:2px solid var(--tk-ink);
  display:inline-grid;place-items:center;font-family:var(--tk-coin-font);font-size:13px;line-height:1;color:var(--tk-gold-d);box-shadow:0 2px 0 var(--tk-ink);flex:none;box-sizing:border-box}
.tk-coin::after{content:"T"}
.tk-coin.sm{width:16px;height:16px;font-size:8px;box-shadow:0 1px 0 var(--tk-ink);border-width:1.5px;vertical-align:-2px}
.tk-pool{position:relative}
.tk-pool .tk-coin{position:absolute}
.tk-fly{position:fixed;z-index:9999;pointer-events:none;margin:-15px 0 0 -15px}
.tk-pass table{width:100%;border-collapse:collapse}
.tk-pass td.r{text-align:right}
.tk-pass .prow{display:flex;gap:8px;align-items:center;margin-top:8px}
.tk-pass code{flex:1;font-family:var(--tk-font);font-weight:700;letter-spacing:1px;border:2px dashed var(--tk-ink);padding:8px;text-align:center;word-break:break-word}
.tk-pass input{flex:1;min-width:0;font-family:var(--tk-font);font-size:15px;border:2px solid var(--tk-ink);border-radius:8px;padding:8px}
`;
  const style = document.createElement("style");
  style.textContent = CSS;
  document.head.prepend(style);   // first, so the game's own CSS always comes after it

  const coin = (cls = "") => `<span class="tk-coin${cls ? " " + cls : ""}"></span>`;
  const centerOf = p => {
    if (p && p.getBoundingClientRect) { const r = p.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
    return p;
  };

  // ---------- top bar ----------
  // Puts the token chip and the sound button at the start of el (a game can add its own buttons after them).
  // opts: sound (start on/off), onSound(on), onTokens() (the chip was clicked; enable it with api.clickable(true))
  function bar(el, opts = {}) {
    el.classList.add("tk-bar");
    el.insertAdjacentHTML("afterbegin",
      `<button class="tk-chip" type="button" data-tk="tok" aria-label="Tama Tokens">${coin("sm")}<span data-tk="n">0</span></button>` +
      `<button class="tk-chip tk-btn" type="button" data-tk="snd" aria-label="Sound"></button>`);
    const tok = el.querySelector('[data-tk="tok"]'), snd = el.querySelector('[data-tk="snd"]');
    let on = opts.sound !== false, click = false;
    const api = {
      tokens(n) { tok.querySelector('[data-tk="n"]').textContent = n; },
      sound(v) { on = !!v; snd.textContent = on ? "♪ ON" : "♪ OFF"; },
      clickable(v) { click = !!v; tok.classList.toggle("tk-click", click); },
      tokenChip: tok, soundButton: snd,
    };
    snd.addEventListener("click", () => { api.sound(!on); opts.onSound?.(on); });
    tok.addEventListener("click", () => { if (click) opts.onTokens?.(); });
    api.sound(on);
    api.tokens(Tama.tokens());
    return api;
  }

  // ---------- Tama Pass ----------
  // Fills el (a card the game styles its own way). opts: btnClass for the buttons, onTokens() after the balance changed.
  function passCard(el, opts = {}) {
    const btn = opts.btnClass || "btn small";
    el.classList.add("tk-pass");
    el.innerHTML = `<h2>TAMA PASS</h2>
      <table>
        <tr><td>Name</td><td class="r">${esc(Tama.name())}</td></tr>
        <tr><td>Tama Tokens</td><td class="r">${Tama.tokens()} ${coin("sm")}</td></tr>
      </table>
      <p class="pnote">Your progress is saved in this browser. Write this code down to keep it or to carry it to another device.</p>
      <div class="prow"><code>${esc(Tama.passCode())}</code><button class="${btn}" type="button" data-tk="copy">COPY</button></div>
      <form class="prow" data-tk="form"><input data-tk="in" autocomplete="off" spellcheck="false" placeholder="have a code?" aria-label="Tama Pass code"><button class="${btn}">LOAD</button></form>
      <p class="pnote" data-tk="msg" role="status"></p>`;
    const q = k => el.querySelector(`[data-tk="${k}"]`), say = t => { q("msg").textContent = t; };
    q("copy").addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(Tama.passCode()); say("Copied!"); }
      catch { getSelection().selectAllChildren(el.querySelector("code")); say("Select and copy the code"); }
    });
    q("form").addEventListener("submit", e => {
      e.preventDefault();
      const code = q("in").value;
      if (Tama.cheat(code)) { opts.onTokens?.(); passCard(el, opts); say("+10 Tama Tokens!"); return; }   // "MORE TOKEN PLEASE"
      const check = Tama.checkPass(code);
      if (!check.ok) { say(check.error); return; }
      if (!confirm(`Load this pass? Your Tama Tokens become ${check.save.tokens}.`)) return;
      Tama.usePass(code); opts.onTokens?.(); passCard(el, opts); say("Pass loaded. Welcome back!");
    });
  }

  // ---------- token prize pool ----------
  // A pile of coins drawn inside el, in jittered rows of 4 from the bottom. The game decides the count.
  function pool(el) {
    el.classList.add("tk-pool");
    let n = 0;
    const draw = () => {
      el.querySelectorAll(".tk-coin").forEach(c => c.remove());
      const w = el.clientWidth || 170, h = el.clientHeight || 70;
      let i = 0, row = 0;
      while (i < n) {
        const inRow = Math.min(4, n - i);
        for (let c = 0; c < inRow; c++, i++) {
          const k = document.createElement("span"); k.className = "tk-coin";
          const x = w / 2 - (inRow - 1) * 13 + c * 26 - 15 + ((i * 13) % 5 - 2), y = h - 30 - row * 20 + ((i * 7) % 4 - 2);
          k.style.left = x + "px"; k.style.top = y + "px"; k.style.transform = `rotate(${(i * 37) % 40 - 20}deg)`;
          el.appendChild(k);
        }
        row++;
      }
    };
    return {
      get n() { return n; },
      set(v) { n = Math.max(0, v | 0); draw(); },
      add(k = 1) { n += k; draw(); },
      take(k = 1) { n = Math.max(0, n - k); draw(); },
      center() { return centerOf(el); },
      el,
    };
  }

  // ---------- flying coins ----------
  // from / to: an element or {x, y} in the viewport. Resolves when the coin lands (on a timer, not the animation:
  // a tab that isn't painted never finishes animations). opts: delay, duration, onLand.
  function fly(from, to, opts = {}) {
    const { delay = 0, duration = 520, onLand } = opts;
    return new Promise(res => setTimeout(() => {
      const a = centerOf(from), b = centerOf(to), c = document.createElement("span");
      c.className = "tk-coin tk-fly"; c.style.left = a.x + "px"; c.style.top = a.y + "px";
      document.body.appendChild(c);
      c.animate([{ transform: "translate(0,0) rotate(0)" }, { transform: `translate(${b.x - a.x}px,${b.y - a.y}px) rotate(540deg)` }],
        { duration, easing: "cubic-bezier(.5,0,.3,1)", fill: "forwards" });
      setTimeout(() => { c.remove(); onLand?.(); res(); }, duration);
    }, delay));
  }

  window.TamaKit = { bar, passCard, pool, fly, coin, centerOf };
})();
