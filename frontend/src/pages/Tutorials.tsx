import { useEffect, useState } from 'react';
import { CheckCircle2, MailCheck, Mail, Phone } from 'lucide-react';
import TextPressure from '../components/TextPressure';

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function Tutorials() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [alreadyJoined, setAlreadyJoined] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }
      setAlreadyJoined(Boolean(data.alreadyJoined));
      setSubmitted(true);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="tut" aria-label="Tutorials — coming soon">
      <div className="tut__bg" aria-hidden="true">
        <video
          className="tut__video"
          src={import.meta.env.BASE_URL + 'assets/videos/tutorials-bg.mp4'}
          autoPlay
          muted
          loop
          playsInline
        />
      </div>

      <div className="tut__inner">
        <span className="tut__badge">
          <span className="tut__badge-dot" aria-hidden="true" />
          Waitlist
        </span>

        <h1 className="tut__title">
          <TextPressure
            text="Coming soon!"
            fontFamily="Roboto Flex"
            flex
            width
            weight
            italic
            alpha={false}
            stroke={false}
            textColor="#ffffff"
            minFontSize={38}
          />
        </h1>

        <div className="tut__card">
          {!submitted ? (
            <>
              <h2 className="tut__card-title">Join our waitlist!</h2>
              <p className="tut__card-sub">
                Sign up today and you'll be one of the first to know when we
                drop tutorials.
              </p>

              <form className="tut__form" onSubmit={handleSubmit}>
                <input
                  type="email"
                  className="tut__input"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  aria-label="Email address"
                />
                <button type="submit" className="tut__submit" disabled={sending}>
                  {sending ? <span className="tut__spinner" aria-hidden="true" /> : 'Join Waitlist'}
                </button>
              </form>

              {error && (
                <p className="tut__error" role="alert">
                  {error}
                </p>
              )}
            </>
          ) : (
            <div className="tut__success">
              {alreadyJoined ? (
                <>
                  <MailCheck className="tut__success-icon" aria-hidden="true" />
                  <h2 className="tut__card-title">You have already joined.</h2>
                  <p className="tut__card-sub">Check your mail for updates. Thank you!</p>
                </>
              ) : (
                <>
                  <CheckCircle2 className="tut__success-icon" aria-hidden="true" />
                  <h2 className="tut__card-title">You're on the list!</h2>
                  <p className="tut__card-sub">
                    We'll notify you when tutorials drop. Keep an eye on your inbox.
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        <div className="tut__socials">
          <a
            className="tut__social"
            href="https://instagram.com/davrestudios"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
          >
            <InstagramIcon />
          </a>
          <a
            className="tut__social"
            href="https://mail.google.com/mail/?view=cm&to=davrestudios@gmail.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Email"
          >
            <Mail />
          </a>
          <a className="tut__social" href="tel:+2348072966135" aria-label="Call">
            <Phone />
          </a>
        </div>
      </div>

      <div className="tut__wordmark" aria-hidden="true">
        Tutorials
      </div>

      <p className="tut__footnote">© 2026 DAVRE STUDIOS</p>
    </section>
  );
}
