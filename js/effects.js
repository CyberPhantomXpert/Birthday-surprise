/* effects.js
 * ---------------------------------------------------------------------------
 * All the celebration extras: confetti, floating hearts, candle smoke, balloon
 * pops and synthesised sound effects. Nothing here needs an asset file —
 * particles are drawn on a canvas and sounds are generated with Web Audio.
 *
 * Exposes window.FX = { sound, burst, hearts, smoke, popBalloon }.
 * ---------------------------------------------------------------------------
 */
(function () {
  "use strict";

  var CFG = window.CONFIG || {};
  var reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var raf = window.requestAnimationFrame || window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame || function (cb) { return window.setTimeout(cb, 1000 / 60); };

  /* ===================================================== sound (Web Audio) */
  var Sound = (function () {
    var ctx = null;

    function ac() {
      if (CFG.sound === false) { return null; }
      if (!ctx) {
        var C = window.AudioContext || window.webkitAudioContext;
        if (!C) { return null; }
        ctx = new C();
      }
      if (ctx.state === "suspended" && ctx.resume) { ctx.resume(); }
      return ctx;
    }

    function tone(o) {
      var a = ac(); if (!a) { return; }
      var t0 = a.currentTime + (o.delay || 0);
      var osc = a.createOscillator(), g = a.createGain();
      osc.type = o.type || "sine";
      osc.frequency.setValueAtTime(o.f0, t0);
      if (o.f1) { osc.frequency.exponentialRampToValueAtTime(o.f1, t0 + o.dur); }
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(o.vol || 0.18, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
      osc.connect(g); g.connect(a.destination);
      osc.start(t0); osc.stop(t0 + o.dur + 0.03);
    }

    function noise(dur, vol, freq) {
      var a = ac(); if (!a) { return; }
      var n = Math.floor(a.sampleRate * dur);
      var buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < n; i++) { d[i] = (Math.random() * 2 - 1) * (1 - i / n); }
      var src = a.createBufferSource(); src.buffer = buf;
      var f = a.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = freq || 1200; f.Q.value = 0.8;
      var g = a.createGain(); g.gain.value = vol || 0.12;
      src.connect(f); f.connect(g); g.connect(a.destination);
      src.start();
    }

    return {
      pop: function () { tone({ type: "triangle", f0: 720, f1: 130, dur: 0.16, vol: 0.22 }); noise(0.07, 0.07, 1800); },
      whoosh: function () { noise(0.55, 0.1, 900); },
      chime: function () { [880, 1318.5, 1760].forEach(function (f, i) { tone({ f0: f, dur: 0.5, vol: 0.1, delay: i * 0.07 }); }); },
      tada: function () {
        [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
          tone({ type: "triangle", f0: f, dur: 0.6, vol: 0.15, delay: i * 0.11 });
        });
        noise(0.25, 0.05, 3000);
      }
    };
  })();

  /* ===================================================== canvas particles */
  var canvas = document.getElementById("fx");
  var g = (canvas && canvas.getContext) ? canvas.getContext("2d") : null;
  var W = 0, H = 0;
  var confetti = [], hearts = [];
  var running = false;
  var heartTimer = null;

  function resize() {
    if (!canvas) { return; }
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function drawHeart(c, x, y, s, color) {
    c.save();
    c.translate(x, y);
    c.scale(s / 16, s / 16);
    c.beginPath();
    c.moveTo(0, 3);
    c.bezierCurveTo(-6, -6, -16, 2, 0, 14);
    c.bezierCurveTo(16, 2, 6, -6, 0, 3);
    c.closePath();
    c.fillStyle = color;
    c.fill();
    c.restore();
  }

  function loop() {
    if (!running) { return; }
    raf(loop);
    g.clearRect(0, 0, W, H);

    var i, p;
    for (i = confetti.length - 1; i >= 0; i--) {
      p = confetti[i];
      p.vy += 0.12; p.x += p.vx; p.y += p.vy; p.vx *= 0.995; p.rot += p.vr;
      g.save();
      g.translate(p.x, p.y);
      g.rotate(p.rot);
      g.fillStyle = p.color;
      g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      g.restore();
      if (p.y > H + 40) { confetti.splice(i, 1); }
    }

    for (i = hearts.length - 1; i >= 0; i--) {
      p = hearts[i];
      p.y -= p.speed;
      p.x += Math.sin((p.y + p.seed) / 45) * 0.6;
      p.a -= 0.0016;
      drawHeart(g, p.x, p.y, p.size, "rgba(255,120,150," + Math.max(p.a, 0).toFixed(3) + ")");
      if (p.y < -40 || p.a <= 0) { hearts.splice(i, 1); }
    }

    if (!confetti.length && !hearts.length) {
      running = false;
      g.clearRect(0, 0, W, H);
    }
  }

  function start() {
    if (!running && g && !reduceMotion) { running = true; loop(); }
  }

  /* ===================================================== public API */
  var CONFETTI_COLORS = ["#F2B300", "#0719D4", "#D14D39", "#8FAD00", "#8377E4", "#99C96A", "#20CFB4", "#FF6FB5"];

  function burst(x, y, count) {
    if (CFG.confetti === false || !g || reduceMotion) { return; }
    count = count || 130;
    for (var i = 0; i < count; i++) {
      var a = Math.random() * Math.PI * 2, sp = 3 + Math.random() * 9;
      confetti.push({
        x: x, y: y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 4,
        w: 6 + Math.random() * 6, h: 8 + Math.random() * 8,
        rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.35,
        color: CONFETTI_COLORS[(Math.random() * CONFETTI_COLORS.length) | 0]
      });
    }
    start();
  }

  function spawnHeart() {
    hearts.push({
      x: Math.random() * W, y: H + 20,
      size: 10 + Math.random() * 16,
      speed: 0.7 + Math.random() * 1.3,
      a: 0.45 + Math.random() * 0.4,
      seed: Math.random() * 100
    });
    start();
  }

  function startHearts() {
    if (CFG.hearts === false || !g || reduceMotion || heartTimer) { return; }
    heartTimer = window.setInterval(spawnHeart, 500);
    spawnHeart();
  }

  function smoke(x, y) {
    if (reduceMotion) { return; }
    for (var i = 0; i < 9; i++) {
      (function (i) {
        window.setTimeout(function () {
          var d = document.createElement("div");
          d.className = "smoke-puff";
          d.style.left = x + "px";
          d.style.top = y + "px";
          d.style.setProperty("--dx", ((Math.random() - 0.5) * 70) + "px");
          document.body.appendChild(d);
          window.setTimeout(function () { if (d.parentNode) { d.parentNode.removeChild(d); } }, 2600);
        }, i * 110);
      })(i);
    }
  }

  function popBalloon(el) {
    if (!el || el.getAttribute("data-popped")) { return; }
    el.setAttribute("data-popped", "1");
    var r = el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, 55);
    Sound.pop();
    el.style.transition = "transform .18s ease-out, opacity .18s ease-out";
    el.style.transform = "scale(1.3)";
    el.style.opacity = "0";
    window.setTimeout(function () { if (el.parentNode) { el.parentNode.removeChild(el); } }, 220);
  }

  resize();
  window.addEventListener("resize", resize);

  window.FX = {
    sound: Sound,
    burst: burst,
    hearts: startHearts,
    smoke: smoke,
    popBalloon: popBalloon
  };
})();
