import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { Panel } from "@/components/fields";
import { calculateProfit, simulatePriceRange } from "@/calculators/profit";
import { useVendaCalc } from "@/hooks/useVendaCalc";
import { MARKETPLACE_LABELS, type MarketplaceId } from "@/types";
import { formatMoney, formatPercent } from "@/utils/format";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard de lucro — Profitza" },
      {
        name: "description",
        content:
          "Acompanhe lucro potencial, margem média, produto mais rentável e o marketplace mais lucrativo das suas simulações.",
      },
      { property: "og:title", content: "Dashboard de lucro — Profitza" },
      {
        property: "og:description",
        content: "Lucro potencial, margem média e comparativo Shopee x Mercado Livre.",
      },
    ],
  }),
  component: DashboardPage,
});

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: string;
  label: string;
  value: string;
  hint?: string | undefined;
}) {
  return (
    <div className="panel-surface p-4">
      <p className="flex items-center gap-2 text-[11px] tracking-wide text-dim uppercase">
        <span className="text-[14px]">{icon}</span>
        {label}
      </p>
      <p className="num mt-2 text-2xl font-semibold text-foreground">{value}</p>
      {hint ? <p className="mt-1 truncate text-[12px] text-mut">{hint}</p> : null}
    </div>
  );
}

const axis = {
  stroke: "var(--color-dim)",
  fontSize: 11,
  fontFamily: "var(--font-mono)",
};

const tooltipStyle = {
  backgroundColor: "var(--color-panel)",
  border: "1px solid var(--hairline)",
  borderRadius: 10,
  fontSize: 12,
  color: "var(--color-foreground)",
};

function DashboardPage() {
  const { simulations, draft, settings, activeStore } = useVendaCalc();

  const stats = useMemo(() => {
    if (simulations.length === 0) return null;
    const totalProfit = simulations.reduce((acc, s) => acc + s.netProfit, 0);
    const avgMargin = simulations.reduce((acc, s) => acc + s.netMargin, 0) / simulations.length;
    const best = simulations.reduce((acc, s) => (s.netProfit > acc.netProfit ? s : acc));

    const byMarketplace = new Map<MarketplaceId, number>();
    simulations.forEach((s) =>
      byMarketplace.set(
        s.input.marketplace,
        (byMarketplace.get(s.input.marketplace) ?? 0) + s.netProfit,
      ),
    );
    const bestMarketplace = [...byMarketplace.entries()].sort((a, b) => b[1] - a[1])[0];

    return { totalProfit, avgMargin, best, bestMarketplace };
  }, [simulations]);

  const byProduct = useMemo(
    () =>
      simulations
        .slice(0, 10)
        .reverse()
        .map((s) => ({
          name: (s.input.productName || "Sem nome").slice(0, 14),
          lucro: Number(s.netProfit.toFixed(2)),
          margem: Number(s.netMargin.toFixed(2)),
        })),
    [simulations],
  );

  const channelData = useMemo(() => {
    const totals: Record<string, { lucro: number; count: number }> = {};
    simulations.forEach((s) => {
      const key = MARKETPLACE_LABELS[s.input.marketplace];
      totals[key] = {
        lucro: (totals[key]?.lucro ?? 0) + s.netProfit,
        count: (totals[key]?.count ?? 0) + 1,
      };
    });
    return Object.entries(totals).map(([name, v]) => ({
      name,
      lucro: Number(v.lucro.toFixed(2)),
    }));
  }, [simulations]);

  const curve = useMemo(() => {
    const base = draft.price || 100;
    return simulatePriceRange(
      draft,
      Math.max(0, base * 0.6),
      base * 1.4,
      Math.max(1, (base * 0.8) / 10),
    ).map((row) => ({
      preco: Number(row.price.toFixed(2)),
      lucro: Number(row.profit.toFixed(2)),
    }));
  }, [draft]);

  const currentResult = calculateProfit(draft, settings.lowMarginThreshold);

  return (
    <AppShell
      title="Dashboard"
      subtitle="Profitza — Venda melhor. Lucre mais."
      actions={
        <span className="flex items-center gap-1.5 rounded-lg bg-panel2 px-2.5 py-1.5 text-[12px] text-mut ring-1 ring-hairline">
          Visualizando dados de:
          <span className="font-medium text-foreground">
            {activeStore ? `${activeStore.icon} ${activeStore.name}` : "—"}
          </span>
        </span>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon="💰"
          label="Lucro estimado"
          value={formatMoney(stats?.totalProfit ?? currentResult.netProfit)}
          hint={
            stats ? `${simulations.length} simulações salvas` : "Simulação atual da calculadora"
          }
        />
        <StatCard
          icon="📦"
          label="Produtos simulados"
          value={String(new Set(simulations.map((s) => s.input.productName)).size || 0)}
          hint={stats?.best.input.productName || "Nenhum produto salvo ainda"}
        />
        <StatCard
          icon="📈"
          label="Margem média"
          value={formatPercent(stats?.avgMargin ?? currentResult.netMargin)}
          hint={`Alerta abaixo de ${formatPercent(settings.lowMarginThreshold, 0)}`}
        />
        <StatCard
          icon="🏆"
          label="Marketplace mais lucrativo"
          value={stats?.bestMarketplace?.[0] ? MARKETPLACE_LABELS[stats.bestMarketplace[0]] : "—"}
          hint={
            stats?.bestMarketplace ? `${formatMoney(stats.bestMarketplace[1])} acumulados` : undefined
          }
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Lucro por produto">
          {byProduct.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={byProduct}>
                <CartesianGrid stroke="var(--hairline)" vertical={false} />
                <XAxis dataKey="name" {...axis} />
                <YAxis {...axis} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="lucro" fill="var(--color-profit)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Margem por produto">
          {byProduct.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={byProduct}>
                <CartesianGrid stroke="var(--hairline)" vertical={false} />
                <XAxis dataKey="name" {...axis} />
                <YAxis {...axis} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="margem" fill="var(--color-info)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Shopee x Mercado Livre">
          {channelData.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={channelData}>
                <CartesianGrid stroke="var(--hairline)" vertical={false} />
                <XAxis dataKey="name" {...axis} />
                <YAxis {...axis} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="lucro" fill="var(--color-warn)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Evolução do preço x lucro">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={curve}>
              <CartesianGrid stroke="var(--hairline)" vertical={false} />
              <XAxis dataKey="preco" {...axis} />
              <YAxis {...axis} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="lucro"
                stroke="var(--color-profit)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </AppShell>
  );
}

function Empty() {
  return (
    <div className="grid h-[240px] place-items-center text-center text-[12px] text-mut">
      <p>
        Nenhuma simulação salva ainda.{" "}
        <Link to="/" className="font-medium text-info hover:underline">
          Abrir a calculadora
        </Link>
      </p>
    </div>
  );
}
