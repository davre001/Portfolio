import { useEffect, useState } from 'react';
import Nav from './sections/Nav';
import Hero from './sections/Hero';
import About from './sections/About';
import Brands from './sections/Brands';
import Footer from './sections/Footer';
import ScrollProgress from './components/ScrollProgress';
import Cursor from './components/Cursor';
import Loader from './sections/Loader';
import ProjectDetail from './sections/ProjectDetail';
import ComingSoon from './pages/ComingSoon';
import Tutorials from './pages/Tutorials';

type Route =
  | { name: 'home' }
  | { name: 'project'; id: string }
  | { name: 'page'; slug: 'outerspace' | 'ai-studio' | 'tutorials' };

// Static-hosting base (e.g. GitHub Pages). Absolute base ('/') on a root domain;
// used as the router basename so paths resolve identically in dev and prod.
const BASE = import.meta.env.BASE_URL.replace(/\/$/, ''); // '' for '/'

// Content for the standalone "coming soon" pages, keyed by URL slug.
const PAGES: Record<'outerspace' | 'ai-studio' | 'tutorials', { title: string; tagline: string }> = {
  outerspace: { title: 'Outerspace', tagline: 'Worlds beyond the frame — cinematic space experiences in the making.' },
  'ai-studio': { title: 'AI Studio', tagline: 'Frames born from code — where generative craft meets the cutting room.' },
  tutorials: { title: 'Tutorials', tagline: 'Learn the craft — breakdowns, techniques and behind-the-scenes, on the way.' },
};

/** Strip the hosting base prefix and normalise to a leading-slash path. */
export function currentPath(): string {
  let p = window.location.pathname;
  if (BASE && p.startsWith(BASE)) p = p.slice(BASE.length);
  return p || '/';
}

/** Client-side navigation: push a new URL and let the app re-render. */
export function navigate(to: string) {
  const url = BASE + (to.startsWith('/') ? to : `/${to}`);
  if (url === window.location.pathname) return;
  window.history.pushState({}, '', url);
  // Notify listeners (App's popstate handler) without a full reload.
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function parsePath(): Route {
  const parts = currentPath().split('/').filter(Boolean);
  if (parts[0] === 'project' && parts[1]) return { name: 'project', id: parts[1] };
  if (parts[0] === 'outerspace' || parts[0] === 'ai-studio' || parts[0] === 'tutorials') {
    return { name: 'page', slug: parts[0] };
  }
  return { name: 'home' };
}

export default function App() {
  const [route, setRoute] = useState<Route>(parsePath);

  useEffect(() => {
    const onNav = () => {
      const next = parsePath();
      setRoute(next);
      if (next.name !== 'home') window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', onNav);
    return () => window.removeEventListener('popstate', onNav);
  }, []);

  const isHome = route.name === 'home';

  return (
    <>
      <Loader />
      <ScrollProgress />
      <div className="grain" aria-hidden="true" />
      {route.name !== 'project' && <Nav />}
      <Cursor />
      <main id="top">
        {route.name === 'project' ? (
          <ProjectDetail id={route.id} />
        ) : route.name === 'page' ? (
          route.slug === 'tutorials' ? (
            <Tutorials />
          ) : (
            <ComingSoon title={PAGES[route.slug].title} tagline={PAGES[route.slug].tagline} />
          )
        ) : (
          <>
            <Hero />
            <About />
            <Brands />
          </>
        )}
      </main>
      {isHome && <Footer />}
    </>
  );
}
