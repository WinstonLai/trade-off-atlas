// You make many calls and are right a share `a` of the time. You state confidence s (50% = no idea, 100% = certain).
// How much people act on a claim: (s − 0.5) / 0.5. Trust once your record is checked: 1 − p·max(0, s − a) − 0.8·max(0, a − s),
// where the overclaiming penalty p is 4 when people keep score and 1.5 when they rarely do. Influence = action × trust.
(function (T) {
  var PEN = { often: 4, rarely: 1.5 };
  var act = function (s) { return (s - 0.5) / 0.5; };
  var trust = function (s, a, k) { return T.clamp(1 - PEN[k] * Math.max(0, s - a) - 0.8 * Math.max(0, a - s), 0, 1); };
  var infl = function (s, a, k) { return act(s) * trust(s, a, k); };
  function best(a, k) { var bs = 0.5, bi = -1; for (var s = 0.5; s <= 1.0001; s += 0.005) { var v = infl(s, a, k); if (v > bi) { bi = v; bs = s; } } return bs; }
  var pct = function (v) { return Math.round(v * 100) + "%"; };

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "Ten past calls marked right or wrong, bars for how much people act on what you say and how much they trust it, and a curve of long-run influence against stated confidence.",
    vars: [
      { key: "s", label: "How sure you sound", min: 0.5, max: 1, step: 0.01, value: 0.6, color: "var(--s1)", fmt: pct },
      { key: "a", label: "How often you're actually right", min: 0.5, max: 1, step: 0.01, value: 0.8, color: "var(--s2)", fmt: pct },
      { key: "k", label: "Does anyone check your track record?", type: "choice", value: "often",
        options: [{ value: "often", label: "Yes, often" }, { value: "rarely", label: "Rarely" }] }
    ],
    scenario: [
      { caption: "Heavy hedging (\"it might, possibly...\"): you're rarely caught out, but nobody acts on what you say.", set: { s: 0.6, a: 0.8, k: "often" }, hold: 4000 },
      { caption: "Total certainty gets action, until the one call in five that's wrong adds up and people start discounting everything you say.", set: { s: 1 }, dur: 2400, hold: 4400 },
      { caption: "Sound as sure as your record justifies. Influence peaks when stated confidence matches how often you're right.", set: { s: 0.8 }, dur: 2000, hold: 4200 },
      { caption: "Where nobody keeps score, overclaiming pays, for now. It's a bet that no one will ever check.", set: { k: "rarely", s: 1 }, dur: 2000, hold: 4400 },
      { caption: "Get more accurate and you earn the right to sound more certain.", set: { k: "often", a: 0.95, s: 0.95 }, dur: 2400, hold: 4200 }
    ],
    setup: function (svg) {
      var el = T.el, x0 = 30, W = 330;
      var say = el("text", { x: x0, y: 30, "class": "t-label" }, svg);
      var calls = [];
      for (var i = 0; i < 10; i++) calls.push(el("circle", { cx: x0 + 14 + i * 31, cy: 56, r: 11 }, svg));
      el("text", { x: x0, y: 88, "class": "t-small", text: "your last ten calls: green = right, red = wrong" }, svg);

      var rows = [["People act on it", "var(--s1)"], ["Trust once checked", "var(--s2)"]].map(function (r, i) {
        var y = 116 + i * 40;
        el("text", { x: x0, y: y, "class": "t-small", text: r[0] }, svg);
        el("rect", { x: x0, y: y + 6, width: W, height: 14, rx: 3, fill: "var(--line)", opacity: 0.5 }, svg);
        return { bar: el("rect", { x: x0, y: y + 6, height: 14, rx: 3, fill: r[1] }, svg), val: el("text", { x: x0 + W, y: y, "text-anchor": "end", "class": "t-small" }, svg) };
      });
      var big = el("text", { x: x0, y: 226, "class": "t-big" }, svg);
      var sub = el("text", { x: x0, y: 250, "class": "t-small" }, svg);
      var verdict = el("text", { x: x0, y: 286, "class": "t-mid" }, svg);

      var C = T.chart(svg, { x: 392, y: 48, w: 218, h: 190, xDomain: [0.5, 1], yDomain: [0, 1], xLabel: "how sure you sound →", yLabel: "long-run influence" });
      var calib = el("line", { y1: 0, y2: C.h, stroke: "var(--s2)", "stroke-width": 2, "stroke-dasharray": "4 4" }, C.g);
      var calibT = el("text", { y: 14, "class": "t-small", fill: "var(--s2)", text: "your record" }, C.g);
      var pI = el("path", { fill: "none", stroke: "var(--ink)", "stroke-width": 3 }, C.g);
      var mk = el("circle", { r: 6.5, fill: "var(--ink)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);

      return function (s) {
        var ac = act(s.s), tr = trust(s.s, s.a, s.k), v = ac * tr, bs = best(s.a, s.k), bv = infl(bs, s.a, s.k), right = Math.round(s.a * 10);
        T.set(say, { text: "You say: \"I'm " + pct(s.s) + " sure\"" });
        calls.forEach(function (c, i) { T.set(c, { fill: i < right ? "var(--good)" : "var(--bad)" }); });
        T.set(rows[0].bar, { width: ac * W }); T.set(rows[0].val, { text: pct(ac) });
        T.set(rows[1].bar, { width: tr * W }); T.set(rows[1].val, { text: pct(tr) });
        T.set(calib, { x1: C.px(s.a), x2: C.px(s.a) });
        T.set(calibT, { x: C.px(s.a) + (s.a > 0.8 ? -6 : 6), "text-anchor": s.a > 0.8 ? "end" : "start" });
        T.set(pI, { d: C.path(function (x) { return infl(x, s.a, s.k); }, 0.5, 1, 100) });
        T.set(mk, { cx: C.px(s.s), cy: C.py(v) });
        T.set(big, { text: "Influence: " + Math.round(v * 100) + " / 100" });
        T.set(sub, { text: "you're right " + pct(s.a) + " of the time · you sound " + pct(s.s) + " sure" });
        var gap = bv - v, over = s.s - s.a;
        T.set(verdict, { text: Math.abs(over) < 0.03 ? "Calibrated" : over > 0 ? (gap < 0.02 ? "Overclaiming, and getting away with it" : "Overclaiming: trust is draining") : "Underselling what you know", fill: Math.abs(over) < 0.03 ? "var(--good)" : over > 0 && gap < 0.02 ? "var(--warn)" : gap < 0.08 ? "var(--warn)" : "var(--bad)" });
      };
    }
  });
})(window.Tradeoff);
