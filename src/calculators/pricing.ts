import type { CalcInput, CalcResult, ProfitType } from "@/types";
import { calculateProfit, extractRates } from "./profit";

/**
 * Price-formation engine (mode 2: costs + goal -> required sale price).
 *
 * Central rules:
 * - Fixed costs (product, packaging, shipping, other costs, fixed fees, fixed
 *   advertising, fixed tax) go in the NUMERATOR.
 * - Percentage costs over the sale price (commission, extra %, % tax,
 *   % advertising) go in the DENOMINATOR.
 * - No intermediate rounding; rounding happens only at presentation.
 */

const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** Money-safe rounding (avoids 199.89999999 artifacts). */
export const roundMoney = (value: number): number =>
  Number.isFinite(value) ? Math.round((value + Number.EPSILON) * 100) / 100 : value;

export interface PriceGoal {
  profitType: ProfitType;
  /** Desired net margin over the sale price, in %. Used when profitType = "margin". */
  desiredMarginPct: number;
  /** Desired markup over the base cost, in %. Used when profitType = "markup". */
  markupPct: number;
}

export interface PriceOutcome {
  ok: boolean;
  /** Friendly reason when the price cannot be computed. */
  error?: string;
  errorHint?: string;
  /** Required unit sale price. */
  price: number;
  /** Fixed costs per unit (numerator). */
  fixedCosts: number;
  /** Sum of percentage costs over the sale price, as a fraction. */
  percentRate: number;
  /** Cost × (1 + markup) — only meaningful in markup mode, ignores marketplace fees. */
  priceBeforeFees: number;
  /** Estimated fees + tax + advertising in money at the required price. */
  estimatedFees: number;
  netProfit: number;
  netMargin: number;
  /** Realised markup: profit / base cost × 100. */
  effectiveMarkup: number;
  /** Lowest price with zero profit. */
  breakEvenPrice: number;
  result: CalcResult | null;
}

export function totalFixedCosts(input: CalcInput): number {
  return extractRates(input).fixedPerUnit;
}

export function percentRateOf(input: CalcInput): number {
  return extractRates(input).percentRate;
}

/** Break-even unit price: fixed costs / (1 - percent rates). */
export function equilibriumPrice(input: CalcInput): number {
  const { percentRate, fixedPerUnit, discountPerUnit } = extractRates(input);
  const remaining = 1 - percentRate;
  if (remaining <= 0) return Infinity;
  return fixedPerUnit / remaining + discountPerUnit;
}

const fail = (error: string, errorHint: string, fixedCosts: number, percentRate: number): PriceOutcome => ({
  ok: false,
  error,
  errorHint,
  price: 0,
  fixedCosts,
  percentRate,
  priceBeforeFees: 0,
  estimatedFees: 0,
  netProfit: 0,
  netMargin: 0,
  effectiveMarkup: 0,
  breakEvenPrice: 0,
  result: null,
});

/**
 * Sale price required to hit the chosen goal (margin over price or markup over cost).
 */
export function calculateRequiredSalePrice(
  input: CalcInput,
  goal: PriceGoal,
  lowMarginThreshold = 10,
): PriceOutcome {
  const { percentRate, fixedPerUnit, discountPerUnit } = extractRates(input);
  const fixedCosts = fixedPerUnit;

  if (fixedCosts <= 0) {
    return fail(
      "Informe os custos do produto para calcular o preço de venda.",
      "Precisamos de pelo menos o custo do produto para chegar a um preço.",
      fixedCosts,
      percentRate,
    );
  }
  if (percentRate >= 1) {
    return fail(
      "Não é possível calcular um preço de venda com esses parâmetros.",
      "A soma das taxas percentuais precisa ser menor que 100%.",
      fixedCosts,
      percentRate,
    );
  }

  let price: number;

  if (goal.profitType === "margin") {
    const margin = num(goal.desiredMarginPct) / 100;
    if (margin < 0) {
      return fail(
        "A margem desejada não pode ser negativa.",
        "Informe uma margem entre 0% e 99%.",
        fixedCosts,
        percentRate,
      );
    }
    const denominator = 1 - percentRate - margin;
    if (denominator <= 0) {
      return fail(
        "Não é possível calcular um preço de venda com esses parâmetros.",
        "A soma das taxas e da margem desejada precisa ser menor que 100%.",
        fixedCosts,
        percentRate,
      );
    }
    price = (fixedCosts + discountPerUnit * (1 - percentRate)) / denominator;
  } else {
    const markup = num(goal.markupPct) / 100;
    if (markup < 0) {
      return fail(
        "O markup desejado não pode ser negativo.",
        "Informe um markup maior ou igual a 0%.",
        fixedCosts,
        percentRate,
      );
    }
    // Desired profit in money = markup over the base cost.
    const desiredProfit = fixedCosts * markup;
    price =
      (fixedCosts + desiredProfit + discountPerUnit * (1 - percentRate)) / (1 - percentRate);
  }

  const result = calculateProfit({ ...input, price, quantity: 1 }, lowMarginThreshold);
  const estimatedFees = result.totalFees + result.tax + result.advertising;

  return {
    ok: true,
    price,
    fixedCosts,
    percentRate,
    priceBeforeFees:
      goal.profitType === "markup" ? fixedCosts * (1 + num(goal.markupPct) / 100) : fixedCosts,
    estimatedFees,
    netProfit: result.netProfit,
    netMargin: result.netMargin,
    effectiveMarkup: fixedCosts > 0 ? (result.netProfit / fixedCosts) * 100 : 0,
    breakEvenPrice: equilibriumPrice(input),
    result,
  };
}

/** Margin -> markup and markup -> margin conversions, for the educational block. */
export const marginToMarkup = (marginPct: number): number => {
  const m = num(marginPct) / 100;
  if (m >= 1) return Infinity;
  return (m / (1 - m)) * 100;
};

export const markupToMargin = (markupPct: number): number => {
  const k = num(markupPct) / 100;
  return (k / (1 + k)) * 100;
};

export interface PriceScenario {
  price: number;
  costs: number;
  fees: number;
  profit: number;
  margin: number;
  recommended: boolean;
}

/** Table of prices around the recommended one. */
export function priceScenarios(
  input: CalcInput,
  recommendedPrice: number,
  lowMarginThreshold = 10,
): PriceScenario[] {
  if (!Number.isFinite(recommendedPrice) || recommendedPrice <= 0) return [];
  const factors = [0.9, 0.95, 1, 1.05, 1.12];
  return factors.map((factor) => {
    const price = factor === 1 ? recommendedPrice : roundMoney(recommendedPrice * factor);
    const r = calculateProfit({ ...input, price, quantity: 1 }, lowMarginThreshold);
    return {
      price,
      costs: r.productCostTotal + r.packaging + r.shipping + r.otherCosts,
      fees: r.totalFees + r.tax + r.advertising,
      profit: r.netProfit,
      margin: r.netMargin,
      recommended: factor === 1,
    };
  });
}

export interface ValidationIssue {
  message: string;
}

/** Shared validations for both calculator modes. */
export function validateCalcInput(
  input: CalcInput,
  mode: "profit" | "price",
  goal?: PriceGoal,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const push = (message: string) => issues.push({ message });

  if (num(input.productCost) < 0) push("O custo do produto não pode ser negativo.");
  if (num(input.packaging) < 0 || num(input.shipping) < 0 || num(input.otherCosts) < 0)
    push("Os custos informados não podem ser negativos.");
  if (num(input.quantity) < 1) push("A quantidade precisa ser no mínimo 1.");
  if (num(input.commissionPct) < 0 || num(input.commissionPct) > 100)
    push("A comissão precisa ficar entre 0% e 100%.");
  if (num(input.extraPct) < 0 || num(input.extraPct) > 100)
    push("A taxa adicional precisa ficar entre 0% e 100%.");
  if (input.taxType === "percent" && (num(input.taxValue) < 0 || num(input.taxValue) > 100))
    push("O imposto percentual precisa ficar entre 0% e 100%.");
  if (input.adType === "percent" && (num(input.adValue) < 0 || num(input.adValue) > 100))
    push("A publicidade percentual precisa ficar entre 0% e 100%.");

  const { percentRate } = extractRates(input);

  if (mode === "profit") {
    if (num(input.price) < 0) push("O preço de venda não pode ser negativo.");
    if (num(input.price) === 0) push("Informe o preço de venda para calcular o lucro.");
  } else {
    if (num(input.productCost) === 0) push("Informe o custo do produto.");
    if (goal) {
      const goalRate =
        goal.profitType === "margin" ? num(goal.desiredMarginPct) / 100 : 0;
      if (goal.profitType === "margin" && percentRate + goalRate >= 1)
        push("A soma das taxas e da margem desejada precisa ser menor que 100%.");
      if (goal.profitType === "margin" && num(goal.desiredMarginPct) >= 100)
        push("A margem desejada precisa ser menor que 100%.");
    }
    if (percentRate >= 1) push("A soma das taxas percentuais precisa ser menor que 100%.");
  }

  return issues;
}
