import { useEffect, useRef, useState, type PointerEvent, type MouseEvent } from 'react';
import { useReducedMotion } from 'motion/react';
import projectsData from '../../data/projects.json';
import type { Project } from '../types';
import Noise from '../components/Noise';
import { navigate } from '../App';

const projects = projectsData as unknown as Project[];
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
const INITIAL = 6;
const DRAG_THRESHOLD = 6; // px of movement that counts as a drag, not a click

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

/** One tile in the hero video wall. Lazy-loads + plays while on screen, pauses off-screen.
 *  Draggable within the wall — press and move to reposition; a plain click still opens the project. */
function HeroTile({
  project,
  zIndex,
  onGrab,
}: {
  project: Project;
  zIndex: number;
  onGrab: (id: string) => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const tileRef = useRef<HTMLAnchorElement>(null);
  const reduce = useReducedMotion();
  const [src, setSrc] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const videoSrc = project.wall ?? project.video;

  // Drag bookkeeping kept in a ref so pointer-move doesn't trigger re-renders per frame.
  const drag = useRef({ startX: 0, startY: 0, baseX: 0, baseY: 0, moved: false, active: false });

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Attach the source only when the tile is actually on screen.
          if (!v.src) setSrc(videoSrc);
          if (reduce) v.pause();
          else v.play().catch(() => {});
        } else {
          v.pause();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, [reduce, videoSrc]);

  const onPointerDown = (e: PointerEvent<HTMLAnchorElement>) => {
    if (e.button !== 0) return;
    if (!tileRef.current?.closest('.hero__wall')) return;
    drag.current.active = true;
    drag.current.moved = false;
    onGrab(project.id); // bring this tile to the front; it stays on top after drop
    drag.current.startX = e.clientX;
    drag.current.startY = e.clientY;
    drag.current.baseX = offset.x;
    drag.current.baseY = offset.y;
    tileRef.current.setPointerCapture(e.pointerId);
    setDragging(true);
  };

  const onPointerMove = (e: PointerEvent<HTMLAnchorElement>) => {
    if (!drag.current.active) return;
    let dx = drag.current.baseX + (e.clientX - drag.current.startX);
    let dy = drag.current.baseY + (e.clientY - drag.current.startY);

    // Clamp so the tile can't be dragged outside the wall.
    const wall = tileRef.current?.closest('.hero__wall') as HTMLElement | null;
    const tile = tileRef.current;
    if (wall && tile) {
      const maxX = wall.clientWidth - (tile.offsetLeft + tile.offsetWidth);
      const minX = -tile.offsetLeft;
      const maxY = wall.clientHeight - (tile.offsetTop + tile.offsetHeight);
      const minY = -tile.offsetTop;
      dx = clamp(dx, minX, maxX);
      dy = clamp(dy, minY, maxY);
    }

    if (
      Math.abs(e.clientX - drag.current.startX) > DRAG_THRESHOLD ||
      Math.abs(e.clientY - drag.current.startY) > DRAG_THRESHOLD
    ) {
      drag.current.moved = true;
    }
    setOffset({ x: dx, y: dy });
  };

  const endDrag = (e: PointerEvent<HTMLAnchorElement>) => {
    if (!drag.current.active) return;
    drag.current.active = false;
    tileRef.current?.releasePointerCapture(e.pointerId);
    setDragging(false);
  };

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // A press that turned into a drag shouldn't navigate to the project.
    if (drag.current.moved) {
      e.preventDefault();
      drag.current.moved = false;
      return;
    }
    // Let modifier / non-primary clicks open normally (new tab etc.).
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(`/project/${project.id}`);
  };

  return (
    <a
      ref={tileRef}
      className={`htile${dragging ? ' is-dragging' : ''}`}
      href={`${BASE}/project/${project.id}`}
      aria-label={`${project.title} — view project`}
      draggable={false}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClick={onClick}
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)`, zIndex }}
    >
      <span className="htile__media">
        <video
          ref={ref}
          className="htile__video"
          src={src ?? undefined}
          muted
          loop
          playsInline
          autoPlay
          preload="none"
        />
        <Noise patternAlpha={8} />
      </span>
      <span className="htile__title">{project.title}</span>
      <span className="htile__role">{project.role}</span>
    </a>
  );
}

export default function Hero() {
  const [count, setCount] = useState(INITIAL);
  const more = count < projects.length;

  // Running z-index so the most-recently grabbed tile stays on top of the others.
  const zCounter = useRef(0);
  const [zMap, setZMap] = useState<Record<string, number>>({});
  const grab = (id: string) =>
    setZMap((m) => ({ ...m, [id]: ++zCounter.current }));

  return (
    <section className="hero" aria-label="Selected work">
      <div className="hero__wall">
        {projects.slice(0, count).map((p) => (
          <HeroTile key={p.id} project={p} zIndex={zMap[p.id] ?? 1} onGrab={grab} />
        ))}
      </div>

      {more && (
        <div className="hero__more">
          <button type="button" className="btn btn--ghost" onClick={() => setCount(projects.length)}>
            See more works
          </button>
        </div>
      )}
    </section>
  );
}
