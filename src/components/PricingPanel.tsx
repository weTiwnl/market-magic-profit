import { cn } from "@/lib/utils";
import type { CalcInput, ProfitType } from "@/types";
import {
  calculateRequiredSalePrice,
  markupToMargin,
  priceScenarios,
  roundMoney,
  validateCalcInput,
} from "@/calculators/pricing";
import { formatMoney, formatMoneySigned, formatPercent } from "@/utils/format";
import { NumberField, Panel } from "./fields";
import { ActionButton } from "./AppShell";

const GOAL_CARDS: { value: ProfitType; title: string; help: string; formula: string }[] = [
  {
    value: "margin",
    title: "Margem de lucro",
    help: "Quero que meu lucro represente uma porcentagem do preço final de venda.",
    formula: "Lucro ÷ Preço de venda × 100",
  },
  {
    value: "markup",
    title: "Markup",
    help: "Quero ganhar uma porcentagem sobre o custo do produto.",
    formula: "Lucro ÷ Custo × 100",
  },
];

export function GoalPanel({
  profitType,
  desiredMarginPct,
  markupPct,
  onChange,
}: {
  profitType: ProfitType;
  desiredMarginPct: number;
  markupPct: number;
  onChange: (patch: Partial<CalcInput>) => void;
}) {
  return (
    <Panel title="Como você quer definir seu lucro?" step="03">
      <div className="grid gap-3 sm:grid-cols-2">
        {GOAL_CARDS.map((card) => {
          const active = card.value === profitType;
          return (
            <button
              key={card.value}
              type="button"
              onClick={() => onChange({ profitType: card.value })}
              className={cn(
                "rounded-xl p-4 text-left ring-1 transition-colors",
                active
                  ? "bg-profit/10 ring-profit/40"
                  : "bg-field ring-hairline hover:ring-ring/40",
              )}
            >
              <p
                className={cn(
                  "text-[13px] font-semibold",
                  active ? "text-profit" : "text-foreground",
                )}
              >
                {card.title}
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-mut">{card.help}</p>
              <p className="num mt-2 text-[11px] text-dim">{card.formula}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-3 sm:max-w-[220px]">
        {profitType === "margin" ? (
          <NumberField
            label="Margem de lucro desejada"
            suffix="%"
            emphasis
            value={desiredMarginPct}
            onChange={(desiredMarginPct) => onChange({ desiredMarginPct })}
          />
        ) : (
          <NumberField
            label="Markup desejado"
            suffix="%"
            emphasis
            value={markupPct}
            onChange={(markupPct) => onChange({ markupPct })}
          />
        )}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-dim">
        Markup é calculado sobre o custo. Margem é calculada sobre o preço de venda. São conceitos
        diferentes e produzem preços diferentes.
      </p>
    </Panel>
  );
}

export function MarginVsMarkup({ markupPct }: { markupPct: number }) {
  const cost = 100;
  const price = cost * (1 + Math.max(0, markupPct) / 100);
  const profit = price - cost;
  return (
    <Panel title="Margem x Markup" step="?">
      <div className="num grid gap-2 rounded-lg bg-field p-3 text-[12px] ring-1 ring-hairline">
        <p className="flex justify-between">
          <span className="text-mut">Custo</span>
          <span>{formatMoney(cost)}</span>
        </p>
        <p className="flex justify-between">
          <span className="text-mut">Markup de {formatPercent(markupPct, 0)}</span>
          <span>{formatMoney(price)}</span>
        </p>
        <p className="flex justify-between">
          <span className="text-mut">Lucro</span>
          <span>{formatMoney(profit)}</span>
        </p>
        <p className="flex justify-between">
          <span className="text-mut">Margem real</span>
          <span className="text-profit">{formatPercent(markupToMargin(markupPct))}</span>
        </p>
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-mut">
        Um markup de {formatPercent(markupPct, 0)} sobre o custo não é o mesmo que{" "}
        {formatPercent(markupPct, 0)} de margem: sobre o preço de venda esse ganho equivale a{" "}
        <span className="num text-foreground">{formatPercent(markupToMargin(markupPct))}</span>.
      </p>
    </Panel>
  );
}

export function PriceResultPanel({
  input,
  lowMarginThreshold,
  onUsePrice,
}: {
  input: CalcInput;
  lowMarginThreshold: number;
  onUsePrice: (price: number) => void;
}) {
  const profitType = input.profitType ?? "margin";
  const goal = {
    profitType,
    desiredMarginPct: input.desiredMarginPct ?? 20,
    markupPct: input.markupPct ?? 20,
  };
  const issues = validateCalcInput(input, "price", goal);
  const outcome = calculateRequiredSalePrice(input, goal, lowMarginThreshold);
  const scenarios = outcome.ok ? priceScenarios(input, outcome.price, lowMarginThreshold) : [];

  if (issues.length > 0 || !outcome.ok) {
    return (
      <div className="space-y-3">
        <section className="panel-surface p-5">
          <p className="eyebrow">Preço de venda recomendado</p>
          <p className="mt-3 text-[13px] font-semibold text-warn">
            {outcome.error ?? "Ainda não é possível calcular o preço."}
          </p>
          <ul className="mt-2 space-y-1 text-[12px] leading-relaxed text-mut">
            {outcome.errorHint ? <li>{outcome.errorHint}</li> : null}
            {issues.map((issue) => (
              <li key={issue.message}>• {issue.message}</li>
            ))}
          </ul>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <section className="panel-surface overflow-hidden">
        <div className="bg-profit/10 p-5">
          <p className="eyebrow">🎯 Preço de venda recomendado</p>
          <p className="num mt-3 text-4xl font-semibold tracking-tight text-profit sm:text-5xl">
            {formatMoney(outcome.price)}
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-mut">
            Vendendo por menos de{" "}
            <span className="num text-foreground">{formatMoney(outcome.price)}</span>, seu{" "}
            {profitType === "margin" ? "resultado" : "ganho"} fica abaixo do objetivo de{" "}
            {profitType === "margin"
              ? formatPercent(goal.desiredMarginPct, 0)
              : `${formatPercent(goal.markupPct, 0)} de markup`}
            .
          </p>
          <ActionButton
            variant="solid"
            className="mt-3"
            onClick={() => onUsePrice(roundMoney(outcome.price))}
          >
            Usar este preço na análise de lucro
          </ActionButton>
        </div>

        <div className="grid grid-cols-2 gap-2 p-5">
          <Metric label="Custo total fixo" value={formatMoney(outcome.fixedCosts)} />
          <Metric label="Taxas estimadas" value={formatMoney(outcome.estimatedFees)} />
          <Metric
            label="Lucro líquido"
            value={formatMoneySigned(outcome.netProfit)}
            tone="text-profit"
          />
          <Metric
            label="Margem líquida"
            value={formatPercent(outcome.netMargin)}
            tone="text-profit"
          />
          <Metric label="Markup efetivo" value={formatPercent(outcome.effectiveMarkup)} />
          <Metric label="⚖️ Preço de equilíbrio" value={formatMoney(outcome.breakEvenPrice)} />
        </div>
        <p className="border-t border-hairline px-5 py-3 text-[11px] leading-relaxed text-dim">
          Abaixo de {formatMoney(outcome.breakEvenPrice)} você terá prejuízo. Taxas percentuais somam{" "}
          {formatPercent(outcome.percentRate * 100)} do preço de venda.
        </p>

        <details className="border-t border-hairline px-5 py-4">
          <summary className="cursor-pointer text-[12px] font-medium text-info">
            Ver detalhes do cálculo
          </summary>
          <ul className="num mt-3 space-y-1.5 text-[12px]">
            <li className="flex justify-between">
              <span className="text-mut">Custos fixos (numerador)</span>
              <span>{formatMoney(outcome.fixedCosts)}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-mut">Percentuais sobre a venda</span>
              <span>{formatPercent(outcome.percentRate * 100)}</span>
            </li>
            {profitType === "markup" ? (
              <li className="flex justify-between">
                <span className="text-mut">Preço antes das taxas (custo × markup)</span>
                <span>{formatMoney(outcome.priceBeforeFees)}</span>
              </li>
            ) : null}
            <li className="flex justify-between">
              <span className="text-mut">Preço final</span>
              <span className="text-profit">{formatMoney(outcome.price)}</span>
            </li>
          </ul>
        </details>
      </section>

      <Panel title="Veja como seu lucro muda conforme o preço" step="04">
        <div className="overflow-x-auto">
          <table className="num w-full text-[12px]">
            <thead>
              <tr className="text-[11px] text-dim uppercase">
                <th className="py-2 text-left font-medium">Preço</th>
                <th className="py-2 text-right font-medium">Custos</th>
                <th className="py-2 text-right font-medium">Taxas</th>
                <th className="py-2 text-right font-medium">Lucro</th>
                <th className="py-2 text-right font-medium">Margem</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((row) => (
                <tr
                  key={row.price}
                  className={cn(
                    "border-t border-hairline",
                    row.recommended && "bg-profit/10 font-semibold text-profit",
                  )}
                >
                  <td className="py-2 text-left">{formatMoney(row.price)}</td>
                  <td className="py-2 text-right">{formatMoney(row.costs)}</td>
                  <td className="py-2 text-right">{formatMoney(row.fees)}</td>
                  <td
                    className={cn(
                      "py-2 text-right",
                      !row.recommended && (row.profit < 0 ? "text-loss" : "text-foreground"),
                    )}
                  >
                    {formatMoneySigned(row.profit)}
                  </td>
                  <td className="py-2 text-right">{formatPercent(row.margin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg bg-field p-3 ring-1 ring-hairline">
      <p className="text-[11px] tracking-wide text-dim uppercase">{label}</p>
      <p className={cn("num mt-1 text-[17px] font-semibold", tone ?? "text-foreground")}>{value}</p>
    </div>
  );
}
