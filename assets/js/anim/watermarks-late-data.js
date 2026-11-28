// Events for a one-minute window arrive late by L seconds. Steady network: L ~ exponential(mean 5 s).
// Mobile clients: 80% exponential(5 s), 20% exponential(60 s) (phones that were offline). The window's result is published
// w seconds after it ends (the watermark). Completeness = P(L ≤ w). Later events are dropped, or sent as corrections.
(function (T) {
  var N = 40, MAXL = 180;
  var cdf = function (w, p) { var a = 1 - Math.exp(-w / 5); return p === "steady" ? a : 0.8 * a + 0.2 * (1 - Math.exp(-w / 60)); };
  function lateness(p) {
    var out = [], fast = [], slow = [];
    for (var i = 0; i < N; i++) (p === "mobile" && i % 5 === 0 ? slow : fast).push(i);
    fast.forEach(function (i, j) { out[i] = -5 * Math.log(1 - (j + 0.5) / fast.length); });
    slow.forEach(function (i, j) { out[i] = -60 * Math.log(1 - (j + 0.5) / slow.length); });
    return out;
  }
  var L = { steady: lateness("steady"), mobile: lateness("mobile") };
  var pct = function (v) { return (v > 0.995 && v < 1 ? (v * 100).toFixed(1) : Math.round(v * 100)) + "%"; };

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "Dots for events arriving after a window closes, a watermark line marking when the result is published, and a curve of the share of events included against how long the watermark waits.",
    vars: [
      { key: "w", label: "Watermark: wait after the window closes", min: 0, max: 120, step: 1, value: 3, color: "var(--s1)", fmt: function (v) { return Math.round(v) + " s"; } },
      { key: "p", label: "Where the events come from", type: "choice", value: "steady",
        options: [{ value: "steady", label: "Servers (steady)" }, { value: "mobile", label: "Phones (go offline)" }] },
      { key: "late", label: "Events after the watermark", type: "choice", value: "drop",
        options: [{ value: "drop", label: "Dropped" }, { value: "fix", label: "Sent as corrections" }] }
    ],
    scenario: [
      { caption: "Publish each minute's result 3 seconds after the minute ends: fast, but more than half the events haven't arrived yet.", set: { w: 3, p: "steady", late: "drop" }, hold: 4200 },
      { caption: "Wait 20 seconds and 98% are in. Results are 20 seconds staler, and nearly complete.", set: { w: 20 }, dur: 2400, hold: 4000 },
      { caption: "Phones that lose signal send data minutes late. The same 20 second wait now misses about one event in six.", set: { p: "mobile" }, hold: 4400 },
      { caption: "Waiting two minutes still misses some, and now every result is two minutes old.", set: { w: 120 }, dur: 2600, hold: 4000 },
      { caption: "The usual answer: publish early, then send corrections as late events arrive (allowed lateness), if downstream can handle updates.", set: { w: 20, late: "fix" }, dur: 2400, hold: 4800 }
    ],
    setup: function (svg) {
      var el = T.el, x0 = 30, W = 330, X = function (l) { return x0 + Math.sqrt(Math.min(l, MAXL) / MAXL) * W; };
      el("text", { x: x0, y: 30, "class": "t-label", text: "Late events (time after the minute ends)" }, svg);
      el("path", { d: "M" + x0 + " 126h" + W, stroke: "var(--line)", "stroke-width": 1.5 }, svg);
      [0, 10, 60, 180].forEach(function (t) { el("text", { x: X(t), y: 142, "text-anchor": t ? (t === 180 ? "end" : "middle") : "start", "class": "t-small", text: t + " s" }, svg); });
      var dots = [];
      for (var i = 0; i < N; i++) dots.push(el("circle", { cy: 60 + (i % 6) * 11, r: 5 }, svg));
      var more = el("text", { x: x0 + W, y: 160, "text-anchor": "end", "class": "t-small" }, svg);
      var wm = el("path", { stroke: "var(--ink)", "stroke-width": 2, "stroke-dasharray": "4 3" }, svg);
      var wmT = el("text", { y: 44, "class": "t-small", fill: "var(--ink)", text: "result out" }, svg);

      var big = el("text", { x: x0, y: 188, "class": "t-big" }, svg);
      var sub = el("text", { x: x0, y: 212, "class": "t-small" }, svg);
      var sub2 = el("text", { x: x0, y: 232, "class": "t-small" }, svg);
      var verdict = el("text", { x: x0, y: 270, "class": "t-mid" }, svg);

      var C = T.chart(svg, { x: 392, y: 48, w: 218, h: 190, xDomain: [0, 120], yDomain: [0, 1], xLabel: "watermark wait (s) →", yLabel: "events in the first result" });
      var pC = el("path", { fill: "none", stroke: "var(--s1)", "stroke-width": 3 }, C.g);
      var pO = el("path", { fill: "none", stroke: "var(--muted)", "stroke-width": 2, "stroke-dasharray": "5 4" }, C.g);
      el("path", { d: "M392 268h14", stroke: "var(--s1)", "stroke-width": 3 }, svg);
      var lgA = el("text", { x: 412, y: 272, "class": "t-small" }, svg);
      el("path", { d: "M516 268h14", stroke: "var(--muted)", "stroke-width": 2, "stroke-dasharray": "5 4" }, svg);
      var lgB = el("text", { x: 536, y: 272, "class": "t-small" }, svg);
      var mk = el("circle", { r: 6.5, fill: "var(--ink)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);

      return function (s) {
        var lat = L[s.p], comp = cdf(s.w, s.p), wx = X(s.w), fix = s.late === "fix";
        var off = 0, missed = 0;
        lat.forEach(function (l, i) {
          var late = l > s.w; if (late) missed++;
          if (l > MAXL) off++;
          T.set(dots[i], { cx: X(l), fill: late ? (fix ? "var(--warn)" : "var(--bad)") : "var(--s1)", opacity: l > MAXL ? 0 : 1 });
        });
        T.set(more, { text: off ? "+" + off + " later than 3 min" : "" });
        T.set(wm, { d: "M" + wx + " 50V128" });
        T.set(wmT, { x: wx + (s.w > 100 ? -4 : 4), "text-anchor": s.w > 100 ? "end" : "start" });
        var other = s.p === "steady" ? "mobile" : "steady";
        T.set(pC, { d: C.path(function (w) { return cdf(w, s.p); }, 0, 120, 80) });
        T.set(pO, { d: C.path(function (w) { return cdf(w, other); }, 0, 120, 80) });
        T.set(lgA, { text: s.p === "mobile" ? "phones" : "servers" });
        T.set(lgB, { text: other === "mobile" ? "phones" : "servers" });
        T.set(mk, { cx: C.px(s.w), cy: C.py(comp) });
        T.set(big, { text: pct(comp) + " of events counted" });
        T.set(sub, { text: "result published " + Math.round(s.w) + " s after the minute ends" });
        T.set(sub2, { text: fix ? "late events update the result: " + pct(1 - comp) + " arrive as corrections" : pct(1 - comp) + " of events are dropped" });
        var bad = fix ? false : comp < 0.9, slow = s.w > 60;
        T.set(verdict, { text: bad ? "Fast but incomplete" : slow ? "Complete, but stale" : fix ? "Fast first answer, fixed later" : "A reasonable balance", fill: bad ? "var(--bad)" : slow ? "var(--warn)" : "var(--good)" });
      };
    }
  });
})(window.Tradeoff);
