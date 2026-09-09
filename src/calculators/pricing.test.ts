import { describe, expect, it } from "vitest";
import { createEmptyInput } from "./defaults";
import { calculateProfit } from "./profit";
import {
  calculateRequiredSalePrice,
  equilibriumPrice,
  markupToMargin,
  validateCalcInput,
} from "./pricing";

describe("modo 1 — lucro a partir do preço", () => {
  it("teste 1: custo 100, venda 200, sem taxas → lucro 100 e margem 50%", () => {
    const r = calculateProfit(createEmptyInput({ productCost: 100, price: 200 }));
    expect(r.netProfit).toBeCloseTo(100, 10);
    expect(r.netMargin).toBeCloseTo(50, 10);
  });

  it("não acumula erro de ponto flutuante", () => {
    const r = calculateProfit(createEmptyInput({ productCost: 100, price: 199.9 }));
    expect(r.netProfit).toBeCloseTo(99.9, 10);
  });
});

describe("modo 2 — preço a partir dos custos", () => {
  it("teste 2: custo 100, comissão 10%, imposto 10%, margem 20%", () => {
    const input = createEmptyInput({
      productCost: 100,
      commissionPct: 10,
      taxType: "percent",
      taxValue: 10,
    });
    const out = calculateRequiredSalePrice(input, {
      profitType: "margin",
      desiredMarginPct: 20,
      markupPct: 0,
    });
    expect(out.ok).toBe(true);
    expect(out.price).toBeCloseTo(100 / 0.6, 6); // 166,67
    expect(out.netMargin).toBeCloseTo(20, 6);
  });

  it("teste 3: custos 115, comissão 15%, imposto 6%, margem 20% → ~194,92", () => {
    const input = createEmptyInput({
      productCost: 100,
      packaging: 5,
      shipping: 10,
      commissionPct: 15,
      taxType: "percent",
      taxValue: 6,
    });
    const out = calculateRequiredSalePrice(input, {
      profitType: "margin",
      desiredMarginPct: 20,
      markupPct: 0,
    });
    expect(out.price).toBeCloseTo(194.92, 2);
    expect(out.netProfit).toBeCloseTo(38.98, 2);
    expect(out.netMargin).toBeCloseTo(20, 6);
  });

  it("teste 4: taxas + margem >= 100% bloqueia o cálculo", () => {
    const input = createEmptyInput({ productCost: 100, commissionPct: 60 });
    const out = calculateRequiredSalePrice(input, {
      profitType: "margin",
      desiredMarginPct: 45,
      markupPct: 0,
    });
    expect(out.ok).toBe(false);
    expect(out.errorHint).toContain("menor que 100%");
    expect(validateCalcInput(input, "price", {
      profitType: "margin",
      desiredMarginPct: 45,
      markupPct: 0,
    }).length).toBeGreaterThan(0);
  });

  it("teste 5: markup 20% sobre custo 100 → preço 120, lucro 20, margem 16,67%", () => {
    const input = createEmptyInput({ productCost: 100 });
    const out = calculateRequiredSalePrice(input, {
      profitType: "markup",
      desiredMarginPct: 0,
      markupPct: 20,
    });
    expect(out.price).toBeCloseTo(120, 6);
    expect(out.netProfit).toBeCloseTo(20, 6);
    expect(out.netMargin).toBeCloseTo(16.6667, 3);
    expect(markupToMargin(20)).toBeCloseTo(16.6667, 3);
  });

  it("markup considera as taxas do marketplace no preço final", () => {
    const input = createEmptyInput({ productCost: 100, commissionPct: 10 });
    const out = calculateRequiredSalePrice(input, {
      profitType: "markup",
      desiredMarginPct: 0,
      markupPct: 20,
    });
    expect(out.price).toBeCloseTo(120 / 0.9, 6);
    expect(out.netProfit).toBeCloseTo(20, 6);
    expect(out.effectiveMarkup).toBeCloseTo(20, 6);
  });

  it("taxa fixa por venda entra no numerador, não no denominador", () => {
    const input = createEmptyInput({ productCost: 100, fixedFee: 5, commissionPct: 10 });
    const out = calculateRequiredSalePrice(input, {
      profitType: "margin",
      desiredMarginPct: 20,
      markupPct: 0,
    });
    expect(out.price).toBeCloseTo(105 / 0.7, 6);
  });

  it("preço de equilíbrio zera o lucro", () => {
    const input = createEmptyInput({ productCost: 100, commissionPct: 15, taxValue: 6 });
    const price = equilibriumPrice(input);
    expect(calculateProfit({ ...input, price }).netProfit).toBeCloseTo(0, 8);
  });
});
