import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { X, Banknote, CheckCircle2, ArrowLeft } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { useCart } from "@/lib/cart";
import { createOrder, type OrderOut, API } from "@/lib/api";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your cart — Lilouette" }] }),
  component: CartPage,
});

type Step = "cart" | "checkout" | "confirmed";

const SHIPPING_FEE = 2.5;

function CartPage() {
  const { items, subtotal, removeItem, clear } = useCart();
  const { t } = useT();
  const total = subtotal + SHIPPING_FEE;
  const [step, setStep] = useState<Step>("cart");
  const [order, setOrder] = useState<OrderOut | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [phone2, setPhone2] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setShowConfirm(true);
  }

  async function handlePlaceOrder() {
    setError(null);
    setLoading(true);
    try {
      const placed = await createOrder({
        name,
        email,
        phone,
        address,
        phone2: phone2 || undefined,
        note: note || undefined,
        items: items.map((i) => ({
          product_slug: i.slug,
          product_name: i.name,
          image_url: i.image_url,
          price: i.price,
          quantity: i.quantity,
        })),
      });
      setOrder(placed);
      await clear();
      setShowConfirm(false);
      setStep("confirmed");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.cart.error);
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-6 py-16">

        {/* ── Cart ── */}
        {step === "cart" && (
          <>
            <div className="mb-10">
              <p className="text-xs tracking-[0.3em] uppercase text-accent mb-3">{t.cart.eyebrow}</p>
              <h1 className="font-display text-5xl md:text-6xl">{t.cart.title}</h1>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-24 space-y-5">
                <p className="text-muted-foreground">{t.cart.empty}</p>
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center rounded-full border border-border px-6 py-2.5 text-sm tracking-wide hover:border-accent hover:text-accent transition-colors"
                >
                  {t.cart.browse}
                </Link>
              </div>
            ) : (
              <div className="space-y-10">
                <ul className="divide-y divide-border/60">
                  {items.map((item) => (
                    <li key={item.id} className="flex gap-5 py-6">
                      <img
                        src={`${API}${item.image_url}`}
                        alt={item.name}
                        className="h-24 w-24 rounded-2xl object-cover bg-secondary flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-display text-2xl leading-tight">{item.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">€{item.price}</p>
                          </div>
                          <button
                            onClick={() => removeItem(item.slug)}
                            aria-label={`Remove ${item.name}`}
                            className="text-muted-foreground hover:text-foreground transition-colors mt-1"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="rounded-2xl bg-secondary/40 p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t.cart.subtotal}</span>
                    <span className="font-display text-2xl">€{subtotal.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={() => setStep("checkout")}
                    className="w-full rounded-full bg-foreground text-background py-3.5 text-sm tracking-wide transition-all hover:bg-accent hover:shadow-[var(--shadow-soft)]"
                  >
                    {t.cart.checkout}
                  </button>
                  <p className="text-xs text-muted-foreground text-center">
                    {t.cart.cashInfo}
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Checkout ── */}
        {step === "checkout" && (
          <>
            <div className="mb-10">
              <button
                onClick={() => setStep("cart")}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
              >
                <ArrowLeft className="h-4 w-4" /> {t.cart.back}
              </button>
              <p className="text-xs tracking-[0.3em] uppercase text-accent mb-3">{t.cart.orderEyebrow}</p>
              <h1 className="font-display text-5xl md:text-6xl">{t.cart.orderDetails}</h1>
            </div>

            <div className="grid md:grid-cols-2 gap-10 items-start">
              {/* Order summary */}
              <div className="space-y-6">
                <div className="rounded-2xl bg-secondary/40 p-5 space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <img
                        src={`${API}${item.image_url}`}
                        alt={item.name}
                        className="h-14 w-14 rounded-xl object-cover bg-secondary flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">× {item.quantity}</p>
                      </div>
                      <span className="text-sm text-muted-foreground flex-shrink-0">
                        €{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-border/60 pt-3 space-y-1.5">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{t.cart.subtotal}</span>
                      <span>€{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{t.cart.shipping}</span>
                      <span>€{SHIPPING_FEE.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-1.5">
                      <span className="text-sm font-medium">{t.cart.total}</span>
                      <span className="font-display text-xl">€{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-accent/30 bg-[var(--blush)]/20 px-5 py-4 flex gap-3">
                  <Banknote className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{t.cart.cashOnly}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {t.cart.cashNote}
                    </p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <Field label={t.cart.name} required>
                  <input
                    required value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Lilou Bonnet"
                    className="cart-input"
                  />
                </Field>
                <Field label={t.cart.email} required>
                  <input
                    required type="email" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="cart-input"
                  />
                </Field>
                <Field label={t.cart.phone} required>
                  <input
                    required type="tel" value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+383 44 000 000"
                    className="cart-input"
                  />
                </Field>
                <Field label={t.cart.phone2}>
                  <input
                    type="tel" value={phone2}
                    onChange={(e) => setPhone2(e.target.value)}
                    placeholder="+383 44 000 000"
                    className="cart-input"
                  />
                </Field>
                <Field label={t.cart.address} required>
                  <textarea
                    required value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    placeholder="Street, city, postal code"
                    className="cart-input resize-none"
                  />
                </Field>
                <Field label={t.cart.note}>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    placeholder="Any special requests..."
                    className="cart-input resize-none"
                  />
                </Field>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <button
                  type="submit" disabled={loading}
                  className="w-full rounded-full bg-foreground text-background py-3.5 text-sm tracking-wide transition-all hover:bg-accent hover:shadow-[var(--shadow-soft)] disabled:opacity-60"
                >
                  {loading ? t.cart.placing : t.cart.placeOrder}
                </button>
              </form>
            </div>
          </>
        )}

        {/* ── Confirm order modal ── */}
        {showConfirm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-6"
            onClick={() => !loading && setShowConfirm(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-background border border-border/60 shadow-[var(--shadow-soft)] p-7 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-display text-2xl mb-3">{t.cart.confirmOrderTitle}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                {t.cart.confirmOrderBody}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  disabled={loading}
                  className="flex-1 rounded-full border border-border py-2.5 text-sm tracking-wide hover:border-foreground transition-colors disabled:opacity-60"
                >
                  {t.cart.cancel}
                </button>
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="flex-1 rounded-full bg-foreground text-background py-2.5 text-sm tracking-wide transition-all hover:bg-accent disabled:opacity-60"
                >
                  {loading ? t.cart.placing : t.cart.confirmYes}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Confirmed ── */}
        {step === "confirmed" && order && (
          <div className="flex flex-col items-center text-center py-16 gap-6">
            <div className="h-20 w-20 rounded-full bg-[var(--blush)]/40 flex items-center justify-center">
              <CheckCircle2 className="h-9 w-9 text-accent" />
            </div>
            <div className="space-y-3 max-w-md">
              <p className="text-xs tracking-[0.3em] uppercase text-accent">{t.cart.confirmedEyebrow}</p>
              <h2 className="font-display text-4xl md:text-5xl">{t.cart.thankYou}, {order.name.split(" ")[0]}!</h2>
              <p className="text-muted-foreground leading-relaxed">
                {t.cart.confirmedA} <span className="text-foreground font-medium">{order.reference}</span> {t.cart.confirmedB} <span className="text-foreground">{order.email}</span> {t.cart.confirmedC}
              </p>
            </div>

            <div className="rounded-2xl border border-accent/30 bg-[var(--blush)]/20 px-5 py-4 max-w-md text-left space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t.cart.pendingPayment}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t.cart.deliveryInfo}
              </p>
            </div>

            <Link
              to="/products"
              className="mt-2 rounded-full border border-border px-7 py-3 text-sm tracking-wide hover:border-accent hover:text-accent transition-colors"
            >
              {t.cart.continueShopping}
            </Link>
          </div>
        )}
      </div>

      <style>{`.cart-input{width:100%;background:var(--background);border:1px solid var(--border);border-radius:.625rem;padding:.7rem .9rem;font-size:.9rem;color:var(--foreground);outline:none;transition:border-color .2s,box-shadow .2s}.cart-input:focus{border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in oklab,var(--accent) 18%,transparent)}`}</style>
    </SiteLayout>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </span>
      {children}
    </label>
  );
}
