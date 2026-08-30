import type { CalcInput, CalcResult, CostToggles, FeeProfile } from "@/types";
import { DEFAULT_TOGGLES } from "@/types";

/**
 * Central calculation engine.
 *
 * Rules:
 * - No intermediate rounding. Every value is returned as a full float and is
 *   only rounded at presentation time.
 * - Every cost line is counted exactly once.
 * - Percentage costs (commission, extra fee, tax, percentage advertising) are
 *   applied over the revenue base = (price - discount - coupon) x quantity.
 * - `netRevenue` is what the seller effectively receives (gross revenue minus
 *   every cost except the product acquisition cost).
 */

const num = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const on = (toggles: CostToggles | undefined, key: keyof CostToggles): boolean =>
  (toggles ?? DEFAULT_TOGGLES)[key] !== false;

export interface RateBreakdown {
  /** Sum of all percentage-based costs, as a fraction (0.21 = 21%). */
  percentRate: number;
  /** Sum of all per-unit fixed costs, including the product cost. */
  fixedPerUnit: number;
  /** Per-unit discounts that reduce the fee base. */
  discountPerUnit: number;
}

export function extractRates(input: CalcInput): RateBreakdown {
  const t = input.toggles;

  const commission = on(t, "commission") ? num(input.commissionPct) / 100 : 0;
  const extra = on(t, "extraPct") ? num(input.extraPct) / 100 : 0;
  const taxPct = on(t, "tax") && input.taxType === "percent" ? num(input.taxValue) / 100 : 0;
  const adPct = on(t, "advertising") && input.adType === "percent" ? num(input.adValue) / 100 : 0;

  const taxFixed = on(t, "tax") && input.taxType === "fixed" ? num(input.taxValue) : 0;
  const adFixed = on(t, "advertising") && input.adType === "fixed" ? num(input.adValue) : 0;

  const fixedPerUnit =
    num(input.productCost) +
    (on(t, "packaging") ? num(input.packaging) : 0) +
    (on(t, "shipping") ? num(input.shipping) : 0) +
    (on(t, "otherCosts") ? num(input.otherCosts) : 0) +
    (on(t, "fixedFee") ? num(input.fixedFee) : 0) +
    (on(t, "otherFees") ? num(input.otherFees) : 0) +
    taxFixed +
    adFixed;

  const discountPerUnit =
    (on(t, "discount") ? num(input.discount) : 0) + (on(t, "coupon") ? num(input.coupon) : 0);

  return { percentRate: commission + extra + taxPct + adPct, fixedPerUnit, discountPerUnit };
}

export function calculateProfit(input: CalcInput, lowMarginThreshold = 10): CalcResult {
  const t = input.toggles;
  const price = num(input.price);
  const quantity = Math.max(1, num(input.quantity) || 1);

  const discountPerUnit =
    (on(t, "discount") ? num(input.discount) : 0) + (on(t, "coupon") ? num(input.coupon) : 0);

  const grossRevenue = price * quantity;
  const discountTotal = discountPerUnit * quantity;
  const revenueBase = grossRevenue - discountTotal;

  const marketplaceFee = on(t, "commission") ? (revenueBase * num(input.commissionPct)) / 100 : 0;
  const extraFee = on(t, "extraPct") ? (revenueBase * num(input.extraPct)) / 100 : 0;
  const fixedFee = on(t, "fixedFee") ? num(input.fixedFee) * quantity : 0;
  const otherFees = on(t, "otherFees") ? num(input.otherFees) * quantity : 0;
  const totalFees = marketplaceFee + extraFee + fixedFee + otherFees;

  const tax = !on(t, "tax")
    ? 0
    : input.taxType === "percent"
      ? (revenueBase * num(input.taxValue)) / 100
      : num(input.taxValue) * quantity;

  const advertising = !on(t, "advertising")
    ? 0
    : input.adType === "percent"
      ? (revenueBase * num(input.adValue)) / 100
      : input.adType === "fixed"
        ? num(input.adValue) * quantity
        : 0;

  const packaging = on(t, "packaging") ? num(input.packaging) * quantity : 0;
  const shipping = on(t, "shipping") ? num(input.shipping) * quantity : 0;
  const otherCosts = on(t, "otherCosts") ? num(input.otherCosts) * quantity : 0;
  const productCostTotal = num(input.productCost) * quantity;

  const totalCosts =
    productCostTotal +
    packaging +
    shipping +
    otherCosts +
    totalFees +
    tax +
    advertising +
    discountTotal;

  const netRevenue = grossRevenue - (totalCosts - productCostTotal);
  const netProfit = grossRevenue - totalCosts;
  const netMargin = grossRevenue === 0 ? 0 : (netProfit / grossRevenue) * 100;
  const costRatio = grossRevenue === 0 ? 0 : (totalCosts / grossRevenue) * 100;

  const breakEvenPrice = breakEvenFor(input, 0);

  return {
    grossRevenue,
    discountTotal,
    revenueBase,
    marketplaceFee,
    fixedFee,
    extraFee,
    otherFees,
    totalFees,
    tax,
    advertising,
    shipping,
    packaging,
    productCostTotal,
    otherCosts,
    totalCosts,
    netRevenue,
    netProfit,
    netMargin,
    costRatio,
    breakEvenPrice,
    profitPerUnit: netProfit / quantity,
    status: netProfit < 0 ? "loss" : netMargin < lowMarginThreshold ? "low" : "healthy",
  };
}

/**
 * Sale price required to reach `targetProfit` (total, across the quantity).
 * Returns Infinity when percentage costs alone consume the whole revenue.
 */
export function breakEvenFor(input: CalcInput, targetProfit = 0): number {
  const { percentRate, fixedPerUnit, discountPerUnit } = extractRates(input);
  const quantity = Math.max(1, num(input.quantity) || 1);
  const remaining = 1 - percentRate;
  if (remaining <= 0) return Infinity;
  const netPrice = (fixedPerUnit * quantity + targetProfit) / (quantity * remaining);
  return netPrice + discountPerUnit;
}

/** Sale price that yields the desired net margin (% over gross revenue). */
export function priceForMargin(input: CalcInput, targetMarginPct: number): number {
  const { percentRate, fixedPerUnit, discountPerUnit } = extractRates(input);
  const margin = num(targetMarginPct) / 100;
  const denominator = 1 - percentRate - margin;
  if (denominator <= 0) return Infinity;
  return (discountPerUnit * (1 - percentRate) + fixedPerUnit) / denominator;
}

/** Units needed to reach a total profit target at the current price. */
export function unitsForProfit(input: CalcInput, targetProfit: number): number {
  const perUnit = calculateProfit({ ...input, quantity: 1 }).netProfit;
  if (perUnit <= 0) return Infinity;
  return num(targetProfit) / perUnit;
}

export interface PriceRow {
  price: number;
  fees: number;
  tax: number;
  costs: number;
  profit: number;
  margin: number;
}

export function simulatePriceRange(
  input: CalcInput,
  from: number,
  to: number,
  step: number,
): PriceRow[] {
  const rows: PriceRow[] = [];
  const start = num(from);
  const end = num(to);
  const increment = num(step) > 0 ? num(step) : 5;
  if (end < start) return rows;
  const maxRows = 200;
  for (let price = start, i = 0; price <= end + 1e-9 && i < maxRows; price += increment, i++) {
    const r = calculateProfit({ ...input, price });
    rows.push({
      price,
      fees: r.totalFees,
      tax: r.tax,
      costs: r.productCostTotal + r.packaging + r.shipping + r.otherCosts + r.advertising,
      profit: r.netProfit,
      margin: r.netMargin,
    });
  }
  return rows;
}

export function applyProfile(input: CalcInput, profile: FeeProfile): CalcInput {
  return {
    ...input,
    marketplace: profile.marketplace,
    profileId: profile.id,
    commissionPct: profile.commissionPct,
    fixedFee: profile.fixedFee,
    extraPct: profile.extraPct,
    otherFees: profile.otherFees,
    adType: profile.adType,
    adValue: profile.adValue,
    taxType: profile.taxType,
    taxValue: profile.taxValue,
  };
}

/** Impact of a price change on the net profit, used by the UX hint. */
export function priceImpact(input: CalcInput, delta: number): number {
  const base = calculateProfit(input).netProfit;
  const next = calculateProfit({ ...input, price: num(input.price) + num(delta) }).netProfit;
  return next - base;
}
