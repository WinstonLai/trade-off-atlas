// A block is stored as r copies on different disks. Each disk fails with annual rate f, and a lost copy is rebuilt in h hours.
// Data is lost if, after one failure, every other copy also fails before the rebuild: P(loss per year) ≈ r·f·q^(r−1), where
// q = chance one copy fails during the rebuild window = f·h/8760. If copies share a fate (same rack, power or firmware), q gets
// an extra 1% floor. Durability is shown in "nines": −log10(P).
(function (T) {
  var CORR = 0.01, MAXR = 5, YMAX = 16;
  function loss(r, f, h, corr) {
    var q = f * h / 8760 + (corr ? CORR : 0);
    return Math.min(1, r * f * Math.pow(q, r - 1));
  }
  var nines = function (p) { return Math.min(YMAX, -Math.log10(p)); };
  function oneIn(p) {
    var x = 1 / p;
    if (x >= 1e12) return "1 in " + (x / 1e12).toFixed(0) + " trillion";
    if (x >= 1e9) return "1 in " + (x / 1e9).toFixed(0) + " billion";
    if (x >= 1e6) return "1 in " + (x / 1e6).toFixed(0) + " million";
    if (x >= 1e3) return "1 in " + (x / 1e3).toFixed(0) + " thousand";
    return "1 in " + Math.round(x);
  }

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "Disks holding copies of one block, the storage used, the chance of losing the block in a year, and a chart of durability in nines against the number of copies.",
    vars: [
      { key: "r", label: "Copies of each block", min: 1, max: MAXR, step: 1, value: 1, color: "var(--s1)", fmt: function (v) { return Math.round(v); } },
      { key: "f", label: "Disk failure rate per year", min: 0.01, max: 0.1, step: 0.005, value: 0.04, color: "var(--s2)", fmt: function (v) { return (v * 100).toFixed(1) + "%"; } },
      { key: "h", label: "Time to rebuild a lost copy (hours)", min: 1, max: 168, step: 1, value: 24, color: "var(--s3)", fmt: function (v) { return Math.round(v) + " h"; } },
      { key: "c", label: "Do copies share a fate?", type: "choice", value: "ind",
        options: [{ value: "ind", label: "Independent" }, { value: "corr", label: "Same rack or power" }] }
    ],
    scenario: [
      { caption: "One copy: a 4% chance each year that the disk dies and takes the data with it.", set: { r: 1, f: 0.04, h: 24, c: "ind" }, hold: 3800 },
      { caption: "A second copy: data is lost only if the other disk also fails during the day it takes to rebuild. Twice the storage, far safer.", set: { r: 2 }, hold: 4400 },
      { caption: "Three copies, the common default in distributed file systems and object stores: about nine nines, for three times the storage.", set: { r: 3 }, hold: 4400 },
      { caption: "But failures cluster: a rack loses power, a batch of disks shares a firmware bug. When copies share a fate, the third copy buys far less.", set: { c: "corr" }, hold: 4800 },
      { caption: "Spreading copies across racks and zones, and rebuilding fast, matter as much as how many copies you keep.", set: { c: "ind", h: 4 }, dur: 2400, hold: 4400 }
    ],
    setup: function (svg) {
      var el = T.el, x0 = 30, W = 330;
      el("text", { x: x0, y: 30, "class": "t-label", text: "Copies of one block" }, svg);
      var disks = [];
      for (var i = 0; i < MAXR; i++) {
        var g = el("g", { transform: "translate(" + (x0 + i * 62) + ",42)" }, svg);
        el("rect", { width: 48, height: 40, rx: 6, fill: "var(--s1)", "fill-opacity": 0.15, stroke: "var(--s1)", "stroke-width": 2 }, g);
        el("rect", { x: 12, y: 12, width: 24, height: 16, rx: 2, fill: "var(--s1)" }, g);
        disks.push(g);
      }
      var place = el("text", { x: x0, y: 104, "class": "t-small" }, svg);

      el("text", { x: x0, y: 134, "class": "t-small", text: "Storage used per TB of data" }, svg);
      el("rect", { x: x0, y: 140, width: W, height: 14, rx: 3, fill: "var(--line)", opacity: 0.5 }, svg);
      var stor = el("rect", { x: x0, y: 140, height: 14, rx: 3, fill: "var(--s2)" }, svg);
      var storT = el("text", { x: x0 + W, y: 134, "text-anchor": "end", "class": "t-small" }, svg);

      var big = el("text", { x: x0, y: 200, "class": "t-big" }, svg);
      var sub = el("text", { x: x0, y: 224, "class": "t-small" }, svg);
      var verdict = el("text", { x: x0, y: 262, "class": "t-mid" }, svg);

      var C = T.chart(svg, { x: 392, y: 48, w: 218, h: 190, xDomain: [1, MAXR], yDomain: [0, YMAX], yLabel: "durability (nines)" });
      for (var k = 1; k <= MAXR; k++) el("text", { x: C.px(k), y: C.h + 18, "text-anchor": "middle", "class": "t-small", text: k }, C.g);
      el("text", { x: C.w / 2, y: C.h + 36, "text-anchor": "middle", "class": "t-small", text: "copies of each block" }, C.g);
      var pO = el("path", { fill: "none", stroke: "var(--muted)", "stroke-width": 2, "stroke-dasharray": "5 4" }, C.g);
      var pC = el("path", { fill: "none", stroke: "var(--s1)", "stroke-width": 3 }, C.g);
      var mk = el("circle", { r: 6.5, fill: "var(--ink)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);
      el("path", { d: "M392 296h14", stroke: "var(--s1)", "stroke-width": 3 }, svg);
      var lgA = el("text", { x: 412, y: 300, "class": "t-small" }, svg);
      el("path", { d: "M516 296h14", stroke: "var(--muted)", "stroke-width": 2, "stroke-dasharray": "5 4" }, svg);
      var lgB = el("text", { x: 536, y: 300, "class": "t-small" }, svg);

      function line(f, h, corr) {
        var d = "";
        for (var k = 1; k <= MAXR; k++) d += (k > 1 ? "L" : "M") + C.px(k).toFixed(1) + " " + C.py(nines(loss(k, f, h, corr))).toFixed(1);
        return d;
      }
      return function (s) {
        var r = Math.round(s.r), corr = s.c === "corr", p = loss(r, s.f, s.h, corr), n = nines(p);
        disks.forEach(function (g, i) { T.set(g, { opacity: i < r ? 1 : 0.12 }); });
        T.set(place, { text: r === 1 ? "a single disk" : corr ? "copies in the same rack" : "copies in different racks" });
        T.set(stor, { width: r / MAXR * W }); T.set(storT, { text: r + " TB" });
        T.set(pC, { d: line(s.f, s.h, corr) });
        T.set(pO, { d: line(s.f, s.h, !corr) });
        T.set(lgA, { text: corr ? "shared fate" : "independent" });
        T.set(lgB, { text: corr ? "independent" : "shared fate" });
        T.set(mk, { cx: C.px(r), cy: C.py(n) });
        T.set(big, { text: "≈ " + (n >= YMAX ? YMAX + "+" : n.toFixed(1)) + " nines" });
        T.set(sub, { text: "chance of losing it this year: " + oneIn(p) });
        T.set(verdict, { text: n < 3 ? "Losing data is a matter of time" : n < 7 ? "Better, but not archival" : "Very durable, at " + r + "× the storage", fill: n < 3 ? "var(--bad)" : n < 7 ? "var(--warn)" : "var(--good)" });
      };
    }
  });
})(window.Tradeoff);
