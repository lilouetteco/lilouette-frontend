import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Eye, EyeOff, CheckCircle2, XCircle, Mail } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: { sitekey: string; callback: (token: string) => void }) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

function TurnstileWidget({ onVerify }: { onVerify: (token: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;

    function render() {
      if (containerRef.current && window.turnstile) {
        window.turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY as string,
          callback: onVerify,
        });
      }
    }

    if (window.turnstile) {
      render();
      return;
    }

    const existing = document.querySelector(`script[src="${TURNSTILE_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", render);
      return () => existing.removeEventListener("load", render);
    }

    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", render);
    document.head.appendChild(script);
    return () => script.removeEventListener("load", render);
  }, [onVerify]);

  if (!TURNSTILE_SITE_KEY) return null;
  return <div ref={containerRef} />;
}

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — Lilouette" }] }),
  component: RegisterPage,
});

function validate(password: string) {
  return {
    length: password.length >= 8,
    number: /\d/.test(password),
  };
}

function RegisterPage() {
  const { register } = useAuth();
  const { t } = useT();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

  const rules = validate(password);
  const passwordValid = rules.length && rules.number;
  const passwordsMatch = password === confirm;
  const captchaRequired = Boolean(TURNSTILE_SITE_KEY);
  const captchaOk = !captchaRequired || Boolean(turnstileToken);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!passwordValid) return;
    if (!passwordsMatch) return;
    if (!captchaOk) return;
    setError(null);
    setLoading(true);
    try {
      await register(name, email, password, turnstileToken);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-md px-6 py-20 text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-secondary mb-8">
            <Mail className="h-7 w-7 text-accent" />
          </div>
          <h1 className="font-display text-4xl mb-4">{t.register.checkInbox}</h1>
          <p className="text-muted-foreground leading-relaxed mb-2">
            {t.register.checkInboxMsg} <strong className="text-foreground">{email}</strong>.
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed mb-8">
            {t.register.checkInboxSub}
          </p>
          <Link to="/login" className="text-sm underline underline-offset-4 hover:text-accent transition-colors">
            {t.register.backToSignIn}
          </Link>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-md px-6 py-20">
        <div className="text-center mb-10">
          <p className="text-xs tracking-[0.3em] uppercase text-accent mb-3">{t.register.eyebrow}</p>
          <h1 className="font-display text-4xl md:text-5xl">{t.register.title}</h1>
        </div>

        <form onSubmit={onSubmit} className="rounded-2xl bg-card border border-border/60 p-8 shadow-[var(--shadow-soft)] space-y-5">
          <Field label={t.register.name}>
            <input
              required value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Lilou Bonnet"
              className="auth-input"
            />
          </Field>

          <Field label={t.register.email}>
            <input
              required type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="auth-input"
            />
          </Field>

          <Field label={t.register.password}>
            <div className="relative">
              <input
                required
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="••••••••"
                className="auth-input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {(touched || password.length > 0) && (
              <ul className="mt-2 space-y-1">
                <Rule ok={rules.length} label={t.register.ruleLength} />
                <Rule ok={rules.number} label={t.register.ruleNumber} />
              </ul>
            )}
          </Field>

          <Field label={t.register.confirmPassword}>
            <div className="relative">
              <input
                required
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className={`auth-input pr-10 ${touched && confirm && !passwordsMatch ? "border-destructive focus:border-destructive" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {touched && confirm && !passwordsMatch && (
              <p className="mt-1.5 text-xs text-destructive">{t.register.noMatch}</p>
            )}
          </Field>

          <TurnstileWidget onVerify={setTurnstileToken} />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit" disabled={loading || !captchaOk}
            className="w-full rounded-full bg-foreground text-background py-3 text-sm tracking-wide transition-all hover:bg-accent hover:shadow-[var(--shadow-soft)] disabled:opacity-60"
          >
            {loading ? t.register.submitting : t.register.submit}
          </button>

          <p className="text-sm text-muted-foreground text-center">
            {t.register.alreadyAccount}{" "}
            <Link to="/login" className="text-foreground hover:text-accent underline underline-offset-4 transition-colors">
              {t.register.signIn}
            </Link>
          </p>
        </form>
      </div>

      <style>{`.auth-input{width:100%;background:var(--background);border:1px solid var(--border);border-radius:.625rem;padding:.7rem .9rem;font-size:.9rem;color:var(--foreground);outline:none;transition:border-color .2s,box-shadow .2s}.auth-input:focus{border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in oklab,var(--accent) 18%,transparent)}`}</style>
    </SiteLayout>
  );
}

function Rule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={`flex items-center gap-1.5 text-xs ${ok ? "text-accent" : "text-muted-foreground"}`}>
      {ok
        ? <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
        : <XCircle className="h-3.5 w-3.5 flex-shrink-0" />}
      {label}
    </li>
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
