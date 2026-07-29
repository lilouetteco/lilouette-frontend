import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/SiteLayout";
import { useCart } from "@/lib/cart";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";
import heroImage from "@/images/hero.png";
import { fetchProducts, type Product, API } from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "lilouette.co" },
      { name: "description", content: "Lilouette is a small jewelry studio offering sculptural gold and pearl earrings, curated in small batches." },
      { property: "og:title", content: "Lilouette — Statement Earrings" },
      { property: "og:description", content: "Sculptural, romantic earrings made to be worn every day." },
    ],
  }),
  component: Index,
});

function Index() {
  const { t } = useT();
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: () => fetchProducts(),
    staleTime: 1000 * 60 * 5,
  });

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 pt-16 pb-20 md:pt-24 md:pb-32 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-7">
            <p className="text-xs tracking-[0.3em] uppercase text-accent">{t.home.eyebrow}</p>
            <h1 className="font-display text-5xl md:text-7xl leading-[1.05] text-foreground">
              {t.home.heroLine1}<br/>
              <em className="italic text-accent">{t.home.heroLine3}</em>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-md leading-relaxed">
              {t.home.heroParagraph}
            </p>
            <div className="flex items-center gap-4 pt-2">
              <Link
                to="/products"
                className="inline-flex items-center justify-center rounded-full bg-foreground px-7 py-3 text-sm tracking-wide text-background transition-all hover:bg-accent hover:shadow-[var(--shadow-soft)]"
              >
                {t.home.shopCollection}
              </Link>
              <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4">
                {t.home.getInTouch}
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-[var(--blush)]/40 blur-2xl" aria-hidden />
            <img
              src={heroImage}
              alt="Lilouette gold square earring worn in a black and white portrait"
              width={1200}
              height={1500}
              className="relative rounded-[1.5rem] shadow-[var(--shadow-soft)] object-cover aspect-[4/5] w-full"
            />
          </div>
        </div>
      </section>

      {/* Featured carousel */}
      <section className="py-16 overflow-hidden">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs tracking-[0.3em] uppercase text-accent mb-3">{t.home.newlyAdded}</p>
              <h2 className="font-display text-4xl md:text-5xl">{t.home.favorites}</h2>
            </div>
            <Link to="/products" className="hidden md:inline text-sm text-muted-foreground hover:text-foreground underline underline-offset-4">
              {t.home.shopCollection}
            </Link>
          </div>
        </div>

        {products.length > 0 && (
          <div className="relative">
            {/* fade edges */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-r from-background to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-l from-background to-transparent" />

            <div className="flex carousel-track" style={{ width: "max-content" }}>
              {[...products.slice(0, 6), ...products.slice(0, 6)].map((p, i) => (
                <div key={`${p.id}-${i}`} className="w-56 flex-shrink-0 px-4">
                  <FeaturedCard product={p} />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* About strip */}
      <section className="bg-secondary/40 mt-10">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center space-y-5">
          <p className="text-xs tracking-[0.3em] uppercase text-accent">{t.home.ourStory}</p>
          <h2 className="font-display text-3xl md:text-4xl leading-snug">
            {t.home.favoritesSubtitle}
          </h2>

        </div>
      </section>

      <style>{`
        .carousel-track {
          animation: carousel-scroll 28s linear infinite;
        }
        .carousel-track:hover {
          animation-play-state: paused;
        }
        @keyframes carousel-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </SiteLayout>
  );
}

function FeaturedCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { t } = useT();
  return (
    <article className="group">
      <Link to="/products/$slug" params={{ slug: product.slug }} className="block overflow-hidden rounded-2xl bg-secondary aspect-square">
        <img
          src={`${API}${product.image_url}`}
          alt={product.name}
          loading="lazy"
          width={800}
          height={800}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </Link>
      <div className="pt-4 flex items-baseline justify-between">
        <Link to="/products/$slug" params={{ slug: product.slug }} className="font-display text-xl hover:text-accent transition-colors">{product.name}</Link>
        <span className="text-sm text-muted-foreground">€{product.price}</span>
      </div>
      {(product.is_sold_out || product.stock <= 0) && (
        <p className="mt-2 text-xs tracking-[0.2em] uppercase text-muted-foreground/50">{t.home.soldOut}</p>
      )}
      <button
        onClick={() => {
          addItem(product);
          toast.success(`${product.name} ${t.product.addedToBag}`);
        }}
        disabled={product.is_sold_out || product.stock <= 0}
        className="mt-2 text-xs tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
      >
        {t.home.quickAdd}
      </button>
    </article>
  );
}
