/* Home page: hero egg and the games grid. Header, panel and footer come from site.js. */
(function () {
  "use strict";
  const { emo, COIN, egg, toast, esc } = window.PT;

  // ---------- hero egg: peeks out now and then (12–20 s apart), or when poked ----------
  const hero = document.getElementById("heroEgg");
  hero.innerHTML = egg("hero-egg");
  const eggEl = hero.firstElementChild;
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let closeT;
  function peek(ms = 2600) {
    eggEl.classList.add("open"); clearTimeout(closeT);
    closeT = setTimeout(() => eggEl.classList.remove("open"), ms);
  }
  eggEl.addEventListener("click", () => eggEl.classList.contains("open") ? (clearTimeout(closeT), eggEl.classList.remove("open")) : peek());
  eggEl.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") peek(); });   // taps already count as clicks
  eggEl.addEventListener("pointerleave", e => { if (e.pointerType === "mouse") { clearTimeout(closeT); eggEl.classList.remove("open"); } });
  function idle(first) { setTimeout(() => { peek(); idle(); }, first ? 1800 : 12000 + Math.random() * 8000); }
  if (!still) idle(true);

  // ---------- grid ----------
  const WHERE = { here: "Play here ▸", itch: "Play on itch.io ↗", steam: "On Steam ↗", download: "Download ↓" };
  const grid = document.getElementById("grid");
  grid.innerHTML = window.TAMA_GAMES.map(g => {
    const ext = g.where !== "here";
    const art = g.art ? `<img src="${esc(g.art)}" alt="" loading="lazy">` : emo(g.emoji[0], g.emoji[1]);
    return `<a class="tile" href="${esc(g.href)}" data-slug="${esc(g.slug)}"${ext ? ' target="_blank" rel="noopener"' : ""}>
      ${g.tag ? `<span class="tag">${esc(g.tag)}</span>` : ""}
      <div class="art" style="--c:${esc(g.color || "")}">${art}</div>
      <div class="body">
        <h3>${esc(g.title)}</h3>
        <p>${esc(g.blurb)}</p>
        <div class="meta"><span class="pill">${esc(g.players)}</span><span class="pill">${esc(g.learns)}</span></div>
        <div class="row-end"><span class="where ${esc(g.where)}">${WHERE[g.where] || "Open ↗"}</span><span class="bonus" data-bonus></span></div>
      </div></a>`;
  }).join("") + `
    <div class="tile next">
      <div class="art">${emo("1f423", "🐣")}</div>
      <div class="body"><h3>Next game</h3><p>Still in the egg.</p></div>
    </div>`;

  grid.querySelectorAll("a.tile").forEach(a => a.addEventListener("click", () => {
    if (Tama.collect(a.dataset.slug)) toast(`+${Tama.VISIT_BONUS} Tama Tokens for visiting ${a.querySelector("h3").textContent}!`);
  }));
  function renderBonuses() {
    grid.querySelectorAll("a.tile").forEach(a => {
      const b = a.querySelector("[data-bonus]"), can = Tama.canCollect(a.dataset.slug);
      b.classList.toggle("got", !can);
      b.innerHTML = can ? `+${Tama.VISIT_BONUS} ${COIN()} today` : `✓ collected today`;
    });
  }
  renderBonuses();
  Tama.onChange(renderBonuses);
  window.addEventListener("pageshow", renderBonuses);

  // ---------- daily pocket money ----------
  // The first home page visit of each day (local midnight) gives POCKET_MONEY tokens. Saved first, then the popup says so.
  function pocketMoney() {
    if (!Tama.pocket()) return;
    let dlg = document.getElementById("pocketDlg");
    if (!dlg) {
      document.body.insertAdjacentHTML("beforeend", `
        <dialog class="panel pocket" id="pocketDlg" aria-labelledby="pocketTitle">
          ${COIN("big", "auto")}
          <h2 id="pocketTitle">Here's some pocket money!</h2>
          <p class="pocket-n">+${Tama.POCKET_MONEY} Tama Tokens</p>
          <button class="btn" type="button" data-close autofocus>Thanks!</button>
        </dialog>`);
      dlg = document.getElementById("pocketDlg");
      dlg.addEventListener("click", e => { if (e.target === dlg || e.target.closest("[data-close]")) dlg.close(); });
    }
    if (!dlg.open) dlg.showModal();
  }
  pocketMoney();
  // a tab left open past midnight, or coming back with the back button
  window.addEventListener("pageshow", pocketMoney);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) pocketMoney(); });
})();
