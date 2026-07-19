import { useEffect, useRef, useState } from 'react';
import projectsData from '../../data/projects.json';
import type { Project } from '../types';
import AppLink from '../components/AppLink';

const projects = projectsData as unknown as Project[];

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
    </article>
  );
}
