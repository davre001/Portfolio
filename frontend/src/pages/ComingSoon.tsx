import { useEffect } from 'react';
import AppLink from '../components/AppLink';

interface ComingSoonProps {
  title: string;
  tagline: string;
}

/** Standalone landing shown for the /outerspace, /ai-studio, /tutorials routes. */
export default function ComingSoon({ title, tagline }: ComingSoonProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [title]);

  return (
    <section className="coming-soon" aria-label={title}>
      <div className="container coming-soon__inner">
        <span className="coming-soon__eyebrow">DAVRE Studio</span>
        <h1 className="coming-soon__title">{title}</h1>
        <p className="coming-soon__tagline">{tagline}</p>
        <span className="coming-soon__badge">
          <span className="coming-soon__badge-dot" aria-hidden="true" />
          Coming soon
        </span>
        <AppLink to="/" className="btn btn--ghost coming-soon__back">
          ← Back to home
        </AppLink>
      </div>
    </section>
  );
}
