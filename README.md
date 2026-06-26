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
