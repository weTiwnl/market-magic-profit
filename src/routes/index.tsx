import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ActionButton, AppShell } from "@/components/AppShell";
import { ComparePanel } from "@/components/ComparePanel";
import { PriceSimulation } from "@/components/PriceSimulation";
import { ResultPanel } from "@/components/ResultPanel";
import {
  NumberField,
  Panel,
  Segmented,
  Stepper,
  TextField,
  ToggleCheck,
} from "@/components/fields";
import { applyProfile, breakEvenFor, calculateProfit, priceForMargin } from "@/calculators/profit";
import { useVendaCalc } from "@/hooks/useVendaCalc";
import { MARKETPLACE_LABELS, type MarketplaceId } from "@/types";
import { formatMoney, formatPercent } from "@/utils/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Profitza — Venda melhor. Lucre mais." },
      {
        name: "description",
        content:
          "Calcule lucro líquido, margem, taxas, impostos e preço mínimo de venda na Shopee e no Mercado Livre em segundos.",
      },
      { property: "og:title", content: "Profitza — Venda melhor. Lucre mais." },
      {
        property: "og:description",
        content: "Venda pelo preço certo. Saiba quanto realmente sobra em cada venda.",
      },
    ],
  }),
  component: CalculadoraPage,
});

const MARKETPLACES: MarketplaceId[] = ["shopee", "mercado_livre", "propria", "custom"];

function CalculadoraPage() {
  const { draft, patchDraft, settings, saveSimulation, saveProduct } = useVendaCalc();
  const [targetProfit, setTargetProfit] = useState(10);
  const [targetMargin, setTargetMargin] = useState(settings.targetMarginPct);
  const [showCompare, setShowCompare] = useState(false);

  const result = useMemo(
    () => calculateProfit(draft, settings.lowMarginThreshold),
    [draft, settings.lowMarginThreshold],
  );

  const minPrice = breakEvenFor(draft, targetProfit);
  const idealPrice = priceForMargin(draft, targetMargin);
  const idealResult = calculateProfit({ ...draft, price: idealPrice });

  const profiles = settings.profiles.filter((p) => p.marketplace === draft.marketplace);
  const toggle = (key: keyof typeof draft.toggles) => (value: boolean) =>
    patchDraft({ toggles: { ...draft.toggles, [key]: value } });

  return (
    <AppShell
      title="Calculadora de lucro"
      subtitle="Simulação em tempo real · valores arredondados só na exibição"
      actions={
        <>
          <ActionButton
            onClick={() => {
              saveProduct(draft);
              toast.success("Produto salvo em Produtos");
            }}
          >
            Salvar produto
          </ActionButton>
          <ActionButton
            variant="solid"
            onClick={() => {
              saveSimulation(draft);
              toast.success("Simulação salva no histórico");
            }}
          >
            Salvar simulação
          </ActionButton>
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_408px]">
        <div className="space-y-4">
          <Panel title="Produto" step="01">
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                label="Nome do produto"
                placeholder="Ex.: Mouse Gamer"
                value={draft.productName}
                onChange={(productName) => patchDraft({ productName })}
              />
              <Stepper
                label="Quantidade"
                value={draft.quantity}
                onChange={(quantity) => patchDraft({ quantity })}
              />
              <NumberField
                label="Custo do produto"
                prefix="R$"
                value={draft.productCost}
                onChange={(productCost) => patchDraft({ productCost })}
              />
              <NumberField
                label="Preço de venda"
                prefix="R$"
                emphasis
                value={draft.price}
                onChange={(price) => patchDraft({ price })}
              />
              <NumberField
                label="Embalagem"
                prefix="R$"
                value={draft.packaging}
                disabled={!draft.toggles.packaging}
                onChange={(packaging) => patchDraft({ packaging })}
                extra={
                  <ToggleCheck
                    label="Ativar embalagem"
                    checked={draft.toggles.packaging}
                    onChange={toggle("packaging")}
                  />
                }
              />
              <NumberField
                label="Frete pago pelo vendedor"
                prefix="R$"
                value={draft.shipping}
                disabled={!draft.toggles.shipping}
                onChange={(shipping) => patchDraft({ shipping })}
                extra={
                  <ToggleCheck
                    label="Ativar frete"
                    checked={draft.toggles.shipping}
                    onChange={toggle("shipping")}
                  />
                }
              />
              <NumberField
                label="Outros custos (operacional)"
                prefix="R$"
                value={draft.otherCosts}
                disabled={!draft.toggles.otherCosts}
                onChange={(otherCosts) => patchDraft({ otherCosts })}
                extra={
                  <ToggleCheck
                    label="Ativar outros custos"
                    checked={draft.toggles.otherCosts}
                    onChange={toggle("otherCosts")}
                  />
                }
              />
              <div className="grid grid-cols-2 gap-3">
                <NumberField
                  label="Desconto"
                  prefix="R$"
                  value={draft.discount}
                  disabled={!draft.toggles.discount}
                  onChange={(discount) => patchDraft({ discount })}
                  extra={
                    <ToggleCheck
                      label="Ativar desconto"
                      checked={draft.toggles.discount}
                      onChange={toggle("discount")}
                    />
                  }
                />
                <NumberField
                  label="Cupom"
                  prefix="R$"
                  value={draft.coupon}
                  disabled={!draft.toggles.coupon}
                  onChange={(coupon) => patchDraft({ coupon })}
                  extra={
                    <ToggleCheck
                      label="Ativar cupom"
                      checked={draft.toggles.coupon}
                      onChange={toggle("coupon")}
                    />
                  }
                />
              </div>
            </div>
          </Panel>

          <Panel title="Marketplace & taxas" step="02">
            <Segmented
              className="grid-cols-2 sm:grid-cols-4"
              value={draft.marketplace}
              onChange={(marketplace) => patchDraft({ marketplace })}
              options={MARKETPLACES.map((id) => ({ value: id, label: MARKETPLACE_LABELS[id] }))}
            />

            {profiles.length > 0 ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-field px-3 py-2 text-[12px] ring-1 ring-hairline">
                <span className="text-mut">Perfil</span>
                <select
                  value={draft.profileId ?? ""}
                  onChange={(e) => {
                    const profile = settings.profiles.find((p) => p.id === e.target.value);
                    if (profile) patchDraft(applyProfile(draft, profile));
                  }}
                  className="max-w-[70%] bg-transparent text-right text-[12px] font-medium text-foreground focus:outline-none"
                >
                  <option value="">Taxas manuais</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <NumberField
                label="Comissão do marketplace"
                suffix="%"
                value={draft.commissionPct}
                disabled={!draft.toggles.commission}
                onChange={(commissionPct) => patchDraft({ commissionPct })}
                extra={
                  <ToggleCheck
                    label="Ativar comissão"
                    checked={draft.toggles.commission}
                    onChange={toggle("commission")}
                  />
                }
              />
              <NumberField
                label="Taxa fixa por venda"
                prefix="R$"
                value={draft.fixedFee}
                disabled={!draft.toggles.fixedFee}
                onChange={(fixedFee) => patchDraft({ fixedFee })}
                extra={
                  <ToggleCheck
                    label="Ativar taxa fixa"
                    checked={draft.toggles.fixedFee}
                    onChange={toggle("fixedFee")}
                  />
                }
              />
              <NumberField
                label="Taxa adicional"
                suffix="%"
                value={draft.extraPct}
                disabled={!draft.toggles.extraPct}
                onChange={(extraPct) => patchDraft({ extraPct })}
                extra={
                  <ToggleCheck
                    label="Ativar taxa adicional"
                    checked={draft.toggles.extraPct}
                    onChange={toggle("extraPct")}
                  />
                }
              />
              <NumberField
                label="Outras taxas"
                prefix="R$"
                value={draft.otherFees}
                disabled={!draft.toggles.otherFees}
                onChange={(otherFees) => patchDraft({ otherFees })}
                extra={
                  <ToggleCheck
                    label="Ativar outras taxas"
                    checked={draft.toggles.otherFees}
                    onChange={toggle("otherFees")}
                  />
                }
              />
              <div className="sm:col-span-2">
                <span className="mb-1.5 flex items-center justify-between text-[12px] text-mut">
                  Imposto
                  <ToggleCheck
                    label="Ativar imposto"
                    checked={draft.toggles.tax}
                    onChange={toggle("tax")}
                  />
                </span>
                <div className="grid grid-cols-[1fr_1fr] gap-2">
                  <Segmented
                    className="grid-cols-2"
                    value={draft.taxType}
                    onChange={(taxType) => patchDraft({ taxType })}
                    options={[
                      { value: "percent", label: "% sobre venda" },
                      { value: "fixed", label: "Valor fixo" },
                    ]}
                  />
                  <NumberField
                    value={draft.taxValue}
                    disabled={!draft.toggles.tax}
                    prefix={draft.taxType === "fixed" ? "R$" : undefined}
                    suffix={draft.taxType === "percent" ? "%" : undefined}
                    onChange={(taxValue) => patchDraft({ taxValue })}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-field p-3 ring-1 ring-hairline">
              <span className="mb-2 flex items-center justify-between text-[12px] text-mut">
                Você vai pagar para destacar/anunciar este produto?
                <ToggleCheck
                  label="Ativar publicidade"
                  checked={draft.toggles.advertising}
                  onChange={toggle("advertising")}
                />
              </span>
              <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr]">
                <Segmented
                  className="grid-cols-3 sm:col-span-2"
                  value={draft.adType}
                  onChange={(adType) => patchDraft({ adType })}
                  options={[
                    { value: "none", label: "Não" },
                    { value: "fixed", label: "Valor fixo" },
                    { value: "percent", label: "% da venda" },
                  ]}
                />
                <NumberField
                  value={draft.adValue}
                  disabled={draft.adType === "none" || !draft.toggles.advertising}
                  prefix={draft.adType === "percent" ? undefined : "R$"}
                  suffix={draft.adType === "percent" ? "%" : undefined}
                  onChange={(adValue) => patchDraft({ adValue })}
                />
              </div>
            </div>

            <p className="mt-3 text-[11px] leading-relaxed text-dim">
              Nenhuma taxa aqui é oficial: Shopee e Mercado Livre variam conforme categoria,
              campanha, tipo de anúncio, reputação e modalidade de envio. Informe os valores do seu
              caso.
            </p>
          </Panel>

          <Panel title="Preço mínimo & preço ideal" step="03">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-field p-4 ring-1 ring-hairline">
                <p className="text-[12px] font-semibold text-foreground">
                  Qual o menor preço que posso vender?
                </p>
                <div className="mt-3">
                  <NumberField
                    label="Lucro líquido desejado"
                    prefix="R$"
                    value={targetProfit}
                    onChange={setTargetProfit}
                  />
                </div>
                <p className="mt-3 text-[12px] leading-relaxed text-mut">
                  Para obter <span className="num text-foreground">{formatMoney(targetProfit)}</span>{" "}
                  de lucro líquido, seu preço mínimo deve ser aproximadamente{" "}
                  <span className="num font-semibold text-profit">{formatMoney(minPrice)}</span>.
                </p>
                <button
                  type="button"
                  onClick={() => patchDraft({ price: Number(minPrice.toFixed(2)) })}
                  className="mt-3 text-[12px] font-medium text-info hover:underline"
                >
                  Usar este preço
                </button>
              </div>

              <div className="rounded-xl bg-field p-4 ring-1 ring-hairline">
                <p className="text-[12px] font-semibold text-foreground">Qual preço devo cobrar?</p>
                <div className="mt-3">
                  <NumberField
                    label="Margem de lucro desejada"
                    suffix="%"
                    value={targetMargin}
                    onChange={setTargetMargin}
                  />
                </div>
                <div className="num mt-3 space-y-1 text-[12px]">
                  <p className="flex justify-between">
                    <span className="text-mut">Preço recomendado</span>
                    <span className="font-semibold text-profit">{formatMoney(idealPrice)}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-mut">Lucro estimado</span>
                    <span>{formatMoney(idealResult.netProfit)}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-mut">Margem</span>
                    <span>{formatPercent(idealResult.netMargin)}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => patchDraft({ price: Number(idealPrice.toFixed(2)) })}
                  className="mt-3 text-[12px] font-medium text-info hover:underline"
                >
                  Usar este preço
                </button>
              </div>
            </div>
          </Panel>

          <PriceSimulation
            input={draft}
            lowMarginThreshold={settings.lowMarginThreshold}
            onPickPrice={(price) => patchDraft({ price: Number(price.toFixed(2)) })}
          />

          <div className={cn(!showCompare && "hidden")}>
            <ComparePanel input={draft} profiles={settings.profiles} />
          </div>
        </div>

        <div className="lg:sticky lg:top-6 lg:h-fit">
          <ResultPanel
            input={draft}
            result={result}
            targetMarginPct={targetMargin}
            onMaximize={() => {
              const price = priceForMargin(draft, targetMargin);
              if (!Number.isFinite(price)) {
                toast.error("As taxas percentuais consomem toda a receita. Reduza-as.");
                return;
              }
              patchDraft({ price: Number(price.toFixed(2)) });
              toast.success(`Preço ajustado para ${formatMoney(price)}`);
            }}
            onCompare={() => setShowCompare((v) => !v)}
          />
        </div>
      </div>
    </AppShell>
  );
}
