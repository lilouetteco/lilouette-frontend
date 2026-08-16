import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/faqs")({
  head: () => ({ meta: [{ title: "Terms & Conditions — Lilouette" }] }),
  component: TermsPage,
});

function TermsPage() {
  const { t } = useT();
  return (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-6 py-20">
        <div className="mb-14 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-accent mb-4">{t.terms.eyebrow}</p>
          <h1 className="font-display text-5xl md:text-6xl">{t.terms.title}</h1>
        </div>
        <div className="space-y-10">
          {t.terms.sections.map((section) => (
            <div key={section.title}>
              <h2 className="font-display text-xl mb-2">{section.title}</h2>
              <p className="text-muted-foreground leading-relaxed text-[0.95rem]">{section.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-14 text-center text-sm text-muted-foreground">
          {t.terms.stillQuestion}{" "}
          <a href="/contact" className="underline underline-offset-4 hover:text-foreground transition-colors">
            {t.terms.getInTouch}
          </a>
        </p>
      </div>
    </SiteLayout>
  );
}
