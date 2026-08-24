import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../constants/colors';
import { TextField } from './TextField';
import { PrimaryButton } from './PrimaryButton';

interface Props {
  visible: boolean;
  mode: 'add' | 'edit';
  initialAddress?: string;
  initialAmount?: string;
  onSubmit: (address: string, amount: number) => void;
  onClose: () => void;
}

function parseAmount(str: string): number {
  return parseFloat(str.replace(',', '.'));
}

// Equivalente del form ordine (#orderFormCard) nell'app web, come modale nativa.
export function OrderFormModal({ visible, mode, initialAddress, initialAmount, onSubmit, onClose }: Props) {
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (visible) {
      setAddress(initialAddress ?? '');
      setAmount(initialAmount ?? '');
    }
  }, [visible, initialAddress, initialAmount]);

  const parsedAmount = parseAmount(amount);
  const valid = address.trim().length > 0 && !isNaN(parsedAmount) && parsedAmount > 0;

  function handleSubmit() {
    if (!valid) return;
    onSubmit(address.trim(), parsedAmount);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.sheet}>
            <Text style={styles.title}>{mode === 'add' ? 'Nuovo ordine' : 'Modifica ordine'}</Text>
            <TextField label="Indirizzo di consegna" value={address} onChangeText={setAddress} placeholder="Via, numero civico" />
            <TextField
              label="Importo (€)"
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^0-9.,]/g, ''))}
              keyboardType="decimal-pad"
              placeholder="0,00"
            />
            <View style={styles.row}>
              <Pressable style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelLabel}>Annulla</Text>
              </Pressable>
              <View style={{ width: spacing.md }} />
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  label={mode === 'add' ? 'Aggiungi ordine' : 'Salva modifiche'}
                  onPress={handleSubmit}
                  disabled={!valid}
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.bg, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: spacing.xl, paddingBottom: spacing.xl + 12,
  },
  title: { fontSize: 18, fontWeight: '800', color: colors.ink, marginBottom: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  cancelBtn: { paddingVertical: 15, paddingHorizontal: 18, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.border },
  cancelLabel: { color: colors.ink, fontWeight: '700' },
});
