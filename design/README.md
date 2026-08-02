# WCBLR 2026 banner kit

Every WordCamp Bengaluru 2026 social banner, as a plain HTML file you can open in
a browser and export as a pixel-exact PNG. No build step and no design tool.

```bash
git clone https://github.com/wpblr/wcblr2026.git
cd wcblr2026/design
./serve.sh          # http://localhost:8420 — gallery of every banner
```

Serve it, don't open the files off disk: on `file://` URLs Chrome taints the
canvas with the local skyline image and the **Download PNG** button fails.

**Requirements.** `serve.sh` and the gallery need only `python3` and a browser.
The scripts in `tools/` additionally want a Chromium-based browser they can drive
headless (Chrome, Chromium, Brave or Edge — see `tools/find-chrome.sh` for where
they look), and `render.sh` needs Pillow (`pip install pillow`) for its crop.

This folder is self-contained and independent of the theme CSS in the rest of the
repo. It is not part of the Gulp build and it does not touch `main.min.css`.

## What's here

| | |
|---|---|
| `index.html` | gallery, live iframe previews of every banner, grouped by campaign, each with its own Download PNG |
| `banners/*.html` | one file per banner, each self-contained |
| `banners/banner.css` | the shared banner primitives (`.b-headline`, `.b-tag`, `.b-marquee`, …) |
| `banners/download-png.js` | the floating export button, incl. Google Fonts inlining. Also exposes `window.wcExportBanner()` → `{ name, dataUrl }`, which is how the gallery's per-card download works |
| `styles.css` + `tokens/` | the kit's colour / type / spacing / effect tokens |
| `assets/illustrations/` | the skyline art the banners draw on |
| `tools/` | headless render + layout smoke test |

Rendered PNGs are not tracked. `tools/render.sh` writes them to `exports/`, which
is gitignored — regenerate them rather than commit them.

The type here (Playfair Display / Hanken Grotesk / Space Mono) is deliberately not
the live site's Fraunces / JetBrains Mono. The banners are their own set and the
Playfair italic is the look they were signed off on, so don't "fix" them to match
the site.

## Making a banner

Copy the closest existing banner, edit the copy, then:

```bash
tools/check.sh "banners/Call for Speakers.html"     # layout smoke test
tools/render.sh "banners/Call for Speakers.html" exports/cfs.png 1080 1080
```

`check.sh` is the one that keeps these from shipping broken. It loads the banner
headless and reports:

- content taller than the canvas (silently clipped at the bottom)
- text clipped inside its own box
- anything straying past an edge or sliding under the gold marquee
- images that didn't load
- fonts that fell back to Georgia/Arial instead of Playfair/Hanken/Space Mono

`CHECK OK` means none of the above. It exits non-zero otherwise, so it works in a
loop: `tools/check.sh banners/*.html`.

`render.sh` gives the same PNG the browser button does, without a browser.

### Downloading from the gallery

Every card has **Download PNG** next to **Open**, so you can export without opening
the banner first. It does not re-implement anything: each banner exposes
`window.wcExportBanner()`, which resolves with `{ name, dataUrl }` and deliberately
does *not* download, so the gallery rasterises through the iframe and saves from the
parent. The font embedding and the export size stay in one place, `download-png.js`,
and the floating pill inside each banner calls the same function.

This reaches across into the iframes, so it only works over HTTP. On `file://` the
button says so rather than failing quietly.

### House rules for a new banner

- Start from `styles.css` + `banners/banner.css`; compose the existing classes
  rather than inventing new colours. Per-banner CSS goes in a `<style>` block in
  that file.
- First line is a comment naming the banner and its canvas, e.g.
  `<!-- Banner · 1080×1080 · Call for Speakers`, so the file says what it is
  before you open it.
- Square social is 1080×1080; the WordPress featured image / OG card is 1200×630.
- Add `data-download-name` to `.banner` and keep the two script tags at the
  bottom, or the export button won't appear and the gallery's Download PNG will
  not be able to reach the banner either.
- Icons come from the site's own set in `../assets/icons/`. Reuse those rather
  than drawing bespoke illustration next to the engraving.
- Copy rules: no em dashes, no AI filler, plain natural voice.

## Current banners

- **Call for Speakers** (1080×1080) and **Call for Speakers — Featured** (1200×630).
  Deadline **14 Sep 2026**, submissions at `bengaluru.wordcamp.org/call-for-speakers`.

  Composed as a printed bill rather than a UI: a ruled masthead, a `// call_for_speakers`
  kicker, then the whole top half given to one piece of type — "Call for" in upright
  Playfair black over a very large crimson Playfair italic. Everything else stays quiet.

  The idea is **the blank speaker pass**: a ticket laid over the city with the talk
  title left empty, a dashed rule waiting to be filled, a perforated tear-off stub
  carrying the date and venue, and the theme's gold rubber stamp for the deadline.
  It is drawn on translucent parchment (`rgba(248,244,236,.91)`) and notched at the
  perforation with a composited radial-gradient mask, so the engraving reads straight
  through the pass and shows at full strength in the punched holes. The illustration
  is never covered.

  A crimson **"Submissions are live"** flag sits on the kicker row, because a call
  needs to say it is open the moment someone glances at it, and the gold band at the
  foot carries the one action instead of a generic ticker, ruled 2px espresso top and
  bottom the way the live site's marquee is.

  The mark top right is the **site's own megaphone icon** — Lucide `megaphone` at
  stroke width 2, the same file as `../assets/icons/megaphone.svg`, in the site's
  badge treatment (a tinted disc with the icon at ~45% of it). A megaphone reads as a
  call going out, where a mic reads as someone already speaking. The pass's blank line
  is marked with the site's `square-pen`, for fill this in. Both are deliberately not a
  photo and not hand-drawn: a bespoke illustration read as amateur next to the
  engraving, and no usable speaker-on-stage photo exists. Every photo to hand is a
  posed group shot, and putting an identifiable attendee on a call for speakers would
  imply they are speaking.

  Only Noto Sans Kannada is loaded per-banner, because the tokens carry no Kannada face.

  Watch out when editing: the mask lives on `.s-pass`, and anything that must overhang
  it (the stamp) has to sit in `.s-passwrap` outside the masked element, or it gets
  clipped. The masks do survive the PNG export; that was verified by rendering the
  exported image back into the page and screenshotting it.

- **Call for Sponsors** and **Call for Sponsors — Featured**, the pair the rest of
  the kit is calibrated against.

- **Call for Media Partners** (1080×1080) and **Call for Media Partners — Featured**
  (1200×630), for the call at `bengaluru.wordcamp.org/call-for-media-partners`.
  Deadline **31 Aug 2026**.

  Headline shape is the speaker banner's on purpose — upright Playfair black over a
  crimson italic — because this is the same kind of thing, a call whose name has to be
  readable at thumbnail size. The two objects are what make it its own poster.

  Top right, the **press credential**: the only dark surface in the kit, because this is
  the only banner whose offer literally is a pass hung round your neck. A card rather
  than a disc keeps it apart from the speaker badge and the guide's arrival stamp, so
  the set reads as related posters rather than one template with the words swapped. The
  punched lanyard slot is a pill filled with the page colour, so it reads as a hole
  rather than a shape. The glyph is the site's own `id-card-lanyard.svg`, recoloured
  gold for the dark ground.

  Along the foot, **the deal**: a two-sided ledger, YOU BRING against WE BRING, because
  the whole proposition is a trade with no money in it. Both columns are lifted from the
  post — the left from `who_can_apply` and `how_we_pick`, the right from `what_you_get`
  — with the post's own icons (`square-pen`, `mic`, `hand-helping` in crimson;
  `ticket`, `users`, `archive` in deep gold). Same translucent parchment as the speaker
  pass, so the engraving reads through it. The swap disc straddling the seam is the
  equivalent of the pass's perforation notch: a bit of hardware that says what the object
  is without a word of explanation.

  The crimson flag carries **the weekend, 21–22 November**, rather than announcing the
  call is open. Applications do not open until 10 August, so a live/open claim would date
  the asset, and the gold stamp already has the application deadline — which left the
  banner never saying when the camp actually is, the first thing an editor needs in order
  to decide whether to send anyone.

  Do not put the funding arrangement on that flag. Both attempts at it were rejected:
  "no money either way" leads with an absence and reads like an apology, and "coverage
  for access" is the name of a practice journalists criticise, so it reads worse than
  saying nothing. The post makes the trade plain in its opening note and the ledger below
  shows it; the flag does not need to argue the point.

  Watch out when editing: the swap disc is centred on the seam and eats half its width
  into each column, so the right column carries a much deeper `padding-left` than the
  left. On the featured variant the skyline is drawn bigger and higher than the guide
  banner's (`width: 690px; bottom: 76px`), because the ledger is a taller object than
  that banner's route strip and the default placement leaves only a sliver of the
  engraving showing.

- **Travel and City Guide** (1080×1080) and **Travel and City Guide — Featured**
  (1200×630), for the guide post at `bengaluru.wordcamp.org/travel-and-city-guide`.

  Two objects carry it. Top right, an **arrival stamp**: a gold rubber disc, dashed
  espresso border, `ARRIVALS / BLR / 21–22 Nov`. It carries the whole weekend rather
  than a single arrival date, because Saturday is Contributor Day and so a programme
  day, not a travel day. It is deliberately not the badge disc the speaker banner
  uses, so the kit reads as a set of related posters rather than one template with
  the words swapped, and it is the only thing on the banner carrying the date.

  Along the foot, **the strip**: the four ways of getting around, in the same order
  and with the same icons as the `getting_around` cards in the post (`tram-front`,
  `auto-rickshaw`, `bus`, `footprints` from `../assets/icons/`, recoloured to
  crimson because the post's greens are not tokens in this kit). It is drawn on the
  same translucent parchment as the speaker pass, so the engraving reads through it,
  and the last leg is tinted gold because it is the destination: ten minutes on foot.

  The gold flag on the kicker row is the weather, which is the first thing a traveller
  actually wants, and the rubber stamp across the strip is *swalpa adjust maadi*,
  which is the guide's own joke.

  Watch out when editing: the strip fills from its own top edge, unlike the speaker
  pass whose stub is vertically centred. The stamp therefore needs a deeper negative
  `top` than the speaker banner's, or it lands on the last leg's icon.

- **What Happens at a WordCamp** (1080×1080) and **What Happens at a WordCamp —
  Featured** (1200×630), for the first timer guide at
  `bengaluru.wordcamp.org/what-happens-at-a-wordcamp`.

  Top right, **a steel tumbler standing in its davara**. The set had a ticket, a
  tier strip, a disc, a dark card and a ballot, and no vessel, so a vessel is
  what this one gets. It is also the honest answer to what a first timer takes
  away from the two days: the talks are on the schedule and the coffee is where
  the part people remember happens, so the coffee is the poster. It is drawn as
  one SVG rather than composed from divs, because a tapered vessel in CSS is
  three overlapping pseudo elements that drift the moment it is rescaled for the
  featured variant; here the featured is a one line width change. Dark fill and
  the only drop shadow on the canvas, per the one focal point rule.

  Along the foot, **the day as bars**: EARLY, MORNING, MIDDAY, AFTERNOON, LATE,
  with MIDDAY and LATE filled gold and MIDDAY drawn nearly twice as wide as its
  neighbours. Those are the two stretches nobody puts on a schedule, and the
  width difference makes the point before the legend does. It is the post's whole
  argument as one object with no sentence attached.

  **There is no gold stamp on this pair, deliberately.** The campaign has no
  deadline and no call that opens, and the stamp is a cutoff device: putting one
  on would have invented a date. The crimson pill on the kicker row is the only
  date claim either banner makes. The marquee carries the post URL rather than
  the post's CTA, because the CTA is a WhatsApp invite link and its hash is
  unreadable in uppercase mono.

  Watch out when editing: the vessel's draw order is the whole trick. Bowl, then
  the far lip, then the tumbler, then the near lip painted over the tumbler's
  base. Move the near lip earlier and the tumbler sits in front of the dish
  instead of in it. The first draft had a wide shallow trapezoid for the davara
  and rendered as a paper boat; an elliptical top edge is what makes it a dish.
  The SVG `viewBox` is cropped to `32 -4 156 212` so the vessel fills its own
  frame, which means the CSS `width` is close to the object's real width. Widen
  the viewBox and the object shrinks without the number changing. On the featured
  the object caption is dropped: at 630 tall it lands on the engraving and goes
  unreadable, and the featured skyline needed `width: 700px; right: -70px` rather
  than the guide's 600, to push the food montage off the right edge instead of
  piling it under the day card.

  One deliberate echo: the engraving already carries two steel tumblers and a
  dosa plate at its far right. The hero object pulls one of them out and makes it
  the subject.

- **Community Poll** (1080×1080), a ballot asking where your WordPress time goes.
