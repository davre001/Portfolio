import { useEffect, useState } from 'react';

/** Timed glass banner announcing the site's in-development state. Appears once
 *  the loader has cleared (Loader.tsx: 1800ms hold + 700ms fade), holds for 7s,
 *  then slides back out. */
const AFTER_LOADER = 2600;
const VISIBLE = 7000;
const EXIT = 700; // must cover the longest transition on `.notice`

export default function SiteNotice() {
  const [phase, setPhase] = useState<'wait' | 'enter' | 'in' | 'out' | 'done'>('wait');

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setPhase('enter'), AFTER_LOADER),
      window.setTimeout(() => setPhase('out'), AFTER_LOADER + VISIBLE),
      window.setTimeout(() => setPhase('done'), AFTER_LOADER + VISIBLE + EXIT),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, []);

  // Mount off-screen for one frame so the slide-in actually transitions —
  // adding the class in the same commit as the mount skips the animation.
  useEffect(() => {
    if (phase !== 'enter') return;
    const raf = requestAnimationFrame(() => setPhase('in'));
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  if (phase === 'wait' || phase === 'done') return null;

  return (
    <div
      className={`notice${phase === 'in' ? ' notice--in' : ''}`}
      role="status"
      aria-live="polite"
    >
      <span className="notice__dot" aria-hidden="true" />
      <p className="notice__text">
        This site is still in development — some pages may not display correctly.
      </p>
    </div>
  );
}
