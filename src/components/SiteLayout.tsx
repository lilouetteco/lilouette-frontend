import { Link } from "@tanstack/react-router";
import { Instagram, ShoppingCart, User, LogOut, Settings, Menu } from "lucide-react";
import type { ReactNode } from "react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import logoImage from "@/images/logo.svg";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function Header() {
  const { count } = useCart();
  const { user, logout, isAdmin } = useAuth();
  const { t, lang, setLang } = useT();

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-background/70 border-b border-border/50">
      <div className="mx-auto max-w-6xl px-6 py-5">
        {/* Mobile: hamburger left, logo centered, icons right */}
        <div className="grid grid-cols-3 items-center md:hidden">
          <div className="justify-self-start">
            <Sheet>
              <SheetTrigger asChild>
                <button aria-label="Menu" className="text-foreground">
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-3/4 sm:max-w-xs flex flex-col gap-8 pt-14">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <SheetClose asChild>
                  <Link to="/" className="text-sm uppercase tracking-wide text-foreground">
                    Home
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link to="/products" className="text-sm uppercase tracking-wide text-foreground">
                    {t.nav.collection}
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link to="/contact" className="text-sm uppercase tracking-wide text-foreground">
                    {t.nav.contact}
                  </Link>
                </SheetClose>
              </SheetContent>
            </Sheet>
          </div>
          <Link to="/" aria-label="Lilouette home" className="justify-self-center inline-flex items-center">
            <img src={logoImage} alt="Lilouette" className="h-5 w-auto" />
          </Link>
          <div className="justify-self-end flex items-center gap-4">
            <InstagramLink />
            <CartLink count={count} title={t.cart.title} />
            <AccountCluster user={user} logout={logout} isAdmin={isAdmin} t={t} />
            <LangSwitch lang={lang} setLang={setLang} />
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden md:flex items-center justify-between">
          <Link to="/" aria-label="Lilouette home" className="inline-flex items-center">
            <img src={logoImage} alt="Lilouette" className="h-6 w-auto" />
          </Link>
          <nav className="flex items-center gap-8 text-sm">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/products">{t.nav.collection}</NavLink>
            <NavLink to="/contact">{t.nav.contact}</NavLink>
            <InstagramLink />
            <CartLink count={count} title={t.cart.title} />
            <AccountCluster user={user} logout={logout} isAdmin={isAdmin} t={t} />
            <LangSwitch lang={lang} setLang={setLang} />
          </nav>
        </div>
      </div>
    </header>
  );
}

function InstagramLink() {
  return (
    <a
      href="https://www.instagram.com/lilouette.co/"
      target="_blank"
      rel="noreferrer noopener"
      aria-label="Instagram"
      className="text-muted-foreground transition-colors hover:text-foreground"
    >
      <Instagram className="h-4 w-4" />
    </a>
  );
}

function CartLink({ count, title }: { count: number; title: string }) {
  return (
    <Link
      to="/cart"
      aria-label={`${title}, ${count} items`}
      className="relative text-muted-foreground transition-colors hover:text-foreground"
    >
      <ShoppingCart className="h-4 w-4" />
      {count > 0 && (
        <span className="absolute -top-2 -right-2 min-w-[1.1rem] h-[1.1rem] px-1 inline-flex items-center justify-center rounded-full bg-accent text-[10px] font-medium text-background">
          {count}
        </span>
      )}
    </Link>
  );
}

function AccountCluster({
  user,
  logout,
  isAdmin,
  t,
}: {
  user: ReturnType<typeof useAuth>["user"];
  logout: () => void;
  isAdmin: boolean;
  t: ReturnType<typeof useT>["t"];
}) {
  if (!user) {
    return (
      <Link
        to="/login"
        aria-label={t.nav.signIn}
        className="text-muted-foreground transition-colors hover:text-foreground"
      >
        <User className="h-4 w-4" />
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        to="/account"
        className="text-xs text-muted-foreground hidden md:block hover:text-foreground transition-colors"
      >
        Hi, {user.name.split(" ")[0]}
      </Link>
      <Link
        to="/account"
        aria-label={t.nav.myAccount}
        title={t.nav.myAccount}
        className="text-muted-foreground transition-colors hover:text-foreground md:hidden"
      >
        <User className="h-4 w-4" />
      </Link>
      {isAdmin && (
        <Link
          to="/admin"
          aria-label={t.nav.admin}
          title={t.nav.admin}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
        </Link>
      )}
      <button
        onClick={logout}
        aria-label={t.nav.signOut}
        title={t.nav.signOut}
        className="text-muted-foreground transition-colors hover:text-foreground"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}

function LangSwitch({ lang, setLang }: { lang: "en" | "sq"; setLang: (l: "en" | "sq") => void }) {
  return (
    <button
      onClick={() => setLang(lang === "en" ? "sq" : "en")}
      className="text-xs tracking-wide uppercase text-muted-foreground hover:text-foreground transition-colors"
      title={lang === "en" ? "Shqip" : "English"}
    >
      {lang === "en" ? "SQ" : "EN"}
    </button>
  );
}

function NavLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="text-muted-foreground tracking-wide uppercase text-xs transition-colors hover:text-foreground"
      activeProps={{ className: "text-foreground" }}
      activeOptions={{ exact: true }}
    >
      {children}
    </Link>
  );
}

function Footer() {
  const { t } = useT();
  return (
    <footer className="border-t border-border/50 mt-20">
      <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted-foreground">
        <img src={logoImage} alt="Lilouette" className="h-4 w-auto" />
        <div className="flex items-center gap-6">
          <Link to="/privacy-policy" className="hover:text-foreground transition-colors">{t.nav.terms}</Link>
          <Link to="/contact" className="hover:text-foreground transition-colors">{t.nav.contact}</Link>
          <p>© {new Date().getFullYear()} Lilouette.</p>
        </div>
        <a
          href="https://www.instagram.com/lilouette.co/"
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-2 hover:text-foreground transition-colors"
        >
          <Instagram className="h-4 w-4" /> @lilouette.co
        </a>
      </div>
    </footer>
  );
}
