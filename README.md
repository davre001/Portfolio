# Davre Portfolio

Personal portfolio of a video editor, motion designer & AI creator — showcasing reels, motion graphics, and AI-generated creative work.

Live site is built from `frontend/` and deployed to GitHub Pages.

## Repository layout

```
frontend/       Main portfolio site — React + TypeScript + Vite + Tailwind
ascii-editor/   Standalone ASCII art editor experiment
Public/         Shared media (demo reel, cover image)
.github/        GitHub Actions (Pages deploy)
```

## Frontend

The site is a single-page app with lightweight client-side routing (`home`, `/project/:id`, and standalone pages like `/outerspace`, `/ai-studio`, `/tutorials`). It uses React Three Fiber, GSAP, and Motion for the visuals and animations.

### Local development

```bash
cd frontend
npm install
npm run dev        # start Vite dev server at http://127.0.0.1:5173
```

### Build & preview

```bash
npm run build      # type-check + production build to frontend/dist
npm run preview    # serve the production build locally
```

## ASCII editor

A separate experiment under `ascii-editor/`. Serve it with:

```bash
cd ascii-editor
node serve.js
```

## Deployment

Pushes to `main` trigger `.github/workflows/deploy.yml`, which builds `frontend/`
and publishes `frontend/dist` to GitHub Pages. The Vite `base` is set to `/` for a
root-domain deploy; `public/404.html` handles SPA deep-link restores since Pages
has no server-side rewrites.

## Tech stack

- React 18 + TypeScript
- Vite 6
- Tailwind CSS 4
- Three.js / React Three Fiber / drei
- GSAP + Motion
- Playwright (verification scripts)
