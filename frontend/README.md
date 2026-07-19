# Portfolio — Video Editing / Motion Graphics / AI Creation

A personal portfolio site showcasing video editing reels, motion graphics, and AI-generated creative work.

## Structure

```
assets/        Static media (videos, images, fonts, audio)
css/           Stylesheets (reset, tokens, main)
js/            Scripts (entry, data loading, lazy video)
data/          Project data (projects.json)
pages/         Standalone sub-pages (project detail, blog)
src/           Component & section source (if using a build step)
docs/          Notes, shot lists, process docs
```

## Local dev

Open `index.html` directly, or serve with a static server:

```bash
npx serve .
# or
python -m http.server 8000
```

## Conventions

- Add new work as an entry in `data/projects.json`.
- Organize media by category under `assets/videos/`.
- Use `js/lazy-video.js` for autoplay-on-scroll videos.
