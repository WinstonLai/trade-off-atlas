// Spend x (share of budget) on prevention and testing. Defects made fall as exp(-x/0.06); the share that escapes to
// customers falls as 0.5·exp(-x/0.1). A caught defect costs 0.05% of budget to fix, an escaped one m times that.
// Total cost of quality = x + internal failure + external failure: the classic U-shaped curve.
(function (T) {
  var UNIT = 0.0005, MAXX = 0.3, YMAX = 0.5;
  function parts(x, m) {
    var defects = 100 * Math.exp(-x / 0.06), esc = 0.5 * Math.exp(-x / 0.1);
    return { defects: defects, esc: esc, internal: defects * (1 - esc) * UNIT, external: defects * esc * UNIT * m };
  }
  function total(x, m) { var p = parts(x, m); return x + p.internal + p.external; }
  function best(m) { var bx = 0, bt = Infinity; for (var x = 0; x <= MAXX + 1e-9; x += 0.0025) { var t = total(x, m); if (t < bt) { bt = t; bx = x; } } return bx; }
  var pct = function (v) { return Math.round(v * 100) + "%"; };

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "A stacked bar of prevention, internal failure and external failure costs, and a U-shaped curve of total cost of quality against spending on prevention and testing.",
    vars: [
      { key: "x", label: "Spent on prevention and testing (share of budget)", min: 0, max: MAXX, step: 0.005, value: 0.01, color: "var(--s1)", fmt: pct },
      { key: "m", label: "Cost of a defect customers find (× one caught in-house)", min: 1, max: 20, step: 1, value: 10, color: "var(--s2)", fmt: function (v) { return Math.round(v) + "×"; } }
    ],
    scenario: [
      { caption: "Skimp on reviews and testing: the project looks cheap, until failures cost over a fifth of the budget.", set: { x: 0.01, m: 10 }, hold: 4000 },
      { caption: "Spend more up front and defects are prevented or caught early, when they are cheap. Total cost falls.", set: { x: 0.08 }, dur: 2400, hold: 4000 },
      { caption: "Past the bottom of the curve, each extra check costs more than the failures it prevents.", set: { x: 0.28 }, dur: 2400, hold: 3800 },
      { caption: "An internal tool where a bug is cheap to fix after release: the best spend is much lower.", set: { m: 2, x: 0.02 }, dur: 2400, hold: 4000 },
      { caption: "Payments or medical software, where an escaped defect is very expensive: the best spend moves right.", set: { m: 20, x: 0.1 }, dur: 2400, hold: 4400 }
    ],
    setup: function (svg) {
      var el = T.el, x0 = 30, W = 330, sx = W / YMAX;
      el("text", { x: x0, y: 30, "class": "t-label", text: "Cost of quality (share of budget)" }, svg);
      el("rect", { x: x0, y: 42, width: W, height: 28, rx: 4, fill: "var(--line)", opacity: 0.4 }, svg);
      var bP = el("rect", { x: x0, y: 42, height: 28, fill: "var(--s1)" }, svg);
      var bI = el("rect", { y: 42, height: 28, fill: "var(--warn)" }, svg);
      var bE = el("rect", { y: 42, height: 28, fill: "var(--bad)" }, svg);
      var tP = el("text", { x: x0, y: 96, "class": "t-small", fill: "var(--s1)" }, svg);
      var tI = el("text", { x: x0, y: 116, "class": "t-small", fill: "var(--warn)" }, svg);
      var tE = el("text", { x: x0, y: 136, "class": "t-small", fill: "var(--bad)" }, svg);
      var tD = el("text", { x: x0, y: 162, "class": "t-small" }, svg);

      var big = el("text", { x: x0, y: 210, "class": "t-big" }, svg);
      var sub = el("text", { x: x0, y: 234, "class": "t-small" }, svg);
      var verdict = el("text", { x: x0, y: 272, "class": "t-mid" }, svg);

      var C = T.chart(svg, { x: 392, y: 48, w: 218, h: 190, xDomain: [0, MAXX], yDomain: [0, YMAX], xLabel: "prevention + testing →", yLabel: "total cost of quality" });
      el("path", { d: C.path(function (x) { return x; }, 0, MAXX, 2), fill: "none", stroke: "var(--s1)", "stroke-width": 2, "stroke-dasharray": "5 4" }, C.g);
      var pF = el("path", { fill: "none", stroke: "var(--bad)", "stroke-width": 2, "stroke-dasharray": "5 4" }, C.g);
      var pT = el("path", { fill: "none", stroke: "var(--ink)", "stroke-width": 3 }, C.g);
      var bestLine = el("line", { y1: 0, y2: C.h, stroke: "var(--good)", "stroke-width": 2, "stroke-dasharray": "4 4" }, C.g);
      var mk = el("circle", { r: 6.5, fill: "var(--ink)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);
      [["var(--s1)", "prevention", 0], ["var(--bad)", "failures", 1], ["var(--ink)", "total", 2]].forEach(function (l) {
        var lx = 392 + (l[2] % 2) * 124, ly = 280 + Math.floor(l[2] / 2) * 20;
        el("path", { d: "M" + lx + " " + ly + "h14", stroke: l[0], "stroke-width": l[0] === "var(--ink)" ? 3 : 2, "stroke-dasharray": l[0] === "var(--ink)" ? null : "5 4" }, svg);
        el("text", { x: lx + 20, y: ly + 4, "class": "t-small", text: l[1] }, svg);
      });

      return function (s) {
        var p = parts(s.x, s.m), tot = s.x + p.internal + p.external, bx = best(s.m), bt = total(bx, s.m);
        var w1 = s.x * sx, w2 = p.internal * sx, w3 = Math.min(W - w1 - w2, p.external * sx);
        T.set(bP, { width: w1 });
        T.set(bI, { x: x0 + w1, width: w2 });
        T.set(bE, { x: x0 + w1 + w2, width: Math.max(0, w3) });
        T.set(tP, { text: "Prevention and testing: " + pct(s.x) });
        T.set(tI, { text: "Fixing defects caught in-house: " + pct(p.internal) });
        T.set(tE, { text: "Defects customers find: " + pct(p.external) });
        T.set(tD, { text: Math.round(p.defects) + " defects made, " + Math.round(p.defects * p.esc) + " reach customers" });
        T.set(pF, { d: C.path(function (x) { var q = parts(x, s.m); return q.internal + q.external; }, 0, MAXX, 60) });
        T.set(pT, { d: C.path(function (x) { return total(x, s.m); }, 0, MAXX, 60) });
        T.set(bestLine, { x1: C.px(bx), x2: C.px(bx) });
        T.set(mk, { cx: C.px(s.x), cy: C.py(Math.min(tot, YMAX)) });
        T.set(big, { text: "Total: " + pct(tot) + " of budget" });
        T.set(sub, { text: "lowest possible: " + pct(bt) + " at about " + pct(bx) + " on prevention" });
        var gap = tot - bt;
        T.set(verdict, { text: gap < 0.01 ? "Near the bottom of the curve" : s.x < bx ? "Too little prevention" : "More checking than it saves", fill: gap < 0.01 ? "var(--good)" : gap < 0.04 ? "var(--warn)" : "var(--bad)" });
      };
    }
  });
})(window.Tradeoff);
