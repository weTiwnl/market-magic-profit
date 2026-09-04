import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Panel } from "@/components/fields";
import { calculateProfit } from "@/calculators/profit";
import { useVendaCalc } from "@/hooks/useVendaCalc";
import { MARKETPLACE_LABELS } from "@/types";
import { formatMoney, formatMoneySigned, formatPercent } from "@/utils/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/produtos")({
  head: () => ({
    meta: [
      { title: "Produtos favoritos — Profitza" },
      {
        name: "description",
        content:
          "Salve seus produtos com custo e preço e recalcule o lucro automaticamente com as taxas configuradas hoje.",
      },
      { property: "og:title", content: "Produtos favoritos — Profitza" },
      {
        property: "og:description",
        content: "Seus produtos salvos, recalculados com as configurações atuais de taxas.",
      },
    ],
  }),
  component: ProdutosPage,
});

function ProdutosPage() {
  const { products, removeProduct, toggleFavorite, setDraft, settings } = useVendaCalc();
  const navigate = useNavigate();

  const ordered = [...products].sort((a, b) => Number(b.favorite) - Number(a.favorite));

  return (
    <AppShell
      title="Produtos"
      subtitle="Recalculados automaticamente com as configurações atuais"
    >
      {ordered.length === 0 ? (
        <Panel title="Nenhum produto salvo">
          <p className="py-6 text-center text-[13px] text-mut">
            Na calculadora, toque em “Salvar produto” para reaproveitar custos e preços depois.
          </p>
        </Panel>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map((product) => {
            const result = calculateProfit(product.input, settings.lowMarginThreshold);
            return (
              <div key={product.id} className="panel-surface p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-foreground">
                      {product.input.productName || "Sem nome"}
                    </p>
                    <p className="text-[11px] text-dim">
                      {MARKETPLACE_LABELS[product.input.marketplace]}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Favoritar"
                    onClick={() => toggleFavorite(product.id)}
                    className={cn("text-[15px]", product.favorite ? "text-warn" : "text-dim")}
                  >
                    ★
                  </button>
                </div>

                <div className="num mt-3 space-y-1 text-[12px]">
                  <p className="flex justify-between">
                    <span className="text-mut">Custo</span>
                    <span>{formatMoney(product.input.productCost)}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-mut">Preço</span>
                    <span>{formatMoney(product.input.price)}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-mut">Lucro líquido</span>
                    <span
                      className={cn(
                        "font-semibold",
                        result.netProfit < 0 ? "text-loss" : "text-profit",
                      )}
                    >
                      {formatMoneySigned(result.netProfit)}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-mut">Margem</span>
                    <span>{formatPercent(result.netMargin)}</span>
                  </p>
                </div>

                <div className="mt-3 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setDraft(product.input);
                      navigate({ to: "/" });
                    }}
                    className="flex-1 rounded-md bg-panel2 px-2.5 py-2 text-[11px] font-medium text-foreground ring-1 ring-hairline"
                  >
                    Abrir na calculadora
                  </button>
                  <button
                    type="button"
                    onClick={() => removeProduct(product.id)}
                    className="rounded-md bg-loss/10 px-2.5 py-2 text-[11px] font-medium text-loss ring-1 ring-loss/30"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
