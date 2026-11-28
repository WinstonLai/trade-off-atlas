// Four jobs share one team. Each job has a cost of delay (value lost per week until it ships) and a duration.
// Total delay cost = sum of cost of delay × completion week. Ordering by cost of delay ÷ duration (WSJF) minimises it.
(function (T) {
  var MAXW = 24;
  function jobs(s) {
    return [
      { id: "D", name: "Report", cod: 1, dur: 4 },
      { id: "A", name: "Platform", cod: s.a, dur: s.d },
      { id: "C", name: "Fix", cod: 2, dur: 1 },
      { id: "B", name: "API", cod: 6, dur: 3 }
    ];
  }
  function order(list, how) {
    var o = list.slice();
    if (how === "value") o.sort(function (x, y) { return y.cod - x.cod || x.dur - y.dur; });
    if (how === "short") o.sort(function (x, y) { return x.dur - y.dur || y.cod - x.cod; });
    if (how === "wsjf") o.sort(function (x, y) { return y.cod / y.dur - x.cod / x.dur || x.dur - y.dur; });
    return o;
  }
  function cost(o) { var t = 0, c = 0; o.forEach(function (j) { t += j.dur; c += j.cod * t; }); return c; }

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "A timeline of four jobs in the chosen order, and a chart of the cost of delay still being paid each week, whose area is the total delay cost.",
    vars: [
      { key: "how", label: "Order the jobs by", type: "choice", value: "arrival",
        options: [{ value: "arrival", label: "Arrival" }, { value: "value", label: "Value" }, { value: "short", label: "Shortest" }, { value: "wsjf", label: "Value ÷ time" }] },
      { key: "a", label: "Platform job: cost of delay ($k/week)", min: 2, max: 24, step: 1, value: 8, color: "var(--s1)", fmt: function (v) { return "$" + Math.round(v) + "k"; } },
      { key: "d", label: "Platform job: duration (weeks)", min: 2, max: 12, step: 1, value: 8, color: "var(--s2)", fmt: function (v) { return Math.round(v) + " wk"; } }
    ],
    scenario: [
      { caption: "Four jobs, one team, in the order they arrived. The urgent API work waits behind everything else.", set: { how: "arrival", a: 8, d: 8 }, hold: 4000 },
      { caption: "Highest value first starts the big platform job, and everything else waits eight weeks for it.", set: { how: "value" }, hold: 3800 },
      { caption: "Shortest first clears small jobs quickly, but it ignores how much each one is worth.", set: { how: "short" }, hold: 3800 },
      { caption: "Divide cost of delay by duration (weighted shortest job first). This order loses the least to waiting.", set: { how: "wsjf" }, hold: 4400 },
      { caption: "Make the platform job far more urgent and it jumps the queue. Shortest-first, which leaves it until last, now loses a third more than the best order.", set: { a: 20 }, dur: 2200, hold: 4600 }
    ],
    setup: function (svg) {
      var el = T.el, x0 = 30, W = 330, sx = W / MAXW, colors = { A: "var(--s1)", B: "var(--s2)", C: "var(--s3)", D: "var(--muted)" };
      el("text", { x: x0, y: 30, "class": "t-label", text: "One team works through the queue" }, svg);
      var bars = {}, labels = {};
      ["A", "B", "C", "D"].forEach(function (id) {
        bars[id] = el("rect", { y: 44, height: 30, rx: 4, fill: colors[id], stroke: "var(--surface)", "stroke-width": 2 }, svg);
        labels[id] = el("text", { y: 64, "text-anchor": "middle", "class": "t-small", "font-weight": 700, fill: "var(--surface)" }, svg);
      });
      el("path", { d: "M" + x0 + " 80h" + W, stroke: "var(--line)", "stroke-width": 1.5 }, svg);
      [0, 8, 16, 24].forEach(function (w) { el("text", { x: x0 + w * sx, y: 96, "text-anchor": w ? "middle" : "start", "class": "t-small", text: w ? w + " wk" : "0" }, svg); });

      var seq = el("text", { x: x0, y: 130, "class": "t-small" }, svg);
      var seq2 = el("text", { x: x0, y: 150, "class": "t-small" }, svg);
      var big = el("text", { x: x0, y: 200, "class": "t-big" }, svg);
      var sub = el("text", { x: x0, y: 224, "class": "t-small" }, svg);
      var verdict = el("text", { x: x0, y: 262, "class": "t-mid" }, svg);
      el("text", { x: x0, y: 290, "class": "t-small", text: "A = Platform · B = API · C = Fix · D = Report" }, svg);

      var C = T.chart(svg, { x: 392, y: 48, w: 218, h: 190, xDomain: [0, MAXW], yDomain: [0, 34], xLabel: "weeks →", yLabel: "delay cost still running ($k/wk)" });
      var area = el("path", { fill: "var(--bad)", opacity: 0.22 }, C.g);
      var bestP = el("path", { fill: "none", stroke: "var(--good)", "stroke-width": 2, "stroke-dasharray": "5 4" }, C.g);
      var line = el("path", { fill: "none", stroke: "var(--ink)", "stroke-width": 2.5 }, C.g);
      el("path", { d: "M392 268h14", stroke: "var(--good)", "stroke-width": 2, "stroke-dasharray": "5 4" }, svg);
      el("text", { x: 412, y: 272, "class": "t-small", text: "best order" }, svg);
      el("rect", { x: 517, y: 262, width: 14, height: 10, fill: "var(--bad)", opacity: 0.35 }, svg);
      el("text", { x: 537, y: 272, "class": "t-small", text: "lost value" }, svg);

      function steps(o) {
        var rate = o.reduce(function (a, j) { return a + j.cod; }, 0), t = 0, d = "M0 " + C.py(Math.min(rate, 34));
        o.forEach(function (j) {
          t += j.dur; d += "H" + C.px(Math.min(t, MAXW)).toFixed(1);
          rate -= j.cod; d += "V" + C.py(Math.min(rate, 34)).toFixed(1);
        });
        return d;
      }
      return function (s) {
        var list = jobs(s), o = order(list, s.how), best = order(list, "wsjf"), c = cost(o), cb = cost(best), t = 0;
        o.forEach(function (j) {
          var w = Math.min(j.dur, MAXW - t);
          T.set(bars[j.id], { x: x0 + t * sx, width: Math.max(0, w * sx) });
          T.set(labels[j.id], { x: x0 + (t + w / 2) * sx, text: w * sx > 10 ? j.id : "" });
          t += j.dur;
        });
        T.set(seq, { text: "Order: " + o.map(function (j) { return j.id; }).join(" → ") });
        T.set(seq2, { text: "Value ÷ time: " + list.map(function (j) { return j.id + " " + (Math.round(j.cod / j.dur * 10) / 10); }).join(" · ") });
        var line_d = steps(o);
        T.set(line, { d: line_d });
        T.set(area, { d: line_d + "V" + C.py(0) + "H0Z" });
        T.set(bestP, { d: steps(best) });
        T.set(big, { text: "$" + c + "k lost to waiting" });
        T.set(sub, { text: "best possible order: $" + cb + "k" });
        var extra = (c - cb) / cb;
        T.set(verdict, { text: extra < 0.005 ? "Least delay cost" : "+" + Math.round(extra * 100) + "% more than the best order", fill: extra < 0.005 ? "var(--good)" : extra < 0.2 ? "var(--warn)" : "var(--bad)" });
      };
    }
  });
})(window.Tradeoff);
