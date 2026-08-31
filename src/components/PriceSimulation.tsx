import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { CalcInput } from "@/types";
import { simulatePriceRange } from "@/calculators/profit";
import { formatMoney, formatMoneySigned, formatPercent } from "@/utils/format";
import { NumberField, Panel } from "./fields";

export function PriceSimulation({
  input,
  lowMarginThreshold,
  onPickPrice,
}: {
  input: CalcInput;
  lowMarginThreshold: number;
  onPickPrice: (price: number) => void;
}) {
  const base = input.price || 100;
  const [from, setFrom] = useState(() => Math.max(0, Math.round(base * 0.75)));
  const [to, setTo] = useState(() => Math.round(base * 1.25) || 200);
  const [step, setStep] = useState(5);

  const rows = useMemo(
    () => simulatePriceRange(input, from, to, step),
    [input, from, to, step],
  );

  return (
    <Panel title="Simulação de preços" step="04">
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <NumberField label="Preço inicial" prefix="R$" value={from} onChange={setFrom} />
        <NumberField label="Preço final" prefix="R$" value={to} onChange={setTo} />
        <NumberField label="Incremento" prefix="R$" value={step} onChange={setStep} />
      </div>
      <div className="max-h-[420px] overflow-auto">
        <table className="num w-full min-w-[460px] border-collapse text-[13px]">
          <thead>
            <tr className="text-[11px] tracking-wide text-dim uppercase">
              <th className="pb-2 text-left font-medium">Preço</th>
              <th className="pb-2 text-right font-medium">Taxas</th>
              <th className="pb-2 text-right font-medium">Imposto</th>
              <th className="pb-2 text-right font-medium">Custos</th>
              <th className="pb-2 text-right font-medium">Lucro</th>
              <th className="pb-2 text-right font-medium">Margem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {rows.map((row) => {
              const current = Math.abs(row.price - input.price) < 1e-9;
              const tone =
                row.profit < 0
                  ? "text-loss"
                  : row.margin < lowMarginThreshold
                    ? "text-warn"
                    : "text-profit";
              return (
                <tr
                  key={row.price}
                  onClick={() => onPickPrice(row.price)}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-panel2/60",
                    current && "bg-profit/5",
                  )}
                >
                  <td
                    className={cn(
                      "py-2 text-left",
                      current ? "font-semibold text-profit" : "text-mut",
                    )}
                  >
                    {formatMoney(row.price)}
                  </td>
                  <td className="py-2 text-right text-mut">{formatMoney(row.fees)}</td>
                  <td className="py-2 text-right text-mut">{formatMoney(row.tax)}</td>
                  <td className="py-2 text-right text-mut">{formatMoney(row.costs)}</td>
                  <td className={cn("py-2 text-right font-medium", tone)}>
                    {formatMoneySigned(row.profit)}
                  </td>
                  <td className={cn("py-2 text-right", tone)}>{formatPercent(row.margin)}</td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-mut">
                  Defina um intervalo de preços válido.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
