import { useEffect, useState } from 'react';
import StaggeredMenu from '../components/StaggeredMenu';
import { navigate, currentPath } from '../App';

// Base-aware href for the real routes (so the links are correct even on a
// hosting subpath); client-side navigation is handled in onItemClick.
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
const toHref = (path: string) => BASE + path;

// The items that used to live in the three-dot dropdown, now inside the
// staggered menu that slides in from the right. Each opens its own page.
const MENU_ITEMS = [
  { label: 'OUTERSPACE', ariaLabel: 'Outerspace', link: toHref('/outerspace'), preview: 'space' as const, path: '/outerspace' },
  { label: 'AI STUDIO', ariaLabel: 'AI Studio', link: toHref('/ai-studio'), preview: 'ai' as const, path: '/ai-studio' },
  { label: 'TUTORIALS', ariaLabel: 'Tutorials', link: toHref('/tutorials'), preview: 'tutorials' as const, path: '/tutorials' },
];

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  // Track the active route so the matching menu item shows its arrow indicator
  // before any hover. Subscribes to the same popstate the router uses.
  const [path, setPath] = useState(currentPath);
  useEffect(() => {
    const onNav = () => setPath(currentPath());
    window.addEventListener('popstate', onNav);
    return () => window.removeEventListener('popstate', onNav);
  }, []);

  const menuItems = MENU_ITEMS.map((it) => ({ ...it, active: it.path === path }));

  return (
    <header className="nav" id="nav">
      <div className="nav__inner nav__inner--full">
        {/* Left: About — also a hover/focus card trigger */}
        <div className="nav__about">
          <a href="#about" className="nav__btn nav__btn--right">
            About
          </a>

          <div className="nav__about-card" role="region" aria-label="About Davre Studio">
            <p className="nav__about-desc">
              Davre Studio is a visionary creative agency specializing in film production,
              directing, high-end video editing, motion graphics, and AI creation.
              <br />
              We seamlessly blend cinematic storytelling with next-gen technology to deliver
              striking visual experiences that demand attention.
            </p>

            <div className="nav__about-contact">
              <span className="nav__about-contact-label">Send a message</span>
              <a className="nav__about-link" href="https://mail.google.com/mail/?view=cm&to=davrestudios@gmail.com" target="_blank" rel="noopener noreferrer">davrestudios@gmail.com</a>
              <span className="nav__about-divider" aria-hidden="true"></span>
              <a className="nav__about-link" href="tel:+2348072966135">(+234) 8072966135</a>
            </div>
          </div>
        </div>

        {/* Center: Davre logo — routes home (scrolls to top if already home) */}
        <a
          href={toHref('/') || '/'}
          className="nav__brand"
          aria-label="DAVRE — back to home"
          onClick={(e) => {
            if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            e.preventDefault();
            navigate('/');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <img className="nav__logo" src="davre-logo.png" alt="DAVRE" width={70} height={40} />
        </a>

        {/* Right: Menu toggle — drives the staggered menu */}
        <button
          type="button"
          className="nav__btn nav__menu-toggle"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          Menu
        </button>
      </div>

      <StaggeredMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        hideHeader
        isFixed
        position="right"
        items={menuItems}
        onItemClick={(item, e) => {
          // Plain left-click → client-side navigate + close the menu.
          // Let modifier / non-primary clicks fall through to the real href.
          if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
          const path = (item as { path?: string }).path;
          if (!path) return;
          e.preventDefault();
          setMenuOpen(false);
          navigate(path);
        }}
        displaySocials={false}
        displayItemNumbering={false}
        colors={['#ff3b30', '#ffd9d6', '#ffffff']}
        accentColor="#ff3b30"
        menuButtonColor="#ff3b30"
        openMenuButtonColor="#ffffff"
        closeOnClickAway={false}
      />
    </header>
  );
}
