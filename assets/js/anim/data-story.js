// A message is a mix: share m is story (examples, a person, a narrative), 1 − m is data (figures, charts, method).
// Credibility = 0.2 + 0.8·√(1 − m); memorability = 0.15 + 0.85·√m. Persuasion = credibility^w · memorability^(1 − w),
// where w is how much this audience weighs evidence over a memorable example.
(function (T) {
  var Wt = { exp: 0.75, exec: 0.5, gen: 0.3 };
  var cred = function (m) { return 0.2 + 0.8 * Math.sqrt(1 - m); };
  var mem = function (m) { return 0.15 + 0.85 * Math.sqrt(m); };
  var pers = function (m, a) { return Math.pow(cred(m), Wt[a]) * Math.pow(mem(m), 1 - Wt[a]); };
  function best(a) { var bm = 0, bp = 0; for (var m = 0; m <= 1.0001; m += 0.01) { var p = pers(m, a); if (p > bp) { bp = p; bm = m; } } return bm; }
  var pct = function (v) { return Math.round(v * 100) + "%"; };

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "A slide split between charts and a story, bars for credibility, memorability and persuasion, and curves of all three against the share of the message that is story.",
    vars: [
      { key: "m", label: "Share of the message that is story", min: 0, max: 1, step: 0.01, value: 0.05, color: "var(--s2)", fmt: pct },
      { key: "a", label: "Audience", type: "choice", value: "exec",
        options: [{ value: "exp", label: "Analysts" }, { value: "exec", label: "Executives" }, { value: "gen", label: "General public" }] }
    ],
    scenario: [
      { caption: "All numbers: hard to argue with, and forgotten by the next meeting.", set: { m: 0.05, a: "exec" }, hold: 3800 },
      { caption: "All anecdote: memorable, but easy to wave away as \"one customer\".", set: { m: 0.95 }, dur: 2400, hold: 3800 },
      { caption: "Lead with one concrete story and back it with the key number. For executives the best mix is about half and half.", set: { m: 0.5 }, dur: 2000, hold: 4400 },
      { caption: "Analysts weigh evidence more heavily. Keep the story short and show the method.", set: { a: "exp", m: 0.24 }, dur: 2200, hold: 4000 },
      { caption: "A general audience remembers people, not percentages. Let the story carry it and keep one memorable figure.", set: { a: "gen", m: 0.74 }, dur: 2200, hold: 4400 }
    ],
    setup: function (svg) {
      var el = T.el, x0 = 30, W = 330;
      el("rect", { x: x0, y: 20, width: W, height: 76, rx: 6, fill: "none", stroke: "var(--line)", "stroke-width": 2 }, svg);
      var dataG = el("g", {}, svg), storyG = el("g", {}, svg);
      var clipD = el("clipPath", { id: "ds-clip-d" }, svg), clipS = el("clipPath", { id: "ds-clip-s" }, svg);
      var rD = el("rect", { x: x0, y: 20, height: 76 }, clipD), rS = el("rect", { y: 20, height: 76 }, clipS);
      T.set(dataG, { "clip-path": "url(#ds-clip-d)" }); T.set(storyG, { "clip-path": "url(#ds-clip-s)" });
      [14, 30, 22, 40, 34, 50, 44, 58].forEach(function (h, i) { el("rect", { x: x0 + 14 + i * 20, y: 86 - h, width: 13, height: h, rx: 2, fill: "var(--s1)" }, dataG); });
      for (var i = 0; i < 8; i++) {
        var cx = x0 + W - 24 - i * 40;
        el("circle", { cx: cx, cy: 42, r: 9, fill: "var(--s2)" }, storyG);
        el("path", { d: "M" + (cx - 14) + " 76q14-24 28 0", fill: "var(--s2)", opacity: 0.6 }, storyG);
      }
      var divider = el("path", { stroke: "var(--ink)", "stroke-width": 2, "stroke-dasharray": "3 3" }, svg);
      el("text", { x: x0, y: 114, "class": "t-small", text: "blue = data · orange = story" }, svg);

      var rows = [["Credibility", "var(--s1)"], ["Memorability", "var(--s2)"], ["Persuasion", "var(--ink)"]].map(function (r, i) {
        var y = 140 + i * 30;
        el("text", { x: x0, y: y + 11, "class": "t-small", text: r[0] }, svg);
        el("rect", { x: x0 + 104, y: y, width: W - 104, height: 14, rx: 3, fill: "var(--line)", opacity: 0.5 }, svg);
        return el("rect", { x: x0 + 104, y: y, height: 14, rx: 3, fill: r[1] }, svg);
      });
      var verdict = el("text", { x: x0, y: 252, "class": "t-mid" }, svg);
      var sub = el("text", { x: x0, y: 276, "class": "t-small" }, svg);

      var C = T.chart(svg, { x: 392, y: 48, w: 218, h: 190, xDomain: [0, 1], yDomain: [0, 1], xLabel: "share that is story →", yLabel: "score" });
      el("path", { d: C.path(cred, 0, 1, 60), fill: "none", stroke: "var(--s1)", "stroke-width": 2, "stroke-dasharray": "5 4" }, C.g);
      el("path", { d: C.path(mem, 0, 1, 60), fill: "none", stroke: "var(--s2)", "stroke-width": 2, "stroke-dasharray": "5 4" }, C.g);
      var pP = el("path", { fill: "none", stroke: "var(--ink)", "stroke-width": 3 }, C.g);
      var bestLine = el("line", { y1: 0, y2: C.h, stroke: "var(--good)", "stroke-width": 2, "stroke-dasharray": "4 4" }, C.g);
      var mk = el("circle", { r: 6.5, fill: "var(--ink)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);
      [["var(--s1)", "credibility", 0], ["var(--s2)", "memorability", 1], ["var(--ink)", "persuasion", 2]].forEach(function (l) {
        var lx = 392 + (l[2] % 2) * 124, ly = 280 + Math.floor(l[2] / 2) * 20;
        el("path", { d: "M" + lx + " " + ly + "h14", stroke: l[0], "stroke-width": l[2] === 2 ? 3 : 2, "stroke-dasharray": l[2] === 2 ? null : "5 4" }, svg);
        el("text", { x: lx + 20, y: ly + 4, "class": "t-small", text: l[1] }, svg);
      });

      return function (s) {
        var c = cred(s.m), me = mem(s.m), p = pers(s.m, s.a), bm = best(s.a), bp = pers(bm, s.a), split = x0 + (1 - s.m) * W;
        T.set(rD, { width: (1 - s.m) * W }); T.set(rS, { x: split, width: s.m * W });
        T.set(divider, { d: "M" + split + " 20V96", opacity: s.m > 0.01 && s.m < 0.99 ? 1 : 0 });
        var bw = W - 104;
        T.set(rows[0], { width: c * bw }); T.set(rows[1], { width: me * bw }); T.set(rows[2], { width: p * bw });
        T.set(pP, { d: C.path(function (m) { return pers(m, s.a); }, 0, 1, 60) });
        T.set(bestLine, { x1: C.px(bm), x2: C.px(bm) });
        T.set(mk, { cx: C.px(s.m), cy: C.py(p) });
        var gap = bp - p;
        T.set(verdict, { text: gap < 0.02 ? "A strong mix for this audience" : s.m < bm ? "Needs a story to stick" : "Needs evidence to convince", fill: gap < 0.02 ? "var(--good)" : gap < 0.08 ? "var(--warn)" : "var(--bad)" });
        T.set(sub, { text: "best mix for this audience: about " + pct(bm) + " story" });
      };
    }
  });
})(window.Tradeoff);
