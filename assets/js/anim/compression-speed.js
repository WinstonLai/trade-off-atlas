// Write 1 GB once and read it R times over a link (disk or network) of bandwidth B MB/s.
// Time = compress (1000 / write speed) + R × decompress (1000 / read speed) + (1 + R) × transfer (1000 / ratio / B).
// Ratios and single-core speeds are illustrative, in the range public benchmarks report for typical data.
(function (T) {
  var CODECS = [
    { name: "None", ratio: 1, comp: Infinity, dec: Infinity },
    { name: "LZ4", ratio: 2.1, comp: 700, dec: 4000 },
    { name: "Snappy", ratio: 2.0, comp: 500, dec: 1800 },
    { name: "Zstd 1", ratio: 2.9, comp: 500, dec: 1500 },
    { name: "Zstd 9", ratio: 3.3, comp: 90, dec: 1400 },
    { name: "Gzip 6", ratio: 3.2, comp: 35, dec: 400 },
    { name: "Zstd 19", ratio: 3.6, comp: 5, dec: 1300 }
  ];
  var bw = function (b) { return Math.pow(10, 1 + 2.5 * b); };
  function times(c, B, R) {
    var w = 1000 / c.comp, r = 1000 / c.dec, x = 1000 / c.ratio / B;
    return { cpu: w + R * r, io: (1 + R) * x, total: w + R * r + (1 + R) * x };
  }
  var fmtS = function (t) { return t >= 100 ? Math.round(t) + " s" : t >= 10 ? t.toFixed(0) + " s" : t.toFixed(1) + " s"; };

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "Details of the chosen codec with bars for CPU time and transfer time, and a ranked set of bars comparing the total time of every codec for the chosen bandwidth and number of reads.",
    vars: [
      { key: "c", label: "Codec and level", min: 0, max: CODECS.length - 1, step: 1, value: 0, color: "var(--s1)", fmt: function (v) { return CODECS[Math.round(v)].name; } },
      { key: "b", label: "Bandwidth of the disk or network", min: 0, max: 1, step: 0.01, value: 0.4, color: "var(--s2)", fmt: function (v) { var x = bw(v); return (x >= 1000 ? (x / 1000).toFixed(1) + " GB/s" : Math.round(x) + " MB/s"); } },
      { key: "r", label: "Times the data is read after writing", min: 1, max: 50, step: 1, value: 10, color: "var(--s3)", fmt: function (v) { return Math.round(v) + "×"; } }
    ],
    scenario: [
      { caption: "Uncompressed over a 100 MB/s link, read ten times: every read moves the full gigabyte.", set: { c: 0, b: 0.4, r: 10 }, hold: 3800 },
      { caption: "LZ4 halves the bytes at almost no CPU cost. Less to move, so everything is faster.", set: { c: 1 }, hold: 3800 },
      { caption: "Maximum compression gives the smallest file, but writing one gigabyte takes over three minutes of CPU.", set: { c: 6 }, hold: 4400 },
      { caption: "On a slow 20 MB/s link with data read 50 times, a stronger codec pays for itself on every read.", set: { b: 0.12, r: 50, c: 4 }, dur: 2400, hold: 4600 },
      { caption: "On a fast local disk with data read once, any compression costs more time than it saves. It still saves storage.", set: { b: 1, r: 1, c: 0 }, dur: 2400, hold: 4600 }
    ],
    setup: function (svg) {
      var el = T.el, x0 = 30, W = 330;
      var name = el("text", { x: x0, y: 30, "class": "t-label" }, svg);
      el("rect", { x: x0, y: 42, width: W, height: 18, rx: 3, fill: "var(--line)", opacity: 0.5 }, svg);
      var size = el("rect", { x: x0, y: 42, height: 18, rx: 3, fill: "var(--s3)" }, svg);
      var sizeT = el("text", { x: x0, y: 78, "class": "t-small" }, svg);

      el("text", { x: x0, y: 110, "class": "t-label", text: "Time for 1 write + all reads" }, svg);
      var bCpu = el("rect", { x: x0, y: 120, height: 22, fill: "var(--s1)" }, svg);
      var bIo = el("rect", { y: 120, height: 22, fill: "var(--s2)" }, svg);
      var tCpu = el("text", { x: x0, y: 160, "class": "t-small", fill: "var(--s1)" }, svg);
      var tIo = el("text", { x: x0, y: 178, "class": "t-small", fill: "var(--s2)" }, svg);

      var big = el("text", { x: x0, y: 222, "class": "t-big" }, svg);
      var sub = el("text", { x: x0, y: 246, "class": "t-small" }, svg);
      var verdict = el("text", { x: x0, y: 282, "class": "t-mid" }, svg);

      el("text", { x: 392, y: 30, "class": "t-label", text: "Total time by codec" }, svg);
      var rows = CODECS.map(function (c, i) {
        var y = 46 + i * 30;
        return {
          label: el("text", { x: 392, y: y + 13, "class": "t-small", text: c.name }, svg),
          bar: el("rect", { x: 456, y: y, height: 18, rx: 3 }, svg),
          val: el("text", { y: y + 13, "class": "t-small" }, svg)
        };
      });
      el("text", { x: 392, y: 272, "class": "t-small", text: "green = fastest for these settings" }, svg);

      return function (s) {
        var ci = Math.round(s.c), c = CODECS[ci], B = bw(s.b), R = Math.round(s.r), t = times(c, B, R);
        var all = CODECS.map(function (k) { return times(k, B, R).total; }), mx = Math.max.apply(null, all), mn = Math.min.apply(null, all), bi = all.indexOf(mn);
        T.set(name, { text: c.name + ": " + c.ratio.toFixed(1) + "× smaller" });
        T.set(size, { width: W / c.ratio });
        T.set(sizeT, { text: "1 GB stored as " + Math.round(1000 / c.ratio) + " MB" });
        var sc = W / Math.max(t.total, 1e-9);
        T.set(bCpu, { width: t.cpu * sc });
        T.set(bIo, { x: x0 + t.cpu * sc, width: t.io * sc });
        T.set(tCpu, { text: "CPU (compress + decompress): " + fmtS(t.cpu) });
        T.set(tIo, { text: "Moving the bytes: " + fmtS(t.io) });
        T.set(big, { text: "Total: " + fmtS(t.total) });
        T.set(sub, { text: "fastest here: " + CODECS[bi].name + " at " + fmtS(mn) });
        var r = t.total / mn;
        T.set(verdict, { text: r < 1.05 ? "Fastest choice for this workload" : r < 1.5 ? "Close, " + Math.round((r - 1) * 100) + "% slower than the best" : (r).toFixed(1) + "× slower than the best", fill: r < 1.05 ? "var(--good)" : r < 1.5 ? "var(--warn)" : "var(--bad)" });
        rows.forEach(function (row, i) {
          var w = Math.max(2, all[i] / mx * 130);
          T.set(row.bar, { width: w, fill: i === bi ? "var(--good)" : i === ci ? "var(--ink)" : "var(--line)" });
          T.set(row.val, { x: 456 + w + 5, text: fmtS(all[i]) });
          T.set(row.label, { fill: i === ci ? "var(--ink)" : "var(--muted)" });
        });
      };
    }
  });
})(window.Tradeoff);
