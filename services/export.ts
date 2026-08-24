import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import type { HistoryDay, PaymentType } from '../types';

// Esportazione degli ordini di UNA sessione (giornata) chiusa — equivalente di
// exportDayCSV()/exportDayPDF() nel riferimento CORRIO. A differenza del web
// (che scarica subito il file), qui generiamo il file e lo mostriamo prima in
// un'anteprima in-app (vedi components/ExportPreviewModal.tsx); solo da lì,
// se l'utente lo desidera, si apre il foglio nativo per salvare/condividere.

function formatEuro(n: number) {
  return n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
}
const TYPE_LABEL: Record<PaymentType, string> = { pos: 'POS', cash: 'Contanti', paid: 'Pagato' };

function toLocalDateStr(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dayTotals(day: HistoryDay) {
  const posTotal = day.orders.filter((o) => o.type === 'pos').reduce((s, o) => s + o.amount, 0);
  const cashTotal = day.orders.filter((o) => o.type === 'cash').reduce((s, o) => s + o.amount, 0);
  const paidCount = day.orders.filter((o) => o.type === 'paid').length;
  return { posTotal, cashTotal, paidCount };
}

function csvEscape(v: string): string {
  if (/[;"\n]/.test(v)) return '"' + v.replace(/"/g, '""') + '"';
  return v;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export interface ExportOptions {
  /** true lato manager: include il nome del rider nel file (la sessione appartiene al team, non solo a chi legge). */
  includeRider?: boolean;
}

export interface GeneratedFile {
  uri: string;
  fileName: string;
  mimeType: string;
}

// --- CSV / "Excel" ---

export function buildDayCsvContent(day: HistoryDay, opts: ExportOptions = {}): string {
  const sorted = [...day.orders].sort((a, b) => a.ts - b.ts);
  const rows: string[][] = [];
  rows.push(['Giorno', day.label]);
  if (opts.includeRider) rows.push(['Rider', day.riderName]);
  rows.push([]);
  rows.push(['Cliente', 'Indirizzo', 'Telefono', 'Importo (EUR)', 'Pagamento', 'Orario']);
  sorted.forEach((o) => {
    rows.push([
      o.customerName || '',
      o.address,
      o.phone || '',
      o.amount.toFixed(2).replace('.', ','),
      o.type ? TYPE_LABEL[o.type] : 'Da assegnare',
      new Date(o.ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
    ]);
  });
  const { posTotal, cashTotal, paidCount } = dayTotals(day);
  rows.push([]);
  rows.push(['Totale POS', posTotal.toFixed(2).replace('.', ',')]);
  rows.push(['Totale Contanti', cashTotal.toFixed(2).replace('.', ',')]);
  rows.push(['Totale generale', (posTotal + cashTotal).toFixed(2).replace('.', ',')]);
  rows.push(['Ordini già pagati', String(paidCount)]);

  return rows.map((r) => r.map(csvEscape).join(';')).join('\r\n');
}

export async function writeDayCsvFile(day: HistoryDay, opts: ExportOptions = {}): Promise<GeneratedFile> {
  const csvContent = buildDayCsvContent(day, opts);
  const fileName = `sessione_${toLocalDateStr(day.closedAt)}.csv`;
  const uri = FileSystem.cacheDirectory + fileName;
  await FileSystem.writeAsStringAsync(uri, '﻿' + csvContent, { encoding: FileSystem.EncodingType.UTF8 });
  return { uri, fileName, mimeType: 'text/csv' };
}

// --- PDF ---

export function buildDayPdfHtml(day: HistoryDay, opts: ExportOptions = {}): string {
  const { posTotal, cashTotal, paidCount } = dayTotals(day);
  const sorted = [...day.orders].sort((a, b) => a.ts - b.ts);
  const rowsHtml = sorted
    .map(
      (o) => `
        <tr>
          <td>${escapeHtml(o.customerName || '—')}</td>
          <td>${escapeHtml(o.address)}</td>
          <td>${escapeHtml(o.phone || '—')}</td>
          <td>${formatEuro(o.amount)}</td>
          <td>${o.type ? TYPE_LABEL[o.type] : 'Da assegnare'}</td>
          <td>${new Date(o.ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</td>
        </tr>`
    )
    .join('');

  return `
    <html><head><meta charset="utf-8" />
    <style>
      body { font-family: -apple-system, Helvetica, Arial, sans-serif; padding: 28px; color:#1f2933; }
      h1 { font-size: 19px; margin: 0 0 2px; }
      .sub { font-size: 12px; color:#6b7280; margin-bottom: 18px; }
      table { width:100%; border-collapse: collapse; font-size: 11px; }
      th, td { text-align:left; padding: 7px 9px; border-bottom: 1px solid #e6e5ea; }
      th { background:#f1f0f3; font-weight:700; }
      .totals { margin-top: 18px; font-size: 12.5px; max-width: 320px; }
      .totals div { display:flex; justify-content:space-between; padding:4px 0; }
      .totals .grand { font-weight:800; font-size: 15px; border-top:1px solid #e6e5ea; padding-top:8px; margin-top:6px; }
    </style></head>
    <body>
      <h1>CORRIO — Report Sessione</h1>
      <div class="sub">${escapeHtml(day.label)}${opts.includeRider ? ' · ' + escapeHtml(day.riderName) : ''}</div>
      <table>
        <thead><tr><th>Cliente</th><th>Indirizzo</th><th>Telefono</th><th>Importo</th><th>Pagamento</th><th>Orario</th></tr></thead>
        <tbody>${rowsHtml || '<tr><td colspan="6">Nessun ordine.</td></tr>'}</tbody>
      </table>
      <div class="totals">
        <div><span>Totale POS</span><span>${formatEuro(posTotal)}</span></div>
        <div><span>Totale Contanti</span><span>${formatEuro(cashTotal)}</span></div>
        <div class="grand"><span>Totale generale</span><span>${formatEuro(posTotal + cashTotal)}</span></div>
        <div><span>Ordini già pagati</span><span>${paidCount}</span></div>
      </div>
    </body></html>
  `;
}

export async function writeDayPdfFile(day: HistoryDay, opts: ExportOptions = {}): Promise<GeneratedFile> {
  const html = buildDayPdfHtml(day, opts);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  const fileName = `sessione_${toLocalDateStr(day.closedAt)}.pdf`;
  return { uri, fileName, mimeType: 'application/pdf' };
}

// --- Condivisione/salvataggio (chiamata SOLO dall'anteprima, non più al tap iniziale) ---

export async function shareGeneratedFile(file: GeneratedFile) {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('La condivisione non è disponibile su questo dispositivo.');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: file.mimeType,
    dialogTitle: file.fileName,
    UTI: file.mimeType === 'application/pdf' ? 'com.adobe.pdf' : 'public.comma-separated-values-text',
  });
}
