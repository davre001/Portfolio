import { useEffect, useRef, useState } from 'react';
import projectsData from '../../data/projects.json';
import type { Project } from '../types';
import AppLink from '../components/AppLink';

const projects = projectsData as unknown as Project[];
const IG_PROFILE = 'https://instagram.com/davrestudios';

// lucide-react dropped brand icons, so Instagram is an inline SVG.
function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export default function ProjectDetail({ id }: { id: string }) {
  const project = projects.find((p) => p.id === id);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  // Reset scroll each time a different project is opened.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // React doesn't reliably reflect the `muted` prop onto the DOM element,
  // so sync it explicitly (and keep state + element in lockstep).
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    if (!v.muted) v.play().catch(() => {});
    setMuted(v.muted);
  };

  if (!project) {
    return (
      <section className="section container detail">
        <p className="detail__missing">Sorry — we couldn&rsquo;t find that project.</p>
        <AppLink className="btn btn--ghost" to="/">Back to work</AppLink>
      </section>
    );
  }

  return (
    <article className="section container detail" key={project.id}>
      <AppLink className="detail__back" to="/">← Back to work</AppLink>

      <div className="detail__media">
        <video
          ref={videoRef}
          className="detail__video"
          src={project.video}
          autoPlay
          loop
          muted
          controlsList="nodownload"
          disablePictureInPicture
          playsInline
          preload="metadata"
          onClick={toggleMute}
          onContextMenu={(e) => e.preventDefault()}
        />
        {muted && (
          <span className="detail__hint" aria-hidden="true">Click to unmute</span>
        )}
      </div>

      <header className="detail__head">
        <div className="detail__title-row">
          <div className="detail__title-group">
            <h1 className="detail__title">{project.title}</h1>
            {project.logo && (
              <img className="detail__brand" src={project.logo} alt={project.title} />
            )}
          </div>
          <p className="detail__role">{project.role}</p>
        </div>
      </header>

      <div className="detail__body">
        <dl className="detail__meta">
          <div className="detail__meta-item">
            <dt>Client</dt>
            <dd>{project.client}</dd>
          </div>
          <div className="detail__meta-item">
            <dt>Year</dt>
            <dd>{project.year}</dd>
          </div>
        </dl>

        {project.tags && project.tags.length > 0 && (
          <ul className="detail__tags">
            {project.tags.map((tag) => (
              <li className="detail__tag" key={tag}>
                {tag}
              </li>
            ))}
          </ul>
        )}

        {project.description && <p className="detail__desc">{project.description}</p>}

        <a
          className="btn btn--ghost detail__ig"
          href={project.instagram ?? IG_PROFILE}
          target="_blank"
          rel="noopener noreferrer"
        >
          <InstagramIcon />
          Watch on Instagram
        </a>
      </div>
    </article>
  );
}
