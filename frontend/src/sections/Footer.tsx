import { useEffect, useState } from "react";
import { Mail, Phone } from "lucide-react";
import { ScrambleButton } from "@/components/ui/cta-with-marquee";

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

// Work-sample pool — local images copied from Downloads into /public/assets/footer.
const POOL = [
  "/assets/footer/footer-1.jpg",
  "/assets/footer/footer-2.jpg",
  "/assets/footer/footer-3.jpg",
  "/assets/footer/footer-4.jpg",
  "/assets/footer/footer-5.jpg",
  "/assets/footer/footer-6.jpg",
  "/assets/footer/footer-7.jpg",
  "/assets/footer/footer-8.jpg",
];

/** A single box that fades out, swaps to the next image, and fades back in.
 *  `order` staggers both the load-in and the swap so the effect travels
 *  box-to-box (one after another) instead of firing on all boxes at once. */
function FadeBox({ images, order }: { images: string[]; order: number }) {
  const [idx, setIdx] = useState(order % images.length);
  const [op, setOp] = useState(1);
  const FADE = 600;
  // One full wave traverses all 6 boxes within a single PERIOD, so the image
  // swap visibly moves from one box to the next rather than all together.
  const PERIOD = 3000;
  const STEP = PERIOD / 6; // even offset between neighbouring boxes

  useEffect(() => {
    const timers: number[] = [];

    const start = window.setTimeout(() => {
      const cycle = () => {
        setOp(0);
        const t1 = window.setTimeout(() => {
          setIdx((i) => (i + 1) % images.length);
          setOp(1);
          timers.push(window.setTimeout(cycle, PERIOD));
        }, FADE);
        timers.push(t1);
      };
      cycle();
    }, order * STEP);

    timers.push(start);
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [images.length, order]);

  return (
    <div className="footer__tile" style={{ animationDelay: `${order * 140}ms` }}>
      <img
        src={images[idx]}
        alt=""
        loading="lazy"
        style={{ opacity: op, transition: `opacity ${FADE}ms var(--ease)` }}
      />
    </div>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer--cta">
      <div className="container footer__cta-grid">
        {/* Left: copy + CTA */}
        <div className="footer__cta">
          <h2 className="footer__title">Like what you see ?</h2>
          <p className="footer__subtitle">
            <a
              className="footer__contact"
              href="mailto:davrestudios@gmail.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Mail size={18} /> davrestudios@gmail.com
            </a>
            <span className="footer__sep" aria-hidden="true">
              &middot;
            </span>
            <a
              className="footer__contact"
              href="https://instagram.com/davrestudios"
              target="_blank"
              rel="noopener noreferrer"
            >
              <InstagramIcon /> davrestudios
            </a>
          </p>
          <ScrambleButton
            href="tel:+2348072966135"
            icon={<Phone size={18} aria-hidden="true" />}
            animated={false}
          >
            Call
          </ScrambleButton>

          <img
            className="footer__logo"
            src="davre-logo.png"
            alt="DAVRE"
            width={175}
            height={100}
          />
        </div>

        {/* Right: 3x2 grid of 6 boxes that cross-fade in sequence */}
        <div className="footer__grid" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <FadeBox key={i} images={POOL} order={i} />
          ))}
        </div>
      </div>

      <div className="container footer__bottom">
        <span className="footer__copy">
          &copy; {year} DAVRE STUDIOS. All rights reserved.
        </span>
        <a href="#top" className="footer__top">
          Back to top &uarr;
        </a>
      </div>
    </footer>
  );
}
