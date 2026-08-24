import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radius, spacing } from '../constants/colors';
import { useManagerStore } from '../hooks/useManagerStore';
import { Card } from '../components/Card';
import { TextField } from '../components/TextField';
import { Icon } from '../components/Icon';
import { ExportPreviewModal } from '../components/ExportPreviewModal';
import { buildDayCsvContent, writeDayCsvFile, writeDayPdfFile, type GeneratedFile } from '../services/export';
import type { ManagerHistoryDay, PaymentType } from '../types';

function formatEuro(n: number) {
  return n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
}
function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}
const TYPE_LABEL: Record<PaymentType, string> = { pos: 'POS', cash: 'Contanti', paid: 'Pagato' };
const TYPE_COLOR: Record<PaymentType, { bg: string; fg: string }> = {
  pos: { bg: colors.posBg, fg: colors.pos },
  cash: { bg: colors.cashBg, fg: colors.cash },
  paid: { bg: colors.paidBg, fg: colors.paid },
};

// dd/mm/yyyy -> yyyy-mm-dd (per confronto lessicografico con toLocalDateStr)
function parseItDate(str: string): string | null {
  const m = str.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
}
function toLocalDateStr(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function DayCard({ day, onPreview }: { day: ManagerHistoryDay; onPreview: (file: GeneratedFile, csvContent?: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [exporting, setExporting] = useState<'pdf' | 'csv' | null>(null);
  const posTotal = day.orders.filter((o) => o.type === 'pos').reduce((s, o) => s + o.amount, 0);
  const cashTotal = day.orders.filter((o) => o.type === 'cash').reduce((s, o) => s + o.amount, 0);
  const paidCount = day.orders.filter((o) => o.type === 'paid').length;

  async function handleExport(format: 'pdf' | 'csv') {
    setExporting(format);
    try {
      if (format === 'pdf') {
        const file = await writeDayPdfFile(day, { includeRider: true });
        onPreview(file);
      } else {
        const file = await writeDayCsvFile(day, { includeRider: true });
        onPreview(file, buildDayCsvContent(day, { includeRider: true }));
      }
    } catch (e) {
      Alert.alert('Esportazione non riuscita', e instanceof Error ? e.message : String(e));
    } finally {
      setExporting(null);
    }
  }

  return (
    <Card style={styles.dayCard}>
      <View style={styles.dayHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.dayLabel}>{day.label}</Text>
          <Text style={styles.daySub}>{day.riderName} · {day.orders.length} ordini · chiusa alle {formatTime(day.closedAt)}</Text>
        </View>
        <Text style={styles.dayTotal}>{formatEuro(posTotal + cashTotal)}</Text>
      </View>

      <View style={styles.exportRow}>
        <Pressable style={styles.exportBtn} onPress={() => handleExport('pdf')} disabled={!!exporting}>
          {exporting === 'pdf' ? <ActivityIndicator size="small" color={colors.muted} /> : <Icon name="doc" size={14} color={colors.muted} />}
          <Text style={styles.exportBtnLabel}>PDF</Text>
        </Pressable>
        <Pressable style={styles.exportBtn} onPress={() => handleExport('csv')} disabled={!!exporting}>
          {exporting === 'csv' ? <ActivityIndicator size="small" color={colors.muted} /> : <Icon name="download" size={14} color={colors.muted} />}
          <Text style={styles.exportBtnLabel}>Excel</Text>
        </Pressable>
      </View>

      <View style={styles.chipsRow}>
        <View style={[styles.chip, { backgroundColor: colors.posBg }]}>
          <Text style={[styles.chipText, { color: colors.pos }]}>POS {formatEuro(posTotal)}</Text>
        </View>
        <View style={[styles.chip, { backgroundColor: colors.cashBg }]}>
          <Text style={[styles.chipText, { color: colors.cash }]}>Contanti {formatEuro(cashTotal)}</Text>
        </View>
        <View style={[styles.chip, { backgroundColor: colors.paidBg }]}>
          <Text style={[styles.chipText, { color: colors.paid }]}>{paidCount} pagati</Text>
        </View>
      </View>

      {day.orders.length > 0 && (
        <Pressable onPress={() => setExpanded((v) => !v)} style={styles.toggleBtn}>
          <Text style={styles.toggleLabel}>{expanded ? 'Nascondi ordini' : 'Mostra ordini'}</Text>
        </Pressable>
      )}

      {expanded && (
        <View style={styles.ordersWrap}>
          {[...day.orders].sort((a, b) => b.ts - a.ts).map((o) => (
            <View key={o.id} style={styles.orderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderAddress} numberOfLines={1}>{o.address}</Text>
                <Text style={styles.orderTime}>{formatTime(o.ts)}</Text>
              </View>
              <Text style={styles.orderAmount}>{formatEuro(o.amount)}</Text>
              {o.type && (
                <View style={[styles.orderBadge, { backgroundColor: TYPE_COLOR[o.type].bg }]}>
                  <Text style={[styles.orderBadgeText, { color: TYPE_COLOR[o.type].fg }]}>{TYPE_LABEL[o.type]}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

// Equivalente 1:1 di #mgrHistoryView nel riferimento CORRIO: filtri (ricerca
// indirizzo, rider, intervallo date) + riepilogo + elenco giornate di TUTTI i
// rider del business.
export function ManagerStoricoScreen() {
  const { riders, history, historyLoading, fetchHistory, fetchRiders } = useManagerStore();
  const [search, setSearch] = useState('');
  const [riderFilter, setRiderFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [previewFile, setPreviewFile] = useState<GeneratedFile | null>(null);
  const [previewCsv, setPreviewCsv] = useState<string | undefined>(undefined);

  function handlePreview(file: GeneratedFile, csvContent?: string) {
    setPreviewFile(file);
    setPreviewCsv(csvContent);
  }

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
      fetchRiders();
    }, [fetchHistory, fetchRiders])
  );

  const { visibleDays, summary } = useMemo(() => {
    const fromStr = parseItDate(dateFrom);
    const toStr = parseItDate(dateTo);
    const searchLower = search.trim().toLowerCase();

    const sorted = [...history].sort((a, b) => b.closedAt - a.closedAt);
    const days = sorted
      .filter((day) => {
        const dateStr = toLocalDateStr(day.closedAt);
        if (fromStr && dateStr < fromStr) return false;
        if (toStr && dateStr > toStr) return false;
        if (riderFilter !== 'all' && day.riderId !== riderFilter) return false;
        return true;
      })
      .map((day) => ({
        day,
        matched: searchLower ? day.orders.filter((o) => o.address.toLowerCase().includes(searchLower)) : day.orders,
      }))
      .filter(({ matched }) => !searchLower || matched.length > 0);

    let allMatched = days.flatMap(({ matched }) => matched);
    const posSum = allMatched.filter((o) => o.type === 'pos').reduce((s, o) => s + o.amount, 0);
    const cashSum = allMatched.filter((o) => o.type === 'cash').reduce((s, o) => s + o.amount, 0);
    const paidCount = allMatched.filter((o) => o.type === 'paid').length;

    return {
      visibleDays: days.map(({ day }) => day),
      summary: { count: days.length, posSum, cashSum, paidCount },
    };
  }, [history, search, riderFilter, dateFrom, dateTo]);

  function resetFilters() {
    setSearch('');
    setRiderFilter('all');
    setDateFrom('');
    setDateTo('');
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Storico</Text>
      </View>

      {historyLoading && history.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : (
        <FlatList
          data={visibleDays}
          keyExtractor={(d) => d.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              <Card style={styles.filtersCard}>
                <Text style={styles.filtersTitle}>Filtri</Text>
                <TextField label="Cerca indirizzo" value={search} onChangeText={setSearch} placeholder="Es. Via Verdi" />

                <Text style={styles.fieldLabel}>Rider</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.riderChipsRow}>
                  <Pressable
                    style={[styles.riderChip, riderFilter === 'all' && styles.riderChipActive]}
                    onPress={() => setRiderFilter('all')}
                  >
                    <Text style={[styles.riderChipLabel, riderFilter === 'all' && styles.riderChipLabelActive]}>Tutti</Text>
                  </Pressable>
                  {riders.map((r) => {
                    const name = [r.firstName, r.lastName].filter(Boolean).join(' ').trim() || r.email;
                    const active = riderFilter === r.id;
                    return (
                      <Pressable key={r.id} style={[styles.riderChip, active && styles.riderChipActive]} onPress={() => setRiderFilter(r.id)}>
                        <Text style={[styles.riderChipLabel, active && styles.riderChipLabelActive]} numberOfLines={1}>{name}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <View style={styles.dateRow}>
                  <View style={{ flex: 1 }}>
                    <TextField label="Da (gg/mm/aaaa)" value={dateFrom} onChangeText={setDateFrom} placeholder="01/01/2026" keyboardType="numbers-and-punctuation" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextField label="A (gg/mm/aaaa)" value={dateTo} onChangeText={setDateTo} placeholder="31/12/2026" keyboardType="numbers-and-punctuation" />
                  </View>
                </View>

                <Pressable style={styles.resetBtn} onPress={resetFilters}>
                  <Icon name="x" size={14} color={colors.muted} />
                  <Text style={styles.resetBtnLabel}>Azzera filtri</Text>
                </Pressable>
              </Card>

              {history.length > 0 && (
                <Card style={styles.summaryCard}>
                  <View style={styles.summaryRow}><Text style={styles.summaryK}>Sessioni trovate</Text><Text style={styles.summaryV}>{summary.count}</Text></View>
                  <View style={styles.summaryRow}><Text style={styles.summaryK}>Totale POS + Contanti</Text><Text style={styles.summaryV}>{formatEuro(summary.posSum + summary.cashSum)}</Text></View>
                  <View style={styles.summaryRow}><Text style={styles.summaryK}>POS</Text><Text style={styles.summaryV}>{formatEuro(summary.posSum)}</Text></View>
                  <View style={styles.summaryRow}><Text style={styles.summaryK}>Contanti</Text><Text style={styles.summaryV}>{formatEuro(summary.cashSum)}</Text></View>
                  <View style={styles.summaryRow}><Text style={styles.summaryK}>Già pagati</Text><Text style={styles.summaryV}>{summary.paidCount}</Text></View>
                </Card>
              )}
            </>
          }
          renderItem={({ item }) => <DayCard day={item} onPreview={handlePreview} />}
          ListEmptyComponent={
            <Text style={styles.emptyState}>
              {history.length === 0 ? 'Nessuna sessione registrata dai rider.' : 'Nessun risultato per questi filtri.'}
            </Text>
          }
        />
      )}

      <ExportPreviewModal
        visible={!!previewFile}
        file={previewFile}
        csvContent={previewCsv}
        onClose={() => { setPreviewFile(null); setPreviewCsv(undefined); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.md },
  title: { fontSize: 26, fontWeight: '800', color: colors.ink },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },

  filtersCard: { marginBottom: spacing.md },
  filtersTitle: { fontSize: 15, fontWeight: '700', color: colors.ink, marginBottom: spacing.md },
  fieldLabel: { fontSize: 12.5, fontWeight: '600', color: colors.muted, marginBottom: 6 },
  riderChipsRow: { marginBottom: spacing.md },
  riderChip: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.pill,
    paddingHorizontal: 12, paddingVertical: 7, marginRight: 6, backgroundColor: colors.white,
  },
  riderChipActive: { backgroundColor: colors.brandLight, borderColor: colors.brand },
  riderChipLabel: { fontSize: 12.5, fontWeight: '700', color: colors.muted },
  riderChipLabelActive: { color: colors.brand },
  dateRow: { flexDirection: 'row', gap: spacing.sm },
  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  resetBtnLabel: { fontSize: 13, fontWeight: '700', color: colors.muted },

  summaryCard: { marginBottom: spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  summaryK: { fontSize: 13, color: colors.muted },
  summaryV: { fontSize: 13.5, fontWeight: '700', color: colors.ink },

  dayCard: { marginBottom: spacing.md },
  dayHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  dayLabel: { fontSize: 15.5, fontWeight: '800', color: colors.ink },
  daySub: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
  dayTotal: { fontSize: 18, fontWeight: '800', color: colors.brand },

  exportRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.sm },
  exportBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.pill, paddingHorizontal: 11, paddingVertical: 6, backgroundColor: colors.white,
  },
  exportBtnLabel: { fontSize: 11.5, fontWeight: '700', color: colors.muted },

  chipsRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.sm, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  chipText: { fontSize: 11.5, fontWeight: '700' },

  toggleBtn: { alignSelf: 'flex-start', paddingVertical: 4 },
  toggleLabel: { fontSize: 12.5, fontWeight: '700', color: colors.brand },

  ordersWrap: { marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  orderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, gap: 8 },
  orderAddress: { fontSize: 13.5, fontWeight: '600', color: colors.ink },
  orderTime: { fontSize: 11.5, color: colors.muted, marginTop: 1 },
  orderAmount: { fontSize: 13.5, fontWeight: '800', color: colors.ink },
  orderBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  orderBadgeText: { fontSize: 10.5, fontWeight: '700' },

  emptyState: { textAlign: 'center', color: colors.muted, paddingVertical: 30, paddingHorizontal: 10, fontSize: 14 },
});
