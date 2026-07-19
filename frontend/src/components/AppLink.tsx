import type { AnchorHTMLAttributes, MouseEvent } from 'react';
import { navigate } from '../App';

interface AppLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Internal path, e.g. "/outerspace" or "/". */
  to: string;
}

/**
 * Internal client-side link. Renders a real <a href> (so it's accessible,
 * middle-clickable and open-in-new-tab friendly), but intercepts plain
 * left-clicks to navigate via history without a full page reload.
 */
export default function AppLink({ to, onClick, children, ...rest }: AppLinkProps) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const href = base + (to.startsWith('/') ? to : `/${to}`);

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    // Respect modifier clicks / new-tab / non-primary buttons — let the browser handle them.
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }
    e.preventDefault();
    navigate(to);
  };

  return (
    <a href={href} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
