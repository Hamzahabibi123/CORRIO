import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../constants/colors';
import { useHistoryStore } from '../hooks/useHistoryStore';
import { Card } from '../components/Card';
import { IconBadge } from '../components/IconBadge';
import { Icon } from '../components/Icon';
import { ExportPreviewModal } from '../components/ExportPreviewModal';
import { buildDayCsvContent, writeDayCsvFile, writeDayPdfFile, type GeneratedFile } from '../services/export';
import type { HistoryDay, PaymentType } from '../types';

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

function DayCard({ day, onPreview }: { day: HistoryDay; onPreview: (file: GeneratedFile, csvContent?: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [exporting, setExporting] = useState<'pdf' | 'csv' | null>(null);
  const summary = useMemo(() => {
    const posTotal = day.orders.filter((o) => o.type === 'pos').reduce((s, o) => s + o.amount, 0);
    const cashTotal = day.orders.filter((o) => o.type === 'cash').reduce((s, o) => s + o.amount, 0);
    return { posTotal, cashTotal, general: posTotal + cashTotal };
  }, [day.orders]);

  async function handleExport(format: 'pdf' | 'csv') {
    setExporting(format);
    try {
      if (format === 'pdf') {
        const file = await writeDayPdfFile(day);
        onPreview(file);
      } else {
        const file = await writeDayCsvFile(day);
        onPreview(file, buildDayCsvContent(day));
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
          <Text style={styles.daySub}>
            {formatTime(day.startedAt)} – {formatTime(day.closedAt)} · {day.orders.length} ordini
          </Text>
        </View>
        <Text style={styles.dayTotal}>{formatEuro(summary.general)}</Text>
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
          <Text style={[styles.chipText, { color: colors.pos }]}>POS {formatEuro(summary.posTotal)}</Text>
        </View>
        <View style={[styles.chip, { backgroundColor: colors.cashBg }]}>
          <Text style={[styles.chipText, { color: colors.cash }]}>Contanti {formatEuro(summary.cashTotal)}</Text>
        </View>
      </View>

      {day.orders.length > 0 && (
        <Pressable onPress={() => setExpanded((v) => !v)} style={styles.toggleBtn}>
          <Text style={styles.toggleLabel}>{expanded ? 'Nascondi ordini' : 'Mostra ordini'}</Text>
          <Ionicons name={expanded ? 'chevron-up-outline' : 'chevron-down-outline'} size={14} color={colors.brand} />
        </Pressable>
      )}

      {expanded && (
        <View style={styles.ordersWrap}>
          {day.orders.map((o) => (
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

// Equivalente dello Storico rider nell'app web: elenco delle sessioni chiuse
// (work_sessions.closed_at not null) con i relativi ordini, in card Factorial-style.
export function StoricoScreen() {
  const { days, loading, fetchHistory } = useHistoryStore();
  const [previewFile, setPreviewFile] = useState<GeneratedFile | null>(null);
  const [previewCsv, setPreviewCsv] = useState<string | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [fetchHistory])
  );

  function handlePreview(file: GeneratedFile, csvContent?: string) {
    setPreviewFile(file);
    setPreviewCsv(csvContent);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Storico</Text>
      </View>

      {loading && days.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : (
        <FlatList
          data={days}
          keyExtractor={(d) => d.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <DayCard day={item} onPreview={handlePreview} />}
          ListEmptyComponent={
            <Card style={styles.emptyCard}>
              <IconBadge name="time-outline" bg={colors.paidBg} fg={colors.muted} size={48} />
              <Text style={styles.emptyTitle}>Nessuna sessione conclusa</Text>
              <Text style={styles.emptySub}>Le sessioni terminate compariranno qui.</Text>
            </Card>
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

  chipsRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.sm },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  chipText: { fontSize: 11.5, fontWeight: '700' },

  toggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingVertical: 4 },
  toggleLabel: { fontSize: 12.5, fontWeight: '700', color: colors.brand },

  ordersWrap: { marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  orderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, gap: 8 },
  orderAddress: { fontSize: 13.5, fontWeight: '600', color: colors.ink },
  orderTime: { fontSize: 11.5, color: colors.muted, marginTop: 1 },
  orderAmount: { fontSize: 13.5, fontWeight: '800', color: colors.ink },
  orderBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  orderBadgeText: { fontSize: 10.5, fontWeight: '700' },

  emptyCard: { alignItems: 'center', paddingVertical: 28, marginTop: spacing.md },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.ink, marginTop: spacing.md },
  emptySub: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 4 },
});
