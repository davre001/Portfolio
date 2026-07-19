/**
 * MenuPreview — a miniature "broadcast monitor" that lives at the bottom of the
 * StaggeredMenu panel. As the user hovers a menu item, the monitor switches
 * channels and plays a themed, looping scene:
 *
 *   • space      → OUTERSPACE : starfield, orbiting planets, a passing comet
 *   • ai         → AI STUDIO  : a shuffling deck of cinematic frames
 *   • tutorials  → TUTORIALS  : a scrubbing video player + scrolling filmstrip
 *
 * With nothing hovered it sits on an "idle" standby channel (colour bars +
 * NO SIGNAL). All scenes are stacked and cross-fade via CSS; the active one is
 * chosen with the `data-scene` attribute. A viewfinder chrome overlay (REC dot,
 * channel id, live timecode, corner brackets) plus CRT scanlines/vignette sell
 * the "watching a monitor" idea. Motion is pure CSS so it's cheap; inactive
 * scenes have their animations paused. Honours prefers-reduced-motion via CSS.
 */

import { useEffect, useRef } from 'react';

export type PreviewScene = 'space' | 'ai' | 'tutorials';

interface MenuPreviewProps {
  /** Currently hovered scene, or null for the idle standby channel. */
  scene: PreviewScene | null;
}

/** Cinematic frames reused from the footer pool for the AI deck + filmstrip. */
const FRAMES = [
  '/assets/footer/footer-1.jpg',
  '/assets/footer/footer-2.jpg',
  '/assets/footer/footer-3.jpg',
  '/assets/footer/footer-4.jpg',
  '/assets/footer/footer-5.jpg',
  '/assets/footer/footer-6.jpg',
  '/assets/footer/footer-7.jpg',
  '/assets/footer/footer-8.jpg',
];

const CHANNELS: Record<'idle' | PreviewScene, { id: string; caption: string }> = {
  idle: { id: 'CH.00 · STANDBY', caption: 'Hover a channel' },
  space: { id: 'CH.01 · OUTERSPACE', caption: 'Worlds beyond the frame' },
  ai: { id: 'CH.02 · AI.STUDIO', caption: 'Frames born from code' },
  tutorials: { id: 'CH.03 · TUTORIALS', caption: 'Learn the craft' },
};

export default function MenuPreview({ scene }: MenuPreviewProps) {
  const key = scene ?? 'idle';
  const tcRef = useRef<HTMLSpanElement | null>(null);
  const typeRef = useRef<HTMLSpanElement | null>(null);

  // Measure the standby prompt's natural width and expose it as --tw so the
  // typewriter keyframe reveals to exactly that width (caret stays snug, text
  // never clips regardless of font/letter-spacing).
  useEffect(() => {
    const el = typeRef.current;
    if (!el) return;
    const measure = () => {
      el.style.setProperty('--tw', `${Math.ceil(el.scrollWidth)}px`);
    };
    measure();
    window.addEventListener?.('resize', measure);
    return () => window.removeEventListener?.('resize', measure);
  }, []);

  // Live SMPTE-style timecode (HH:MM:SS:FF @ 24fps), written straight to the DOM
  // via rAF so the ticking never re-renders React. Runs while the monitor is
  // mounted (i.e. while the menu is open).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    const start = performance.now();
    const pad = (n: number, w = 2) => String(Math.floor(n)).padStart(w, '0');

    const tick = () => {
      const totalFrames = ((performance.now() - start) / 1000) * 24;
      const f = totalFrames % 24;
      const s = (totalFrames / 24) % 60;
      const m = (totalFrames / 24 / 60) % 60;
      const h = (totalFrames / 24 / 3600) % 24;
      if (tcRef.current) {
        tcRef.current.textContent = `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`;
      }
      if (!reduce) raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="mprev" data-scene={key} aria-hidden="true">
      <div className="mprev__frame">
        {/* ── Idle standby: black screen, NO SIGNAL + typewriter prompt ── */}
        <div className="mprev__scene mprev__scene--idle">
          <div className="mprev__standby">
            <span className="mprev__standby-dot" />
            <span className="mprev__nosignal">NO SIGNAL</span>
            <span className="mprev__type" aria-hidden="true">
              <span className="mprev__type-text" ref={typeRef}>Please hover on a channel</span>
              <span className="mprev__type-caret" />
            </span>
          </div>
        </div>

        {/* ── OUTERSPACE: 2D rocket climbing past stars + asteroids ── */}
        <div className="mprev__scene mprev__scene--space">
          <div className="mprev__stars" />
          <div className="mprev__stars mprev__stars--far" />
          <div className="mprev__streaks" />
          {/* drifting asteroids */}
          <span className="mprev__aster mprev__aster--1" />
          <span className="mprev__aster mprev__aster--2" />
          <span className="mprev__aster mprev__aster--3" />
          <span className="mprev__planet mprev__planet--moon" />
          {/* the rocket, bobbing as the world scrolls down beneath it */}
          <div className="mprev__rocket">
            <span className="mprev__rocket-body">
              <span className="mprev__rocket-window" />
              <span className="mprev__rocket-fin mprev__rocket-fin--l" />
              <span className="mprev__rocket-fin mprev__rocket-fin--r" />
            </span>
            <span className="mprev__flame" />
          </div>
        </div>

        {/* ── AI STUDIO: shuffling deck of generated frames ── */}
        <div className="mprev__scene mprev__scene--ai">
          <div className="mprev__deck">
            {FRAMES.slice(0, 5).map((src, i) => (
              <div
                key={src}
                className="mprev__card"
                style={{ ['--i' as string]: i, backgroundImage: `url(${src})` }}
              />
            ))}
          </div>
          <div className="mprev__scanbeam" />
        </div>

        {/* ── TUTORIALS: player + scrubbing timeline + filmstrip ── */}
        <div className="mprev__scene mprev__scene--tutorials">
          <div
            className="mprev__player"
            style={{ backgroundImage: `url(${FRAMES[2]})` }}
          >
            <span className="mprev__play" />
          </div>
          <div className="mprev__strip">
            {[...FRAMES, ...FRAMES].map((src, i) => (
              <span key={i} style={{ backgroundImage: `url(${src})` }} />
            ))}
          </div>
          <div className="mprev__timeline">
            <span className="mprev__progress" />
            <span className="mprev__playhead" />
          </div>
        </div>

        {/* ── Viewfinder chrome + CRT overlays ── */}
        <div className="mprev__crt" />
        <div className="mprev__vignette" />
        <div className="mprev__bracket mprev__bracket--tl" />
        <div className="mprev__bracket mprev__bracket--tr" />
        <div className="mprev__bracket mprev__bracket--bl" />
        <div className="mprev__bracket mprev__bracket--br" />

        <div className="mprev__hud mprev__hud--top">
          <span className="mprev__rec">
            <span className="mprev__rec-dot" /> REC
          </span>
          <span className="mprev__tc" ref={tcRef}>00:00:00:00</span>
        </div>
        <div className="mprev__hud mprev__hud--bottom">
          <span className="mprev__chan">{CHANNELS[key].id}</span>
          <span className="mprev__caption">{CHANNELS[key].caption}</span>
        </div>
      </div>
    </div>
  );
}
