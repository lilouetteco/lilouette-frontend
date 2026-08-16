import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import { fetchProducts, type Product, API } from "@/lib/api";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/products/$slug")({
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { slug } = Route.useParams();

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: () => fetchProducts(),
    staleTime: 1000 * 60 * 5,
  });

  const product = products.find((p) => p.slug === slug);

  const { addItem, items } = useCart();
  const { t } = useT();
  const [activeIndex, setActiveIndex] = useState(0);
  const [mainLoaded, setMainLoaded] = useState(false);

  const allImages = product
    ? [product.image_url, ...product.images.map((i) => i.url)]
    : [];

  const clampedIndex = Math.min(activeIndex, Math.max(0, allImages.length - 1));
  const displayImg = allImages[clampedIndex] ?? "";

  useEffect(() => {
    setMainLoaded(false);
  }, [displayImg]);

  function prev() { setActiveIndex((i) => (i - 1 + allImages.length) % allImages.length); }
  function next() { setActiveIndex((i) => (i + 1) % allImages.length); }

  const soldOut = !product || product.is_sold_out || product.stock <= 0;
  const inBag = !!product && items.some((i) => i.slug === product.slug);

  function handleAdd() {
    if (!product || soldOut || inBag) return;
    addItem(product);
    toast.success(`${product.name} ${t.product.addedToBag}`);
  }

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-6xl px-6 py-20 grid md:grid-cols-2 gap-16 animate-pulse">
          <div className="aspect-square rounded-3xl bg-secondary" />
          <div className="space-y-6 pt-4">
            <div className="h-6 w-1/3 rounded bg-secondary" />
            <div className="h-10 w-2/3 rounded bg-secondary" />
            <div className="h-4 w-full rounded bg-secondary" />
            <div className="h-4 w-4/5 rounded bg-secondary" />
          </div>
        </div>
      </SiteLayout>
    );
  }

  if (!product) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-6xl px-6 py-32 text-center space-y-5">
          <p className="text-muted-foreground">{t.product.notFound}</p>
          <Link to="/products" className="text-sm underline underline-offset-4 hover:text-accent transition-colors">
            {t.product.back}
          </Link>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-6 py-14">
        {/* Back link */}
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10"
        >
          <ArrowLeft className="h-4 w-4" /> {t.product.back}
        </Link>

        <div className="grid md:grid-cols-2 gap-14 lg:gap-20 items-start">
          {/* ── Left: image gallery ── */}
          <div className="sticky top-24 flex flex-col gap-4">
            <div className="relative overflow-hidden rounded-3xl bg-secondary aspect-square shadow-[var(--shadow-soft)] group">
              <img
                key={displayImg}
                src={displayImg.startsWith("/") ? `${API}${displayImg}` : displayImg}
                alt={product.name}
                width={1200}
                height={1200}
                decoding="async"
                fetchPriority="high"
                onLoad={() => setMainLoaded(true)}
                className={`h-full w-full object-cover transition-opacity duration-300 ${mainLoaded ? "opacity-100" : "opacity-0"}`}
              />
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={prev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={next}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {allImages.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveIndex(i)}
                        className={`h-1.5 rounded-full transition-all ${i === clampedIndex ? "w-4 bg-foreground" : "w-1.5 bg-foreground/30"}`}
                        aria-label={`Image ${i + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-2.5 flex-wrap">
                {allImages.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className={`h-16 w-16 rounded-xl overflow-hidden bg-secondary flex-shrink-0 transition-all ${
                      i === clampedIndex
                        ? "ring-2 ring-foreground ring-offset-2"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={url.startsWith("/") ? `${API}${url}` : url}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: details ── */}
          <div className="flex flex-col gap-7 pt-2">
            <div>
              <p className="text-xs tracking-[0.3em] uppercase text-accent mb-3">{t.product.brand}</p>
              <h1 className="font-display text-4xl md:text-5xl leading-tight mb-4">{product.name}</h1>
              <p className="font-display text-3xl text-foreground">€{product.price}</p>
            </div>

            <p className="text-base text-muted-foreground leading-relaxed">{product.description}</p>

            {soldOut ? (
              <div className="space-y-3">
                <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground/50">{t.product.soldOut}</p>
                <button
                  disabled
                  className="w-full rounded-full border border-foreground/30 py-4 text-sm tracking-[0.2em] uppercase text-foreground/40 cursor-not-allowed"
                >
                  {t.product.addToBag}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={handleAdd}
                  disabled={inBag}
                  className="w-full rounded-full bg-foreground text-background py-4 text-sm tracking-[0.2em] uppercase transition-all hover:bg-accent hover:shadow-[var(--shadow-soft)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-foreground"
                >
                  {inBag ? t.product.inBag : t.product.addToBag}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
