import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { ActionButton, AppShell } from "@/components/AppShell";
import { NumberField, Panel, Segmented, TextField } from "@/components/fields";
import { createProfile, DEFAULT_SETTINGS } from "@/calculators/defaults";
import { useVendaCalc } from "@/hooks/useVendaCalc";
import { MARKETPLACE_LABELS, type FeeProfile, type MarketplaceId } from "@/types";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações de taxas — Profitza" },
      {
        name: "description",
        content:
          "Crie perfis de taxas por marketplace: comissão, taxa fixa, publicidade, imposto e outros custos, do jeito que se aplicam ao seu caso.",
      },
      { property: "og:title", content: "Configurações de taxas — Profitza" },
      {
        property: "og:description",
        content: "Perfis configuráveis de comissão, taxa fixa, publicidade e imposto.",
      },
    ],
  }),
  component: ConfiguracoesPage,
});

const GROUPS: MarketplaceId[] = ["shopee", "mercado_livre", "propria", "custom"];

function ConfiguracoesPage() {
  const { settings, setSettings } = useVendaCalc();

  const update = (id: string, patch: Partial<FeeProfile>) =>
    setSettings((prev) => ({
      ...prev,
      profiles: prev.profiles.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));

  const addProfile = (marketplace: MarketplaceId) =>
    setSettings((prev) => ({
      ...prev,
      profiles: [
        ...prev.profiles,
        createProfile(marketplace, `${MARKETPLACE_LABELS[marketplace]} — novo perfil`),
      ],
    }));

  const removeProfile = (id: string) =>
    setSettings((prev) => ({ ...prev, profiles: prev.profiles.filter((p) => p.id !== id) }));

  return (
    <AppShell
      title="Configurações"
      subtitle="Nenhuma taxa é oficial — configure conforme categoria, campanha e reputação"
      actions={
        <ActionButton
          onClick={() => {
            setSettings(DEFAULT_SETTINGS);
            toast.success("Configurações restauradas");
          }}
        >
          Restaurar padrões
        </ActionButton>
      }
    >
      <div className="space-y-4">
        <Panel title="Preferências gerais">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <span className="mb-1.5 block text-[12px] text-mut">Tipo de imposto padrão</span>
              <Segmented
                className="grid-cols-2"
                value={settings.defaultTaxType}
                onChange={(defaultTaxType) => setSettings((p) => ({ ...p, defaultTaxType }))}
                options={[
                  { value: "percent", label: "% venda" },
                  { value: "fixed", label: "Fixo" },
                ]}
              />
            </div>
            <NumberField
              label="Imposto padrão"
              suffix={settings.defaultTaxType === "percent" ? "%" : undefined}
              prefix={settings.defaultTaxType === "fixed" ? "R$" : undefined}
              value={settings.defaultTaxValue}
              onChange={(defaultTaxValue) => setSettings((p) => ({ ...p, defaultTaxValue }))}
            />
            <NumberField
              label="Margem-alvo padrão"
              suffix="%"
              value={settings.targetMarginPct}
              onChange={(targetMarginPct) => setSettings((p) => ({ ...p, targetMarginPct }))}
            />
            <NumberField
              label="Alertar quando a margem ficar abaixo de"
              suffix="%"
              value={settings.lowMarginThreshold}
              onChange={(lowMarginThreshold) => setSettings((p) => ({ ...p, lowMarginThreshold }))}
            />
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-dim">
            O app faz uma simulação financeira. A alíquota correta depende do regime tributário e da
            situação do vendedor.
          </p>
        </Panel>

        {GROUPS.map((marketplace) => {
          const profiles = settings.profiles.filter((p) => p.marketplace === marketplace);
          return (
            <Panel
              key={marketplace}
              title={MARKETPLACE_LABELS[marketplace]}
              action={
                <button
                  type="button"
                  onClick={() => addProfile(marketplace)}
                  className="text-[12px] font-medium text-info hover:underline"
                >
                  + Novo perfil
                </button>
              }
            >
              {profiles.length === 0 ? (
                <p className="py-4 text-center text-[12px] text-mut">
                  Nenhum perfil criado para este canal.
                </p>
              ) : (
                <div className="space-y-4">
                  {profiles.map((profile) => (
                    <div key={profile.id} className="rounded-xl bg-field p-4 ring-1 ring-hairline">
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <TextField
                            label="Nome do perfil"
                            value={profile.name}
                            onChange={(name) => update(profile.id, { name })}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeProfile(profile.id)}
                          className="h-11 rounded-lg bg-loss/10 px-3 text-[12px] font-medium text-loss ring-1 ring-loss/30"
                        >
                          Excluir
                        </button>
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-4">
                        <NumberField
                          label="Comissão padrão"
                          suffix="%"
                          value={profile.commissionPct}
                          onChange={(commissionPct) => update(profile.id, { commissionPct })}
                        />
                        <NumberField
                          label="Taxa fixa"
                          prefix="R$"
                          value={profile.fixedFee}
                          onChange={(fixedFee) => update(profile.id, { fixedFee })}
                        />
                        <NumberField
                          label="Taxa adicional"
                          suffix="%"
                          value={profile.extraPct}
                          onChange={(extraPct) => update(profile.id, { extraPct })}
                        />
                        <NumberField
                          label="Outros custos"
                          prefix="R$"
                          value={profile.otherFees}
                          onChange={(otherFees) => update(profile.id, { otherFees })}
                        />
                        <div className="sm:col-span-2">
                          <span className="mb-1.5 block text-[12px] text-mut">Publicidade</span>
                          <div className="grid grid-cols-[1fr_auto] gap-2">
                            <Segmented
                              className="grid-cols-3"
                              value={profile.adType}
                              onChange={(adType) => update(profile.id, { adType })}
                              options={[
                                { value: "none", label: "Não" },
                                { value: "fixed", label: "R$" },
                                { value: "percent", label: "%" },
                              ]}
                            />
                            <NumberField
                              className="w-28"
                              value={profile.adValue}
                              disabled={profile.adType === "none"}
                              onChange={(adValue) => update(profile.id, { adValue })}
                            />
                          </div>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="mb-1.5 block text-[12px] text-mut">Imposto</span>
                          <div className="grid grid-cols-[1fr_auto] gap-2">
                            <Segmented
                              className="grid-cols-2"
                              value={profile.taxType}
                              onChange={(taxType) => update(profile.id, { taxType })}
                              options={[
                                { value: "percent", label: "%" },
                                { value: "fixed", label: "R$" },
                              ]}
                            />
                            <NumberField
                              className="w-28"
                              value={profile.taxValue}
                              onChange={(taxValue) => update(profile.id, { taxValue })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          );
        })}
      </div>
    </AppShell>
  );
}
