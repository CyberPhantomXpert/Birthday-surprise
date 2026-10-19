/* main.js
 * The whole reveal animation, rewritten to run on jQuery 3 and to read every
 * personal detail from config.js. Vanilla-jQuery, no plugins.
 */
(function ($) {
  "use strict";

  var CONFIG = window.CONFIG || { to: "You", from: "", song: "", fireworks: false, message: [], photos: [] };
  var BALLOON_COLORS = ["#F2B300", "#0719D4", "#D14D39", "#8FAD00", "#8377E4", "#99C96A", "#20CFB4"];
  var FX = window.FX || { sound: {}, burst: function () {}, hearts: function () {}, smoke: function () {}, popBalloon: function () {} };

  /* ---- helpers ---------------------------------------------------------- */

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function fill(line) {
    return esc(line).replace(/\{name\}/g, esc(CONFIG.to)).replace(/\{from\}/g, esc(CONFIG.from));
  }

  function ordinal(n) {
    n = parseInt(n, 10);
    var s = ["th", "st", "nd", "rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  /* ---- build the page from CONFIG -------------------------------------- */

  function applyConfig() {
    document.title = "Happy Birthday " + CONFIG.to + " 🥳";
    $(".js-from-name").text(CONFIG.from);
    $("#wish_message").text("Happy Birthday " + CONFIG.to + " 🥳");
    if (CONFIG.song) { $("#song source").attr("src", CONFIG.song); }

    // Balloons spell "HBD" then the recipient's name (up to 7 balloons total).
    var letters = ["HBD"].concat((CONFIG.to || "").toUpperCase().split("")).slice(0, 7);
    var balloons = "";
    $.each(letters, function (i, ch) {
      balloons += '<div class="balloons text-center" id="b' + (i + 1) + '">' +
                    '<h2 style="color:' + BALLOON_COLORS[i % BALLOON_COLORS.length] + '">' +
                      esc(ch) +
                    "</h2>" +
                  "</div>";
    });
    $("#balloon-stage").html(balloons);

    // The story message.
    var story = "";
    $.each(CONFIG.message || [], function (i, line) { story += "<p>" + fill(line) + "</p>"; });
    $(".message .message-body").html(story);

    // The big age heading.
    if (CONFIG.age) {
      $("#wish-title .line1").text("Happy");
      $("#wish-title .num").text(ordinal(CONFIG.age));
      $("#wish-title .line2").text("Birthday, " + CONFIG.to + " 🎉");
    } else {
      $("#wish-title .line1").text("Happy Birthday");
      $("#wish-title .num").hide();
      $("#wish-title .line2").text(CONFIG.to + " 🎉");
    }
  }

  /* ---- the reveal animation -------------------------------------------- */

  function flyBalloon(sel) {
    var $b = $(sel);
    if (!$b.length) { return; }
    $b.animate({ left: 1000 * Math.random(), bottom: 500 * Math.random() }, 10000, function () {
      flyBalloon(sel);
    });
  }

  function playStory() {
    var $lines = $(".message p");
    var i = 0;
    (function next() {
      if (i >= $lines.length) { $(".cake").fadeIn("fast"); afterStory(); return; }
      $lines.eq(i).fadeIn("slow", function () {
        window.setTimeout(function () { i++; next(); }, 1300);
      });
    })();
  }

  function afterStory() {
    if (CONFIG.photos && CONFIG.photos.length) { $("#memories").fadeIn("slow"); }
    $("#share").fadeIn("slow");
  }

  /* ---- optional countdown ---------------------------------------------- */

  function setupCountdown() {
    if (!CONFIG.date) { return; }
    var target = Date.parse(CONFIG.date);
    if (isNaN(target) || target <= Date.now()) { return; }

    var el = document.getElementById("countdown");
    if (!el) { return; }
    el.classList.add("show");

    var cells = {
      d: el.querySelector(".cd-d"), h: el.querySelector(".cd-h"),
      m: el.querySelector(".cd-m"), s: el.querySelector(".cd-s")
    };
    var heading = el.querySelector("h1");

    function tick() {
      var diff = target - Date.now();
      if (diff <= 0) {
        heading.textContent = "It's time! 🎉";
        window.clearInterval(timer);
        return;
      }
      var s = Math.floor(diff / 1000);
      var d = Math.floor(s / 86400); s %= 86400;
      var h = Math.floor(s / 3600); s %= 3600;
      var m = Math.floor(s / 60); s %= 60;
      cells.d.textContent = d;
      cells.h.textContent = pad(h);
      cells.m.textContent = pad(m);
      cells.s.textContent = pad(s);
    }

    tick();
    var timer = window.setInterval(tick, 1000);

    $(el).find(".cd-skip, .cd-continue").on("click", function () {
      window.clearInterval(timer);
      el.classList.remove("show");
    });
  }

  /* ---- photo slideshow -------------------------------------------------- */

  function setupSlideshow() {
    var photos = CONFIG.photos || [];
    if (!photos.length) { return; }

    var frame = document.querySelector(".slide-frame");
    var dots = document.querySelector(".slide-dots");
    if (!frame || !dots) { return; }

    $.each(photos, function (i, src) {
      $("<img>").attr({ src: src, alt: "Memory " + (i + 1) }).toggleClass("active", i === 0).appendTo(frame);
      $("<i>").toggleClass("on", i === 0).appendTo(dots);
    });

    var idx = 0, timer = null;
    var $imgs = $(frame).find("img"), $dots = $(dots).find("i");

    function go(n) {
      idx = (n + photos.length) % photos.length;
      $imgs.removeClass("active").eq(idx).addClass("active");
      $dots.removeClass("on").eq(idx).addClass("on");
    }
    function startAuto() { stopAuto(); timer = window.setInterval(function () { go(idx + 1); }, 4500); }
    function stopAuto() { if (timer) { window.clearInterval(timer); } }

    $("#memories").on("click", function () { document.getElementById("slideshow").classList.add("show"); go(0); startAuto(); });
    $(".slide-next").on("click", function () { go(idx + 1); startAuto(); });
    $(".slide-prev").on("click", function () { go(idx - 1); startAuto(); });
    $(".slide-close").on("click", function () { document.getElementById("slideshow").classList.remove("show"); stopAuto(); });
  }

  /* ---- share ------------------------------------------------------------ */

  function setupShare() {
    var text = (CONFIG.shareText || "Happy Birthday {name} 🎂")
      .replace(/\{name\}/g, CONFIG.to).replace(/\{from\}/g, CONFIG.from);

    $("#share").on("click", function () {
      var url = window.location.href;
      if (navigator.share) {
        navigator.share({ title: "Happy Birthday " + CONFIG.to, text: text, url: url }).catch(function () {});
      } else {
        window.open("https://wa.me/?text=" + encodeURIComponent(text + " " + url), "_blank");
      }
    });
  }

  /* ---- boot ------------------------------------------------------------- */

  $(function () {
    applyConfig();
    setupCountdown();
    setupSlideshow();
    setupShare();

    // tap a balloon to pop it
    $(document).on("click", ".balloons", function () { FX.popBalloon(this); });

    // theme toggle
    $("#theme").on("click", function () {
      var night = document.body.classList.toggle("theme-night");
      this.textContent = night ? "☀️" : "🌙";
    });

    $(window).on("load", function () {
      $(".loading").fadeOut("fast");
      $(".container").fadeIn("fast");
    });

    $("#turn_on").on("click", function () {
      $("#bulb_yellow").addClass("bulb-glow-yellow");
      $("#bulb_red").addClass("bulb-glow-red");
      $("#bulb_blue").addClass("bulb-glow-blue");
      $("#bulb_green").addClass("bulb-glow-green");
      $("#bulb_pink").addClass("bulb-glow-pink");
      $("#bulb_orange").addClass("bulb-glow-orange");
      $("body").addClass("peach");
      $(this).fadeOut("slow").delay(5000).promise().done(function () { $("#play").fadeIn("slow"); });
    });

    $("#play").on("click", function () {
      var audio = $(".song")[0];
      if (audio && audio.play) { var p = audio.play(); if (p && p.catch) { p.catch(function () {}); } }
      $("#bulb_yellow").addClass("bulb-glow-yellow-after");
      $("#bulb_red").addClass("bulb-glow-red-after");
      $("#bulb_blue").addClass("bulb-glow-blue-after");
      $("#bulb_green").addClass("bulb-glow-green-after");
      $("#bulb_pink").addClass("bulb-glow-pink-after");
      $("#bulb_orange").addClass("bulb-glow-orange-after");
      $("body").addClass("peach-after");
      $(this).fadeOut("slow").delay(6000).promise().done(function () { $("#bannar_coming").fadeIn("slow"); });
    });

    $("#bannar_coming").on("click", function () {
      $(".bannar").addClass("bannar-come");
      FX.sound.whoosh();
      $(this).fadeOut("slow").delay(6000).promise().done(function () { $("#balloons_flying").fadeIn("slow"); });
    });

    $("#balloons_flying").on("click", function () {
      $(".balloon-border").animate({ top: -500 }, 8000);
      $("#b1,#b4,#b5,#b7").addClass("balloons-rotate-behaviour-one");
      $("#b2,#b3,#b6").addClass("balloons-rotate-behaviour-two");
      for (var i = 1; i <= 7; i++) { flyBalloon("#b" + i); }
      $(this).fadeOut("slow").delay(5000).promise().done(function () { $("#cake_fadein").fadeIn("slow"); });
    });

    $("#cake_fadein").on("click", function () {
      $(".cake").fadeIn("slow");
      $(this).fadeOut("slow").delay(3000).promise().done(function () { $("#light_candle").fadeIn("slow"); });
    });

    $("#light_candle").on("click", function () {
      $(".fuego").fadeIn("slow");
      FX.sound.chime();
      $(this).fadeOut("slow").promise().done(function () { $("#blow_candle").fadeIn("slow"); });
    });

    // Blow the candle: flames out, smoke, confetti + fireworks + hearts
    $("#blow_candle").on("click", function () {
      var v = document.querySelector(".velas");
      if (v && FX.smoke) { var r = v.getBoundingClientRect(); FX.smoke(r.left + r.width / 2, r.top); }
      $(".fuego").fadeOut("fast");
      FX.sound.tada();
      var cx = window.innerWidth / 2, cy = window.innerHeight / 2;
      FX.burst(cx, cy - 60, 170);
      window.setTimeout(function () { FX.burst(cx - 230, cy + 20, 90); }, 220);
      window.setTimeout(function () { FX.burst(cx + 230, cy + 20, 90); }, 420);
      FX.hearts();
      if (CONFIG.fireworks && typeof window.startFireworks === "function") { window.startFireworks(); }
      $(this).fadeOut("slow").delay(2600).promise().done(function () { $("#wish_message").fadeIn("slow"); });
    });

    $("#wish_message").on("click", function () {
      var vw = $(window).width() / 2;
      var offsets = [-350, -250, -150, -50, 50, 150, 250];
      $("#b1,#b2,#b3,#b4,#b5,#b6,#b7").stop();
      for (var i = 1; i <= 7; i++) {
        if (!$("#b" + i).length) { continue; }
        $("#b" + i).attr("id", "b" + i + i);           // b1 -> b11, matching the CSS
        $("#b" + i + i).animate({ top: 240, left: vw + offsets[i - 1] }, 500);
      }
      $(".balloons").css("opacity", "0.9");
      $(".balloons h2").fadeIn(3000);
      $(".cake").fadeOut("slow");        // clear the stage for the title + gift
      $("#wish-title").addClass("show");
      FX.sound.chime();
      $(this).fadeOut("slow").delay(1600).promise().done(function () { $("#gift").addClass("show"); });
    });

    // Open the gift -> reveal the message
    $("#gift").on("click", function () {
      var $g = $(this);
      $g.addClass("open");
      FX.sound.tada();
      var r = this.getBoundingClientRect();
      FX.burst(r.left + r.width / 2, r.top + r.height / 2, 160);
      window.setTimeout(function () {
        $g.fadeOut("fast", function () { $g.removeClass("show"); });
        $("#wish-title").fadeOut("slow");
        $(".message").fadeIn("slow");
        playStory();
      }, 750);
    });
  });
})(jQuery);
