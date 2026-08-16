import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Instagram } from "lucide-react";
import { useState, type FormEvent } from "react";
import { API } from "@/lib/api";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Lilouette" },
      { name: "description", content: "Get in touch with Lilouette for custom pieces, questions, or to say hello." },
      { property: "og:title", content: "Contact — Lilouette" },
      { property: "og:description", content: "Send Lilouette a note or find us on Instagram." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { t } = useT();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const body = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
    };
    try {
      const res = await fetch(`${API}/api/contact/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail ?? "Something went wrong. Please try again.");
      }
      setSent(true);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteLayout>
      <section className="mx-auto max-w-5xl px-6 pt-16 pb-24 grid md:grid-cols-2 gap-14 items-start">
        <div className="space-y-6">
          <p className="text-xs tracking-[0.3em] uppercase text-accent">{t.contact.eyebrow}</p>
          <h1 className="font-display text-5xl md:text-6xl leading-[1.05]">{t.contact.title}</h1>
          <p className="text-muted-foreground leading-relaxed max-w-md">
            {t.contact.subtitle}
          </p>
          <a
            href="https://www.instagram.com/lilouette.co/"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-3 rounded-full border border-border bg-card px-5 py-3 text-sm transition-all hover:border-accent hover:text-accent"
          >
            <Instagram className="h-4 w-4" />
            {t.contact.dmUs}
          </a>
        </div>

        <form onSubmit={onSubmit} className="rounded-2xl bg-card border border-border/60 p-8 shadow-[var(--shadow-soft)] space-y-5">
          <Field label={t.contact.name}>
            <input required name="name" type="text" className="field-input" placeholder={t.contact.namePlaceholder} />
          </Field>
          <Field label={t.contact.email}>
            <input required name="email" type="email" className="field-input" placeholder="you@example.com" />
          </Field>
          <Field label={t.contact.message}>
            <textarea required name="message" rows={5} className="field-input resize-none" />
          </Field>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-foreground text-background py-3 text-sm tracking-wide transition-all hover:bg-accent hover:shadow-[var(--shadow-soft)] disabled:opacity-60"
          >
            {loading ? t.contact.submitting : t.contact.submit}
          </button>
          {sent && (
            <p className="text-sm text-accent text-center pt-1">{t.contact.sent}</p>
          )}
          {error && (
            <p className="text-sm text-destructive text-center pt-1">{error}</p>
          )}
        </form>
      </section>

      <style>{`
        .field-input {
          width: 100%;
          background: var(--background);
          border: 1px solid var(--border);
          border-radius: 0.625rem;
          padding: 0.7rem 0.9rem;
          font-size: 0.9rem;
          color: var(--foreground);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .field-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px color-mix(in oklab, var(--accent) 18%, transparent);
        }
      `}</style>
    </SiteLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">{label}</span>
      {children}
    </label>
  );
}