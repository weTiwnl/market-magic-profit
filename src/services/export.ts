import type { SavedSimulation } from "@/types";
import { MARKETPLACE_LABELS } from "@/types";
import { formatDate } from "@/utils/format";

const HEADERS = [
  "Produto",
  "Data",
  "Marketplace",
  "Preço",
  "Quantidade",
  "Custo",
  "Lucro líquido",
  "Margem %",
];

function toRows(simulations: SavedSimulation[]): string[][] {
  return simulations.map((s) => [
    s.input.productName || "Sem nome",
    formatDate(s.createdAt),
    MARKETPLACE_LABELS[s.input.marketplace],
    s.input.price.toFixed(2),
    String(s.input.quantity),
    s.input.productCost.toFixed(2),
    s.netProfit.toFixed(2),
    s.netMargin.toFixed(2),
  ]);
}

function download(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** CSV with a BOM + semicolons so Excel pt-BR opens it correctly. */
export function exportCsv(simulations: SavedSimulation[]) {
  const lines = [HEADERS, ...toRows(simulations)]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(";"))
    .join("\r\n");
  download("vendacalc-simulacoes.csv", new Blob(["\uFEFF" + lines], { type: "text/csv" }));
}

/** SpreadsheetML table — opens natively in Excel and Google Sheets. */
export function exportExcel(simulations: SavedSimulation[]) {
  const escape = (value: string) =>
    value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const body = [HEADERS, ...toRows(simulations)]
    .map((row) => `<tr>${row.map((cell) => `<td>${escape(cell)}</td>`).join("")}</tr>`)
    .join("");
  const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8" /></head><body><table>${body}</table></body></html>`;
  download(
    "vendacalc-simulacoes.xls",
    new Blob([html], { type: "application/vnd.ms-excel" }),
  );
}

/** PDF via the browser print dialog (works offline, no dependency). */
export function exportPdf(simulations: SavedSimulation[]) {
  const rows = [HEADERS, ...toRows(simulations)]
    .map(
      (row, index) =>
        `<tr>${row
          .map((cell) => (index === 0 ? `<th>${cell}</th>` : `<td>${cell}</td>`))
          .join("")}</tr>`,
    )
    .join("");
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" />
<title>Profitza — Simulações</title>
<style>
body{font-family:Arial,Helvetica,sans-serif;padding:24px;color:#111}
h1{font-size:18px;margin:0 0 4px}p{color:#666;font-size:12px;margin:0 0 16px}
table{width:100%;border-collapse:collapse;font-size:11px}
th,td{border:1px solid #ddd;padding:6px 8px;text-align:right}
th:first-child,td:first-child,th:nth-child(3),td:nth-child(3){text-align:left}
th{background:#f4f4f5}
</style></head><body>
<h1>Profitza — Simulações</h1>
<p>Venda pelo preço certo. Saiba quanto realmente sobra. Simulação financeira — confira as alíquotas com seu contador.</p>
<table>${rows}</table>
<script>window.onload=function(){window.print()}</script>
</body></html>`);
  win.document.close();
}

export async function shareSimulation(simulation: SavedSimulation) {
  const text = [
    `${simulation.input.productName || "Produto"} — ${MARKETPLACE_LABELS[simulation.input.marketplace]}`,
    `Preço: R$ ${simulation.input.price.toFixed(2)}`,
    `Custo: R$ ${simulation.input.productCost.toFixed(2)}`,
    `Lucro líquido: R$ ${simulation.netProfit.toFixed(2)}`,
    `Margem: ${simulation.netMargin.toFixed(2)}%`,
    "— Profitza",
  ].join("\n");

  const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
  if (nav.share) {
    try {
      await nav.share({ title: "Profitza", text });
      return "shared";
    } catch {
      return "cancelled";
    }
  }
  await navigator.clipboard.writeText(text);
  return "copied";
}
