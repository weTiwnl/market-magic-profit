import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ActionButton, AppShell } from "@/components/AppShell";
import { Panel } from "@/components/fields";
import { useVendaCalc } from "@/hooks/useVendaCalc";
import { MARKETPLACE_LABELS } from "@/types";
import { exportCsv, exportExcel, exportPdf, shareSimulation } from "@/services/export";
import { formatDate, formatMoneySigned, formatPercent } from "@/utils/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/simulacoes")({
  head: () => ({
    meta: [
      { title: "Histórico de simulações — VendaCalc" },
      {
        name: "description",
        content:
          "Consulte, edite, duplique e exporte para CSV, Excel ou PDF todas as simulações de lucro que você salvou.",
      },
      { property: "og:title", content: "Histórico de simulações — VendaCalc" },
      {
        property: "og:description",
        content: "Todas as suas simulações de lucro salvas, com exportação e compartilhamento.",
      },
    ],
  }),
  component: SimulacoesPage,
});

function SimulacoesPage() {
  const { simulations, removeSimulation, duplicateSimulation, setDraft } = useVendaCalc();
  const navigate = useNavigate();

  return (
    <AppShell
      title="Simulações"
      subtitle={`${simulations.length} registro(s) salvos neste dispositivo`}
      actions={
        <>
          <ActionButton onClick={() => exportCsv(simulations)}>CSV</ActionButton>
          <ActionButton onClick={() => exportExcel(simulations)}>Excel</ActionButton>
          <ActionButton variant="solid" onClick={() => exportPdf(simulations)}>
            PDF
          </ActionButton>
        </>
      }
    >
      <Panel title="Histórico">
        {simulations.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-mut">
            Nenhuma simulação salva. Faça um cálculo e toque em “Salvar simulação”.
          </p>
        ) : (
          <ul className="divide-y divide-hairline">
            {simulations.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-[160px] flex-1">
                  <p className="truncate text-[13px] font-medium text-foreground">
                    {s.input.productName || "Sem nome"}
                  </p>
                  <p className="num text-[11px] text-dim">
                    {MARKETPLACE_LABELS[s.input.marketplace]} · {formatDate(s.createdAt)}
                  </p>
                </div>
                <div className="num text-right text-[12px]">
                  <p className="text-mut">
                    Venda {formatMoneySigned(s.input.price)} · Custo{" "}
                    {formatMoneySigned(s.input.productCost)}
                  </p>
                  <p
                    className={cn(
                      "font-semibold",
                      s.netProfit < 0 ? "text-loss" : "text-profit",
                    )}
                  >
                    Lucro {formatMoneySigned(s.netProfit)} · {formatPercent(s.netMargin)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setDraft(s.input);
                      navigate({ to: "/" });
                    }}
                    className="rounded-md bg-panel2 px-2.5 py-1.5 text-[11px] font-medium text-foreground ring-1 ring-hairline"
                  >
                    Refazer
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicateSimulation(s.id)}
                    className="rounded-md bg-panel2 px-2.5 py-1.5 text-[11px] font-medium text-foreground ring-1 ring-hairline"
                  >
                    Duplicar
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const outcome = await shareSimulation(s);
                      if (outcome === "copied") toast.success("Resultado copiado");
                    }}
                    className="rounded-md bg-panel2 px-2.5 py-1.5 text-[11px] font-medium text-foreground ring-1 ring-hairline"
                  >
                    Compartilhar
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSimulation(s.id)}
                    className="rounded-md bg-loss/10 px-2.5 py-1.5 text-[11px] font-medium text-loss ring-1 ring-loss/30"
                  >
                    Excluir
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </AppShell>
  );
}
