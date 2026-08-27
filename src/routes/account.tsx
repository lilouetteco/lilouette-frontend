import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { OrderItemThumb } from "@/components/OrderItemThumb";
import { useAuth } from "@/lib/auth";
import { apiUpdateMe, apiChangePassword, apiMyOrders, type Order } from "@/lib/api";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "My account — Lilouette" }] }),
  component: AccountPage,
});

type Tab = "profile" | "password" | "orders";

function AccountPage() {
  const { user, token, persist } = useAuth();
  const navigate = useNavigate();
  const { t } = useT();
  const [tab, setTab] = useState<Tab>("profile");

  const TABS: { id: Tab; label: string }[] = [
    { id: "profile", label: t.account.tabUser },
    { id: "password", label: t.account.tabPassword },
    { id: "orders", label: t.account.tabOrders },
  ];

  useEffect(() => {
    if (!user) navigate({ to: "/login" });
  }, [user]);

  if (!user || !token) return null;

  return (
    <SiteLayout>
      <style>{`.account-input{width:100%;background:var(--background);border:1px solid var(--border);border-radius:.625rem;padding:.7rem .9rem;font-size:.9rem;color:var(--foreground);outline:none;transition:border-color .2s,box-shadow .2s}.account-input:focus{border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in oklab,var(--accent) 18%,transparent)}`}</style>
      <div className="mx-auto max-w-5xl px-6 py-20">
        <div className="mb-12">
          <p className="text-xs tracking-[0.3em] uppercase text-accent mb-3">{t.account.eyebrow}</p>
          <h1 className="font-display text-5xl">{t.account.hi}, {user.name.split(" ")[0]}</h1>
        </div>

        <div className="flex gap-12 items-start">
          {/* ── Vertical tabs ── */}
          <nav className="flex-shrink-0 w-44">
            <ul className="flex flex-col">
              {TABS.map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => setTab(t.id)}
                    className={`w-full text-left py-3 text-sm border-l-2 pl-4 transition-colors ${
                      tab === t.id
                        ? "border-foreground text-foreground font-medium"
                        : "border-border/40 text-muted-foreground hover:text-foreground hover:border-border"
                    }`}
                  >
                    {t.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* ── Content ── */}
          <div className="flex-1 min-w-0">
            {tab === "profile" && <ProfileSection user={user} token={token} persist={persist} />}
            {tab === "password" && <PasswordSection token={token} />}
            {tab === "orders" && <OrdersSection token={token} />}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

// ── Profile ───────────────────────────────────────────────────────────────────

function ProfileSection({ user, token, persist }: { user: any; token: string; persist: any }) {
  const { t } = useT();
  const [name, setName] = useState(user.name);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (name.trim() === user.name) return;
    setSaving(true); setError(null); setSaved(false);
    try {
      const updated = await apiUpdateMe(token, name.trim());
      persist(token, updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <h2 className="font-display text-3xl mb-8">{t.account.tabUser}</h2>
      <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
        <AccountField label={t.account.name}>
          <input className="account-input" value={name} onChange={(e) => setName(e.target.value)} required />
        </AccountField>
        <AccountField label={t.account.email}>
          <input className="account-input opacity-60 cursor-not-allowed" value={user.email} disabled />
        </AccountField>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex items-center gap-4 pt-1">
          <button
            type="submit"
            disabled={saving || name.trim() === user.name}
            className="rounded-full bg-foreground text-background px-6 py-2.5 text-sm tracking-wide transition-all hover:bg-accent disabled:opacity-50"
          >
            {saving ? t.account.saving : t.account.saveChanges}
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" /> {t.account.saved}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}

// ── Password ──────────────────────────────────────────────────────────────────

function PasswordSection({ token }: { token: string }) {
  const { t } = useT();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordsMatch = next === confirm;
  const nextValid = next.length >= 8 && /\d/.test(next);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!passwordsMatch || !nextValid) return;
    setSaving(true); setError(null); setSaved(false);
    try {
      await apiChangePassword(token, current, next);
      setCurrent(""); setNext(""); setConfirm("");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <h2 className="font-display text-3xl mb-8">{t.account.tabPassword}</h2>
      <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
        <AccountField label={t.account.currentPassword}>
          <div className="relative">
            <input required type={showCurrent ? "text" : "password"} className="account-input pr-10"
              value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="••••••••" />
            <ToggleEye show={showCurrent} onToggle={() => setShowCurrent(v => !v)} />
          </div>
        </AccountField>
        <AccountField label={t.account.newPassword}>
          <div className="relative">
            <input required type={showNext ? "text" : "password"} className="account-input pr-10"
              value={next} onChange={(e) => setNext(e.target.value)} placeholder="••••••••" />
            <ToggleEye show={showNext} onToggle={() => setShowNext(v => !v)} />
          </div>
          {next.length > 0 && !nextValid && (
            <p className="mt-1.5 text-xs text-muted-foreground">{t.account.passwordRule}</p>
          )}
        </AccountField>
        <AccountField label={t.account.confirmPassword}>
          <input required type="password"
            className={`account-input ${confirm && !passwordsMatch ? "border-destructive" : ""}`}
            value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
          {confirm && !passwordsMatch && (
            <p className="mt-1.5 text-xs text-destructive">{t.account.noMatch}</p>
          )}
        </AccountField>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex items-center gap-4 pt-1">
          <button
            type="submit"
            disabled={saving || !current || !nextValid || !passwordsMatch}
            className="rounded-full bg-foreground text-background px-6 py-2.5 text-sm tracking-wide transition-all hover:bg-accent disabled:opacity-50"
          >
            {saving ? t.account.updating : t.account.updatePassword}
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" /> {t.account.passwordUpdated}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}

// ── Orders ────────────────────────────────────────────────────────────────────

function OrdersSection({ token }: { token: string }) {
  const { t } = useT();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiMyOrders(token).then(setOrders).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <h2 className="font-display text-3xl mb-8">{t.account.tabOrders}</h2>
      {loading ? (
        <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-secondary animate-pulse" />)}</div>
      ) : orders.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t.account.noOrders}</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const itemsSubtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const shipping = order.total - itemsSubtotal;
            const statusLabel = (t.orderStatus as Record<string, string>)[order.status] ?? order.status;
            return (
            <div key={order.id} className="rounded-xl border border-border/50 p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-1">{t.account.order} #{order.reference}</p>
                <span className={`rounded-full px-3 py-1 text-xs ${
                  order.status === "confirmed" ? "bg-green-100 text-green-700" :
                  order.status === "pending" ? "bg-amber-100 text-amber-700" :
                  "bg-secondary text-muted-foreground"
                }`}>
                  {statusLabel}
                </span>
              </div>
              <ul className="space-y-2">
                {order.items.map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-center gap-3">
                    <OrderItemThumb imageUrl={item.image_url} name={item.product_name} />
                    <span className="flex-1">{item.product_name} × {item.quantity}</span>
                    <span>€{(item.price * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-border/40 mt-3 pt-3 space-y-1.5">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{t.cart.subtotal}</span>
                  <span>€{itemsSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{t.cart.shipping}</span>
                  <span>€{shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-sm font-medium">{t.cart.total}</span>
                  <span className="font-display text-xl">€{order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function AccountField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">{label}</span>
      {children}
    </label>
  );
}

function ToggleEye({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}
