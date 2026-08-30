import type { AppSettings, CalcInput, FeeProfile, MarketplaceId } from "@/types";
import { DEFAULT_TOGGLES } from "@/types";

/**
 * IMPORTANT: none of these numbers are official marketplace rates.
 * They are neutral starting points; the user configures the real values.
 */
export function createEmptyInput(overrides: Partial<CalcInput> = {}): CalcInput {
  return {
    productName: "",
    productCost: 0,
    packaging: 0,
    shipping: 0,
    otherCosts: 0,
    price: 0,
    quantity: 1,
    discount: 0,
    coupon: 0,
    marketplace: "shopee",
    commissionPct: 0,
    fixedFee: 0,
    extraPct: 0,
    otherFees: 0,
    adType: "none",
    adValue: 0,
    taxType: "percent",
    taxValue: 0,
    toggles: { ...DEFAULT_TOGGLES },
    ...overrides,
  };
}

export function createProfile(marketplace: MarketplaceId, name: string): FeeProfile {
  return {
    id: `${marketplace}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    marketplace,
    commissionPct: 0,
    fixedFee: 0,
    extraPct: 0,
    otherFees: 0,
    adType: "none",
    adValue: 0,
    taxType: "percent",
    taxValue: 0,
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  profiles: [
    { ...createProfile("shopee", "Shopee — Venda normal"), id: "shopee-normal" },
    { ...createProfile("shopee", "Shopee — Campanha"), id: "shopee-campanha" },
    {
      ...createProfile("mercado_livre", "Mercado Livre — Anúncio Clássico"),
      id: "ml-classico",
    },
    {
      ...createProfile("mercado_livre", "Mercado Livre — Anúncio Premium"),
      id: "ml-premium",
    },
  ],
  defaultTaxType: "percent",
  defaultTaxValue: 0,
  lowMarginThreshold: 10,
  targetMarginPct: 20,
};
