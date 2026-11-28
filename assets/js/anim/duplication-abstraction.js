// N similar pieces of code face H = 20 future changes. A share d of changes are specific to one caller (the needs diverge),
// the rest apply to all. Duplicated: a shared change is N edits, a specific one is 1. Abstracted: building it costs 3, every
// change costs 1, but each specific change adds a flag or parameter, and each change costs 0.25 more per flag already there.
(function (T) {
  var H = 20, BUILD = 3, BETA = 0.25;
  var dup = function (n, d) { return H * ((1 - d) * n + d); };
  var abs = function (d) { return BUILD + H + BETA * d * H * (H + 1) / 2; };
  var cross = function (n) { return (n * H - BUILD - H) / (BETA * H * (H + 1) / 2 + H * (n - 1)); };

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "Callers using either separate copies of similar code or one shared function that accumulates flags, and lines of effort for twenty future changes against how much the callers' needs diverge.",
    vars: [
      { key: "how", label: "Approach", type: "choice", value: "dup",
        options: [{ value: "dup", label: "Keep the copies" }, { value: "abs", label: "Shared abstraction" }] },
      { key: "n", label: "Number of similar copies", min: 2, max: 8, step: 1, value: 3, color: "var(--s1)", fmt: function (v) { return Math.round(v); } },
      { key: "d", label: "How much the callers' needs diverge", min: 0, max: 1, step: 0.01, value: 0.1, color: "var(--s2)", fmt: function (v) { return Math.round(v * 100) + "%"; } }
    ],
    scenario: [
      { caption: "Three near-identical copies. Almost every change has to be made three times, and it's easy to miss one.", set: { how: "dup", n: 3, d: 0.1 }, hold: 4000 },
      { caption: "Extract one shared function: each change is made once. While the callers want the same thing, this wins easily.", set: { how: "abs" }, hold: 4000 },
      { caption: "But the callers drift apart. Every special case becomes a flag, and each change has to step around all of them.", set: { d: 0.8 }, dur: 2600, hold: 4400 },
      { caption: "Now the copies are cheaper. \"Duplication is far cheaper than the wrong abstraction.\"", set: { how: "dup" }, hold: 4000 },
      { caption: "Two copies and an unclear future: duplication is still slightly cheaper. Many teams wait for a third copy before abstracting.", set: { n: 2, d: 0.3 }, dur: 2200, hold: 4600 }
    ],
    setup: function (svg) {
      var el = T.el, x0 = 30, W = 330;
      el("text", { x: x0, y: 30, "class": "t-label", text: "Callers and the code they use" }, svg);
      var callers = [], copies = [], links = [];
      for (var i = 0; i < 8; i++) {
        callers.push(el("circle", { cy: 128, r: 8, fill: "var(--s3)" }, svg));
        copies.push(el("rect", { y: 76, width: 30, height: 30, rx: 4, fill: "var(--s1)" }, svg));
        links.push(el("path", { stroke: "var(--line)", "stroke-width": 2 }, svg));
      }
      var shared = el("rect", { x: x0 + 60, y: 42, width: 210, height: 40, rx: 6, fill: "var(--s1)" }, svg);
      var flags = [];
      for (var f = 0; f < 20; f++) flags.push(el("rect", { x: x0 + 68 + f * 10, y: 48, width: 6, height: 12, rx: 1.5, fill: "var(--warn)" }, svg));
      var sharedT = el("text", { x: x0 + 165, y: 76, "text-anchor": "middle", "class": "t-small", fill: "var(--surface)", text: "shared function" }, svg);
      var caption = el("text", { x: x0, y: 160, "class": "t-small" }, svg);

      var big = el("text", { x: x0, y: 206, "class": "t-big" }, svg);
      var sub = el("text", { x: x0, y: 230, "class": "t-small" }, svg);
      var verdict = el("text", { x: x0, y: 268, "class": "t-mid" }, svg);

      var C = T.chart(svg, { x: 392, y: 48, w: 218, h: 190, xDomain: [0, 1], yDomain: [0, 170], xLabel: "needs diverge →", yLabel: "effort for 20 changes" });
      var pD = el("path", { fill: "none", stroke: "var(--s2)", "stroke-width": 2.5 }, C.g);
      el("path", { d: C.path(abs, 0, 1, 2), fill: "none", stroke: "var(--s1)", "stroke-width": 2.5 }, C.g);
      var crossL = el("line", { y1: 0, y2: C.h, stroke: "var(--muted)", "stroke-width": 1.5, "stroke-dasharray": "4 4" }, C.g);
      var mk = el("circle", { r: 6.5, fill: "var(--ink)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);
      [["var(--s2)", "keep copies", 0], ["var(--s1)", "abstraction", 1]].forEach(function (l) {
        var lx = 392 + l[2] * 124;
        el("path", { d: "M" + lx + " 268h14", stroke: l[0], "stroke-width": 2.5 }, svg);
        el("text", { x: lx + 20, y: 272, "class": "t-small", text: l[1] }, svg);
      });

      return function (s) {
        var n = Math.round(s.n), A = s.how === "abs", cD = dup(n, s.d), cA = abs(s.d), cur = A ? cA : cD, other = A ? cD : cA;
        var gap = W / n;
        for (var i = 0; i < 8; i++) {
          var on = i < n, cx = x0 + gap * (i + 0.5);
          T.set(callers[i], { cx: cx, opacity: on ? 1 : 0 });
          T.set(copies[i], { x: cx - 15, opacity: on && !A ? 1 : 0 });
          T.set(links[i], { d: A ? "M" + cx + " 120L" + (x0 + 165) + " 82" : "M" + cx + " 120V106", opacity: on ? 1 : 0 });
        }
        var nf = A ? Math.round(s.d * H) : 0;
        T.set(shared, { opacity: A ? 1 : 0 }); T.set(sharedT, { opacity: A ? 1 : 0 });
        flags.forEach(function (fl, i) { T.set(fl, { opacity: i < nf ? 1 : 0 }); });
        T.set(caption, { text: A ? (nf ? nf + " flags for special cases after 20 changes" : "one place to change") : n + " copies to keep in step" });
        T.set(pD, { d: C.path(function (d) { return dup(n, d); }, 0, 1, 2) });
        var cx0 = cross(n);
        T.set(crossL, { x1: C.px(T.clamp(cx0, 0, 1)), x2: C.px(T.clamp(cx0, 0, 1)), opacity: cx0 > 0 && cx0 < 1 ? 1 : 0 });
        T.set(mk, { cx: C.px(s.d), cy: C.py(Math.min(170, cur)), fill: A ? "var(--s1)" : "var(--s2)" });
        T.set(big, { text: "Effort: " + Math.round(cur) + " units" });
        T.set(sub, { text: "other: " + Math.round(other) + " · break-even at " + Math.round(T.clamp(cx0, 0, 1) * 100) + "% divergence" });
        var r = cur / other;
        T.set(verdict, { text: r < 0.97 ? "The cheaper choice here" : r < 1.03 ? "Roughly a tie" : "The other approach is cheaper", fill: r < 0.97 ? "var(--good)" : r < 1.03 ? "var(--warn)" : "var(--bad)" });
      };
    }
  });
})(window.Tradeoff);
