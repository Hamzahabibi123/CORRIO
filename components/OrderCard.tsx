import React from 'react';
import { Alert, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../constants/colors';
import { Icon } from './Icon';
import type { PaymentType, UiOrder } from '../types';

interface Props {
  order: UiOrder;
  /** true se il tipo pagamento è già assegnato e questa card non è in modalità modifica. */
  locked: boolean;
  onSetType: (type: PaymentType) => void;
  onEdit: () => void;
  onDelete: () => void;
}

const TYPE_LABEL: Record<PaymentType, string> = { pos: 'POS', cash: 'Contanti', paid: 'Pagato' };
const TYPE_COLOR: Record<PaymentType, { bg: string; fg: string }> = {
  pos: { bg: colors.posBg, fg: colors.pos },
  cash: { bg: colors.cashBg, fg: colors.cash },
  paid: { bg: colors.paidBg, fg: colors.paid },
};

function formatEuro(n: number) {
  return n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
}

async function openUrl(preferredUrl: string, fallbackUrl: string) {
  try {
    const supported = await Linking.canOpenURL(preferredUrl);
    await Linking.openURL(supported ? preferredUrl : fallbackUrl);
  } catch {
    await Linking.openURL(fallbackUrl);
  }
}

function handleCall(phone: string) {
  Linking.openURL(`tel:${phone.replace(/[^0-9+]/g, '')}`).catch(() => {
    Alert.alert('Impossibile chiamare', 'Il numero non è valido su questo dispositivo.');
  });
}

function handleNavigate(address: string) {
  const q = encodeURIComponent(address);
  const options: Array<{ text: string; onPress?: () => void; style?: 'cancel' | 'destructive' }> = [];

  if (Platform.OS === 'ios') {
    options.push({ text: 'Mappe (Apple)', onPress: () => Linking.openURL(`https://maps.apple.com/?q=${q}`) });
  }
  options.push(
    { text: 'Google Maps', onPress: () => openUrl(`comgooglemaps://?q=${q}`, `https://www.google.com/maps/search/?api=1&query=${q}`) },
    { text: 'Waze', onPress: () => openUrl(`waze://?q=${q}&navigate=yes`, `https://waze.com/ul?q=${q}&navigate=yes`) },
    { text: 'Annulla', style: 'cancel' }
  );

  Alert.alert('Apri con', 'Scegli l\'app per la navigazione', options);
}

// Equivalente 1:1 di .order-card nel riferimento CORRIO: indirizzo + meta (importo,
// badge, orario) a sinistra, due pulsanti icona circolari (modifica/elimina) a
// destra, type-picker su tutta la larghezza sotto. In più: riga "Chiama"/"Mappa"
// per contattare il cliente e aprire la navigazione verso l'indirizzo.
export function OrderCard({ order, locked, onSetType, onEdit, onDelete }: Props) {
  const time = new Date(order.ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[styles.card, !order.type && styles.cardUnassigned]}>
      <View style={styles.info}>
        {!!order.customerName && <Text style={styles.customerName} numberOfLines={1}>{order.customerName}</Text>}
        <Text style={styles.address} numberOfLines={3}>{order.address}</Text>
        <View style={styles.meta}>
          <Text style={styles.amount}>{formatEuro(order.amount)}</Text>
          {order.type ? (
            <View style={[styles.badge, { backgroundColor: TYPE_COLOR[order.type].bg }]}>
              <Text style={[styles.badgeText, { color: TYPE_COLOR[order.type].fg }]}>{TYPE_LABEL[order.type]}</Text>
            </View>
          ) : (
            <View style={[styles.badge, styles.badgeUnset]}>
              <Text style={[styles.badgeText, { color: colors.danger }]}>Da assegnare</Text>
            </View>
          )}
          <Text style={styles.time}>{time}</Text>
        </View>

        <View style={styles.contactRow}>
          {!!order.phone && (
            <Pressable style={styles.contactBtn} onPress={() => handleCall(order.phone!)}>
              <Icon name="phone" size={13} color={colors.accent2} />
              <Text style={[styles.contactBtnLabel, { color: colors.accent2 }]}>Chiama</Text>
            </Pressable>
          )}
          <Pressable style={styles.contactBtn} onPress={() => handleNavigate(order.address)}>
            <Icon name="navigate" size={13} color={colors.pos} />
            <Text style={[styles.contactBtnLabel, { color: colors.pos }]}>Mappa</Text>
          </Pressable>
        </View>

        <View style={[styles.typePicker, locked && styles.typePickerLocked]}>
          {(['pos', 'cash', 'paid'] as PaymentType[]).map((t) => {
            const active = order.type === t;
            return (
              <Pressable
                key={t}
                disabled={locked}
                onPress={() => onSetType(t)}
                style={[styles.typeBtn, active && { backgroundColor: TYPE_COLOR[t].bg, borderColor: TYPE_COLOR[t].fg }]}
              >
                <Text style={[styles.typeBtnLabel, active && { color: TYPE_COLOR[t].fg }]}>
                  {t === 'pos' ? 'POS' : t === 'cash' ? 'CONTANTI' : 'PAGATO'}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {locked && (
          <View style={styles.lockHint}>
            <Icon name="lock" size={13} color={colors.muted} />
            <Text style={styles.lockHintText}>Tocca</Text>
            <Icon name="pencil" size={13} color={colors.muted} />
            <Text style={styles.lockHintText}>per modificare il pagamento</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.iconBtn} onPress={onEdit}>
          <Icon name="pencil" size={17} color={colors.pos} />
        </Pressable>
        <Pressable style={styles.iconBtn} onPress={onDelete}>
          <Icon name="trash" size={17} color={colors.danger} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl,
    padding: 14, paddingVertical: 12, marginBottom: 10,
  },
  cardUnassigned: { borderWidth: 1.5, borderColor: colors.danger, backgroundColor: '#fff6f6' },
  info: { flex: 1 },
  customerName: { fontSize: 12.5, fontWeight: '700', color: colors.accent2, marginBottom: 2 },
  address: { fontSize: 15, fontWeight: '600', color: colors.ink },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5, flexWrap: 'wrap' },
  amount: { fontSize: 15, fontWeight: '700', color: colors.ink },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  badgeUnset: { backgroundColor: colors.dangerBg },
  badgeText: { fontSize: 11, fontWeight: '700' },
  time: { fontSize: 11, color: colors.muted },

  contactRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  contactBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.white,
  },
  contactBtnLabel: { fontSize: 11.5, fontWeight: '700' },

  typePicker: { flexDirection: 'row', gap: 6, marginTop: 9 },
  typePickerLocked: { opacity: 0.55 },
  typeBtn: {
    flex: 1, paddingVertical: 8, paddingHorizontal: 4, borderRadius: radius.sm, borderWidth: 1.5,
    borderColor: colors.border, alignItems: 'center', backgroundColor: colors.white,
  },
  typeBtnLabel: { fontSize: 11.5, fontWeight: '700', color: colors.muted },
  lockHint: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, flexWrap: 'wrap' },
  lockHintText: { fontSize: 11, color: colors.muted },
  actions: { gap: spacing.sm },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center',
  },
});
