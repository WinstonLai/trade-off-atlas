// An experiment checks m metrics; one in four truly moved (sized so a single test at α = 5% finds it 80% of the time).
// Each metric is tested at threshold t. No correction: t = 5%. Bonferroni: t = 5% / m. Benjamini–Hochberg: the largest t with
// t = 5% × (expected discoveries / m), found by fixed-point iteration. Chance of ≥1 false alarm = 1 − (1 − t)^(nulls).
(function (T) {
  var A = 0.05, DELTA = 1.96 + 0.8416, MAXM = 50;
  function Phi(z) {
    var s = z < 0 ? -1 : 1, x = Math.abs(z) / Math.SQRT2, t = 1 / (1 + 0.3275911 * x);
    var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return 0.5 * (1 + s * y);
  }
  function zq(p) { var lo = -10, hi = 10; for (var i = 0; i < 60; i++) { var mid = (lo + hi) / 2; if (Phi(mid) < p) lo = mid; else hi = mid; } return (lo + hi) / 2; }
  var power = function (t) { return Phi(DELTA - zq(1 - t / 2)); };
  var real = function (m) { return Math.floor(m / 4); };
  function thresh(m, how) {
    if (how === "none") return A;
    if (how === "bonf") return A / m;
    var m1 = real(m), m0 = m - m1, t = A;
    for (var i = 0; i < 100; i++) t = A * (m0 * t + m1 * power(t)) / m;
    return Math.max(t, A / m);
  }
  var cache = {};
  function stats(m, how) {
    var key = how + m;
    if (cache[key]) return cache[key];
    var t = thresh(m, how), m1 = real(m), m0 = m - m1;
    return (cache[key] = { t: t, m1: m1, m0: m0, fwer: 1 - Math.pow(1 - t, m0), pow: power(t), fa: m0 * t });
  }
  var pct = function (v) { return Math.round(v * 100) + "%"; };

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "A grid of metrics marked as real effects found or missed and false alarms, and curves of the chance of at least one false alarm and of the share of real effects found against the number of metrics tested.",
    vars: [
      { key: "m", label: "Metrics tested", min: 1, max: MAXM, step: 1, value: 1, color: "var(--s1)", fmt: function (v) { return Math.round(v); } },
      { key: "how", label: "Correction", type: "choice", value: "none",
        options: [{ value: "none", label: "None" }, { value: "bonf", label: "Bonferroni" }, { value: "bh", label: "Benjamini–Hochberg" }] }
    ],
    scenario: [
      { caption: "One metric chosen in advance: a 5% chance of a false win, as designed.", set: { m: 1, how: "none" }, hold: 3600 },
      { caption: "Check 20 metrics at 5% each and there's a better than even chance that at least one \"wins\" by luck alone.", set: { m: 20 }, dur: 2600, hold: 4400 },
      { caption: "Bonferroni tests each at 5% ÷ 20. False wins drop back to about 5%, but real effects are now found well under half the time.", set: { how: "bonf" }, hold: 4600 },
      { caption: "Benjamini–Hochberg limits the share of discoveries that are false instead. More real effects found, for a few more false alarms.", set: { how: "bh" }, hold: 4600 },
      { caption: "With 50 metrics and no correction, a false win is very likely. Decide the primary metric before you look.", set: { m: 50, how: "none" }, dur: 2400, hold: 4400 }
    ],
    setup: function (svg) {
      var el = T.el, x0 = 30;
      el("text", { x: x0, y: 30, "class": "t-label", text: "Metrics in the experiment" }, svg);
      var cells = [];
      for (var i = 0; i < MAXM; i++) cells.push(el("rect", { x: x0 + (i % 17) * 19.4, y: 42 + Math.floor(i / 17) * 20, width: 15, height: 15, rx: 3, "stroke-width": 2 }, svg));
      el("text", { x: x0, y: 122, "class": "t-small", text: "green = real effect (hollow if missed)" }, svg);
      el("text", { x: x0, y: 140, "class": "t-small", text: "red = expected false alarms" }, svg);

      var big = el("text", { x: x0, y: 184, "class": "t-big" }, svg);
      var sub = el("text", { x: x0, y: 208, "class": "t-small" }, svg);
      var sub2 = el("text", { x: x0, y: 228, "class": "t-small" }, svg);
      var verdict = el("text", { x: x0, y: 266, "class": "t-mid" }, svg);

      var C = T.chart(svg, { x: 392, y: 48, w: 218, h: 190, xDomain: [1, MAXM], yDomain: [0, 1], xLabel: "metrics tested →", yLabel: "probability" });
      el("line", { x1: 0, x2: C.w, y1: C.py(A), y2: C.py(A), stroke: "var(--muted)", "stroke-width": 1, "stroke-dasharray": "3 3" }, C.g);
      var pF = el("path", { fill: "none", stroke: "var(--bad)", "stroke-width": 3 }, C.g);
      var pP = el("path", { fill: "none", stroke: "var(--good)", "stroke-width": 2.5, "stroke-dasharray": "6 4" }, C.g);
      var mk = el("circle", { r: 6.5, fill: "var(--ink)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);
      el("path", { d: "M392 268h14", stroke: "var(--bad)", "stroke-width": 3 }, svg);
      el("text", { x: 412, y: 272, "class": "t-small", text: "any false win" }, svg);
      el("path", { d: "M516 268h14", stroke: "var(--good)", "stroke-width": 2.5, "stroke-dasharray": "6 4" }, svg);
      el("text", { x: 536, y: 272, "class": "t-small", text: "real found" }, svg);

      return function (s) {
        var m = Math.round(s.m), st = stats(m, s.how), found = Math.round(st.m1 * st.pow), fa = Math.round(st.fa);
        cells.forEach(function (c, i) {
          var on = i < m, isReal = i < st.m1, isFa = !isReal && i - st.m1 < fa;
          T.set(c, { opacity: on ? 1 : 0,
            fill: isReal ? (i < found ? "var(--good)" : "transparent") : isFa ? "var(--bad)" : "var(--line)",
            stroke: isReal ? "var(--good)" : "transparent" });
        });
        T.set(pF, { d: C.path(function (x) { return stats(Math.round(x), s.how).fwer; }, 1, MAXM, 49) });
        T.set(pP, { d: C.path(function (x) { return stats(Math.round(x), s.how).pow; }, 1, MAXM, 49) });
        T.set(mk, { cx: C.px(m), cy: C.py(st.fwer) });
        T.set(big, { text: pct(st.fwer) + " chance of a false win" });
        T.set(sub, { text: "each metric tested at " + (st.t * 100).toFixed(st.t < 0.01 ? 2 : 1) + "% · " + st.m1 + " real effect" + (st.m1 === 1 ? "" : "s") });
        T.set(sub2, { text: "a real effect is found " + pct(st.pow) + " of the time" });
        T.set(verdict, { text: st.fwer > 0.2 ? "Something will \"win\" by chance" : st.pow < 0.5 && st.m1 ? "Safe, but real effects get missed" : "False wins kept in check", fill: st.fwer > 0.2 ? "var(--bad)" : st.pow < 0.5 && st.m1 ? "var(--warn)" : "var(--good)" });
      };
    }
  });
})(window.Tradeoff);
