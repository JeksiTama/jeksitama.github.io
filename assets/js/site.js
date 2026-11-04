/* Shared by every page: the egg logo, header token chip, Tama Pass panel, footer and toast. */
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ---------- animated emoji (Google Noto, CC BY 4.0) ----------
  // Each emoji is a Lottie animation that sits still, plays once now and then (each on its own random
  // timer, so they never all move together), and plays when its tile or button is hovered.
  // mode "auto" = now and then + hover, "hover" = only on hover. Shows the plain character until it loads.
  const LOTTIE_JS = "https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie_svg.min.js";
  const emo = (code, char, cls = "emo", mode = "auto") =>
    `<span class="${cls}" data-lottie="${code}" data-mode="${mode}" role="img" aria-label="${char}"><span class="ch" aria-hidden="true">${char}</span></span>`;
  const COIN = (cls, mode = "hover") => emo("1fa99", "🪙", "emo coin" + (cls ? " " + cls : ""), mode);

  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rand = (a, b) => a + Math.random() * (b - a);
  let lottieLib;
  const getLottie = () => lottieLib ||= new Promise((ok, fail) => {
    const s = document.createElement("script"); s.src = LOTTIE_JS; s.onload = () => ok(window.lottie); s.onerror = fail;
    document.head.appendChild(s);
  });
  function hydrate(el) {
    if (el.dataset.ready) return;
    el.dataset.ready = "1";
    getLottie().then(lottie => {
      const anim = lottie.loadAnimation({ container: el, renderer: "svg", loop: false, autoplay: false,
        path: `https://fonts.gstatic.com/s/e/notoemoji/latest/${el.dataset.lottie}/lottie.json` });
      anim.addEventListener("DOMLoaded", () => { el.classList.add("live"); anim.goToAndStop(0, true); });
      const play = () => { if (anim.isPaused) anim.goToAndPlay(0, true); };
      anim.addEventListener("complete", () => {
        anim.goToAndStop(0, true);
        if (el.dataset.mode === "auto" && !still) setTimeout(play, rand(9000, 20000));
      });
      if (el.dataset.mode === "auto" && !still) setTimeout(play, rand(800, 7000));
      const host = el.closest("a, button, .card, .tile, .cta") || el;
      host.addEventListener("mouseenter", play);
    }).catch(() => {});
  }
  const hydrateAll = (root = document) => root.querySelectorAll("[data-lottie]").forEach(hydrate);
  new MutationObserver(() => hydrateAll()).observe(document.documentElement, { childList: true, subtree: true });

  // ---------- the egg ----------
  // An egg covered in maths symbols. Add the class "open" and it cracks, stands up on its feet and peeks out.
  // Everything is drawn from the settings in EGG (units are the SVG's own, the shell is 96 wide).
  // How it moves (how high it rises, how far the top lifts, speed) is in site.css under "the egg".
  const PAL = { red: "#fe6767", green: "#73d049", blue: "#68c1ff", pink: "#fe94de", orange: "#fea046", purple: "#aa88ff", yellow: "#ffdb33" };
  const EGG = {
    width: 96, height: 126,
    bulge: .14,           // 0 = plain oval; higher puts the widest part lower, like a real egg
    ends: .5,             // .5 = round ends; higher = pointier, lower = blunter
    shell: "#fffaf0", ink: "#2b2b2b", outline: 4,
    insideLine: { color: "#fff", width: 2.4 },   // thin edge round the dark inside so it shows on a dark page (half is hidden)
    room: { top: 28, side: 12, bottom: 11 },   // empty space around the shell so the lid and feet have room to move
    crack: { at: .44, depth: 7, color: "#9a9a9a", width: 2.2 },   // at = how far down the shell (0 top, 1 bottom)
    eyes: { gap: 26, w: 3.7, h: 4.1, color: "#fff", raise: 2.5 },  // gap = distance between the two eyes; raise = how far above the crack's dips
    feet: { spread: 25, size: 9, color: PAL.green },               // spread = distance of each foot from the middle
    symbols: { size: 18, count: 9, minGap: 26, edge: .78, tilt: 6 },   // minGap = closest two symbols may be (centre to centre); edge = how far out they go (1 = centred on the rim)
  };
  // one colour per symbol, everywhere; ORDER is how they repeat along a row
  const SYM_COLOR = { plus: PAL.red, divide: PAL.yellow, times: PAL.blue, minus: PAL.purple, equals: PAL.green };
  const ORDER = ["plus", "minus", "times", "equals", "divide"];
  const SHAPES = (s => {          // drawn at size s, centred on 0,0
    const h = s / 2, t = s * .33, r = s * .11;
    const bar = (y, th = t) => `<rect x="${-h}" y="${y - th / 2}" width="${s}" height="${th}" rx="${r}"/>`;
    const cross = `${bar(0)}<rect x="${-t / 2}" y="${-h}" width="${t}" height="${s}" rx="${r}"/>`;
    return {
      plus: cross,
      minus: bar(0),
      times: `<g transform="rotate(45)">${cross}</g>`,
      divide: `${bar(0, t * .85)}<circle cy="${-s * .43}" r="${s * .18}"/><circle cy="${s * .43}" r="${s * .18}"/>`,
      equals: `${bar(-s * .21, t * .85)}${bar(s * .21, t * .85)}`,
    };
  })(EGG.symbols.size);

  // the shell's outline: half-width at a given height (0 at the top), widest point exactly width / 2
  const eggCurve = t => (1 - t * t) ** EGG.ends * (1 + EGG.bulge * t);   // t runs -1 (top) to 1 (bottom)
  const PEAK = (() => { let m = 0; for (let t = -1; t <= 1; t += .001) m = Math.max(m, eggCurve(t)); return m; })();
  const halfWidth = y => eggCurve(Math.min(1, Math.max(-1, 2 * y / EGG.height - 1))) / PEAK * EGG.width / 2;
  const n2 = v => Math.round(v * 100) / 100;
  const SHELL = (() => {
    const N = 64, right = [], left = [];
    for (let k = 0; k <= N; k++) {
      const y = EGG.height * (1 - Math.cos(Math.PI * k / N)) / 2;   // more points near the ends, where it curves most
      right.push(`${n2(halfWidth(y))},${n2(y)}`); left.unshift(`${n2(-halfWidth(y))},${n2(y)}`);
    }
    return `M${right.join(" L")} L${left.join(" L")}Z`;
  })();
  // the lowest point the shell covers at a given x (so the feet can hide above it)
  const shellBottomAt = x => { let y = EGG.height; while (y > 0 && halfWidth(y) < Math.abs(x)) y -= .5; return y; };

  // the crack: a zigzag whose two deepest dips sit right under the eyes
  const CRACK = (() => {
    const { at, depth } = EGG.crack, y = EGG.height * at, w = halfWidth(y), e = EGG.eyes.gap / 2;
    const shape = [[-w, 0], [-.75 * w, -1], [-.54 * w, -.15], [-e, 1], [0, -.55], [e, 1], [.54 * w, -.15], [.75 * w, -1], [w, 0]];
    return { y, points: shape.map(([x, d]) => [n2(x), n2(y + d * depth)]) };
  })();

  // symbols scattered evenly: each one goes to the free spot farthest from all the others (so the first ones land
  // on the rim and the rest fill in), never closer than minGap and never across the crack. Read top to bottom for colours.
  const SYMS = (() => {
    const { size, count, minGap, edge, tilt } = EGG.symbols, h = size / 2, pad = 1.5, spots = [], picked = [];
    for (let y = h; y <= EGG.height - h; y += 2) {
      if (Math.abs(y - CRACK.y) < EGG.crack.depth + h + pad) continue;   // keep clear of the crack
      const room = Math.min(halfWidth(y - h / 2), halfWidth(y + h / 2)) * edge;   // narrower side, so the ends of the egg don't swallow them
      for (let x = -room; x <= room + .01; x += 2) spots.push([x, y]);
    }
    const dist = p => Math.min(...picked.map(q => Math.hypot(p[0] - q[0], p[1] - q[1])));
    picked.push(spots.reduce((a, b) => b[1] < a[1] ? b : a));          // start at the top
    while (picked.length < count) {
      let best = null, far = minGap;
      for (const p of spots) { const d = dist(p); if (d >= far) { far = d; best = p; } }
      if (!best) break;                                                   // no room left at minGap
      picked.push(best);
    }
    picked.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    return picked.map(([x, y], k) => [n2(x), n2(y), n2(Math.sin(k * 12.9898) * tilt), ORDER[k % ORDER.length]]);   // small, steady tilt per symbol
  })();
  const sym = ([x, y, r, s]) => `<g transform="translate(${x} ${y}) rotate(${r})" fill="${SYM_COLOR[s]}">${SHAPES[s]}</g>`;

  let eggN = 0;
  function egg(cls = "") {
    const id = "egg" + ++eggN, { width: W, height: H, room, crack, eyes, feet } = EGG;
    const far = W;   // clip shapes reach well past the shell
    const zig = CRACK.points.map(p => p.join(",")).join(" ");
    const zigBack = CRACK.points.slice().reverse().map(p => p.join(",")).join(" ");
    const viewBox = [-W / 2 - room.side, -room.top, W + 2 * room.side, H + room.top + room.bottom].join(" ");
    // feet sit just above the shell's lowest edge so they're hidden until the egg stands up
    const fs = feet.size, toeR = fs * .33, toeY = shellBottomAt(feet.spread + fs * .55 + toeR) - toeR - EGG.outline;
    const foot = x => `<ellipse cx="${x}" cy="${n2(toeY - fs * .45)}" rx="${fs}" ry="${n2(fs * .66)}"/>` +
      `<circle cx="${n2(x - fs * .55)}" cy="${n2(toeY)}" r="${n2(toeR)}"/><circle cx="${n2(x + fs * .55)}" cy="${n2(toeY)}" r="${n2(toeR)}"/>`;
    const eyeY = n2(CRACK.y + crack.depth - eyes.h - 1 - eyes.raise);
    // the top hinges on the right end of the crack (as a % of the shell's box)
    const hinge = `${n2((halfWidth(CRACK.y) + W / 2) / W * 100)}% ${n2(CRACK.y / H * 100)}%`;
    const crackLine = `<polyline class="crack" points="${zig}" fill="none" stroke="${crack.color}" stroke-width="${crack.width}" stroke-linecap="round" stroke-linejoin="round"/>`;
    const shell = `<path d="${SHELL}" fill="${EGG.shell}"/><g clip-path="url(#${id}i)">${SYMS.map(sym).join("")}</g><path d="${SHELL}" fill="none" stroke="${EGG.ink}" stroke-width="${EGG.outline}"/>${crackLine}`;
    return `<svg class="egg ${cls}" viewBox="${viewBox}" aria-hidden="true">
      <defs>
        <clipPath id="${id}t"><polygon points="${-far},${-far} ${far},${-far} ${far},${CRACK.y} ${zigBack} ${-far},${CRACK.y}"/></clipPath>
        <clipPath id="${id}b"><polygon points="${-far},${CRACK.y} ${zig} ${far},${CRACK.y} ${far},${H + far} ${-far},${H + far}"/></clipPath>
        <clipPath id="${id}i"><path d="${SHELL}"/></clipPath>
      </defs>
      <g class="feet" fill="${feet.color}">${foot(-feet.spread)}${foot(feet.spread)}</g>
      <g class="body">
        <g class="inside" clip-path="url(#${id}i)">
          <rect x="${-far}" y="0" width="${2 * far}" height="${n2(CRACK.y + crack.depth + 1)}" fill="${EGG.ink}"/>
          <path d="${SHELL}" fill="none" stroke="${EGG.insideLine.color}" stroke-width="${EGG.insideLine.width}"/>
          <g class="eyes" fill="${eyes.color}"><ellipse cx="${-eyes.gap / 2}" cy="${eyeY}" rx="${eyes.w}" ry="${eyes.h}"/><ellipse cx="${eyes.gap / 2}" cy="${eyeY}" rx="${eyes.w}" ry="${eyes.h}"/></g>
        </g>
        <g class="base" clip-path="url(#${id}b)">${shell}</g>
        <g class="lid" style="transform-origin:${hinge}"><g clip-path="url(#${id}t)">${shell}</g></g>
      </g>
    </svg>`;
  }

  // ---------- header chip + Tama Pass panel ----------
  function mountHeader() {
    const brand = document.querySelector("[data-brand-egg]");
    if (brand) brand.outerHTML = egg("brand-egg");
    const chip = $("tokBtn");
    if (chip) chip.innerHTML = `${COIN()}<span id="tokN">${Tama.tokens()}</span><span class="sr"> Tama Tokens. Open your Tama Pass</span>`;
    document.body.insertAdjacentHTML("beforeend", `
      <dialog class="panel" id="passDlg" aria-labelledby="passTitle">
        <button class="x" type="button" data-close aria-label="Close">✕</button>
        <div class="panel-head">${COIN("big")}
          <div><h2 id="passTitle"><span id="pName"></span><button class="icon-btn" type="button" id="renameBtn" aria-label="Change name">✎</button></h2>
          <p class="hint"><b id="pTokens"></b> Tama Tokens · <a href="about.html#tokens">how to get more</a></p></div>
        </div>
        <h3>Tama Pass</h3>
        <p class="hint">Your progress is saved in this browser. Write this code down to keep it safe or to carry it to another device.</p>
        <div class="pass"><code id="passCode"></code><button class="btn small" type="button" id="copyPass">Copy</button></div>
        <form class="pass-in" id="passForm">
          <label for="passInput">Have a code?</label>
          <div class="row"><input id="passInput" autocomplete="off" spellcheck="false" placeholder="A1B2 C3D4 …"><button class="btn small" type="submit">Load</button></div>
          <p class="msg" id="passMsg" role="status"></p>
        </form>
      </dialog>
      <div class="toast" id="toast" role="status" aria-live="polite"></div>`);

    const dlg = $("passDlg");
    const fill = () => { $("pName").textContent = Tama.name(); $("pTokens").textContent = Tama.tokens(); $("passCode").textContent = Tama.passCode(); };
    const open = () => { fill(); $("passMsg").textContent = ""; dlg.showModal(); };
    if (chip) chip.addEventListener("click", open);
    document.querySelectorAll("[data-open-pass]").forEach(b => b.addEventListener("click", open));
    dlg.addEventListener("click", e => { if (e.target === dlg || e.target.closest("[data-close]")) dlg.close(); });
    $("renameBtn").addEventListener("click", () => { const n = prompt("Your name", Tama.name()); if (n) Tama.rename(n); });
    $("copyPass").addEventListener("click", async () => {
      try { await navigator.clipboard.writeText($("passCode").textContent); toast("Tama Pass copied"); }
      catch { getSelection().selectAllChildren($("passCode")); toast("Select and copy the code"); }
    });
    $("passForm").addEventListener("submit", e => {
      e.preventDefault();
      const msg = $("passMsg"), code = $("passInput").value;
      msg.className = "msg";
      if (Tama.cheat(code)) { $("passInput").value = ""; msg.textContent = "+10 Tama Tokens!"; msg.classList.add("good"); return; }
      const check = Tama.checkPass(code);
      if (!check.ok) { msg.textContent = check.error; msg.classList.add("bad"); return; }
      if (!confirm(`Load this pass? Your tokens become ${check.save.tokens}.`)) return;
      Tama.usePass(code); $("passInput").value = "";
      msg.textContent = "Pass loaded. Welcome back!"; msg.classList.add("good");
    });

    const refresh = () => { const n = $("tokN"); if (n) n.textContent = Tama.tokens(); if (dlg.open) fill(); };
    Tama.onChange(refresh);
    window.addEventListener("pageshow", refresh);   // coming back from a game with the back button
  }

  // ---------- footer ----------
  const X_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.2 2.25h3.4l-7.4 8.45L23 21.75h-6.8l-5.3-6.95-6.1 6.95H1.4l7.9-9.05L1 2.25h7l4.8 6.35 5.4-6.35zm-1.2 17.5h1.9L7.1 4.2H5.1l11.9 15.55z"/></svg>`;
  function iconSVG(key) {
    if (key === "x") return X_ICON;
    const ic = window.TAMA_ICONS[key]; if (!ic) return "";
    return `<svg viewBox="0 -448 ${ic.w} 512" aria-hidden="true"><path transform="scale(1,-1)" d="${ic.d}"/></svg>`;
  }
  function mountFooter() {
    const f = $("foot"); if (!f) return;
    const socials = window.TAMA_SOCIALS.map(s => s.href
      ? `<a class="social" href="${esc(s.href)}" target="_blank" rel="noopener" aria-label="PlayTama on ${esc(s.name)}" title="${esc(s.name)}">${iconSVG(s.icon)}</a>`
      : `<span class="social off" title="${esc(s.name)}: no link yet" aria-label="${esc(s.name)}: no link yet">${iconSVG(s.icon)}</span>`).join("");
    f.innerHTML = `<nav class="socials" aria-label="PlayTama elsewhere">${socials}</nav>
      <p><a href="./">Games</a> · <a href="about.html">About</a></p>
      <p>© ${new Date().getFullYear()} PlayTama</p>
      <p class="credit">Animated emoji: Google Noto Emoji (CC BY 4.0) · Brand icons: Font Awesome Free (CC BY 4.0)</p>`;
  }

  // ---------- toast ----------
  let toastT;
  function toast(text) {
    const t = $("toast"); if (!t) return;
    t.textContent = text; t.classList.add("on");
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), 2600);
  }

  window.PT = { emo, COIN, egg, toast, esc };
  mountHeader(); mountFooter();
})();
