import { useEffect, useState } from 'react';
import Noise from '../components/Noise';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { CheckCircle2 } from 'lucide-react';

/**
 * /tutorials — "coming soon" page. A full-bleed looping video plays behind a
 * film-grain overlay, with a centered tagline and waitlist form. Users submit
 * their email to join the waitlist; on success, a confirmation animation plays.
 */
export default function Tutorials() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    // TODO: wire to a backend endpoint or service (e.g. Mailchimp, ConvertKit)
    setSubmitted(true);
  };

  return (
    <section className="tutorials" aria-label="Tutorials — coming soon">
      <div className="tutorials__media" aria-hidden="true">
        <video
          className="tutorials__video"
          src={import.meta.env.BASE_URL + 'assets/videos/tutorials-source.mp4'}
          autoPlay
          muted
          loop
          playsInline
        />
        {/* film-grain noise over the video */}
        <Noise patternAlpha={3} patternRefreshInterval={2} />
      </div>

      <div className="container tutorials__inner">
        <p className="tutorials__tagline">
          Tutorials are coming <span className="tutorials__tagline-em">soon</span>
        </p>

        {!submitted ? (
          <form className="tutorials__waitlist" onSubmit={handleSubmit}>
            <div className="tutorials__waitlist-box">
              <input
                type="email"
                className="tutorials__waitlist-input"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-label="Email address"
              />
              <button
                type="submit"
                className="tutorials__waitlist-btn"
                aria-label="Join waitlist"
              >
                <svg
                  className="tutorials__waitlist-arrow"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <p className="tutorials__waitlist-helper">
              Join the waitlist to get notified first when Tutorials are available.
            </p>
          </form>
        ) : (
          <div className="tutorials__waitlist-success-wrapper">
            <Alert variant="success" className="tutorials__waitlist-success-alert">
              <CheckCircle2 className="size-4" />
              <AlertTitle>You're on the list!</AlertTitle>
              <AlertDescription>
                We'll notify you when tutorials drop. Keep an eye on your inbox.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </section>
  );
}
