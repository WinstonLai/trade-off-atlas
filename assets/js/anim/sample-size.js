// A survey estimates a share near 50%. The 95% margin of error is 1.96·√(0.25 / n) ≈ 0.98 / √n, so quartering the margin
// takes 16 times the sample. Each response costs $5. To tell apart two options that differ by D points, the margin should be
// at most D / 2.
(function (T) {
  var COST = 5, LO = Math.log10(25), HI = 4;
  var nOf = function (v) { return Math.round(Math.pow(10, LO + (HI - LO) * v)); };
  var moe = function (n) { return 0.98 / Math.sqrt(n); };
  var need = function (d) { return Math.ceil(Math.pow(0.98 / (d / 200), 2)); };
  var commas = function (n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); };

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "An estimate of 50% with its margin of error on a scale from 0 to 100, the cost of the survey, and a curve of margin of error falling with sample size on a log scale.",
    vars: [
      { key: "v", label: "Responses collected", min: 0, max: 1, step: 0.002, value: 0.1157, color: "var(--s1)", fmt: function (v) { return commas(nOf(v)); } },
      { key: "d", label: "Smallest difference that would change the decision", type: "choice", value: "10",
        options: [{ value: "10", label: "10 points" }, { value: "5", label: "5 points" }, { value: "2", label: "2 points" }] }
    ],
    scenario: [
      { caption: "50 responses: the answer is 50% give or take 14 points, too vague to tell apart options 10 points apart.", set: { v: 0.1157, d: "10" }, hold: 4000 },
      { caption: "About 400 responses brings the margin under 5 points, enough for a 10-point question, for $2,000.", set: { v: 0.4626 }, dur: 2400, hold: 4000 },
      { caption: "Four times the sample, four times the cost, only halves the margin.", set: { v: 0.6941 }, dur: 2400, hold: 3800 },
      { caption: "To separate options 2 points apart you need nearly 10,000 responses. Worth it only if a difference that small changes what you do.", set: { d: "2", v: 1 }, dur: 2400, hold: 4800 },
      { caption: "Asking for 10,000 when 10 points is all that matters spends $50,000 to measure differences nobody will act on.", set: { d: "10" }, hold: 4400 }
    ],
    setup: function (svg) {
      var el = T.el, x0 = 30, W = 330;
      el("text", { x: x0, y: 30, "class": "t-label", text: "Survey result with its 95% margin" }, svg);
      el("path", { d: "M" + x0 + " 70h" + W, stroke: "var(--line)", "stroke-width": 2 }, svg);
      [0, 25, 50, 75, 100].forEach(function (p) { el("text", { x: x0 + p / 100 * W, y: 96, "text-anchor": p === 0 ? "start" : p === 100 ? "end" : "middle", "class": "t-small", text: p + "%" }, svg); });
      var band = el("rect", { y: 56, height: 28, rx: 4, fill: "var(--s1)", opacity: 0.25 }, svg);
      el("path", { d: "M" + (x0 + W / 2) + " 50v40", stroke: "var(--s1)", "stroke-width": 3 }, svg);
      var dZone = el("rect", { y: 104, height: 8, rx: 2, fill: "var(--s2)" }, svg);
      var dT = el("text", { x: x0, y: 130, "class": "t-small" }, svg);

      var big = el("text", { x: x0, y: 176, "class": "t-big" }, svg);
      var sub = el("text", { x: x0, y: 200, "class": "t-small" }, svg);
      var sub2 = el("text", { x: x0, y: 220, "class": "t-small" }, svg);
      var verdict = el("text", { x: x0, y: 258, "class": "t-mid" }, svg);

      var C = T.chart(svg, { x: 392, y: 48, w: 218, h: 190, xDomain: [LO, HI], yDomain: [0, 0.2], yLabel: "margin of error (±)" });
      [[100, "100"], [1000, "1,000"], [10000, "10,000"]].forEach(function (t) {
        var x = C.px(Math.log10(t[0]));
        el("path", { d: "M" + x + " " + C.h + "v5", stroke: "var(--line)", "stroke-width": 1.5 }, C.g);
        el("text", { x: x, y: C.h + 18, "text-anchor": t[0] === 10000 ? "end" : "middle", "class": "t-small", text: t[1] }, C.g);
      });
      el("text", { x: 0, y: C.h + 36, "class": "t-small", text: "responses (log scale) →" }, C.g);
      el("path", { d: C.path(function (lx) { return moe(Math.pow(10, lx)); }, LO, HI, 60), fill: "none", stroke: "var(--s1)", "stroke-width": 3 }, C.g);
      var target = el("line", { x1: 0, x2: C.w, stroke: "var(--s2)", "stroke-width": 2, "stroke-dasharray": "4 4" }, C.g);
      var targetT = el("text", { x: C.w, "text-anchor": "end", "class": "t-small", fill: "var(--s2)" }, C.g);
      var mk = el("circle", { r: 6.5, fill: "var(--ink)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);

      return function (s) {
        var n = nOf(s.v), m = moe(n), D = +s.d, req = need(D), half = D / 200;
        T.set(band, { x: x0 + (0.5 - m) * W, width: 2 * m * W });
        T.set(dZone, { x: x0 + 0.5 * W, width: D / 100 * W });
        T.set(dT, { text: "orange = a " + D + "-point difference" });
        T.set(big, { text: "50% ± " + (m * 100).toFixed(1) + " points" });
        T.set(sub, { text: commas(n) + " responses · cost $" + commas(n * COST) });
        T.set(sub2, { text: "needed for a " + D + "-point call: about " + commas(req) + " ($" + commas(req * COST) + ")" });
        T.set(target, { y1: C.py(half), y2: C.py(half) });
        T.set(targetT, { y: C.py(half) - 6, text: "±" + (half * 100) + " pts" });
        T.set(mk, { cx: C.px(Math.log10(n)), cy: C.py(Math.min(0.2, m)) });
        var r = n / req;
        T.set(verdict, { text: r < 0.95 ? "Too few to tell the options apart" : r < 3 ? "Enough for this decision" : "More precision than the decision needs", fill: r < 0.95 ? "var(--bad)" : r < 3 ? "var(--good)" : "var(--warn)" });
      };
    }
  });
})(window.Tradeoff);
