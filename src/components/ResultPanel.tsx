import { cn } from "@/lib/utils";
import type { CalcInput, CalcResult } from "@/types";
import { breakEvenFor, priceForMargin, priceImpact } from "@/calculators/profit";
import { formatMoney, formatMoneySigned, formatPercent } from "@/utils/format";
import { ActionButton } from "./AppShell";

const STATUS = {
  loss: {
    icon: "▼",
    tone: "text-loss",
    bg: "bg-loss/10",
    ring: "bg-loss/20",
    title: "🔴 Prejuízo",
  },
  low: {
    icon: "!",
    tone: "text-warn",
    bg: "bg-warn/10",
    ring: "bg-warn/20",
    title: "🟡 Atenção",
  },
  healthy: {
    icon: "▲",
    tone: "text-profit",
    bg: "bg-profit/10",
    ring: "bg-profit/20",
    title: "🟢 Venda rentável",
  },
} as const;

function Line({
  label,
  value,
  negative,
}: {
  label: string;
  value: number;
  negative?: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="text-mut">{label}</span>
      <span className={cn("num", negative ? "text-loss" : "text-foreground")}>
        {negative ? `− ${formatMoney(Math.abs(value))}` : formatMoney(value)}
      </span>
    </li>
  );
}

export function ResultPanel({
  input,
  result,
  targetMarginPct,
  onMaximize,
  onCompare,
}: {
  input: CalcInput;
  result: CalcResult;
  targetMarginPct: number;
  onMaximize: () => void;
  onCompare: () => void;
}) {
  const status = STATUS[result.status];
  const impact = priceImpact(input, 10);
  const idealPrice = priceForMargin(input, targetMarginPct);
  const targetProfitPrice = breakEvenFor(input, 10 * Math.max(1, input.quantity));

  return (
    <div className="space-y-3">
      <section className="panel-surface overflow-hidden">
        <div className={cn("flex items-start gap-3 border-b border-hairline p-4", status.bg)}>
          <span
            className={cn(
              "num mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-[13px]",
              status.ring,
              status.tone,
            )}
          >
            {status.icon}
          </span>
          <div className="min-w-0">
            <p className={cn("text-[13px] font-semibold", status.tone)}>{status.title}</p>
            <p className="mt-0.5 text-[12px] text-mut">
              {result.status === "loss" ? (
                <>
                  Você perderá <span className="num text-foreground">{formatMoney(Math.abs(result.netProfit))}</span>{" "}
                  nesta venda.
                </>
              ) : result.status === "low" ? (
                <>
                  Sua margem líquida é de apenas{" "}
                  <span className="num text-foreground">{formatPercent(result.netMargin)}</span>.
                </>
              ) : (
                <>
                  Esta venda gera{" "}
                  <span className="num text-foreground">{formatMoney(result.netProfit)}</span> de
                  lucro líquido.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="p-5">
          <p className="eyebrow">Resultado da venda</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={cn(
                "num text-4xl font-semibold tracking-tight sm:text-5xl",
                result.netProfit < 0 ? "text-loss" : "text-profit",
              )}
            >
              {formatMoneySigned(result.netProfit)}
            </span>
          </div>
          <p className="mt-1 text-[13px] text-mut">
            Lucro líquido {input.quantity > 1 ? `(${input.quantity} un.)` : "por venda"} · margem{" "}
            <span className="num text-foreground">{formatPercent(result.netMargin)}</span>
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-field p-3 ring-1 ring-hairline">
              <p className="text-[11px] tracking-wide text-dim uppercase">Margem líquida</p>
              <p
                className={cn(
                  "num mt-1 text-[17px] font-semibold",
                  result.netProfit < 0 ? "text-loss" : "text-profit",
                )}
              >
                {formatPercent(result.netMargin)}
              </p>
            </div>
            <div className="rounded-lg bg-field p-3 ring-1 ring-hairline">
              <p className="text-[11px] tracking-wide text-dim uppercase">
                Preço p/ não ter prejuízo
              </p>
              <p className="num mt-1 text-[17px] font-semibold text-foreground">
                {formatMoney(result.breakEvenPrice)}
              </p>
            </div>
            <div className="rounded-lg bg-field p-3 ring-1 ring-hairline">
              <p className="text-[11px] tracking-wide text-dim uppercase">% de custos</p>
              <p className="num mt-1 text-[17px] font-semibold text-foreground">
                {formatPercent(result.costRatio)}
              </p>
            </div>
            <div className="rounded-lg bg-field p-3 ring-1 ring-hairline">
              <p className="text-[11px] tracking-wide text-dim uppercase">Lucro por unidade</p>
              <p className="num mt-1 text-[17px] font-semibold text-foreground">
                {formatMoneySigned(result.profitPerUnit)}
              </p>
            </div>
          </div>

          <p className="mt-3 rounded-lg bg-field p-3 text-[12px] leading-relaxed text-mut ring-1 ring-hairline">
            Se aumentar o preço em <span className="num text-foreground">{formatMoney(10)}</span>, seu
            lucro {impact >= 0 ? "aumenta" : "reduz"} em{" "}
            <span className={cn("num", impact >= 0 ? "text-profit" : "text-loss")}>
              {formatMoney(Math.abs(impact))}
            </span>
            . Para {formatMoney(10)} de lucro líquido, o preço mínimo é{" "}
            <span className="num text-foreground">{formatMoney(targetProfitPrice)}</span>.
          </p>
        </div>

        <div className="border-t border-hairline p-5">
          <ul className="num space-y-2.5 text-[13px]">
            <Line label="Faturamento bruto" value={result.grossRevenue} />
            {result.discountTotal > 0 ? (
              <Line label="Descontos e cupons" value={result.discountTotal} negative />
            ) : null}
            <Line label="Comissão marketplace" value={result.marketplaceFee} negative />
            {result.fixedFee > 0 ? <Line label="Taxa fixa" value={result.fixedFee} negative /> : null}
            {result.extraFee > 0 ? (
              <Line label="Taxa adicional" value={result.extraFee} negative />
            ) : null}
            {result.otherFees > 0 ? (
              <Line label="Outras taxas" value={result.otherFees} negative />
            ) : null}
            <Line
              label={`Imposto${input.taxType === "percent" ? ` (${formatPercent(input.taxValue, 2)})` : ""}`}
              value={result.tax}
              negative
            />
            <Line label="Publicidade" value={result.advertising} negative />
            <Line label="Embalagem" value={result.packaging} negative />
            <Line label="Frete" value={result.shipping} negative />
            {result.otherCosts > 0 ? (
              <Line label="Outros custos" value={result.otherCosts} negative />
            ) : null}
            <Line label="Custo do produto" value={result.productCostTotal} negative />
          </ul>
          <div className="mt-4 flex items-center justify-between border-t border-hairline pt-4">
            <span className="text-[13px] font-medium text-foreground">Valor líquido recebido</span>
            <span className="num text-[17px] font-semibold text-foreground">
              {formatMoney(result.netRevenue)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[12px] text-mut">Total de taxas</span>
            <span className="num text-[13px] text-mut">{formatMoney(result.totalFees)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[12px] text-mut">Custo total</span>
            <span className="num text-[13px] text-mut">{formatMoney(result.totalCosts)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[12px] text-mut">
              Preço ideal ({formatPercent(targetMarginPct, 0)} de margem)
            </span>
            <span className="num text-[13px] text-profit">{formatMoney(idealPrice)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-hairline p-4">
          <ActionButton variant="solid" onClick={onMaximize}>
            Maximizar lucro
          </ActionButton>
          <ActionButton onClick={onCompare}>Comparar marketplaces</ActionButton>
        </div>
      </section>

      <p className="px-1 text-[11px] leading-relaxed text-dim">
        Simulação financeira. A alíquota correta depende do regime tributário e da situação do
        vendedor. Confira com um contador.
      </p>
    </div>
  );
}
