import { type ReactNode, useState } from "react";

/** Button/link whose label scrambles to random glyphs on hover, then resolves. */
function ScrambleButton({
  href,
  children = "Read More",
  icon,
  animated = true,
}: {
  href?: string;
  children?: ReactNode;
  icon?: ReactNode;
  animated?: boolean;
}) {
  const originalText = typeof children === "string" ? children : "Read More";
  const [displayText, setDisplayText] = useState(originalText);
  const [isScrambling, setIsScrambling] = useState(false);
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";

  const scramble = () => {
    if (isScrambling) return;
    setIsScrambling(true);

    let iteration = 0;
    const maxIterations = originalText.length;

    const interval = setInterval(() => {
      setDisplayText(
        originalText
          .split("")
          .map((_, index) =>
            index < iteration
              ? originalText[index]
              : chars[Math.floor(Math.random() * chars.length)]
          )
          .join("")
      );

      if (iteration >= maxIterations) {
        clearInterval(interval);
        setIsScrambling(false);
      }

      iteration += 1 / 3;
    }, 30);
  };

  const className = "footer__cta-btn";
  const hoverProps = animated ? { onMouseEnter: scramble } : {};
  if (href) {
    return (
      <a
        href={href}
        className={className}
        {...hoverProps}
        target={href.startsWith("mailto") ? undefined : "_blank"}
        rel="noopener noreferrer"
      >
        {icon}
        {displayText}
      </a>
    );
  }
  return (
    <button className={className} {...hoverProps}>
      {icon}
      {displayText}
    </button>
  );
}

export { ScrambleButton };
