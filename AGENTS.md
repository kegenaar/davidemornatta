# Agent Instructions — Personal Website

This repository is a minimal personal website. All agents working here must respect the following constraints.

## Allowed technologies

- **HTML**, **CSS** (`style.css`) and **JavaScript** only.
- No frameworks, libraries, preprocessors, or build tools of any kind (no React, Vue, Tailwind, Sass, etc.).
- Static assets (images, fonts) are acceptable if the user explicitly requests them.
- No web fonts and no CDN links: system stacks only.

## Design rules

A board on cream paper: Bauhaus geometry for structure, serif for reading.

- **Palette**: light only (`color-scheme: only light`). Ground `#f5f2e7` (cream), ink `#0d0d0d`, muted `#5f5f5f`, accent `#de301e`. Marks: red `#de301e`, blue `#0b5cab`, yellow `#ffcf33`. No dark mode. Do not go back to pure white.
- **Type**: grotesk (`Helvetica Neue`, Helvetica, Roboto, system-ui, Arial) for the name, labels, stats, and UI. Georgia (then `Times New Roman`, serif) for bio, articles, and lists. Mono only for data (gene symbols). Titles are uppercase grotesk, tight tracking, weight 700. Labels are 11px grotesk, uppercase, `letter-spacing: 0.12em`.
- **Rules**: 1px solid ink. The page is a `.board` — a 12-column grid with a black frame. Content lives in `.cell` compartments; seams are the borders, not `<hr>`.
- **Links**: inherit ink; the accent is the underline (1.5px, `text-decoration-skip-ink: none`), not the text colour. Hover turns the text accent.
- **Emphasis**: a key word in an `h1` may sit in an accent box (`em` → white on `#de301e`).
- **Contrast**: text must always be clearly readable. Yellow is a mark, not small text; black on yellow if type sits on it.
- No decorative icons, emoji, or illustrations unless the user explicitly asks.

## Layout

- Home: 12-column board. Name | stats is 5 / 7. Things | Interesting Stuff is 6 / 6. Contact lives in the stats (LinkedIn, Mail, Southwind) — no extra footer. Below `1080px` every cell spans 12 and stacks; left borders drop.
- Inner pages: `.board.article`, cells span 12.
- Do not add sidebars. Do not add new sections on your own initiative.

## What NOT to do

- Do not add external CSS frameworks or CDN links.
- Do not restructure the page layout without being asked.
- Do not revert to a pure-white poster, or to a centred single-column linen page with no board.
- Do not add new sections on your own initiative.
