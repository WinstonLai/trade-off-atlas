// N front-line staff, each manager has `s` direct reports. Layers = how many times N must be divided by s to reach one person.
// A manager has about 20 hours a week for their people, so each report gets 20/s hours. Teams need 1, 2 or 4 hours each.
(function (T) {
  var HOURS = 20, NEED = { exp: 1, mix: 2, new: 4 }, NS = { s: 50, m: 200, l: 1000 };
  function org(n, s) {
    var c = n, L = 0, M = 0;
    while (c > 1) { c = Math.ceil(c / s); M += c; L++; }
    return { layers: L, managers: M };
  }

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "A chain of management layers between front-line staff and the top, a bar of each manager's time per report against what people need, and a chart of layers against span of control.",
    vars: [
      { key: "s", label: "Direct reports per manager", min: 2, max: 15, step: 1, value: 4, color: "var(--s1)", fmt: function (v) { return Math.round(v); } },
      { key: "need", label: "How much support people need", type: "choice", value: "mix",
        options: [{ value: "exp", label: "Experienced" }, { value: "mix", label: "Mixed" }, { value: "new", label: "Mostly new" }] },
      { key: "n", label: "Front-line staff", type: "choice", value: "m",
        options: [{ value: "s", label: "50" }, { value: "m", label: "200" }, { value: "l", label: "1,000" }] }
    ],
    scenario: [
      { caption: "Four reports each: plenty of time per person, but 200 staff need four layers of managers, and decisions climb all of them.", set: { s: 4, need: "mix", n: "m" }, hold: 4400 },
      { caption: "Twelve reports each flattens the organisation to three layers, but each person now gets under two hours a week.", set: { s: 12 }, dur: 2400, hold: 4400 },
      { caption: "Ten is the widest span that still gives this team the support it needs.", set: { s: 10 }, dur: 1600, hold: 3800 },
      { caption: "Experienced people need less support, so spans can be wider and the hierarchy flatter.", set: { need: "exp", s: 15 }, dur: 2200, hold: 4000 },
      { caption: "A team of new hires needs more coaching: narrow spans, and another layer, are the price.", set: { need: "new", s: 5 }, dur: 2200, hold: 4400 }
    ],
    setup: function (svg) {
      var el = T.el, x0 = 30, W = 330;
      el("text", { x: x0, y: 30, "class": "t-label", text: "Layers a decision climbs" }, svg);
      var nodes = [], links = [];
      for (var i = 0; i < 12; i++) {
        if (i) links.push(el("path", { stroke: "var(--line)", "stroke-width": 3 }, svg));
        nodes.push(el("circle", { cy: 58, r: 9 }, svg));
      }
      var tL = el("text", { x: x0, y: 92, "class": "t-small" }, svg);

      el("text", { x: x0, y: 128, "class": "t-label", text: "Manager time per report (hours/week)" }, svg);
      el("rect", { x: x0, y: 138, width: W, height: 20, rx: 4, fill: "var(--line)", opacity: 0.5 }, svg);
      var bar = el("rect", { x: x0, y: 138, height: 20, rx: 4 }, svg);
      var needL = el("path", { stroke: "var(--ink)", "stroke-width": 2, "stroke-dasharray": "3 3" }, svg);
      var needT = el("text", { y: 174, "class": "t-small" }, svg);

      var big = el("text", { x: x0, y: 218, "class": "t-big" }, svg);
      var sub = el("text", { x: x0, y: 242, "class": "t-small" }, svg);
      var verdict = el("text", { x: x0, y: 280, "class": "t-mid" }, svg);

      var C = T.chart(svg, { x: 392, y: 48, w: 218, h: 190, xDomain: [2, 15], yDomain: [0, 10], xLabel: "reports per manager →", yLabel: "management layers" });
      var thin = el("rect", { y: 0, height: C.h, fill: "var(--bad)", opacity: 0.12 }, C.g);
      var thinT = el("text", { y: 16, "class": "t-small", fill: "var(--bad)", text: "too thin" }, C.g);
      var pL = el("path", { fill: "none", stroke: "var(--ink)", "stroke-width": 3 }, C.g);
      var mk = el("circle", { r: 6.5, fill: "var(--ink)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);

      return function (s) {
        var span = Math.round(s.s), n = NS[s.n], o = org(n, span), per = HOURS / span, need = NEED[s.need], ok = per >= need - 1e-9;
        var shown = o.layers + 1, gap = Math.min(44, (W - 24) / Math.max(1, shown - 1));
        nodes.forEach(function (c, i) {
          var on = i < shown, cx = x0 + 12 + i * gap;
          T.set(c, { cx: cx, opacity: on ? 1 : 0, fill: i === 0 ? "var(--s3)" : "var(--s1)" });
          if (i) T.set(links[i - 1], { d: "M" + (x0 + 12 + (i - 1) * gap) + " 58H" + cx, opacity: on ? 1 : 0 });
        });
        T.set(tL, { text: "front line + " + o.layers + " layers of management" });
        var sc = W / 10;
        T.set(bar, { width: Math.min(W, per * sc), fill: ok ? "var(--good)" : "var(--bad)" });
        T.set(needL, { d: "M" + (x0 + need * sc) + " 132V164" });
        T.set(needT, { x: x0 + need * sc, "text-anchor": need > 5 ? "end" : "start", text: "needed: " + need + " h" });
        var maxOk = Math.min(15, Math.floor(HOURS / need));
        T.set(thin, { x: C.px(Math.min(15, maxOk + 0.5)), width: Math.max(0, C.w - C.px(Math.min(15, maxOk + 0.5))) });
        T.set(thinT, { x: C.px(Math.min(14.2, maxOk + 0.7)), opacity: maxOk < 15 ? 1 : 0 });
        var d = "";
        for (var k = 2; k <= 15; k++) { var L = org(n, k).layers; d += (k === 2 ? "M" : "L") + C.px(k - 0.5 < 2 ? 2 : k - 0.5) + " " + C.py(L) + "H" + C.px(Math.min(15, k + 0.5)); }
        T.set(pL, { d: d });
        T.set(mk, { cx: C.px(span), cy: C.py(o.layers) });
        T.set(big, { text: o.layers + " layers · " + per.toFixed(1) + " h each" });
        T.set(sub, { text: o.managers + " managers for " + n.toLocaleString("en") + " staff" });
        T.set(verdict, { text: !ok ? "Spread too thin to support people" : span < maxOk ? "Room to widen spans" : "Flattest structure that still supports people", fill: !ok ? "var(--bad)" : span < maxOk ? "var(--warn)" : "var(--good)" });
      };
    }
  });
})(window.Tradeoff);
