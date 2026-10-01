# wcblr2026

Remote CSS for WordCamp Bengaluru 2026.

## Build

Source styles live in `assets/scss/` and compile to `main.min.css`.

```bash
npm install
npm run build
```

Watch for changes during development:

```bash
npm run watch
```

## Preview on the local site

Pushing `main.min.css` changes the live site as soon as Remote CSS is re-saved, so
look at a change locally first. The organizers' workspace keeps a wp-env copy of
bengaluru.wordcamp.org/2026 next to this repo, in `wordcamp/website/local-site/`.
It runs on <http://localhost:8890/2026/> (admin at `/wp-admin/`, `admin` / `password`)
with the live site's WordPress, theme, plugins, templates, global styles and content.

It serves **this folder's `main.min.css`** in place of Remote CSS, at the same URL and
in the same slot in the cascade, with every `url()` emptied the way the live sanitiser
empties it. So the local site shows the unpushed build, and never shows something
the sanitiser would strip.

```bash
cd ../local-site
npm start                                      # needs Docker running
npm run build --prefix ../wcblr2026            # or leave `npm run watch` going here
npm run preview -- posts/<slug>.html           # or pages/<slug>.html
npm run shot -- /<slug>/                       # screenshots at 1440 and 390 into shots/
npm run shot -- /<slug>/ --width 1440,768,390,320
npm run shot -- /<slug>/ --live                # the same page on production, to compare
```

- **A CSS-only change** needs no preview step: rebuild, then reload the page or re-run
  `shot`. No restart.
- **`preview`** puts a block-markup file from `../posts/` or `../pages/` onto the local
  site, using the file name as the slug. An existing slug keeps its live template,
  category and featured image. A new one gets the Default template unless you add
  `template=<slug>`, and a title from the file name unless you add `title="..."`.
  It warns about markup outside any block, which would also fail the paste.
- **`shot`** uses Playwright, so 390 is a real 390px viewport with fluid type.
  Headless Chrome on its own clamps at 485px and gives a misleading phone render.
- **Not reproduced locally:** the footer newsletter box, the cookie banner, and CampTix
  and the `wordcamp/*` speaker and session blocks, which render empty. Check those on
  live.

Media is not copied: `/2026/files/...` is fetched from live on first use and cached.
To refresh templates, styles and content from live, see `local-site/README.md`.

## Shipping

1. `npm run build` and check the change on the local site.
2. Commit `main.min.css` with the SCSS, and push.
3. In wp-admin on live, **Appearance → Remote CSS**, update it. Until that re-save,
   live keeps serving the old copy.

## SCSS structure

```
assets/scss/
├── main.scss              # Entry point — imports in cascade order
├── base/                  # Global resets & typography
├── layout/                # Header, footer, skyline
├── sections/              # Homepage block sections
├── sponsors/              # Sponsor grids, tiers, CTAs
├── speakers/              # Speaker & organizer grids
├── sessions/              # Session detail blocks
├── forms/                 # Jetpack contact forms
├── content/               # Post/page content utilities
└── pages/                 # 404, coming soon
```

Import order in `main.scss` mirrors the original flat `style.css` cascade. Do not reorder imports without checking for specificity side-effects.

## Files

| File | Purpose |
|------|---------|
| `assets/scss/main.scss` | Entry point |
| `main.min.css` | Compiled, minified output (deploy this) |
| `style.css.backup` | Pre-Sass backup of the original flat CSS |

## Remote CSS URL

```
https://raw.githubusercontent.com/wpblr/wcblr2026/main/main.min.css
```
