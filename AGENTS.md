# Agent Instructions — Personal Website

This repository is a minimal personal website. All agents working here must respect the following constraints.

## Allowed technologies

- **HTML** (`index.html`) and **CSS** (`style.css`) only.
- No JavaScript — not inline, not in `<script>` tags, not in separate files.
- No frameworks, libraries, preprocessors, or build tools of any kind (no React, Vue, Tailwind, Sass, etc.).
- Static assets (images, fonts) are acceptable if the user explicitly requests them.

## Site structure

The page has three fixed sections. Do not add or remove sections without explicit user instruction.

| Section id   | Purpose |
|--------------|---------|
| `#about`     | Short personal bio written by the user. |
| `#current`   | The active 3-media list (≤ 1 book, 1 series, 1 game at any time). |
| `#completed` | Archive of finished medias with a comment and date. |

## Design rules

- **Palette**: earth tones only — linens, parchments, walnuts, siennas, muted greens and blues. No bright or saturated colours.
- **Contrast**: text must always be clearly readable against its background.
- **Layout**: single-column, centred, generous whitespace. No sidebars or grids.
- **Typography**: serif body font, monospace for tags and timestamps.
- No decorative icons, emoji, or illustrations unless the user explicitly asks.

## Content conventions

- Bio in `#about`: placeholder text, leave for the user to fill.
- Current media items: each `<li>` holds a `.media-type` tag (`book` | `series` | `game`) and a `.media-title`. Leave the title empty if the user has not provided one.
- The `#completed` section is divided into three `<div class="completed-group">` blocks (books, series, games), each with an `<h3 class="group-label {type}">` heading.
- Each completed entry inside a group needs: `.media-title`, a `<time class="completed-date">` element with a `YYYY-MM-DD` date, and a short italic `.completed-comment`. No per-item type tag — the group heading handles that.

## What NOT to do

- Do not add JavaScript.
- Do not add external CSS frameworks or CDN links.
- Do not restructure the page layout without being asked.
- Do not change the colour palette to non-earth tones.
- Do not add new sections on your own initiative.
