export type MarketplaceId = "shopee" | "mercado_livre" | "propria" | "custom";

export const MARKETPLACE_LABELS: Record<MarketplaceId, string> = {
  shopee: "Shopee",
  mercado_livre: "Mercado Livre",
  propria: "Venda própria",
  custom: "Personalizado",
};

export type AdType = "none" | "fixed" | "percent";
export type TaxType = "percent" | "fixed";

/** Which calculator flow the user is on. */
export type CalculationMode = "profit" | "price";
/** How the user defines the desired gain in the price-formation flow. */
export type ProfitType = "margin" | "markup";

/** A reusable fee configuration (ex: "Mercado Livre — Anúncio Clássico"). */
export interface FeeProfile {
  id: string;
  name: string;
  marketplace: MarketplaceId;
  commissionPct: number;
  fixedFee: number;
  extraPct: number;
  otherFees: number;
  adType: AdType;
  adValue: number;
  taxType: TaxType;
  taxValue: number;
}

/** Which cost lines are active in the calculation. */
export interface CostToggles {
  commission: boolean;
  fixedFee: boolean;
  extraPct: boolean;
  otherFees: boolean;
  tax: boolean;
  advertising: boolean;
  packaging: boolean;
  shipping: boolean;
  otherCosts: boolean;
  discount: boolean;
  coupon: boolean;
}

export const DEFAULT_TOGGLES: CostToggles = {
  commission: true,
  fixedFee: true,
  extraPct: true,
  otherFees: true,
  tax: true,
  advertising: true,
  packaging: true,
  shipping: true,
  otherCosts: true,
  discount: true,
  coupon: true,
};

/** Everything the calculation engine needs. All money values are per unit. */
export interface CalcInput {
  productName: string;
  productCost: number;
  packaging: number;
  shipping: number;
  otherCosts: number;
  price: number;
  quantity: number;
  discount: number;
  coupon: number;
  marketplace: MarketplaceId;
  profileId?: string;
  commissionPct: number;
  fixedFee: number;
  extraPct: number;
  otherFees: number;
  adType: AdType;
  adValue: number;
  taxType: TaxType;
  taxValue: number;
  toggles: CostToggles;
  /** Calculator flow used (legacy records may omit it → "profit"). */
  calcMode?: CalculationMode;
  /** Gain definition in the price-formation flow (legacy → "margin"). */
  profitType?: ProfitType;
  /** Desired net margin (%) used by the price-formation flow. */
  desiredMarginPct?: number;
  /** Desired markup (%) over the base cost. */
  markupPct?: number;
}

export interface CalcResult {
  grossRevenue: number;
  discountTotal: number;
  revenueBase: number;
  marketplaceFee: number;
  fixedFee: number;
  extraFee: number;
  otherFees: number;
  totalFees: number;
  tax: number;
  advertising: number;
  shipping: number;
  packaging: number;
  productCostTotal: number;
  otherCosts: number;
  totalCosts: number;
  netRevenue: number;
  netProfit: number;
  netMargin: number;
  costRatio: number;
  breakEvenPrice: number;
  profitPerUnit: number;
  status: "loss" | "low" | "healthy";
}

export interface SavedSimulation {
  id: string;
  storeId?: string;
  createdAt: string;
  input: CalcInput;
  netProfit: number;
  netMargin: number;
  /** Legacy records omit these → treated as "profit" / "margin". */
  calculationMode?: CalculationMode;
  profitType?: ProfitType;
  recommendedPrice?: number;
  markupPct?: number;
}

export interface SavedProduct {
  id: string;
  storeId?: string;
  createdAt: string;
  favorite: boolean;
  input: CalcInput;
}

export interface AppSettings {
  profiles: FeeProfile[];
  defaultTaxType: TaxType;
  defaultTaxValue: number;
  lowMarginThreshold: number;
  targetMarginPct: number;
}

/** A store / workspace: an isolated data space (products, simulations, settings). */
export interface Store {
  id: string;
  name: string;
  icon: string;
  createdAt: string;
}

export interface StoreRegistry {
  stores: Store[];
  activeStoreId: string;
}
