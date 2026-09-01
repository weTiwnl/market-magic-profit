import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { CalcInput, FeeProfile } from "@/types";
import { applyProfile, calculateProfit } from "@/calculators/profit";
import { formatMoney, formatMoneySigned, formatPercent } from "@/utils/format";
import { Panel } from "./fields";

function Column({
  title,
  profileName,
  input,
  best,
}: {
  title: string;
  profileName: string;
  input: CalcInput;
  best: boolean;
}) {
  const r = calculateProfit(input);
  return (
    <div
      className={cn(
        "rounded-xl p-4 ring-1",
        best ? "bg-profit/10 ring-profit/40" : "bg-field ring-hairline",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-foreground">{title}</p>
        {best ? <span className="text-[11px] font-semibold text-profit">🏆 Melhor</span> : null}
      </div>
      <p className="mt-0.5 truncate text-[11px] text-dim">{profileName}</p>
      <p
        className={cn(
          "num mt-3 text-2xl font-semibold",
          r.netProfit < 0 ? "text-loss" : "text-profit",
        )}
      >
        {formatMoneySigned(r.netProfit)}
      </p>
      <p className="text-[11px] text-mut">margem {formatPercent(r.netMargin)}</p>
      <ul className="num mt-3 space-y-1.5 border-t border-hairline pt-3 text-[12px]">
        <li className="flex justify-between">
          <span className="text-mut">Comissão</span>
          <span>{formatMoney(r.marketplaceFee + r.fixedFee + r.extraFee)}</span>
        </li>
        <li className="flex justify-between">
          <span className="text-mut">Impostos</span>
          <span>{formatMoney(r.tax)}</span>
        </li>
        <li className="flex justify-between">
          <span className="text-mut">Publicidade</span>
          <span>{formatMoney(r.advertising)}</span>
        </li>
        <li className="flex justify-between">
          <span className="text-mut">Outros custos</span>
          <span>{formatMoney(r.otherFees + r.packaging + r.shipping + r.otherCosts)}</span>
        </li>
      </ul>
    </div>
  );
}

export function ComparePanel({
  input,
  profiles,
}: {
  input: CalcInput;
  profiles: FeeProfile[];
}) {
  const shopeeProfiles = profiles.filter((p) => p.marketplace === "shopee");
  const mlProfiles = profiles.filter((p) => p.marketplace === "mercado_livre");
  const [shopeeId, setShopeeId] = useState(shopeeProfiles[0]?.id ?? "");
  const [mlId, setMlId] = useState(mlProfiles[0]?.id ?? "");

  const shopeeProfile = shopeeProfiles.find((p) => p.id === shopeeId) ?? shopeeProfiles[0];
  const mlProfile = mlProfiles.find((p) => p.id === mlId) ?? mlProfiles[0];

  const shopeeInput = useMemo(
    () => (shopeeProfile ? applyProfile(input, shopeeProfile) : input),
    [input, shopeeProfile],
  );
  const mlInput = useMemo(
    () => (mlProfile ? applyProfile(input, mlProfile) : input),
    [input, mlProfile],
  );

  const shopeeProfit = calculateProfit(shopeeInput).netProfit;
  const mlProfit = calculateProfit(mlInput).netProfit;
  const diff = Math.abs(shopeeProfit - mlProfit);
  const winner = shopeeProfit === mlProfit ? null : shopeeProfit > mlProfit ? "shopee" : "ml";

  const selectClass =
    "h-9 w-full rounded-lg bg-field px-2 text-[12px] text-foreground ring-1 ring-hairline focus:outline-none";

  return (
    <Panel title="Onde é mais lucrativo vender?" step="05">
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[12px] text-mut">Perfil Shopee</span>
          <select
            className={selectClass}
            value={shopeeProfile?.id ?? ""}
            onChange={(e) => setShopeeId(e.target.value)}
          >
            {shopeeProfiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[12px] text-mut">Perfil Mercado Livre</span>
          <select
            className={selectClass}
            value={mlProfile?.id ?? ""}
            onChange={(e) => setMlId(e.target.value)}
          >
            {mlProfiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Column
          title="Shopee"
          profileName={shopeeProfile?.name ?? "Sem perfil"}
          input={shopeeInput}
          best={winner === "shopee"}
        />
        <Column
          title="Mercado Livre"
          profileName={mlProfile?.name ?? "Sem perfil"}
          input={mlInput}
          best={winner === "ml"}
        />
      </div>

      <p className="mt-3 rounded-lg bg-field p-3 text-[12px] text-mut ring-1 ring-hairline">
        {winner === null ? (
          <>Com estes perfis, os dois canais entregam o mesmo lucro por venda.</>
        ) : (
          <>
            🏆{" "}
            <span className="font-semibold text-foreground">
              {winner === "shopee" ? "Shopee" : "Mercado Livre"}
            </span>{" "}
            gera <span className="num text-profit">{formatMoney(diff)}</span> a mais de lucro por
            venda.
          </>
        )}
      </p>
    </Panel>
  );
}
