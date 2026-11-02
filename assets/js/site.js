/* Shared by every page: the egg logo, header token chip, Tama Pass panel, footer and toast. */
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ---------- animated emoji (Google Noto, CC BY 4.0) ----------
  // Falls back to the plain emoji character if the image can't load.
  const emo = (code, char, cls = "emo") =>
    `<img class="${cls}" src="https://fonts.gstatic.com/s/e/notoemoji/latest/${code}/512.webp" alt="${char}" draggable="false" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:this.className+' txt',textContent:this.alt}))">`;
  const COIN = cls => emo("1fa99", "🪙", "emo coin" + (cls ? " " + cls : ""));

  // ---------- the egg ----------
  // An egg covered in maths symbols. Add the class "open" to crack it: the top lifts, eyes peek out, feet pop out.
  const PAL = { red: "#fe6767", green: "#73d049", blue: "#68c1ff", pink: "#fe94de", orange: "#fea046", purple: "#aa88ff", yellow: "#ffdb33" };
  const SHAPES = {
    plus:   `<rect x="-7" y="-2.3" width="14" height="4.6" rx="1.6"/><rect x="-2.3" y="-7" width="4.6" height="14" rx="1.6"/>`,
    minus:  `<rect x="-7" y="-2.3" width="14" height="4.6" rx="1.6"/>`,
    times:  `<g transform="rotate(45)"><rect x="-7" y="-2.3" width="14" height="4.6" rx="1.6"/><rect x="-2.3" y="-7" width="4.6" height="14" rx="1.6"/></g>`,
    divide: `<rect x="-7" y="-2" width="14" height="4" rx="1.6"/><circle cy="-6" r="2.5"/><circle cy="6" r="2.5"/>`,
    equals: `<rect x="-7" y="-5" width="14" height="4" rx="1.6"/><rect x="-7" y="1" width="14" height="4" rx="1.6"/>`,
  };
  const sym = ([x, y, r, s, c]) => `<g transform="translate(${x} ${y}) rotate(${r})" fill="${PAL[c]}" stroke="#2b2b2b" stroke-width="1.3" stroke-linejoin="round">${SHAPES[s]}</g>`;
  const LID_SYMS = [[60, 22, 0, "plus", "red"], [40, 38, -15, "times", "blue"], [80, 38, 12, "divide", "purple"], [26, 56, 0, "minus", "orange"], [94, 56, -8, "equals", "green"], [61, 50, 8, "minus", "pink"]];
  const BASE_SYMS = [[34, 84, -10, "divide", "pink"], [60, 98, 0, "plus", "yellow"], [86, 84, 15, "times", "red"], [44, 120, 0, "minus", "blue"], [77, 120, -10, "plus", "purple"], [22, 104, 0, "equals", "green"], [98, 104, 20, "times", "orange"]];
  const EGG = "M60 8C92 8 108 58 108 86C108 116 86 134 60 134C34 134 12 116 12 86C12 58 28 8 60 8Z";
  const ZIG = "12,66 24,58 36,68 48,57 60,68 72,57 84,68 96,58 108,66";
  let eggN = 0;
  function egg(cls = "") {
    const id = "egg" + ++eggN;
    const foot = x => `<g class="foot"><ellipse cx="${x}" cy="134" rx="15" ry="9"/><circle cx="${x - 9}" cy="140" r="4.5"/><circle cx="${x}" cy="142" r="4.5"/><circle cx="${x + 9}" cy="140" r="4.5"/></g>`;
    return `<svg class="egg ${cls}" viewBox="0 -26 120 176" aria-hidden="true">
      <defs>
        <clipPath id="${id}t"><polygon points="-5,-40 125,-40 125,66 ${ZIG.split(" ").reverse().join(" ")} -5,66"/></clipPath>
        <clipPath id="${id}b"><polygon points="-5,66 ${ZIG} 125,66 125,160 -5,160"/></clipPath>
        <clipPath id="${id}i"><path d="${EGG}"/></clipPath>
      </defs>
      <g class="feet" fill="${PAL.green}" stroke="#2b2b2b" stroke-width="3.5">${foot(40)}${foot(80)}</g>
      <g class="inside" clip-path="url(#${id}i)">
        <rect x="0" y="16" width="120" height="56" fill="#2b2b2b"/>
        <g class="eyes"><ellipse cx="47" cy="48" rx="6" ry="7" fill="#fff"/><ellipse cx="73" cy="48" rx="6" ry="7" fill="#fff"/>
          <circle cx="48.5" cy="49.5" r="3.2" fill="#2b2b2b"/><circle cx="74.5" cy="49.5" r="3.2" fill="#2b2b2b"/>
          <circle cx="46.5" cy="46.5" r="1.4" fill="#fff"/><circle cx="72.5" cy="46.5" r="1.4" fill="#fff"/></g>
      </g>
      <g class="base" clip-path="url(#${id}b)">
        <path d="${EGG}" fill="#fffaf0"/>${BASE_SYMS.map(sym).join("")}
        <path d="${EGG}" fill="none" stroke="#2b2b2b" stroke-width="4"/>
        <polyline class="crack" points="${ZIG}" pathLength="1" fill="none" stroke="#2b2b2b" stroke-width="3" stroke-linejoin="round"/>
      </g>
      <g class="lid"><g clip-path="url(#${id}t)">
        <path d="${EGG}" fill="#fffaf0"/>${LID_SYMS.map(sym).join("")}
        <path d="${EGG}" fill="none" stroke="#2b2b2b" stroke-width="4"/>
        <polyline class="crack" points="${ZIG}" pathLength="1" fill="none" stroke="#2b2b2b" stroke-width="3" stroke-linejoin="round"/>
      </g></g>
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
      const msg = $("passMsg"), code = $("passInput").value, check = Tama.checkPass(code);
      msg.className = "msg";
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
