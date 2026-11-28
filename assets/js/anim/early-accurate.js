// A risk appears at week 0 with a deadline at week 10. Your certainty grows as c(t) = 1 − 0.5·exp(−t/τ) while the room to
// react shrinks as o(t) = 1 − t/10. Usefulness of telling at week t = c·o − k·(1 − c): k is the trust lost if you are wrong,
// high when the warning is stated as fact and low when it carries an honest confidence level.
(function (T) {
  var K = { fact: 0.8, conf: 0.15 };
  var cert = function (t, tau) { return 1 - 0.5 * Math.exp(-t / tau); };
  var room = function (t) { return Math.max(0, 1 - t / 10); };
  var use = function (t, tau, f) { var c = cert(t, tau); return c * room(t) - K[f] * (1 - c); };
  function best(tau, f) { var bt = 0, bu = -Infinity; for (var t = 0; t <= 10.0001; t += 0.05) { var u = use(t, tau, f); if (u > bu) { bu = u; bt = t; } } return bt; }
  var pct = function (v) { return Math.round(v * 100) + "%"; };

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "A timeline from when a risk appears to the deadline with a marker for when you tell stakeholders, bars for how sure you are and how much room is left to react, and curves of both and of the update's usefulness over time.",
    vars: [
      { key: "t", label: "When you tell stakeholders (week)", min: 0, max: 10, step: 0.1, value: 0.5, color: "var(--s1)", fmt: function (v) { return "week " + v.toFixed(1); } },
      { key: "tau", label: "How long until you'd know for sure (weeks)", min: 1, max: 6, step: 0.1, value: 3, color: "var(--s2)", fmt: function (v) { return "~" + v.toFixed(1) + " wk"; } },
      { key: "f", label: "How you frame it", type: "choice", value: "fact",
        options: [{ value: "fact", label: "As a firm call" }, { value: "conf", label: "With a confidence level" }] }
    ],
    scenario: [
      { caption: "Sound the alarm in week one as a firm call: lots of time to react, but it's close to a coin flip, and a false alarm costs trust.", set: { t: 0.5, tau: 3, f: "fact" }, hold: 4400 },
      { caption: "Wait until you're sure: the warning is accurate, but there's little left anyone can do about it.", set: { t: 8 }, dur: 2400, hold: 4000 },
      { caption: "For a firm call, the best moment is in between: sure enough to be credible, early enough to act.", set: { t: 3.3 }, dur: 2000, hold: 3800 },
      { caption: "Say how sure you are (\"about 60%, I'll confirm by Friday\"). Being wrong costs far less, so the update is more useful and the best time moves earlier.", set: { f: "conf", t: 2 }, dur: 1800, hold: 5000 },
      { caption: "If the uncertainty won't clear for weeks, waiting buys little. Share what you know now and update as you learn.", set: { tau: 6, t: 1.7 }, dur: 2200, hold: 4400 }
    ],
    setup: function (svg) {
      var el = T.el, x0 = 30, W = 330, sx = W / 10;
      el("text", { x: x0, y: 30, "class": "t-label", text: "From risk spotted to deadline" }, svg);
      el("path", { d: "M" + x0 + " 56h" + W, stroke: "var(--line)", "stroke-width": 4, "stroke-linecap": "round" }, svg);
      var done = el("path", { stroke: "var(--s1)", "stroke-width": 4, "stroke-linecap": "round", opacity: 0.4 }, svg);
      el("circle", { cx: x0, cy: 56, r: 6, fill: "var(--warn)" }, svg);
      el("rect", { x: x0 + W - 5, y: 46, width: 10, height: 20, rx: 2, fill: "var(--ink)" }, svg);
      el("text", { x: x0, y: 82, "class": "t-small", text: "risk spotted" }, svg);
      el("text", { x: x0 + W, y: 82, "text-anchor": "end", "class": "t-small", text: "deadline" }, svg);
      var flag = el("path", { fill: "var(--s1)" }, svg);

      var rows = [["How sure you are", "var(--s2)"], ["Room left to react", "var(--s3)"]].map(function (r, i) {
        var y = 110 + i * 40;
        el("text", { x: x0, y: y, "class": "t-small", text: r[0] }, svg);
        el("rect", { x: x0, y: y + 6, width: W, height: 14, rx: 3, fill: "var(--line)", opacity: 0.5 }, svg);
        return { bar: el("rect", { x: x0, y: y + 6, height: 14, rx: 3, fill: r[1] }, svg), val: el("text", { x: x0 + W, y: y, "text-anchor": "end", "class": "t-small" }, svg) };
      });

      var big = el("text", { x: x0, y: 222, "class": "t-big" }, svg);
      var sub = el("text", { x: x0, y: 246, "class": "t-small" }, svg);
      var verdict = el("text", { x: x0, y: 284, "class": "t-mid" }, svg);

      var C = T.chart(svg, { x: 392, y: 48, w: 218, h: 190, xDomain: [0, 10], yDomain: [0, 1], xLabel: "week you tell them →", yLabel: "share / usefulness" });
      var pC = el("path", { fill: "none", stroke: "var(--s2)", "stroke-width": 2, "stroke-dasharray": "5 4" }, C.g);
      el("path", { d: C.path(room, 0, 10, 2), fill: "none", stroke: "var(--s3)", "stroke-width": 2, "stroke-dasharray": "5 4" }, C.g);
      var pU = el("path", { fill: "none", stroke: "var(--ink)", "stroke-width": 3 }, C.g);
      var bestLine = el("line", { y1: 0, y2: C.h, stroke: "var(--good)", "stroke-width": 2, "stroke-dasharray": "4 4" }, C.g);
      var mk = el("circle", { r: 6.5, fill: "var(--ink)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);
      [["var(--s2)", "how sure", 0], ["var(--s3)", "room to react", 1], ["var(--ink)", "usefulness", 2]].forEach(function (l) {
        var lx = 392 + (l[2] % 2) * 124, ly = 280 + Math.floor(l[2] / 2) * 20;
        el("path", { d: "M" + lx + " " + ly + "h14", stroke: l[0], "stroke-width": l[2] === 2 ? 3 : 2, "stroke-dasharray": l[2] === 2 ? null : "5 4" }, svg);
        el("text", { x: lx + 20, y: ly + 4, "class": "t-small", text: l[1] }, svg);
      });

      return function (s) {
        var c = cert(s.t, s.tau), o = room(s.t), u = use(s.t, s.tau, s.f), bt = best(s.tau, s.f), bu = use(bt, s.tau, s.f);
        var fx = x0 + s.t * sx;
        T.set(done, { d: "M" + x0 + " 56H" + fx });
        T.set(flag, { d: "M" + fx + " 58V34l16 6-16 6" });
        T.set(rows[0].bar, { width: c * W }); T.set(rows[0].val, { text: pct(c) });
        T.set(rows[1].bar, { width: o * W }); T.set(rows[1].val, { text: pct(o) });
        T.set(pC, { d: C.path(function (t) { return cert(t, s.tau); }, 0, 10, 50) });
        T.set(pU, { d: C.path(function (t) { return use(t, s.tau, s.f); }, 0, 10, 80) });
        T.set(bestLine, { x1: C.px(bt), x2: C.px(bt) });
        T.set(mk, { cx: C.px(s.t), cy: C.py(T.clamp(u, 0, 1)) });
        T.set(big, { text: "Usefulness: " + Math.max(0, Math.round(u * 100)) + " / 100" });
        T.set(sub, { text: "if wrong, trust lost: " + (s.f === "fact" ? "high" : "low") + " · best: week " + bt.toFixed(1) });
        var gap = bu - u;
        T.set(verdict, { text: gap < 0.02 ? "About the right time" : s.t < bt ? "Too early to be credible" : "Too late to act on", fill: gap < 0.02 ? "var(--good)" : gap < 0.1 ? "var(--warn)" : "var(--bad)" });
      };
    }
  });
})(window.Tradeoff);
