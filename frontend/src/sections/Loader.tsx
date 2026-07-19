import { useEffect, useState } from 'react';
import AsciiCanvas from './AsciiCanvas';

/** Full-screen ASCII loading screen shown briefly while the app mounts.
 *  Hides on a timer after mount — it does NOT wait for media (the wall
 *  videos) to finish downloading, so a heavy video can't stall the splash. */
export default function Loader() {
  const [phase, setPhase] = useState<'show' | 'hide' | 'done'>('show');

  useEffect(() => {
    const MIN = 1800; // keep the splash up at least this long
    const t = window.setTimeout(() => setPhase('hide'), MIN);
    return () => window.clearTimeout(t);
  }, []);

  // Unmount after the fade-out transition finishes.
  useEffect(() => {
    if (phase !== 'hide') return;
    const t = window.setTimeout(() => setPhase('done'), 700);
    return () => window.clearTimeout(t);
  }, [phase]);

  if (phase === 'done') return null;

  return (
    <div className={`loader${phase === 'hide' ? ' loader--hide' : ''}`} aria-hidden="true">
      <AsciiCanvas className="loader-canvas" maxOut={760} />
    </div>
  );
}
