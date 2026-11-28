// A release contains 50 bugs. Tests covering share x of the code catch 1 − exp(−2.5x) of them (coverage is not proof: even
// 100% misses some). Writing and maintaining tests costs 30x + 60x⁴ (the last few percent are the hardest).
// Each escaped bug costs e. Total = test cost + 50·e·exp(−2.5x).
(function (T) {
  var BUGS = 50, YMAX = 320;
  var caught = function (x) { return 1 - Math.exp(-2.5 * x); };
  var testCost = function (x) { return 30 * x + 60 * Math.pow(x, 4); };
  var escCost = function (x, e) { return BUGS * e * (1 - caught(x)); };
  var total = function (x, e) { return testCost(x) + escCost(x, e); };
  function best(e) { var bx = 0, bt = Infinity; for (var x = 0; x <= 1.0001; x += 0.005) { var t = total(x, e); if (t < bt) { bt = t; bx = x; } } return bx; }
  var pct = function (v) { return Math.round(v * 100) + "%"; };

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "Fifty bugs marked caught or escaped, the effort spent on tests against the cost of escaped bugs, and a U-shaped curve of total cost against test coverage.",
    vars: [
      { key: "x", label: "Test coverage", min: 0, max: 1, step: 0.01, value: 0.1, color: "var(--s1)", fmt: pct },
      { key: "e", label: "Cost of a bug that reaches users", min: 0.5, max: 6, step: 0.1, value: 3, color: "var(--s2)", fmt: function (v) { return v.toFixed(1) + " units"; } }
    ],
    scenario: [
      { caption: "Almost no tests: quick to ship, and most bugs reach users.", set: { x: 0.1, e: 3 }, hold: 3600 },
      { caption: "The first tests, on the core paths, catch the most bugs per hour spent. Total cost drops fast.", set: { x: 0.6 }, dur: 2600, hold: 4000 },
      { caption: "Chasing 100%: the last tests are the hardest to write and catch little. And 100% coverage still lets bugs through.", set: { x: 1 }, dur: 2400, hold: 4400 },
      { caption: "A prototype or internal script, where a bug is cheap: the sweet spot is low.", set: { e: 0.5, x: 0.25 }, dur: 2400, hold: 4000 },
      { caption: "Payments or medical software, where a bug that escapes is expensive: the sweet spot moves well up.", set: { e: 6, x: 0.73 }, dur: 2400, hold: 4400 }
    ],
    setup: function (svg) {
      var el = T.el, x0 = 30, W = 330;
      el("text", { x: x0, y: 30, "class": "t-label", text: "50 bugs in this release" }, svg);
      var dots = [];
      for (var i = 0; i < BUGS; i++) dots.push(el("circle", { cx: x0 + 10 + (i % 17) * 19.4, cy: 50 + Math.floor(i / 17) * 20, r: 7 }, svg));
      var tC = el("text", { x: x0, y: 124, "class": "t-small" }, svg);

      var rows = [["Writing and maintaining tests", "var(--s1)"], ["Bugs that reach users", "var(--bad)"]].map(function (r, i) {
        var y = 150 + i * 36;
        el("text", { x: x0, y: y, "class": "t-small", text: r[0] }, svg);
        el("rect", { x: x0, y: y + 6, width: W, height: 12, rx: 3, fill: "var(--line)", opacity: 0.5 }, svg);
        return { bar: el("rect", { x: x0, y: y + 6, height: 12, rx: 3, fill: r[1] }, svg), val: el("text", { x: x0 + W, y: y, "text-anchor": "end", "class": "t-small" }, svg) };
      });
      var big = el("text", { x: x0, y: 252, "class": "t-big" }, svg);
      var verdict = el("text", { x: x0, y: 284, "class": "t-mid" }, svg);

      var C = T.chart(svg, { x: 392, y: 48, w: 218, h: 190, xDomain: [0, 1], yDomain: [0, YMAX], xLabel: "coverage →", yLabel: "total cost" });
      el("path", { d: C.path(testCost, 0, 1, 50), fill: "none", stroke: "var(--s1)", "stroke-width": 2, "stroke-dasharray": "5 4" }, C.g);
      var pE = el("path", { fill: "none", stroke: "var(--bad)", "stroke-width": 2, "stroke-dasharray": "5 4" }, C.g);
      var pT = el("path", { fill: "none", stroke: "var(--ink)", "stroke-width": 3 }, C.g);
      var bestLine = el("line", { y1: 0, y2: C.h, stroke: "var(--good)", "stroke-width": 2, "stroke-dasharray": "4 4" }, C.g);
      var mk = el("circle", { r: 6.5, fill: "var(--ink)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);
      [["var(--s1)", "tests", 0], ["var(--bad)", "escaped bugs", 1], ["var(--ink)", "total", 2]].forEach(function (l) {
        var lx = 392 + (l[2] % 2) * 124, ly = 280 + Math.floor(l[2] / 2) * 20;
        el("path", { d: "M" + lx + " " + ly + "h14", stroke: l[0], "stroke-width": l[2] === 2 ? 3 : 2, "stroke-dasharray": l[2] === 2 ? null : "5 4" }, svg);
        el("text", { x: lx + 20, y: ly + 4, "class": "t-small", text: l[1] }, svg);
      });

      return function (s) {
        var k = Math.round(caught(s.x) * BUGS), tc = testCost(s.x), ec = escCost(s.x, s.e), tot = tc + ec, bx = best(s.e), bt = total(bx, s.e);
        dots.forEach(function (d, i) { T.set(d, { fill: i < k ? "var(--good)" : "var(--bad)", opacity: i < k ? 0.45 : 1 }); });
        T.set(tC, { text: k + " caught by tests · " + (BUGS - k) + " reach users" });
        var sc = W / YMAX;
        T.set(rows[0].bar, { width: Math.min(W, tc * sc) }); T.set(rows[0].val, { text: Math.round(tc) });
        T.set(rows[1].bar, { width: Math.min(W, ec * sc) }); T.set(rows[1].val, { text: Math.round(ec) });
        T.set(pE, { d: C.path(function (x) { return escCost(x, s.e); }, 0, 1, 50) });
        T.set(pT, { d: C.path(function (x) { return total(x, s.e); }, 0, 1, 60) });
        T.set(bestLine, { x1: C.px(bx), x2: C.px(bx) });
        T.set(mk, { cx: C.px(s.x), cy: C.py(Math.min(YMAX, tot)) });
        T.set(big, { text: "Total cost: " + Math.round(tot) + " (best ≈ " + Math.round(bt) + ")" });
        var gap = (tot - bt) / bt;
        T.set(verdict, { text: gap < 0.04 ? "Near the sweet spot (≈" + pct(bx) + ")" : s.x < bx ? "Too few tests for the risk" : "Past the point of payoff", fill: gap < 0.04 ? "var(--good)" : gap < 0.2 ? "var(--warn)" : "var(--bad)" });
      };
    }
  });
})(window.Tradeoff);
