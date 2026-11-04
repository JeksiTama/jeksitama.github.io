/* PlayTama question bank: multiple-choice questions any game can use.
 *
 *   <script src="../../assets/js/tama-questions.js"></script>
 *
 * The bank is assets/data/questions.json (see docs/SITE_RULES.md for its fields). To move it to a server later,
 * change SOURCE below to the server's address; it must answer with the same JSON.
 *
 * - TamaQuestions.load()                  Promise of the bank. Rejects if it doesn't load.
 * - TamaQuestions.daily(bank, n, opts)     n questions for today, the same for everyone on the same date.
 *                                          opts: salt (use the game's slug), day ("YYYY-MM-DD"), filter(q), choices (default 3)
 * - TamaQuestions.random(bank, n, opts)    n questions picked at random. opts: filter(q), choices
 * - TamaQuestions.credits(bank)            every image credit in the bank, without repeats
 *
 * A picked question is { id, q, tags, choices: [{ text, img, credit }], correct } where correct is the index of the
 * right choice. img is a full URL or null. Each question shows the right answer and (choices - 1) wrong ones.
 */
(function () {
  "use strict";
  const SOURCE = "assets/data/questions.json";   // relative to the site root, or a full URL
  // the site root this script was loaded from (assets/js/ → ../../); picture paths in the bank start here
  const ROOT = new URL("../../", document.currentScript.src).href;

  // ---------- loading ----------
  // choices may be plain text or { text, img, credit }; img is relative to the bank's site root
  function choice(c, root) {
    const o = typeof c === "string" ? { text: c } : (c || {});
    return { text: String(o.text ?? ""), img: o.img ? new URL(o.img, root).href : null, credit: String(o.credit || "") };
  }
  function tidy(data, root) {
    const qs = (data && Array.isArray(data.questions) ? data.questions : []).filter(q => q && q.id && q.q && q.answer && Array.isArray(q.wrong) && q.wrong.length);
    return {
      root,
      questions: qs.map(q => ({ id: String(q.id), q: String(q.q), tags: Array.isArray(q.tags) ? q.tags.map(String) : [], answer: choice(q.answer, root), wrong: q.wrong.map(w => choice(w, root)) }))
        .sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0),   // file order doesn't change the daily pick
    };
  }
  async function load() {
    const res = await fetch(new URL(SOURCE, ROOT), { cache: "no-cache" });
    if (!res.ok) throw new Error("The questions didn't load.");
    const bank = tidy(await res.json(), ROOT);
    if (!bank.questions.length) throw new Error("The question bank is empty.");
    return bank;
  }

  // ---------- picking ----------
  // a small seeded random number generator, so a date gives everyone the same questions
  function seeded(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; }
    let a = h >>> 0;
    return () => { a = a + 0x6d2b79f5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function shuffle(list, rnd) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function ask(q, rnd, n = 3) {
    const choices = shuffle([q.answer, ...shuffle(q.wrong, rnd).slice(0, n - 1)], rnd);
    return { id: q.id, q: q.q, tags: q.tags, choices, correct: choices.indexOf(q.answer) };
  }
  function daily(bank, n = 5, opts = {}) {
    const key = `${opts.salt || ""}|${opts.day || window.Tama.today()}`;
    const pool = bank.questions.filter(opts.filter || (() => true));
    return shuffle(pool, seeded(key)).slice(0, n).map(q => ask(q, seeded(`${key}|${q.id}`), opts.choices));
  }
  function random(bank, n = 5, opts = {}) {
    const pool = bank.questions.filter(opts.filter || (() => true));
    return shuffle(pool, Math.random).slice(0, n).map(q => ask(q, Math.random, opts.choices));
  }
  function credits(bank) {
    const all = bank.questions.flatMap(q => [q.answer, ...q.wrong]).map(c => c.credit).filter(Boolean);
    return [...new Set(all)];
  }

  window.TamaQuestions = { load, daily, random, credits, seeded };
})();
