# 🎂 Birthday Surprise

A config-driven, animated **Happy Birthday** page. Turn on the lights, play a song,
decorate, release the balloons, light and blow out the candle — then open the gift
to reveal a personal message, with confetti, fireworks and floating hearts.

**Live demo:** https://cyberphantomxpert.github.io/Birthday-surprise/

## Features

**The reveal**
- Step-by-step animated reveal: lights → music → banner → balloons → cake → candle → blow out → wish
- **Blow out the candle** — flames go out, smoke rises, then confetti bursts and fireworks start
- **Gift box** — tap it to open the message (with a tada + confetti)
- **Big age heading** — e.g. "Happy 21st Birthday"
- **Photo slideshow** — optional memories, with Ken Burns zoom and auto-advance
- **Share / reply** button — native share sheet, or WhatsApp fallback
- **Optional countdown** — if the birthday is still in the future

**The extras**
- Canvas **confetti** and floating **hearts**
- **Tap a balloon to pop it**
- **Synthesised sound effects** (pop / chime / tada / whoosh) — generated with the Web Audio API, no files
- **Theme toggle** — warm (peach) or night (indigo)
- Fully **config-driven**: name, age, sender, song, photos, countdown and message in one file
- **Shareable per-recipient links** — `?to=Prachi&from=Ankit` personalises the whole page at runtime
- Lightweight and dependency-honest: no Bootstrap, no runtime LESS, no tracking scripts
- Responsive, with `prefers-reduced-motion` support (all the heavy effects step aside)

## Make it yours

Open **`js/config.js`** and edit the `DEFAULTS` block:

```js
var DEFAULTS = {
  to: "Prachi",     // who it's for
  from: "Ankit",    // who it's from
  age: 21,          // -> "Happy 21st Birthday"  (null = no number)
  date: null,       // e.g. "2026-12-31T00:00:00" for a live countdown
  song: "hbd.mp3",  // any audio file you drop in the repo
  fireworks: true,  // finale fireworks
  confetti: true,   // confetti on the candle blow-out / gift
  hearts: true,     // floating hearts
  sound: true,      // synthesised sound effects
  photos: ["photos/1.jpg", "photos/2.jpg"], // [] = no slideshow
  shareText: "Wish {name} a very Happy Birthday 🎂",
  message: [ /* one line per paragraph; {name} and {from} are substituted */ ]
};
```

…or override it from the URL without touching any code:

```
https://cyberphantomxpert.github.io/Birthday-surprise/?to=Sneha&from=Rahul
```

## Run it locally

With Python:

```bash
python3 -m http.server 8081
# open http://localhost:8081
```

Or with Node:

```bash
npm install
npm start
```

## Project structure

```
.
├── index.html          # single, valid document
├── css/
│   ├── layout.css      # small grid/utility layer (replaces Bootstrap 3)
│   ├── cake.css        # compiled from the original cake.less
│   └── extras.css      # countdown, gift, slideshow, share, theme
├── js/
│   ├── config.js       # <-- all the personal bits live here
│   ├── effects.js      # confetti, hearts, smoke, balloon pop, sound
│   ├── main.js         # the reveal animation
│   └── fireworks.js    # canvas fireworks
├── stylesheet.css      # the core animation styles
├── loading.css         # the loading spinner
├── photos/             # optional slideshow images
└── README.md
```

## Credits

Built on the classic open-source "Happy Birthday" CSS animation. Refactored,
modernised and made config-driven.
