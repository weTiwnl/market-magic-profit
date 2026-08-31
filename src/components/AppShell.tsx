import { Link } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { STORAGE_KEYS, loadValue, saveValue } from "@/services/storage";
import { usePersistentState } from "@/hooks/usePersistentState";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: "🏠" },
  { to: "/", label: "Calculadora", icon: "🧮" },
  { to: "/produtos", label: "Produtos", icon: "📦" },
  { to: "/simulacoes", label: "Simulações", icon: "📊" },
  { to: "/configuracoes", label: "Configurações", icon: "⚙️" },
] as const;

function ThemeToggle() {
  const { value: theme, setValue: setTheme } = usePersistentState<"dark" | "light">(
    STORAGE_KEYS.theme,
    "dark",
  );

  useEffect(() => {
    document.documentElement.dataset["theme"] = theme;
  }, [theme]);

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Alternar tema"
      className="grid size-8 place-items-center rounded-md bg-panel2 text-mut ring-1 ring-hairline hover:text-foreground"
    >
      <span className="text-[13px]">{theme === "dark" ? "☾" : "☀"}</span>
    </button>
  );
}

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    const stored = loadValue<"dark" | "light">(STORAGE_KEYS.theme, "dark");
    document.documentElement.dataset["theme"] = stored;
    saveValue(STORAGE_KEYS.theme, stored);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-profit/30">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-profit/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-info/10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-chart-5/5 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8 lg:pb-10">
        <header className="flex h-14 items-center justify-between border-b border-hairline">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="num grid size-7 place-items-center rounded-md bg-primary text-[13px] font-bold text-primary-foreground">
                V
              </span>
              <span className="text-[15px] font-semibold tracking-tight">VendaCalc</span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  activeOptions={{ exact: item.to === "/" }}
                  className="rounded-md px-3 py-1.5 text-[13px] text-mut hover:text-foreground"
                  activeProps={{
                    className:
                      "rounded-md bg-primary/10 px-3 py-1.5 text-[13px] font-medium text-foreground ring-1 ring-hairline",
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-full bg-panel2/80 px-2.5 py-1 text-[11px] font-medium text-mut ring-1 ring-hairline sm:flex">
              <span className="live-dot size-1.5 rounded-full bg-profit" /> Terminal ao vivo
            </span>
            <ThemeToggle />
          </div>
        </header>

        <div className="flex flex-wrap items-end justify-between gap-3 pt-6 pb-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-balance sm:text-2xl">
              {title}
            </h1>
            {subtitle ? <p className="mt-1 text-[13px] text-mut">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>

        {children}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-hairline bg-panel/95 backdrop-blur-xl md:hidden">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.to === "/" }}
            className="flex flex-col items-center gap-0.5 py-2.5 text-[10px] text-mut"
            activeProps={{
              className:
                "flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold text-profit",
            }}
          >
            <span className="text-[15px] leading-none">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function ActionButton({
  children,
  onClick,
  variant = "ghost",
  className,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "solid" | "ghost";
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-2.5 text-[13px] transition-colors",
        variant === "solid"
          ? "bg-primary font-semibold text-primary-foreground hover:opacity-90"
          : "bg-panel2 font-medium text-foreground ring-1 ring-hairline hover:bg-panel2/70",
        className,
      )}
    >
      {children}
    </button>
  );
}
