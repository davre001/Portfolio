import { LogoCloud, type Logo } from "@/components/ui/logo-cloud-3";

// Brand logos are served locally from /public/assets/images/brands and forced
// white by .brands__cloud. A src that 404s gracefully falls back to the name.
// (Nike/Glovo/LG/McDonald's/Adidas still use the simple-icons CDN.)
const brands: Logo[] = [
  { src: "https://cdn.simpleicons.org/nike", alt: "Nike", label: "Nike" },
  { src: "https://cdn.simpleicons.org/glovo", alt: "Glovo", label: "Glovo" },
  { src: "https://cdn.simpleicons.org/lg", alt: "LG", label: "LG" },
  { src: "/assets/images/brands/nescafe.png", alt: "Nescafé", label: "Nescafé" },
  { src: "/assets/images/brands/cadbury.png", alt: "Cadbury", label: "Cadbury" },
  { src: "https://cdn.simpleicons.org/mcdonalds", alt: "McDonald's", label: "McDonald's" },
  { src: "https://cdn.simpleicons.org/adidas", alt: "Adidas Y-3", label: "Adidas Y-3" },
  // Local real-brand logos (luxury marks absent from the simple-icons set).
  { src: "/assets/images/brands/louis-vuitton.svg", alt: "Louis Vuitton", label: "Louis Vuitton" },
  { src: "/assets/images/brands/chanel.png", alt: "Chanel", label: "Chanel" },
  { src: "/assets/images/brands/balenciaga.png", alt: "Balenciaga", label: "Balenciaga" },
  { src: "/assets/images/brands/rolex.png", alt: "Rolex", label: "Rolex" },
];

export default function Brands() {
  return (
    <section className="brands" aria-label="Brands we've worked with">
      <div className="brands__inner">
        <h2 className="brands__title">Brands We&rsquo;ve Worked With</h2>
        <div className="brands__rule" aria-hidden="true" />
        <div className="brands__cloud">
          <LogoCloud logos={brands} />
        </div>
        <p className="brands__note">
          Projects with the companies above are unofficial and not endorsed by them.
        </p>
      </div>
    </section>
  );
}
