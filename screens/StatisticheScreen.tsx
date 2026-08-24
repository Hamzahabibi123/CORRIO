import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radius, spacing } from '../constants/colors';
import { useManagerStore } from '../hooks/useManagerStore';
import { Card } from '../components/Card';

function formatEuro(n: number) {
  return n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
}
function toLocalDateStr(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const BAR_HEIGHT = 130;

// Grafico a barre semplice via View (nessuna libreria esterna) — equivalente
// visivo dei grafici Chart.js "Incassi per giorno" / "Consegne per giorno" nel
// riferimento CORRIO, con la stessa base dati (getDailyStats()).
function BarChart({ labels, values, color, formatValue }: { labels: string[]; values: number[]; color: string; formatValue: (n: number) => string }) {
  const max = Math.max(1, ...values);
  return (
    <View style={styles.chartWrap}>
      <View style={styles.barsRow}>
        {values.map((v, i) => {
          const h = Math.max(3, (v / max) * BAR_HEIGHT);
          return (
            <View key={i} style={styles.barCol}>
              <Text style={styles.barValue} numberOfLines={1}>{v > 0 ? formatValue(v) : ''}</Text>
              <View style={[styles.bar, { height: h, backgroundColor: color }]} />
              <Text style={styles.barLabel} numberOfLines={1}>{labels[i]}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// Equivalente 1:1 di #statsView nel riferimento CORRIO: riepilogo (incasso
// totale, consegne totali, media giornaliera) + due grafici a barre sugli
// ultimi 14 giorni con dati chiusi, calcolati dalle sessioni di tutto il
// business (equivalente di getDailyStats()).
export function StatisticheScreen() {
  const { history, historyLoading, fetchHistory } = useManagerStore();

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [fetchHistory])
  );

  const stats = useMemo(() => {
    const map = new Map<string, { revenue: number; count: number }>();
    history.forEach((day) => {
      const dateStr = toLocalDateStr(day.closedAt);
      const revenue = day.orders.filter((o) => o.type === 'pos' || o.type === 'cash').reduce((s, o) => s + o.amount, 0);
      const count = day.orders.length;
      const entry = map.get(dateStr) ?? { revenue: 0, count: 0 };
      entry.revenue += revenue;
      entry.count += count;
      map.set(dateStr, entry);
    });
    const dates = Array.from(map.keys()).sort();
    const last = dates.slice(-14);
    const totalRevenue = Array.from(map.values()).reduce((s, e) => s + e.revenue, 0);
    const totalCount = Array.from(map.values()).reduce((s, e) => s + e.count, 0);
    return {
      labels: last.map((d) => { const [, m, dd] = d.split('-'); return `${dd}/${m}`; }),
      revenue: last.map((d) => Math.round((map.get(d)?.revenue ?? 0) * 100) / 100),
      counts: last.map((d) => map.get(d)?.count ?? 0),
      totalRevenue,
      totalCount,
      avgDaily: map.size > 0 ? totalRevenue / map.size : 0,
    };
  }, [history]);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Statistiche</Text>
      </View>

      {historyLoading && history.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.summaryGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Incasso totale</Text>
              <Text style={styles.statValue}>{formatEuro(stats.totalRevenue)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Consegne totali</Text>
              <Text style={styles.statValue}>{stats.totalCount}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Media giornaliera</Text>
              <Text style={styles.statValue}>{formatEuro(stats.avgDaily)}</Text>
            </View>
          </View>

          <Card style={styles.chartCard}>
            <Text style={styles.chartTitle}>Incassi per giorno</Text>
            {stats.labels.length === 0 ? (
              <Text style={styles.emptyState}>Nessun dato disponibile ancora.</Text>
            ) : (
              <BarChart labels={stats.labels} values={stats.revenue} color={colors.brand} formatValue={formatEuro} />
            )}
          </Card>

          <Card style={styles.chartCard}>
            <Text style={styles.chartTitle}>Consegne per giorno</Text>
            {stats.labels.length === 0 ? (
              <Text style={styles.emptyState}>Nessun dato disponibile ancora.</Text>
            ) : (
              <BarChart labels={stats.labels} values={stats.counts} color={colors.accent2} formatValue={(n) => String(n)} />
            )}
          </Card>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.md },
  title: { fontSize: 26, fontWeight: '800', color: colors.ink },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },

  summaryGrid: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  statCard: {
    flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, padding: 12, alignItems: 'center',
  },
  statLabel: { fontSize: 10.5, fontWeight: '600', color: colors.muted, textAlign: 'center' },
  statValue: { fontSize: 15, fontWeight: '800', color: colors.ink, marginTop: 4, textAlign: 'center' },

  chartCard: { marginBottom: spacing.md },
  chartTitle: { fontSize: 15, fontWeight: '700', color: colors.ink, marginBottom: spacing.md },
  emptyState: { textAlign: 'center', color: colors.muted, paddingVertical: 20, fontSize: 13.5 },

  chartWrap: { paddingTop: 8 },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, minHeight: BAR_HEIGHT + 40 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  barValue: { fontSize: 8.5, fontWeight: '700', color: colors.ink, marginBottom: 3 },
  bar: { width: '70%', borderRadius: 4, minWidth: 6 },
  barLabel: { fontSize: 8.5, color: colors.muted, marginTop: 5 },
});
