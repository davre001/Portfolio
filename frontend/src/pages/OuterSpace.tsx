/**
 * /outerspace — a warp-drive flight that hosts the studio's manifesto, reel and
 * contact.
 *
 * Scroll is the throttle: scroll velocity (not position) drives a `speed` value
 * that feeds the WebGL starfield's shader, so stars stretch into streaks as you
 * move and settle back to a drift when you stop. Speed lives in a ref, never in
 * state — it updates every frame and would otherwise re-render the whole page
 * 60x a second. The HUD reads it by writing straight to the DOM for the same
 * reason.
 *
 * Content sits in normal scrolling flow above the fixed canvas, so the page
 * stays keyboard-navigable and readable with WebGL disabled.
 */

import { useEffect, useRef, useState } from 'react';
import projectsData from '../../data/projects.json';
import type { Project } from '../types';
import AppLink from '../components/AppLink';
import WarpField from '../components/WarpField';

const projects = projectsData as unknown as Project[];

const CHAPTERS = [
  {
    id: 'manifesto',
    marker: 'CH.01',
    title: 'No frame is fixed',
    body:
      'Every project starts as a black screen. We treat that emptiness as the point — not a problem to fill, but a space to build in. Motion, type and light are the only tools, and restraint is the hardest one to use well.',
  },
  {
    id: 'method',
    marker: 'CH.02',
    title: 'Built, not decorated',
    body:
      'Edits are cut to the beat, but the beat comes from the story. We design in the timeline: rhythm first, polish second, and nothing on screen that has not earned the pixel it sits on.',
  },
  {
    id: 'range',
    marker: 'CH.03',
    title: 'From product to unreal',
    body:
      'Product spots, title sequences, generative experiments. Different surfaces, the same discipline — read it in a thumbnail, hold it on a cinema screen.',
  },
];

/** Longest-tail of recent work, used as the in-flight reel. */
const REEL = projects.slice(0, 6);

export default function OuterSpace() {
  const speedRef = useRef(0);
  const hudSpeedRef = useRef<HTMLSpanElement>(null);
  const hudBarRef = useRef<HTMLSpanElement>(null);
  const hudDistRef = useRef<HTMLSpanElement>(null);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const t = setTimeout(() => setBooted(true), 1600);
    return () => clearTimeout(t);
  }, []);

  // Scroll velocity → throttle. Decays toward zero so the ship coasts.
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let lastY = window.scrollY;
    let velocity = 0;
    let distance = 0;
    let raf = 0;

    const onScroll = () => {
      const y = window.scrollY;
      velocity += Math.abs(y - lastY);
      lastY = y;
    };

    const tick = () => {
      velocity *= 0.9;
      const target = reduce ? 0 : Math.min(velocity / 55, 1);
      // Ease toward the target so throttle changes feel like mass, not a switch.
      speedRef.current += (target - speedRef.current) * 0.09;
      if (speedRef.current < 0.0005) speedRef.current = 0;

      distance += speedRef.current * 0.9;

      if (hudSpeedRef.current) {
        hudSpeedRef.current.textContent = `${(speedRef.current * 0.99).toFixed(2)}c`;
      }
      if (hudBarRef.current) {
        hudBarRef.current.style.transform = `scaleX(${speedRef.current.toFixed(3)})`;
      }
      if (hudDistRef.current) {
        hudDistRef.current.textContent = `${distance.toFixed(1)} AU`;
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className={`osp${booted ? ' is-booted' : ''}`}>
      <div className="osp__sky" aria-hidden="true">
        <WarpField speedRef={speedRef} />
      </div>

      {/* Flight instrumentation — decorative, mirrors the menu monitor's language */}
      <div className="osp__hud" aria-hidden="true">
        <div className="osp__hud-row">
          <span className="osp__hud-label">Warp</span>
          <span className="osp__hud-value" ref={hudSpeedRef}>0.00c</span>
        </div>
        <div className="osp__hud-bar">
          <span className="osp__hud-fill" ref={hudBarRef} />
        </div>
        <div className="osp__hud-row osp__hud-row--dim">
          <span className="osp__hud-label">Dist</span>
          <span className="osp__hud-value" ref={hudDistRef}>0.0 AU</span>
        </div>
      </div>

      <main className="osp__flow">
        <section className="osp__hero">
          <span className="osp__eyebrow">DAVRE Studio · Transmission 01</span>
          <h1 className="osp__title">
            <span>Outer</span>
            <span className="osp__title-accent">space</span>
          </h1>
          <p className="osp__tagline">
            Worlds beyond the frame. Scroll to open the throttle.
          </p>
          <span className="osp__scroll-cue">
            <span className="osp__scroll-cue-dot" />
            Scroll to engage
          </span>
        </section>

        {CHAPTERS.map((chapter) => (
          <section className="osp__chapter" key={chapter.id} id={chapter.id}>
            <span className="osp__marker">{chapter.marker}</span>
            <h2 className="osp__chapter-title">{chapter.title}</h2>
            <p className="osp__chapter-body">{chapter.body}</p>
          </section>
        ))}

        <section className="osp__reel" aria-labelledby="osp-reel-title">
          <span className="osp__marker">CH.04</span>
          <h2 className="osp__chapter-title" id="osp-reel-title">
            Cargo manifest
          </h2>
          <p className="osp__chapter-body">
            Selected work travelling with us. Each one opens its own log.
          </p>

          <ul className="osp__manifest">
            {REEL.map((project, i) => (
              <li key={project.id}>
                <AppLink className="osp__cargo" to={`/project/${project.id}`}>
                  <span className="osp__cargo-index">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="osp__cargo-main">
                    <span className="osp__cargo-title">{project.title}</span>
                    <span className="osp__cargo-role">{project.role}</span>
                  </span>
                  <span className="osp__cargo-year">{project.year}</span>
                  <span className="osp__cargo-go" aria-hidden="true">→</span>
                </AppLink>
              </li>
            ))}
          </ul>
        </section>

        <section className="osp__contact" aria-labelledby="osp-contact-title">
          <span className="osp__marker">CH.05</span>
          <h2 className="osp__chapter-title" id="osp-contact-title">
            Open a channel
          </h2>
          <p className="osp__chapter-body">
            Got something that should not look like everything else? Send the
            brief — we will send back a direction.
          </p>
          <div className="osp__actions">
            <a className="btn btn--ghost osp__cta" href="mailto:hello@davrestudios.com">
              Start a transmission
            </a>
            <AppLink className="osp__back" to="/">
              ← Back to home
            </AppLink>
          </div>
        </section>
      </main>
    </div>
  );
}
