import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { useCart } from "@/lib/cart";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";
import { fetchProducts, type Product, type ProductCategory, type ProductSort, API } from "@/lib/api";

export const Route = createFileRoute("/products/")({
  head: () => ({ meta: [{ title: "Collection — Lilouette" }] }),
  component: ProductsPage,
});

const PAGE_SIZE = 9;

function ProductsPage() {
  const { t } = useT();
  const [sort, setSort] = useState<ProductSort>("default");
  const [category, setCategory] = useState<ProductCategory | "all">("all");
  const [page, setPage] = useState(1);
  const resultsTopRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
    { value: "default",    label: t.products.byRelevance },
    { value: "price_asc",  label: t.products.priceLow },
    { value: "price_desc", label: t.products.priceHigh },
  ];

  const CATEGORY_OPTIONS: { value: ProductCategory | "all"; label: string }[] = [
    { value: "all",      label: t.products.filterAll },
    { value: "earrings", label: t.products.filterEarrings },
    { value: "bracelet", label: t.products.filterBracelets },
    { value: "necklace", label: t.products.filterNecklaces },
  ];

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["products", sort, category],
    queryFn: () => fetchProducts({ sort, category: category === "all" ? undefined : category }),
    staleTime: 1000 * 60 * 2,
  });

  useEffect(() => {
    setPage(1);
  }, [sort, category]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    resultsTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const pageProducts = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <SiteLayout>
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-12 text-center">
        <p className="text-xs tracking-[0.3em] uppercase text-accent mb-4">{t.products.eyebrow}</p>
        <h1 className="font-display text-5xl md:text-6xl">{t.products.title}</h1>
        <p className="mt-4 text-base md:text-lg text-muted-foreground">{t.products.subtitle}</p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div ref={resultsTopRef} className="scroll-mt-24" />
        <div className="flex items-center justify-between mb-10 gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            {CATEGORY_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => setCategory(o.value)}
                className={`rounded-full border px-5 py-2.5 text-sm tracking-wide transition-colors ${
                  category === o.value
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-foreground hover:border-foreground"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as ProductSort)}
              className="appearance-none rounded-2xl border border-border bg-background px-5 py-2.5 pr-10 text-sm text-foreground outline-none focus:border-accent transition-colors cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <svg className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse space-y-4">
                <div className="aspect-square rounded-2xl bg-secondary" />
                <div className="h-4 w-2/3 rounded bg-secondary" />
                <div className="h-3 w-1/2 rounded bg-secondary" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-muted-foreground">{t.products.noProducts}</p>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
              {pageProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-16">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-full border border-border px-4 py-2 text-sm text-foreground transition-colors hover:border-foreground disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-border"
                >
                  {t.products.previous}
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`h-9 w-9 rounded-full border text-sm transition-colors ${
                      page === i + 1
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-foreground hover:border-foreground"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-full border border-border px-4 py-2 text-sm text-foreground transition-colors hover:border-foreground disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-border"
                >
                  {t.products.next}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </SiteLayout>
  );
}

function ProductCard({ product }: { product: Product }) {
  const { addItem, items } = useCart();
  const { t } = useT();
  const [loaded, setLoaded] = useState(false);
  const inBag = items.some((i) => i.slug === product.slug);
  return (
    <article className="group flex flex-col">
      <Link to="/products/$slug" params={{ slug: product.slug }} className="block overflow-hidden rounded-2xl bg-secondary aspect-square mb-5">
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
      <div className="flex items-baseline justify-between mb-2">
        <Link to="/products/$slug" params={{ slug: product.slug }} className="font-display text-2xl hover:text-accent transition-colors">{product.name}</Link>
        <span className="text-sm tracking-wide text-foreground">€{product.price}</span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">{product.description}</p>
      {(product.is_sold_out || product.stock <= 0) && (
        <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground/50 mb-2">{t.products.soldOut}</p>
      )}
      <button
        onClick={() => { if (inBag) return; addItem(product); toast.success(`${product.name} ${t.product.addedToBag}`); }}
        disabled={product.is_sold_out || product.stock <= 0 || inBag}
        className="mt-auto inline-flex items-center justify-center rounded-full border border-foreground/80 px-5 py-2.5 text-xs tracking-[0.2em] uppercase text-foreground transition-all hover:bg-foreground hover:text-background disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-foreground"
      >
        {inBag ? t.product.inBag : t.product.addToBag}
      </button>
    </article>
  );
}
