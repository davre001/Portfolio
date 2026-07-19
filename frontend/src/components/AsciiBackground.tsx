import { useEffect, useRef } from 'react';

/**
 * "Vignette Bloom" ASCII/mosaic background — a Canvas2D reimplementation of the
 * 21st.dev ascii effect, tuned to this preset:
 *   renderMode: mosaic · cellSize 16 · coverage 100
 *   brightness +12 · contrast 115 · saturation 100
 *   post-fx: vignette 38, bloom 25
 *   animation: wave · speed 100 · intensity 60
 *
 * The source is a looping video: each frame is sampled down to one pixel per
 * grid cell (fast average colour), colour-adjusted, then each cell is drawn as
 * a mosaic block with a travelling sine wave modulating its brightness + size.
 * Bloom (additive blurred self-copy) and a radial vignette finish the frame.
 *
 * Rendered behind the page text as a decorative layer; honours
 * prefers-reduced-motion (samples a single paused frame, no wave).
 */

interface Props {
  /** Source video to sample (same-origin so frames are readable). */
  src?: string;
  className?: string;
}

const CELL = 16;            // cellSize (CSS px)
const BRIGHTNESS = 0.12;    // +12%
const CONTRAST = 1.15;      // 115%
const VIGNETTE = 0.38;      // pfx.vignette.intensity / 100
const BLOOM = 0.25;         // pfx.bloom.intensity / 100
const ANIM_SPEED = 1.0;     // animSpeed 100 / 100
const ANIM_INTENSITY = 0.6; // animIntensity 60 / 100

export default function AsciiBackground({
  src = 'assets/videos/tutorials-source.mp4',
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Offscreen "sampling" canvas: video frame scaled to cols×rows so each
    // pixel is a cell's average colour. Re-sampled every frame.
    const sample = document.createElement('canvas');
    const sctx = sample.getContext('2d', { willReadFrequently: true })!;

    // Looping, muted, inline video used purely as a pixel source (never shown).
    const video = document.createElement('video');
    video.src = import.meta.env.BASE_URL + src;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.preload = 'auto';

    let ready = false;
    let cols = 0;
    let rows = 0;
    let cellPx = CELL;
    // Per-cell adjusted colour + luminance (row-major), rebuilt each frame.
    let cr = new Uint8ClampedArray(0);
    let cg = new Uint8ClampedArray(0);
    let cb = new Uint8ClampedArray(0);
    let lum = new Float32Array(0);

    let raf = 0;
    let W = 0;
    let H = 0;

    const adjust = (v: number) => {
      // brightness (multiplicative) then contrast around mid-grey.
      let x = v * (1 + BRIGHTNESS);
      x = (x - 128) * CONTRAST + 128;
      return x < 0 ? 0 : x > 255 ? 255 : x;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      W = Math.max(1, Math.floor(rect.width * dpr));
      H = Math.max(1, Math.floor(rect.height * dpr));
      canvas.width = W;
      canvas.height = H;

      cellPx = CELL * dpr;
      cols = Math.ceil(W / cellPx);
      rows = Math.ceil(H / cellPx);
      sample.width = cols;
      sample.height = rows;

      const n = cols * rows;
      cr = new Uint8ClampedArray(n);
      cg = new Uint8ClampedArray(n);
      cb = new Uint8ClampedArray(n);
      lum = new Float32Array(n);
    };

    // Sample the current video frame into the per-cell colour arrays, with a
    // "cover" fit so the frame fills the grid without distortion.
    const sampleFrame = () => {
      if (!video.videoWidth || !video.videoHeight) return;
      const ia = video.videoWidth / video.videoHeight;
      const ga = cols / rows;
      let sw: number, sh: number, sx: number, sy: number;
      if (ia > ga) {
        sh = video.videoHeight;
        sw = sh * ga;
        sx = (video.videoWidth - sw) / 2;
        sy = 0;
      } else {
        sw = video.videoWidth;
        sh = sw / ga;
        sx = 0;
        sy = (video.videoHeight - sh) / 2;
      }
      sctx.drawImage(video, sx, sy, sw, sh, 0, 0, cols, rows);
      const data = sctx.getImageData(0, 0, cols, rows).data;
      const n = cols * rows;
      for (let i = 0; i < n; i++) {
        const r = adjust(data[i * 4]);
        const g = adjust(data[i * 4 + 1]);
        const b = adjust(data[i * 4 + 2]);
        cr[i] = r;
        cg[i] = g;
        cb[i] = b;
        lum[i] = (0.299 * r + 0.587 * g + 0.114 * b) / 255; // 0..1
      }
    };

    const draw = (time: number) => {
      sampleFrame();

      // 1. solid dark background (bgMode: solid, bgOpacity 90)
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#0a0a0b';
      ctx.fillRect(0, 0, W, H);

      // 2. mosaic cells with a travelling wave
      const phase = reduce ? 0 : time * 0.0022 * ANIM_SPEED;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const l = lum[i];

          // wave: brightness + size ripple across the grid (animStyle: wave)
          const wave = reduce ? 0 : Math.sin((x + y) * 0.45 - phase);
          const bMod = 1 + wave * ANIM_INTENSITY * 0.5;

          const fill = Math.max(0.06, Math.min(1, (0.35 + l * 0.85) * bMod));
          const size = cellPx * (0.62 + l * 0.36) * (reduce ? 1 : 1 + wave * ANIM_INTENSITY * 0.12);
          const off = (cellPx - size) / 2;

          const rr = Math.round(cr[i] * fill);
          const gg = Math.round(cg[i] * fill);
          const bb = Math.round(cb[i] * fill);
          ctx.fillStyle = `rgb(${rr},${gg},${bb})`;
          ctx.fillRect(x * cellPx + off, y * cellPx + off, size, size);
        }
      }

      // 3. bloom — additive blurred copy of what we just drew
      if (BLOOM > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = BLOOM;
        ctx.filter = `blur(${Math.round(cellPx * 1.1)}px) brightness(1.4)`;
        ctx.drawImage(canvas, 0, 0, W, H);
        ctx.restore();
        ctx.filter = 'none';
      }

      // 4. vignette — radial darken toward the edges
      if (VIGNETTE > 0) {
        const g = ctx.createRadialGradient(
          W / 2, H / 2, Math.min(W, H) * 0.28,
          W / 2, H / 2, Math.max(W, H) * 0.72
        );
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, `rgba(0,0,0,${VIGNETTE + 0.35})`);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }

      // 5. global dim — settle the field into the site's dark theme so it reads
      //    as a background layer rather than a bright foreground.
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(10, 10, 11, 0.42)';
      ctx.fillRect(0, 0, W, H);
    };

    const loop = (t: number) => {
      draw(t);
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      ready = true;
      resize();
      if (reduce) {
        // static: seek a frame, draw once.
        video.currentTime = Math.min(0.1, video.duration || 0.1);
        video.addEventListener('seeked', () => draw(0), { once: true });
      } else {
        video.play().catch(() => {
          // Autoplay blocked → draw the poster frame statically.
          draw(0);
        });
        raf = requestAnimationFrame(loop);
      }
    };

    video.addEventListener('loadeddata', start, { once: true });

    const ro = new ResizeObserver(() => {
      if (!ready) return;
      resize();
      if (reduce) draw(0);
    });
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [src]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
