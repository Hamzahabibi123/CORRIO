import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../constants/colors';
import { Card } from './Card';
import { TextField } from './TextField';
import { PrimaryButton } from './PrimaryButton';
import { AddressAutocompleteField } from './AddressAutocompleteField';

interface Props {
  mode: 'add' | 'edit';
  initialAddress?: string;
  initialAmount?: string;
  initialPhone?: string;
  initialCustomerName?: string;
  onSubmit: (address: string, amount: number, phone: string, customerName: string) => void;
  onCancel: () => void;
}

function parseAmount(str: string): number {
  return parseFloat(str.replace(',', '.'));
}

// Equivalente di #orderFormCard nel riferimento CORRIO: card inline (non un
// modale) che appare al posto del pulsante "+ Aggiungi ordine" quando si
// aggiunge o modifica un ordine. Nome cliente e telefono sono facoltativi: se
// presenti, sulla card dell'ordine compaiono il nome e i pulsanti "Chiama"/"Mappa".
export function OrderFormCard({
  mode,
  initialAddress,
  initialAmount,
  initialPhone,
  initialCustomerName,
  onSubmit,
  onCancel,
}: Props) {
  const [address, setAddress] = useState(initialAddress ?? '');
  const [amount, setAmount] = useState(initialAmount ?? '');
  const [phone, setPhone] = useState(initialPhone ?? '');
  const [customerName, setCustomerName] = useState(initialCustomerName ?? '');

  useEffect(() => {
    setAddress(initialAddress ?? '');
    setAmount(initialAmount ?? '');
    setPhone(initialPhone ?? '');
    setCustomerName(initialCustomerName ?? '');
  }, [initialAddress, initialAmount, initialPhone, initialCustomerName]);

  const parsedAmount = parseAmount(amount);
  const valid = address.trim().length > 0 && !isNaN(parsedAmount) && parsedAmount > 0;

  function handleSubmit() {
    if (!valid) return;
    onSubmit(address.trim(), parsedAmount, phone.trim(), customerName.trim());
  }

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{mode === 'add' ? 'Nuovo ordine' : 'Modifica ordine'}</Text>
      <TextField
        label="Nome cliente (opzionale)"
        value={customerName}
        onChangeText={setCustomerName}
        autoCapitalize="words"
        placeholder="Es. Gianni Corona"
      />
      <AddressAutocompleteField label="Indirizzo di consegna" value={address} onChangeText={setAddress} placeholder="Es. Via Verdi 24" />
      <TextField
        label="Importo (€)"
        value={amount}
        onChangeText={(t) => setAmount(t.replace(/[^0-9.,]/g, ''))}
        keyboardType="decimal-pad"
        placeholder="Es. 17,50"
      />
      <TextField
        label="Numero di telefono (opzionale)"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder="Es. 333 1234567"
      />
      <Text style={styles.hint}>Il tipo di pagamento si sceglie dopo, dalla lista qui sotto.</Text>
      <View style={styles.actions}>
        <View style={{ flex: 1 }}>
          <PrimaryButton label={mode === 'add' ? 'Aggiungi ordine' : 'Salva modifiche'} onPress={handleSubmit} disabled={!valid} />
        </View>
        <Pressable style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelLabel}>Annulla</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg },
  title: { fontSize: 15, fontWeight: '700', color: colors.ink, marginBottom: spacing.md },
  hint: { fontSize: 12.5, color: colors.muted, marginTop: -4, marginBottom: spacing.md },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cancelBtn: {
    backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.pill, paddingVertical: 14, paddingHorizontal: 16,
  },
  cancelLabel: { fontSize: 15, fontWeight: '700', color: colors.muted },
});
