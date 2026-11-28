// Friction x (0–10): password rules, extra prompts, short sessions. Protection on paper = 1 − exp(−k·x).
// Share of users who comply rather than work around it = 1 / (1 + exp(x − θ)). A workaround keeps only 30% of the protection.
// Real protection = paper × (comply + 0.3·(1 − comply)). Better design (passkeys, single sign-on, risk-based prompts) has
// a higher k (more protection per unit of friction) and a higher θ (people tolerate it longer).
(function (T) {
  var D = { blunt: { k: 0.35, th: 5 }, smart: { k: 0.6, th: 6 } };
  var paper = function (x, g) { return 1 - Math.exp(-D[g].k * x); };
  var comply = function (x, g) { return 1 / (1 + Math.exp(x - D[g].th)); };
  var real = function (x, g) { var c = comply(x, g); return paper(x, g) * (c + 0.3 * (1 - c)); };
  function best(g) { var bx = 0, br = 0; for (var x = 0; x <= 10.0001; x += 0.05) { var r = real(x, g); if (r > br) { br = r; bx = x; } } return bx; }
  var pct = function (v) { return Math.round(v * 100) + "%"; };

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "Bars for protection on paper, the share of users who comply, real protection and minutes lost per day, and curves of paper and real protection against the amount of security friction.",
    vars: [
      { key: "x", label: "Security friction (rules, prompts, timeouts)", min: 0, max: 10, step: 0.1, value: 1, color: "var(--s1)", fmt: function (v) { return v.toFixed(1) + " / 10"; } },
      { key: "g", label: "How the controls are designed", type: "choice", value: "blunt",
        options: [{ value: "blunt", label: "Blunt rules" }, { value: "smart", label: "Low-friction design" }] }
    ],
    scenario: [
      { caption: "Hardly any friction: easy to use, and easy to break into.", set: { x: 1, g: "blunt" }, hold: 3600 },
      { caption: "Add a few sensible controls and protection rises quickly while people still go along with them.", set: { x: 3.8 }, dur: 2400, hold: 4000 },
      { caption: "Pile on rules and people route around them: passwords on sticky notes, shared logins, files sent to personal email. Real protection falls.", set: { x: 9 }, dur: 2600, hold: 4800 },
      { caption: "Better design gets more protection per unit of friction: passkeys, single sign-on, prompts only when something looks risky.", set: { g: "smart", x: 4 }, dur: 2400, hold: 4600 },
      { caption: "Even well-designed controls have a limit. Past it, more friction buys less real security.", set: { x: 8.5 }, dur: 2400, hold: 4000 }
    ],
    setup: function (svg) {
      var el = T.el, x0 = 30, W = 330;
      el("text", { x: x0, y: 30, "class": "t-label", text: "Security as designed vs. as used" }, svg);
      var rows = [["Protection on paper", "var(--muted)"], ["Users who comply", "var(--s2)"], ["Real protection", "var(--s1)"], ["Time lost per person per day", "var(--bad)"]].map(function (r, i) {
        var y = 56 + i * 40;
        el("text", { x: x0, y: y, "class": "t-small", text: r[0] }, svg);
        el("rect", { x: x0, y: y + 6, width: W, height: 14, rx: 3, fill: "var(--line)", opacity: 0.5 }, svg);
        return { bar: el("rect", { x: x0, y: y + 6, height: 14, rx: 3, fill: r[1] }, svg), val: el("text", { x: x0 + W, y: y, "text-anchor": "end", "class": "t-small" }, svg) };
      });
      var big = el("text", { x: x0, y: 240, "class": "t-big" }, svg);
      var verdict = el("text", { x: x0, y: 276, "class": "t-mid" }, svg);

      var C = T.chart(svg, { x: 392, y: 48, w: 218, h: 190, xDomain: [0, 10], yDomain: [0, 1], xLabel: "friction →", yLabel: "protection" });
      var pP = el("path", { fill: "none", stroke: "var(--muted)", "stroke-width": 2, "stroke-dasharray": "5 4" }, C.g);
      var pR = el("path", { fill: "none", stroke: "var(--s1)", "stroke-width": 3 }, C.g);
      var bestLine = el("line", { y1: 0, y2: C.h, stroke: "var(--good)", "stroke-width": 2, "stroke-dasharray": "4 4" }, C.g);
      var mk = el("circle", { r: 6.5, fill: "var(--ink)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);
      [["var(--muted)", "on paper", 0], ["var(--s1)", "real", 1]].forEach(function (l) {
        var lx = 392 + l[2] * 124;
        el("path", { d: "M" + lx + " 268h14", stroke: l[0], "stroke-width": l[2] ? 3 : 2, "stroke-dasharray": l[2] ? null : "5 4" }, svg);
        el("text", { x: lx + 20, y: 272, "class": "t-small", text: l[1] }, svg);
      });

      return function (s) {
        var p = paper(s.x, s.g), c = comply(s.x, s.g), r = real(s.x, s.g), bx = best(s.g), br = real(bx, s.g), mins = 2 * s.x;
        T.set(rows[0].bar, { width: p * W }); T.set(rows[0].val, { text: pct(p) });
        T.set(rows[1].bar, { width: c * W }); T.set(rows[1].val, { text: pct(c) });
        T.set(rows[2].bar, { width: r * W }); T.set(rows[2].val, { text: pct(r) });
        T.set(rows[3].bar, { width: mins / 20 * W }); T.set(rows[3].val, { text: Math.round(mins) + " min" });
        T.set(pP, { d: C.path(function (x) { return paper(x, s.g); }, 0, 10, 50) });
        T.set(pR, { d: C.path(function (x) { return real(x, s.g); }, 0, 10, 80) });
        T.set(bestLine, { x1: C.px(bx), x2: C.px(bx) });
        T.set(mk, { cx: C.px(s.x), cy: C.py(r) });
        T.set(big, { text: "Real protection: " + pct(r) });
        var gap = br - r;
        T.set(verdict, { text: gap < 0.03 ? "Close to the most real protection" : s.x < bx ? "Too easy to break in" : "Friction is backfiring", fill: gap < 0.03 ? "var(--good)" : gap < 0.12 ? "var(--warn)" : "var(--bad)" });
      };
    }
  });
})(window.Tradeoff);
