/**
 * StaggeredMenu Component (adapted for the DAVRE portfolio)
 *
 * A high-end navigation menu with staggered entrance animations,
 * multiple background layers, and customizable social links.
 * Uses GSAP for high-performance animations.
 *
 * Adaptations for this site:
 *  - Controlled mode: pass `open` + `onOpenChange` to drive it from the
 *    site's own nav (no internal toggle needed).
 *  - `hideHeader`: hide the component's own logo/toggle header so the site
 *    nav bar can supply its own logo / About / Menu button.
 *  - Black + red palette (defaults tuned for the site; pass `colors` /
 *    `accentColor` to override). Item labels are white so they read on the
 *    near-black panel.
 */

import React, { useCallback, useLayoutEffect, useRef, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import MenuPreview, { type PreviewScene } from './MenuPreview';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface StaggeredMenuItem {
  label: string;
  ariaLabel: string;
  link: string;
  /** Optional cinematic preview scene shown in the panel monitor on hover. */
  preview?: PreviewScene;
  /** Marks the item as the current page — pins the arrow indicator on. */
  active?: boolean;
}

export interface StaggeredMenuSocialItem {
  label: string;
  link: string;
}

export interface StaggeredMenuProps {
  /** Position of the menu panel */
  position?: 'left' | 'right';
  /** Background colors for the staggered layers (last = main panel) */
  colors?: string[];
  /** Primary navigation items */
  items?: StaggeredMenuItem[];
  /** Social media links */
  socialItems?: StaggeredMenuSocialItem[];
  /** Whether to show social links section */
  displaySocials?: boolean;
  /** Whether to show '01', '02' numbering next to items */
  displayItemNumbering?: boolean;
  /** Custom class for the wrapper */
  className?: string;
  /** Custom logo or icon to display in the header */
  logo?: React.ReactNode;
  /** Color of the menu button when closed */
  menuButtonColor?: string;
  /** Color of the menu button when open */
  openMenuButtonColor?: string;
  /** Brand accent color for highlights */
  accentColor?: string;
  /** Whether the menu wrapper should be fixed to viewport */
  isFixed?: boolean;
  /** Whether to animate the menu button color transition */
  changeMenuColorOnOpen?: boolean;
  /** Close menu when clicking outside the panel */
  closeOnClickAway?: boolean;
  /** Controlled open state (when provided, the menu is controlled) */
  open?: boolean;
  /** Called when the open state should change */
  onOpenChange?: (open: boolean) => void;
  /** Hide the component's own logo/toggle header (use the site nav instead) */
  hideHeader?: boolean;
  /** Callback when menu starts opening */
  onMenuOpen?: () => void;
  /** Callback when menu starts closing */
  onMenuClose?: () => void;
  /** Click handler for a primary menu item (e.g. client-side navigation). */
  onItemClick?: (item: StaggeredMenuItem, event: React.MouseEvent<HTMLAnchorElement>) => void;
}

export const StaggeredMenu: React.FC<StaggeredMenuProps> = ({
  position = 'right',
  colors = ['#0a0a0b', '#1a1a1b', '#0a0a0b'],
  items = [],
  socialItems = [],
  displaySocials = true,
  displayItemNumbering = true,
  className,
  logo,
  menuButtonColor = 'currentColor',
  openMenuButtonColor = '#ffffff',
  changeMenuColorOnOpen = true,
  accentColor = '#ff3b30',
  isFixed = false,
  closeOnClickAway = true,
  open,
  onOpenChange,
  hideHeader = false,
  onMenuOpen,
  onMenuClose,
  onItemClick
}) => {
  const isControlled = open !== undefined;
  const [openState, setOpenState] = useState(open ?? false);
  const openRef = useRef(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const preLayersRef = useRef<HTMLDivElement | null>(null);
  const preLayerElsRef = useRef<HTMLElement[]>([]);
  const plusHRef = useRef<HTMLSpanElement | null>(null);
  const plusVRef = useRef<HTMLSpanElement | null>(null);
  const iconRef = useRef<HTMLDivElement | null>(null);
  const textInnerRef = useRef<HTMLDivElement | null>(null);
  const [textLines, setTextLines] = useState<string[]>(['Menu', 'Close']);
  // Which item is hovered/focused → drives the cinematic preview monitor.
  // Only items that declare a `preview` scene appear here; null = idle standby.
  const [hoverScene, setHoverScene] = useState<PreviewScene | null>(null);

  // Whether any item declares a preview scene; if none do, we skip the monitor
  // entirely so menus without previews keep their original layout.
  const hasPreviews = items.some(it => it.preview);

  const openTlRef = useRef<gsap.core.Timeline | null>(null);
  const closeTweenRef = useRef<gsap.core.Tween | null>(null);
  const spinTweenRef = useRef<gsap.core.Timeline | null>(null);
  const textCycleAnimRef = useRef<gsap.core.Tween | null>(null);
  const colorTweenRef = useRef<gsap.core.Tween | null>(null);
  const toggleBtnRef = useRef<HTMLButtonElement | null>(null);
  const busyRef = useRef(false);
  // Tracks the last `open` prop value so the controlled effect can detect real
  // changes without being defeated by toggleMenu's optimistic openRef update.
  const prevOpenRef = useRef<boolean>(open ?? false);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const panel = panelRef.current;
      const preContainer = preLayersRef.current;
      const plusH = plusHRef.current;
      const plusV = plusVRef.current;
      const icon = iconRef.current;
      const textInner = textInnerRef.current;

      if (!panel) return;

      let preLayers: HTMLElement[] = [];
      if (preContainer) {
        preLayers = Array.from(preContainer.querySelectorAll('.sm-prelayer')) as HTMLElement[];
      }
      preLayerElsRef.current = preLayers;

      const offscreen = position === 'left' ? -100 : 100;
      gsap.set([panel, ...preLayers], { xPercent: offscreen });
      // Header-only refs may be absent when the header is hidden.
      if (plusH) gsap.set(plusH, { transformOrigin: '50% 50%', rotate: 0 });
      if (plusV) gsap.set(plusV, { transformOrigin: '50% 50%', rotate: 90 });
      if (icon) gsap.set(icon, { rotate: 0, transformOrigin: '50% 50%' });
      if (textInner) gsap.set(textInner, { yPercent: 0 });

      if (toggleBtnRef.current) gsap.set(toggleBtnRef.current, { color: menuButtonColor });
    });
    return () => ctx.revert();
  }, [menuButtonColor, position]);

  const buildOpenTimeline = useCallback(() => {
    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return null;

    openTlRef.current?.kill();
    if (closeTweenRef.current) {
      closeTweenRef.current.kill();
      closeTweenRef.current = null;
    }

    const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel')) as HTMLElement[];
    const socialTitle = panel.querySelector('.sm-socials-title') as HTMLElement | null;
    const socialLinks = Array.from(panel.querySelectorAll('.sm-socials-link')) as HTMLElement[];

    const layerStates = layers.map(el => ({ el, start: Number(gsap.getProperty(el, 'xPercent')) }));
    const panelStart = Number(gsap.getProperty(panel, 'xPercent'));

    if (itemEls.length) gsap.set(itemEls, { yPercent: 140, rotate: 10 });
    if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
    if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    layerStates.forEach((ls, i) => {
      tl.fromTo(ls.el, { xPercent: ls.start }, { xPercent: 0, duration: 0.5, ease: 'power4.out' }, i * 0.07);
    });

    const lastTime = layerStates.length ? (layerStates.length - 1) * 0.07 : 0;
    const panelInsertTime = lastTime + (layerStates.length ? 0.08 : 0);
    const panelDuration = 0.65;

    tl.fromTo(
      panel,
      { xPercent: panelStart },
      { xPercent: 0, duration: panelDuration, ease: 'power4.out' },
      panelInsertTime
    );

    if (itemEls.length) {
      const itemsStart = panelInsertTime + panelDuration * 0.15;
      tl.to(
        itemEls,
        {
          yPercent: 0,
          rotate: 0,
          duration: 1,
          ease: 'power4.out',
          stagger: { each: 0.1, from: 'start' }
        },
        itemsStart
      );
    }

    if (socialTitle || socialLinks.length) {
      const socialsStart = panelInsertTime + panelDuration * 0.4;
      if (socialTitle) tl.to(socialTitle, { opacity: 1, duration: 0.5, ease: 'power2.out' }, socialsStart);
      if (socialLinks.length) {
        tl.to(
          socialLinks,
          {
            y: 0,
            opacity: 1,
            duration: 0.55,
            ease: 'power3.out',
            stagger: { each: 0.08, from: 'start' }
          },
          socialsStart + 0.04
        );
      }
    }

    openTlRef.current = tl;
    return tl;
  }, [position]);

  const playOpen = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    const tl = buildOpenTimeline();
    if (tl) {
      tl.eventCallback('onComplete', () => {
        busyRef.current = false;
      });
      tl.play(0);
    } else {
      busyRef.current = false;
    }
  }, [buildOpenTimeline]);

  const playClose = useCallback(() => {
    openTlRef.current?.kill();
    openTlRef.current = null;
    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return;

    const all: HTMLElement[] = [...layers, panel];
    closeTweenRef.current?.kill();
    const offscreen = position === 'left' ? -100 : 100;

    closeTweenRef.current = gsap.to(all, {
      xPercent: offscreen,
      duration: 0.35,
      ease: 'power3.in',
      stagger: {
        each: 0.05,
        from: 'end'
      },
      overwrite: 'auto',
      onComplete: () => {
        busyRef.current = false;
      }
    });
  }, [position]);

  const animateIcon = useCallback((opening: boolean) => {
    const icon = iconRef.current;
    const h = plusHRef.current;
    const v = plusVRef.current;
    if (!icon || !h || !v) return;

    spinTweenRef.current?.kill();
    if (opening) {
      spinTweenRef.current = gsap.timeline({ defaults: { ease: 'power4.out' } })
        .to(h, { rotate: 45, duration: 0.5 }, 0)
        .to(v, { rotate: -45, duration: 0.5 }, 0);
    } else {
      spinTweenRef.current = gsap.timeline({ defaults: { ease: 'power3.inOut' } })
        .to(h, { rotate: 0, duration: 0.35 }, 0)
        .to(v, { rotate: 90, duration: 0.35 }, 0);
    }
  }, []);

  const animateColor = useCallback((opening: boolean) => {
    const btn = toggleBtnRef.current;
    if (!btn) return;
    colorTweenRef.current?.kill();

    if (changeMenuColorOnOpen) {
      const targetColor = opening ? openMenuButtonColor : menuButtonColor;
      colorTweenRef.current = gsap.to(btn, { color: targetColor, delay: 0.18, duration: 0.3, ease: 'power2.out' });
    }
  }, [openMenuButtonColor, menuButtonColor, changeMenuColorOnOpen]);

  const animateText = useCallback((opening: boolean) => {
    const inner = textInnerRef.current;
    if (!inner) return;
    textCycleAnimRef.current?.kill();

    const seq = opening ? ['Menu', '...', 'Close'] : ['Close', '...', 'Menu'];

    setTextLines(seq);
    gsap.set(inner, { yPercent: 0 });

    const lineCount = seq.length;
    const finalShift = ((lineCount - 1) / lineCount) * 100;

    textCycleAnimRef.current = gsap.to(inner, {
      yPercent: -finalShift,
      duration: 0.5,
      ease: 'power4.out'
    });
  }, []);

  const toggleMenu = useCallback(() => {
    const target = !openRef.current;
    openRef.current = target;
    setOpenState(target);
    onOpenChange?.(target);
    if (!isControlled) {
      if (target) {
        onMenuOpen?.();
        playOpen();
      } else {
        onMenuClose?.();
        playClose();
      }
      animateIcon(target);
      animateColor(target);
      animateText(target);
    }
  }, [isControlled, playOpen, playClose, animateIcon, animateColor, animateText, onMenuOpen, onMenuClose, onOpenChange]);

  // Controlled mode: the `open` prop is the single source of truth. Drive all
  // open/close animations from prop changes (detected via prevOpenRef) so closing
  // works whether it was triggered by the in-panel X (which calls onOpenChange
  // optimistically) or by the external nav toggle.
  useEffect(() => {
    if (!isControlled) return;
    const target = open ?? false;
    if (prevOpenRef.current === target) return;
    prevOpenRef.current = target;
    openRef.current = target;
    setOpenState(target);
    if (target) {
      onMenuOpen?.();
      playOpen();
    } else {
      onMenuClose?.();
      playClose();
    }
    animateIcon(target);
    animateColor(target);
    animateText(target);
  }, [open, isControlled, playOpen, playClose, animateIcon, animateColor, animateText, onMenuOpen, onMenuClose]);

  // Reset the preview to idle standby whenever the menu closes so the next
  // open starts on the neutral channel rather than a stale hovered scene.
  useEffect(() => {
    if (!openState) setHoverScene(null);
  }, [openState]);

  useEffect(() => {
    if (!closeOnClickAway || !openState) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node) &&
        toggleBtnRef.current && !toggleBtnRef.current.contains(event.target as Node)) {
        toggleMenu();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeOnClickAway, openState, toggleMenu]);

  return (
    <div className={cn(
      "sm-scope overflow-hidden select-none font-sans pointer-events-none",
      isFixed ? "fixed inset-0 z-[100]" : "relative w-full h-full min-h-[600px]",
      className
    )}>
      <div
        className="staggered-menu-wrapper w-full h-full pointer-events-none"
        style={{ '--sm-accent': accentColor } as React.CSSProperties}
        data-position={position}
      >
        {/* Layer Backgrounds */}
        <div ref={preLayersRef} className={cn(
          "sm-prelayers absolute top-0 bottom-0 pointer-events-none z-[5] w-[100vw] sm:w-[50.4vw] md:w-[45.9vw] lg:w-[33.3vw]",
          position === 'left' ? 'left-0' : 'right-0'
        )}>
          {colors.slice(0, -1).map((c, i) => (
            <div
              key={i}
              className="sm-prelayer absolute inset-0"
              style={{ background: c }}
            />
          ))}
        </div>

        {/* Header with Logo & Toggle (hidden when the site nav supplies its own) */}
        {!hideHeader && (
          <header className="absolute top-0 left-0 w-full flex items-center justify-between p-8 sm:p-12 z-[20] pointer-events-none">
            <div className="pointer-events-auto">
              {logo}
            </div>

            <button
              ref={toggleBtnRef}
              onClick={toggleMenu}
              className="sm-toggle pointer-events-auto flex items-center gap-3 px-6 py-3 rounded-full bg-transparent hover:bg-foreground/5 transition-colors focus:outline-none"
              aria-expanded={openState}
            >
              <div className="relative h-[1.2em] overflow-hidden min-w-[50px] text-left">
                <div ref={textInnerRef} className="flex flex-col font-medium uppercase tracking-wider text-sm">
                  {textLines.map((line, i) => (
                    <span key={i} className="h-[1.2em] leading-tight flex items-center">{line}</span>
                  ))}
                </div>
              </div>
              <div ref={iconRef} className="relative w-4 h-4">
                <span ref={plusHRef} className="absolute top-1/2 left-0 w-full h-0.5 bg-current rounded-full -translate-y-1/2" />
                <span ref={plusVRef} className="absolute top-0 left-1/2 w-0.5 h-full bg-current rounded-full -translate-x-1/2" />
              </div>
            </button>
          </header>
        )}

        {/* Menu Panel */}
        <aside
          ref={panelRef}
          className={cn(
            "staggered-menu-panel absolute top-0 bottom-0 z-10 pointer-events-auto flex flex-col pt-32 pb-12 px-8 sm:px-16 overflow-y-auto w-[100vw] sm:w-[50.4vw] md:w-[45.9vw] lg:w-[33.3vw]",
            position === 'left' ? 'left-0' : 'right-0'
          )}
          style={{ background: colors[colors.length - 1] }}
        >
          <button
            type="button"
            onClick={toggleMenu}
            className="sm-close absolute top-8 right-8 z-[2] text-black/70 hover:text-black text-3xl leading-none focus:outline-none"
            aria-label="Close menu"
          >
            &times;
          </button>
          <div className="flex-1 flex flex-col">
            <nav>
              <ul className="flex flex-col list-none p-0 m-0">
                {items.map((item, idx) => (
                  <li key={idx} className="overflow-hidden py-4 border-t border-black/15 first:border-t-0">
                    <a
                      href={item.link}
                      className={cn(
                        "group relative flex items-baseline gap-4 no-underline",
                        item.active && "is-active"
                      )}
                      aria-label={item.ariaLabel}
                      aria-current={item.active ? 'page' : undefined}
                      onClick={(e) => onItemClick?.(item, e)}
                      onMouseEnter={() => item.preview && setHoverScene(item.preview)}
                      onMouseLeave={() => item.preview && setHoverScene(null)}
                      onFocus={() => item.preview && setHoverScene(item.preview)}
                      onBlur={() => item.preview && setHoverScene(null)}
                    >
                      <span className="sm-arrow" aria-hidden="true" />
                      {displayItemNumbering && (
                        <span className="text-sm font-medium opacity-40 translate-y-[-0.5rem]">
                          {(idx + 1).toString().padStart(2, '0')}
                        </span>
                      )}
                      <span className="sm-panel-itemLabel inline-block font-bold text-3xl sm:text-4xl md:text-4xl lg:text-5xl text-black uppercase tracking-tighter transition-colors group-hover:text-[var(--sm-accent)]">
                        {item.label}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {hasPreviews && (
              <div className="mt-8 flex-1 flex min-h-[220px] -mx-8 sm:-mx-16 -mb-12">
                <MenuPreview scene={hoverScene} />
              </div>
            )}

            {displaySocials && socialItems.length > 0 && (
              <div className="mt-auto pt-12">
                <h3 className="sm-socials-title text-xs font-bold uppercase tracking-widest mb-6 opacity-40 text-black">Socials</h3>
                <ul className="flex flex-wrap gap-x-8 gap-y-2 list-none p-0 m-0">
                  {socialItems.map((social, i) => (
                    <li key={i}>
                      <a
                        href={social.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sm-socials-link text-sm font-medium text-black no-underline hover:text-[var(--sm-accent)] transition-colors py-1 inline-block"
                      >
                        {social.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default StaggeredMenu;
