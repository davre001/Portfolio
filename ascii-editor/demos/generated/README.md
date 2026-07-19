# demos/generated

Drop the source photo here as **`ref-029.webp`** to match the reference path:

```
/ascii-editor/demos/generated/ref-029.webp
```

The renderer automatically tries to load `./demos/generated/ref-029.webp` on startup.
If it is missing (or blocked by `file://` canvas tainting), the app falls back to a
procedurally generated sample scene so the effect always runs.

You can also just **drag & drop** any image onto the canvas, or use the
**Load photo** button — both load via `FileReader` (data URL) so `getImageData`
works without a server.

> Tip: loading a local `file://` image into a canvas can taint it in some browsers,
> which breaks pixel sampling. For the real `ref-029.webp`, serve the folder over
> HTTP, e.g. `npx serve ascii-editor` or `python -m http.server` from this folder.
