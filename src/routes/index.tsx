import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { useCart } from "@/lib/cart";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";
import heroImage from "@/images/hero-collage.png";
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
          <div className="space-y-7 min-w-0">
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
          <div className="relative min-w-0">
            <div className="absolute -inset-4 rounded-[2rem] bg-[var(--blush)]/40 blur-2xl" aria-hidden />
            <img
              src={heroImage}
              alt="Grid of Lilouette gold jewelry pieces including earrings, a cuff, and a ring styled on natural textures"
              width={954}
              height={1648}
              className="relative rounded-[1.5rem] shadow-[var(--shadow-soft)] object-cover aspect-[954/1648] w-full"
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

        {products.length > 0 && <FeaturedCarousel products={products.slice(0, 6)} />}
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
    </SiteLayout>
  );
}

function FeaturedCarousel({ products }: { products: Product[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  useEffect(() => {
    updateScrollState();
  }, [products]);

  const scrollByAmount = (direction: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {/* fade edges */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-l from-background to-transparent" />

      <button
        type="button"
        aria-label="Scroll left"
        onClick={() => scrollByAmount(-1)}
        disabled={!canScrollLeft}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 shadow-[var(--shadow-soft)] text-foreground transition-opacity hover:bg-background disabled:opacity-0 disabled:pointer-events-none"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="Scroll right"
        onClick={() => scrollByAmount(1)}
        disabled={!canScrollRight}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 shadow-[var(--shadow-soft)] text-foreground transition-opacity hover:bg-background disabled:opacity-0 disabled:pointer-events-none"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth px-6"
      >
        {products.map((p) => (
          <div key={p.id} className="w-56 flex-shrink-0 snap-start px-4">
            <FeaturedCard product={p} />
          </div>
        ))}
      </div>

      <style>{`
        .no-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

function FeaturedCard({ product }: { product: Product }) {
  const { addItem, items } = useCart();
  const { t } = useT();
  const [loaded, setLoaded] = useState(false);
  const inBag = items.some((i) => i.slug === product.slug);
  return (
    <article className="group">
      <Link to="/products/$slug" params={{ slug: product.slug }} className="block overflow-hidden rounded-2xl bg-secondary aspect-square">
        <img
          src={`${API}${product.image_url}`}
          alt={product.name}
          loading="lazy"
          decoding="async"
          width={800}
          height={800}
          onLoad={() => setLoaded(true)}
          className={`h-full w-full object-cover transition-[opacity,transform] duration-700 group-hover:scale-105 ${loaded ? "opacity-100" : "opacity-0"}`}
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
          if (inBag) return;
          addItem(product);
          toast.success(`${product.name} ${t.product.addedToBag}`);
        }}
        disabled={product.is_sold_out || product.stock <= 0 || inBag}
        className="mt-2 text-xs tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
      >
        {inBag ? t.product.inBag : t.home.quickAdd}
      </button>
    </article>
  );
}
