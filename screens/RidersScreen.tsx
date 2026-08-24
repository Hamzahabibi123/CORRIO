import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radius, spacing } from '../constants/colors';
import { useManagerStore } from '../hooks/useManagerStore';
import type { ManagerRider } from '../types';

function initialsOf(r: ManagerRider) {
  return ((r.firstName || '?')[0] || '?') + ((r.lastName || '')[0] || '');
}
function fullNameOf(r: ManagerRider) {
  return [r.firstName, r.lastName].filter(Boolean).join(' ').trim() || r.email;
}

function RiderCard({ rider, onPress }: { rider: ManagerRider; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initialsOf(rider).toUpperCase() || '?'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={1}>{fullNameOf(rider)}</Text>
        <Text style={styles.email} numberOfLines={1}>{rider.email}</Text>
      </View>
      <View style={[styles.badge, rider.isActive ? styles.badgeActive : styles.badgeInactive]}>
        <Text style={[styles.badgeText, { color: rider.isActive ? colors.accent2 : colors.muted }]}>
          {rider.isActive ? 'In servizio' : 'Non in servizio'}
        </Text>
      </View>
    </Pressable>
  );
}

// Equivalente 1:1 di #ridersView + #riderDetailModal nel riferimento CORRIO:
// elenco dei rider registrati con il codice del business, con badge di stato
// (in servizio / non in servizio) e un modale di dettaglio al tocco.
export function RidersScreen() {
  const { riders, ridersLoading, fetchRiders } = useManagerStore();
  const [selected, setSelected] = useState<ManagerRider | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchRiders();
    }, [fetchRiders])
  );

  function sinceText(r: ManagerRider) {
    if (!r.statusSince) return '—';
    return new Date(r.statusSince).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>I miei rider</Text>
      </View>

      {ridersLoading && riders.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : (
        <FlatList
          data={riders}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <RiderCard rider={item} onPress={() => setSelected(item)} />}
          ListEmptyComponent={
            <Text style={styles.emptyState}>Nessun rider registrato con il codice del tuo business.</Text>
          }
        />
      )}

      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSelected(null)} />
          {selected && (
            <View style={styles.modalBox}>
              <View style={styles.modalAvatarRow}>
                <View style={styles.modalAvatar}>
                  <Text style={styles.modalAvatarText}>{initialsOf(selected).toUpperCase() || '?'}</Text>
                </View>
                <View>
                  <Text style={styles.modalName}>{fullNameOf(selected)}</Text>
                  <View style={[styles.badge, selected.isActive ? styles.badgeActive : styles.badgeInactive, { marginTop: 4 }]}>
                    <Text style={[styles.badgeText, { color: selected.isActive ? colors.accent2 : colors.muted }]}>
                      {selected.isActive ? 'In servizio' : 'Non in servizio'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailRows}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailK}>Email</Text>
                  <Text style={styles.detailV}>{selected.email}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailK}>Telefono</Text>
                  <Text style={styles.detailV}>{selected.phone || '—'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailK}>{selected.isActive ? 'In servizio da' : 'Ultimo cambio stato'}</Text>
                  <Text style={styles.detailV}>{sinceText(selected)}</Text>
                </View>
              </View>

              <Pressable style={styles.closeBtn} onPress={() => setSelected(null)}>
                <Text style={styles.closeBtnLabel}>Chiudi</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.md },
  title: { fontSize: 26, fontWeight: '800', color: colors.ink },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, padding: 14, marginBottom: 10,
  },
  avatar: {
    width: 46, height: 46, borderRadius: 16, backgroundColor: colors.accent2Bg,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '800', color: colors.accent2 },
  name: { fontSize: 15, fontWeight: '700', color: colors.ink },
  email: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
  badge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.pill },
  badgeActive: { backgroundColor: colors.accent2Bg },
  badgeInactive: { backgroundColor: colors.paidBg },
  badgeText: { fontSize: 11, fontWeight: '700' },

  emptyState: { textAlign: 'center', color: colors.muted, paddingVertical: 30, paddingHorizontal: 10, fontSize: 14 },

  modalOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.45)' },
  modalBox: {
    width: '100%', maxWidth: 380, backgroundColor: colors.card, borderRadius: radius.card,
    padding: 20, borderWidth: 1, borderColor: colors.border,
  },
  modalAvatarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  modalAvatar: {
    width: 54, height: 54, borderRadius: 18, backgroundColor: colors.accent2Bg,
    alignItems: 'center', justifyContent: 'center',
  },
  modalAvatarText: { fontSize: 19, fontWeight: '800', color: colors.accent2 },
  modalName: { fontSize: 17, fontWeight: '800', color: colors.ink },

  detailRows: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9 },
  detailK: { fontSize: 13, color: colors.muted },
  detailV: { fontSize: 13.5, fontWeight: '700', color: colors.ink },

  closeBtn: {
    marginTop: spacing.md, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.pill, paddingVertical: 14, alignItems: 'center',
  },
  closeBtnLabel: { fontSize: 15, fontWeight: '700', color: colors.muted },
});
