import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { colors, radius, spacing } from '../constants/colors';
import { useAuthStore } from '../hooks/useAuthStore';
import { useOrdersStore } from '../hooks/useOrdersStore';
import { OrderCard } from '../components/OrderCard';
import { OrderFormCard } from '../components/OrderFormCard';
import { SlideToConfirm } from '../components/SlideToConfirm';
import { Icon } from '../components/Icon';
import { PrimaryButton } from '../components/PrimaryButton';
import { scanOrderImage } from '../services/scan';
import type { UiOrder } from '../types';

function formatEuro(n: number) {
  return n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
}
function greeting(firstName: string) {
  const hour = new Date().getHours();
  const word = hour >= 5 && hour < 18 ? 'Buongiorno' : 'Buonasera';
  return firstName ? `${word}, ${firstName}!` : `${word}!`;
}
function brandDate(now: Date) {
  const day = String(now.getDate()).padStart(2, '0');
  const month = now.toLocaleDateString('it-IT', { month: 'long' });
  return `Oggi, ${day} ${month.charAt(0).toUpperCase() + month.slice(1)}`;
}
function clockText(now: Date) {
  const dateStr = now.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' });
  const timeStr = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return `${dateStr} · ${timeStr}`;
}

// Equivalente 1:1 di #todayView nel riferimento CORRIO: header saluto/data,
// barra riepilogo (orologio + 3 chip colorate), dopo l'avvio sessione due
// pulsanti "Compila ordine" (apre un modale con il form) / "Scansiona ordine"
// (apre la fotocamera e legge il foglio ordine automaticamente), lista ordini,
// barra a scorrimento per terminare la sessione.
export function ConsegneScreen() {
  const insets = useSafeAreaInsets();
  const profile = useAuthStore((s) => s.profile);
  const { sessionActive, orders, hydrated, hydrate, startSession, endSession, addOrder, updateOrder, deleteOrder, setOrderType } =
    useOrdersStore();

  const [starting, setStarting] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState<UiOrder | null>(null);
  const [sortDesc, setSortDesc] = useState(true);
  const [now, setNow] = useState(new Date());
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const summary = useMemo(() => {
    const pos = orders.filter((o) => o.type === 'pos');
    const cash = orders.filter((o) => o.type === 'cash');
    const paid = orders.filter((o) => o.type === 'paid');
    return {
      posTotal: pos.reduce((s, o) => s + o.amount, 0),
      cashTotal: cash.reduce((s, o) => s + o.amount, 0),
      posCount: pos.length,
      cashCount: cash.length,
      paidCount: paid.length,
    };
  }, [orders]);

  const hasUnassigned = orders.some((o) => !o.type);
  const unassignedCount = orders.filter((o) => !o.type).length;

  async function handleStart() {
    setStarting(true);
    const { error } = await startSession();
    setStarting(false);
    if (error) Alert.alert('Errore', error);
  }

  function handleEndConfirm() {
    endSession().then(({ error }) => {
      if (error) Alert.alert('Errore', error);
    });
  }

  function handleDelete(order: UiOrder) {
    Alert.alert('Elimina ordine', "Eliminare questo ordine? L'operazione non può essere annullata.", [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Elimina', style: 'destructive', onPress: async () => {
        const { error } = await deleteOrder(order.id);
        if (error) Alert.alert('Errore', error);
        if (editingOrder?.id === order.id) { setEditingOrder(null); setFormVisible(false); }
      } },
    ]);
  }

  function openAddModal() {
    setEditingOrder(null);
    setFormVisible(true);
  }

  function closeModal() {
    setFormVisible(false);
    setEditingOrder(null);
  }

  async function handleFormSubmit(address: string, amount: number, phone: string, customerName: string) {
    if (editingOrder) {
      const { error } = await updateOrder(editingOrder.id, address, amount, phone, customerName);
      if (error) { Alert.alert('Errore', error); return; }
    } else {
      const { error } = await addOrder(address, amount, phone, customerName);
      if (error) { Alert.alert('Errore', error); return; }
    }
    closeModal();
  }

  async function handleScan() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permesso fotocamera', 'Consenti l\'accesso alla fotocamera per scansionare il foglio ordine.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.5,
      allowsEditing: false,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (result.canceled || !result.assets?.[0]?.base64) return;

    setScanning(true);
    const outcome = await scanOrderImage(result.assets[0].base64);
    setScanning(false);

    if (!outcome.ok) {
      if (outcome.reason === 'not_configured') {
        Alert.alert(
          'Lettura automatica non ancora attiva',
          'La lettura automatica del foglio ordine non è ancora configurata su questo account. Compila l\'ordine manualmente nel frattempo.',
          [{ text: 'Compila manualmente', onPress: openAddModal }]
        );
      } else {
        Alert.alert('Scansione non riuscita', outcome.message || 'Riprova oppure compila l\'ordine manualmente.', [
          { text: 'Riprova', onPress: handleScan },
          { text: 'Compila manualmente', onPress: openAddModal },
        ]);
      }
      return;
    }

    const { customerName, address, phone, amount } = outcome.data;
    if (!address && !amount && !customerName && !phone) {
      Alert.alert('Non sono riuscito a leggere il foglio', 'Prova a inquadrare meglio oppure compila l\'ordine manualmente.', [
        { text: 'Riprova', onPress: handleScan },
        { text: 'Compila manualmente', onPress: openAddModal },
      ]);
      return;
    }

    const { error } = await addOrder(address || 'Indirizzo da verificare', amount || 0, phone, customerName);
    if (error) {
      Alert.alert('Errore', error);
      return;
    }
    Alert.alert(
      'Ordine creato dalla scansione',
      `Cliente: ${customerName || '—'}\nIndirizzo: ${address || '—'}\nTelefono: ${phone || '—'}\nImporto: ${amount ? formatEuro(amount) : '—'}\n\nControlla e correggi con la matita se qualcosa non è corretto.`
    );
  }

  if (!hydrated) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.brand} />
      </SafeAreaView>
    );
  }

  const sortedOrders = [...orders].sort((a, b) => (sortDesc ? b.ts - a.ts : a.ts - b.ts));

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.greeting}>{greeting(profile?.firstName || '')}</Text>
        <Text style={styles.date}>{brandDate(now)}</Text>
      </View>

      {sessionActive && (
        <View style={styles.summaryBar}>
          <Text style={styles.clock}>{clockText(now)}</Text>
          <View style={styles.chipsGrid}>
            <View style={[styles.chip, { backgroundColor: colors.posBg }]}>
              <Text style={[styles.chipLabel, { color: colors.pos }]}>{summary.posCount} ordini POS</Text>
              <Text style={[styles.chipAmt, { color: colors.pos }]}>{formatEuro(summary.posTotal)}</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: colors.cashBg }]}>
              <Text style={[styles.chipLabel, { color: colors.cash }]}>{summary.cashCount} ordini contanti</Text>
              <Text style={[styles.chipAmt, { color: colors.cash }]}>{formatEuro(summary.cashTotal)}</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: colors.paidBg }]}>
              <Text style={[styles.chipLabel, { color: colors.paid }]}>{summary.paidCount} già pagati</Text>
              <Text style={[styles.chipAmt, { color: colors.paid }]}> </Text>
            </View>
          </View>
        </View>
      )}

      {!sessionActive ? (
        <View style={styles.startWrap}>
          <Pressable style={styles.startBtn} onPress={handleStart} disabled={starting}>
            {starting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Icon name="play" size={34} color={colors.white} />
                <Text style={styles.startBtnLabel}>Inizia{'\n'}Sessione</Text>
              </>
            )}
          </Pressable>
          <Text style={styles.startHint}>Premi per iniziare una nuova sessione di lavoro e registrare gli ordini di oggi.</Text>
        </View>
      ) : (
        <>
        <FlatList
          style={styles.flatList}
          data={sortedOrders}
          keyExtractor={(o) => o.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              <View style={styles.actionsRow}>
                <View style={{ flex: 1 }}>
                  <PrimaryButton
                    label="Compila ordine"
                    icon={<Icon name="plus" size={16} color={colors.white} />}
                    onPress={openAddModal}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <PrimaryButton
                    label="Scansiona ordine"
                    variant="outline"
                    icon={<Icon name="camera" size={16} color={colors.brand} />}
                    onPress={handleScan}
                    loading={scanning}
                  />
                </View>
              </View>

              <View style={styles.listHeader}>
                <Text style={styles.listHeaderTitle}>Ordini di oggi</Text>
              </View>

              {orders.length > 1 && (
                <View style={styles.toolbar}>
                  <Pressable style={styles.sortBtn} onPress={() => setSortDesc((v) => !v)}>
                    <Text style={styles.sortBtnLabel}>{sortDesc ? 'Più recenti in alto' : 'Più vecchi in alto'}</Text>
                  </Pressable>
                </View>
              )}

              {unassignedCount > 0 && (
                <View style={styles.unassignedHint}>
                  <Text style={styles.unassignedHintText}>
                    {unassignedCount === 1
                      ? '1 ordine senza tipo di pagamento assegnato'
                      : `${unassignedCount} ordini senza tipo di pagamento assegnato`}
                  </Text>
                </View>
              )}

              {orders.length === 0 && (
                <Text style={styles.emptyState}>Nessun ordine inserito. Usa i pulsanti qui sopra per aggiungere il primo ordine.</Text>
              )}
            </>
          }
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              locked={!!item.type && editingOrder?.id !== item.id}
              onSetType={(type) => setOrderType(item.id, item.type === type ? null : type)}
              onEdit={() => { setEditingOrder(item); setFormVisible(true); }}
              onDelete={() => handleDelete(item)}
            />
          )}
        />
        {orders.length > 0 && (
          <View style={styles.endWrapFixed}>
            <SlideToConfirm
              variant="brand"
              icon="stop"
              locked={hasUnassigned}
              label={'Scorri per terminare la sessione →'}
              lockedLabel={'Assegna il pagamento a tutti gli ordini per terminare →'}
              onConfirm={handleEndConfirm}
            />
          </View>
        )}
        </>
      )}

      <Modal visible={formVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={insets.top}
        >
          <Pressable style={styles.modalBackdrop} onPress={closeModal} />
          <View style={[styles.modalSheet, { marginTop: insets.top + 64 }]}>
            <View style={styles.modalHandleRow}>
              <Pressable style={styles.modalCloseBtn} onPress={closeModal}>
                <Icon name="x" size={18} color={colors.muted} />
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <OrderFormCard
                mode={editingOrder ? 'edit' : 'add'}
                initialAddress={editingOrder?.address}
                initialAmount={editingOrder ? String(editingOrder.amount).replace('.', ',') : undefined}
                initialPhone={editingOrder?.phone ?? undefined}
                initialCustomerName={editingOrder?.customerName ?? undefined}
                onSubmit={handleFormSubmit}
                onCancel={closeModal}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },

  header: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16 },
  greeting: { fontSize: 27, fontWeight: '800', letterSpacing: -0.4, color: colors.ink, lineHeight: 32 },
  date: { fontSize: 20, fontWeight: '800', color: colors.ink, marginTop: 16 },

  summaryBar: {
    backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
    paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12,
  },
  clock: { fontSize: 12.5, color: colors.muted, marginBottom: 8 },
  chipsGrid: { flexDirection: 'row', gap: 6 },
  chip: { flex: 1, borderRadius: radius.md, paddingVertical: 7, paddingHorizontal: 6, alignItems: 'center' },
  chipLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  chipAmt: { fontSize: 15, fontWeight: '700', marginTop: 1 },

  startWrap: { flex: 1, alignItems: 'center', paddingHorizontal: 20, paddingTop: 56 },
  startBtn: {
    width: 176, height: 176, borderRadius: 88, backgroundColor: colors.brand,
    alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowColor: colors.brand, shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.32, shadowRadius: 30, elevation: 10,
  },
  startBtnLabel: { color: colors.white, fontSize: 16, fontWeight: '800', textAlign: 'center', lineHeight: 20 },
  startHint: { marginTop: 20, fontSize: 13.5, color: colors.muted, textAlign: 'center', maxWidth: 260, lineHeight: 19 },

  flatList: { flex: 1 },
  listContent: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 40 },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },

  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  listHeaderTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },

  toolbar: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  sortBtn: {
    backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6,
  },
  sortBtnLabel: { fontSize: 12.5, fontWeight: '700', color: colors.muted },

  unassignedHint: { backgroundColor: colors.dangerBg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: spacing.sm },
  unassignedHintText: { fontSize: 12.5, fontWeight: '700', color: colors.danger },

  emptyState: { textAlign: 'center', color: colors.muted, paddingVertical: 30, paddingHorizontal: 10, fontSize: 14 },

  endWrapFixed: {
    paddingHorizontal: 14, paddingTop: spacing.md, paddingBottom: spacing.md,
    backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border,
  },

  modalOverlay: { flex: 1, justifyContent: 'flex-start' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.45)' },
  modalSheet: {
    backgroundColor: colors.bg, borderRadius: radius.card,
    marginHorizontal: 14, paddingHorizontal: 14, paddingTop: 4, paddingBottom: 18, maxHeight: '80%',
  },
  modalHandleRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingVertical: 6 },
  modalCloseBtn: { padding: 8 },
});
