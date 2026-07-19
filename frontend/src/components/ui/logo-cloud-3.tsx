import { useState } from "react";
import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { cn } from "@/lib/utils";

export type Logo = {
  /** Remote logo URL. When absent (or it fails to load) the brand name is shown as text. */
  src?: string;
  /** Brand name shown as a text fallback when there is no usable logo. */
  label?: string;
  alt: string;
  width?: number;
  height?: number;
};

type LogoCloudProps = React.ComponentProps<"div"> & {
  logos: Logo[];
};

function LogoItem({ logo }: { logo: Logo }) {
  const [errored, setErrored] = useState(false);
  const showText = !logo.src || errored;

  if (showText) {
    return (
      <span className="pointer-events-none select-none whitespace-nowrap font-display text-sm font-semibold uppercase tracking-[0.18em] text-foreground/80 md:text-base">
        {logo.label ?? logo.alt}
      </span>
    );
  }

  return (
    <img
      alt={logo.alt}
      className="pointer-events-none h-5 select-none md:h-6"
      height={logo.height || "auto"}
      width={logo.width || "auto"}
      loading="lazy"
      src={logo.src}
      onError={() => setErrored(true)}
    />
  );
}

export function LogoCloud({ className, logos, ...props }: LogoCloudProps) {
  return (
    <div
      {...props}
      className={cn(
        "overflow-hidden py-4 [mask-image:linear-gradient(to_right,transparent,black,transparent)]",
        className
      )}
    >
      <InfiniteSlider gap={42} reverse duration={80} durationOnHover={25}>
        {logos.map((logo, i) => (
          <LogoItem key={`logo-${logo.alt}-${i}`} logo={logo} />
        ))}
      </InfiniteSlider>
    </div>
  );
}
