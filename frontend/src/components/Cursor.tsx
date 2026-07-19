import { useEffect, useRef } from 'react';

/** Custom "move" cursor (a plus crosshair with up/down/left/right arrowheads)
 *  shown only while the pointer is over the hero video wall, signalling that
 *  the tiles are draggable. A single always-on rAF loop tracks the pointer
 *  (no per-event scheduling, no React re-renders), so movement stays smooth. */
export default function Cursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Skip on touch devices (no real cursor to replace).
    if (window.matchMedia('(pointer: coarse)').matches) return;

    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let x = tx;
    let y = ty;
    let raf = 0;

    const move = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
    };

    const over = (e: MouseEvent) => {
      const t = e.target as Element | null;
      el.classList.toggle('is-active', Boolean(t?.closest?.('.hero__wall')));
    };

    const loop = () => {
      x = tx;
      y = ty;
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener('mousemove', move);
    window.addEventListener('mouseover', over);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseover', over);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className="cursor-move" aria-hidden="true">
      <svg
        viewBox="0 0 48 48"
        width="29"
        height="29"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* stems form the central plus, each running out to an arrowhead */}
        <line x1="24" y1="13" x2="24" y2="35" fill="none" />
        <line x1="13" y1="24" x2="35" y2="24" fill="none" />
        {/* solid triangular arrowheads pointing outward on all four sides */}
        <polygon points="24,3 17,15 31,15" stroke="none" />
        <polygon points="24,45 17,33 31,33" stroke="none" />
        <polygon points="3,24 15,17 15,31" stroke="none" />
        <polygon points="45,24 33,17 33,31" stroke="none" />
      </svg>
    </div>
  );
}
