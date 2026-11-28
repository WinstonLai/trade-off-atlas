// A four-week A/B test, simulated (seeded, so every run is identical): 2,000 tests with no real difference and 2,000 with an
// effect sized for 80% power at the planned end. The z-score is checked at k equally spaced looks and the test stops at the
// first look where |z| crosses the boundary. Same threshold: 1.96 at every look. Pocock: one stricter constant. O'Brien–Fleming:
// c·√(k / i), very strict early and near 1.96 at the end. Pocock and O'Brien–Fleming constants are calibrated on the
// no-difference runs to keep the overall false-positive rate at 5%.
(function (T) {
  var G = 120, NP = 2000, MAXK = 20, DELTA = 1.96 + 0.8416, WEEKS = 4;
  var seed = 20261128;
  function rnd() { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
  function gauss() { return Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd()); }
  var B = new Float32Array(NP * G), sd = Math.sqrt(1 / G);
  for (var p = 0; p < NP; p++) { var acc = 0; for (var j = 0; j < G; j++) { acc += gauss() * sd; B[p * G + j] = acc; } }
  var zAt = function (p, j, drift) { var t = (j + 1) / G; return (B[p * G + j] + drift * t) / Math.sqrt(t); };
  function looks(k) { var a = []; for (var i = 1; i <= k; i++) a.push(Math.round(i * G / k) - 1); return a; }
  function bound(how, c, k, i) { return how === "naive" ? 1.96 : how === "pocock" ? c : c * Math.sqrt(k / i); }
  function run(how, c, k, drift) {
    var L = looks(k), hits = 0, stop = 0;
    for (var p = 0; p < NP; p++) {
      var at = 1;
      for (var i = 0; i < k; i++) if (Math.abs(zAt(p, L[i], drift)) >= bound(how, c, k, i + 1)) { hits++; at = (L[i] + 1) / G; break; }
      stop += at;
    }
    return { rate: hits / NP, stop: stop / NP };
  }
  function calibrate(how, k) {
    var lo = 1.5, hi = 5;
    for (var it = 0; it < 18; it++) { var mid = (lo + hi) / 2; if (run(how, mid, k, 0).rate > 0.05) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }
  var TABLE = {};
  ["naive", "pocock", "obf"].forEach(function (how) {
    TABLE[how] = [null];
    for (var k = 1; k <= MAXK; k++) {
      var c = how === "naive" ? 1.96 : calibrate(how, k), n = run(how, c, k, 0), a = run(how, c, k, DELTA);
      TABLE[how].push({ c: c, fpr: n.rate, pow: a.rate, stop: a.stop });
    }
  });
  // Example run for the left panel: crosses 1.96 at look 2 or 3 of 5 (not look 1), never crosses the 20-look Pocock or
  // O'Brien–Fleming boundaries, and ends near zero.
  var EX = 0, L5 = looks(5), L20 = looks(MAXK);
  for (var q = 0; q < NP; q++) {
    var z5 = L5.map(function (j) { return Math.abs(zAt(q, j, 0)); });
    var safe = L20.every(function (j, i) { var z = Math.abs(zAt(q, j, 0)); return z < TABLE.pocock[MAXK].c && z < bound("obf", TABLE.obf[MAXK].c, MAXK, i + 1); });
    if (z5[0] < 1.96 && (z5[1] >= 1.96 || z5[2] >= 1.96) && safe && z5[4] < 0.8) { EX = q; break; }
  }
  var pct = function (v) { return Math.round(v * 100) + "%"; };

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "The z-score of one test with no real difference drawn over four weeks with the stopping boundary and the looks marked, and curves of the false-positive rate against the number of looks.",
    vars: [
      { key: "k", label: "How many times you check the results", min: 1, max: MAXK, step: 1, value: 1, color: "var(--s1)", fmt: function (v) { return Math.round(v) + "×"; } },
      { key: "how", label: "Stopping rule", type: "choice", value: "naive",
        options: [{ value: "naive", label: "p < 0.05 each look" }, { value: "pocock", label: "Pocock" }, { value: "obf", label: "O'Brien–Fleming" }] }
    ],
    scenario: [
      { caption: "Look once, at the planned end: a 5% false-positive rate, as designed.", set: { k: 1, how: "naive" }, hold: 3600 },
      { caption: "Check five times and stop the moment p < 0.05. This test has no real difference, but it crossed the line mid-way. False positives are now about 14%.", set: { k: 5 }, hold: 5000 },
      { caption: "Check every working day and about one test in four \"wins\" with no real difference.", set: { k: 20 }, dur: 2400, hold: 4200 },
      { caption: "Pocock: a stricter bar at every look keeps the overall rate at 5%. Real effects often stop early, but the strict final bar misses more of them.", set: { how: "pocock" }, hold: 4800 },
      { caption: "O'Brien–Fleming: very strict early, close to the usual bar at the end. You can peek safely, and the final analysis loses almost nothing.", set: { how: "obf" }, hold: 4800 }
    ],
    setup: function (svg) {
      var el = T.el, x0 = 30, W = 330, top = 44, H = 100, ZM = 3.5;
      var sy = function (z) { return top + H / 2 - T.clamp(z, -ZM, ZM) / ZM * H / 2; };
      el("text", { x: x0, y: 30, "class": "t-label", text: "One test with no real difference" }, svg);
      el("path", { d: "M" + x0 + " " + sy(0) + "h" + W, stroke: "var(--line)", "stroke-width": 1.5 }, svg);
      var d = "";
      for (var j = 0; j < G; j++) d += (j ? "L" : "M") + (x0 + (j + 1) / G * W).toFixed(1) + " " + sy(zAt(EX, j, 0)).toFixed(1);
      el("path", { d: d, fill: "none", stroke: "var(--muted)", "stroke-width": 1.8 }, svg);
      var bUp = el("path", { fill: "none", stroke: "var(--bad)", "stroke-width": 2, "stroke-dasharray": "4 3" }, svg);
      var bDn = el("path", { fill: "none", stroke: "var(--bad)", "stroke-width": 2, "stroke-dasharray": "4 3" }, svg);
      var dots = [];
      for (var i = 0; i < MAXK; i++) dots.push(el("circle", { r: 5, stroke: "var(--surface)", "stroke-width": 1.5 }, svg));
      el("text", { x: x0, y: top + H + 16, "class": "t-small", text: "week 0" }, svg);
      el("text", { x: x0 + W, y: top + H + 16, "text-anchor": "end", "class": "t-small", text: "week 4" }, svg);
      var stopT = el("text", { x: x0 + W / 2, y: top + H + 16, "text-anchor": "middle", "class": "t-small" }, svg);

      var big = el("text", { x: x0, y: 200, "class": "t-big" }, svg);
      var sub = el("text", { x: x0, y: 224, "class": "t-small" }, svg);
      var sub2 = el("text", { x: x0, y: 244, "class": "t-small" }, svg);
      var verdict = el("text", { x: x0, y: 280, "class": "t-mid" }, svg);

      var C = T.chart(svg, { x: 392, y: 48, w: 218, h: 190, xDomain: [1, MAXK], yDomain: [0, 0.3], xLabel: "looks →", yLabel: "false-positive rate" });
      el("line", { x1: 0, x2: C.w, y1: C.py(0.05), y2: C.py(0.05), stroke: "var(--good)", "stroke-width": 1.5, "stroke-dasharray": "3 3" }, C.g);
      var tab = function (how) { return function (x) { return TABLE[how][Math.round(x)].fpr; }; };
      el("path", { d: C.path(tab("naive"), 1, MAXK, 19), fill: "none", stroke: "var(--bad)", "stroke-width": 2, "stroke-dasharray": "5 4" }, C.g);
      var pCur = el("path", { fill: "none", stroke: "var(--ink)", "stroke-width": 3 }, C.g);
      var mk = el("circle", { r: 6.5, fill: "var(--ink)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);
      el("path", { d: "M392 268h14", stroke: "var(--bad)", "stroke-width": 2, "stroke-dasharray": "5 4" }, svg);
      el("text", { x: 412, y: 272, "class": "t-small", text: "p < 0.05" }, svg);
      el("path", { d: "M516 268h14", stroke: "var(--ink)", "stroke-width": 3 }, svg);
      el("text", { x: 536, y: 272, "class": "t-small", text: "this rule" }, svg);

      return function (s) {
        var k = Math.round(s.k), row = TABLE[s.how][k], L = looks(k), up = "", dn = "", stopped = -1;
        L.forEach(function (j, i) {
          var x = x0 + (j + 1) / G * W, b = bound(s.how, row.c, k, i + 1);
          up += (i ? "V" : "M" + x0 + " ") + sy(b) + "H" + x; dn += (i ? "V" : "M" + x0 + " ") + sy(-b) + "H" + x;
          if (stopped < 0 && Math.abs(zAt(EX, j, 0)) >= b) stopped = i;
        });
        T.set(bUp, { d: up }); T.set(bDn, { d: dn });
        dots.forEach(function (c, i) {
          if (i >= k) { T.set(c, { opacity: 0 }); return; }
          var j = L[i];
          T.set(c, { opacity: stopped >= 0 && i > stopped ? 0.25 : 1, cx: x0 + (j + 1) / G * W, cy: sy(zAt(EX, j, 0)), fill: i === stopped ? "var(--bad)" : "var(--s1)" });
        });
        T.set(stopT, { text: stopped >= 0 ? "stopped at look " + (stopped + 1) + ": false \"win\"" : "no false alarm", fill: stopped >= 0 ? "var(--bad)" : "var(--good)" });
        T.set(pCur, { d: C.path(tab(s.how), 1, MAXK, 19) });
        T.set(mk, { cx: C.px(k), cy: C.py(Math.min(0.3, row.fpr)) });
        T.set(big, { text: pct(row.fpr) + " false positives" });
        T.set(sub, { text: "with a real effect: found " + pct(row.pow) + " of the time" });
        T.set(sub2, { text: "average stop: week " + (row.stop * WEEKS).toFixed(1) + " of " + WEEKS });
        T.set(verdict, { text: row.fpr > 0.07 ? "Peeking inflates false wins" : k === 1 ? "No peeking, no early stop" : "Safe to peek", fill: row.fpr > 0.07 ? "var(--bad)" : k === 1 ? "var(--warn)" : "var(--good)" });
      };
    }
  });
})(window.Tradeoff);
