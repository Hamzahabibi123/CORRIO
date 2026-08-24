import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import { colors, spacing } from '../constants/colors';
import { TextField } from '../components/TextField';
import { PrimaryButton } from '../components/PrimaryButton';
import { AuthMessage } from '../components/AuthMessage';
import { Icon } from '../components/Icon';
import { resolveBusinessCode, translateAuthError } from '../services/auth';
import { useAuthStore } from '../hooks/useAuthStore';

type Props = NativeStackScreenProps<AuthStackParamList, 'RegisterStep2'>;

// Equivalente di #authRegisterStep2 nell'app web: nome/cognome/telefono comuni,
// più campi condizionali (ristorante+indirizzo per il manager, codice business
// validato via RPC per il rider) — stessa logica di regStep2Submit.
export function RegisterStep2Screen({ route, navigation }: Props) {
  const { role, email, password } = route.params;
  const signUpManager = useAuthStore((s) => s.signUpManager);
  const signUpRider = useAuthStore((s) => s.signUpRider);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [address, setAddress] = useState('');
  const [businessCode, setBusinessCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setNotice(null);
    if (!firstName.trim() || !lastName.trim()) { setError('Inserisci nome e cognome.'); return; }

    if (role === 'manager') {
      if (!restaurantName.trim()) { setError('Inserisci il nome del ristorante.'); return; }
    } else {
      if (!businessCode.trim()) { setError('Inserisci il codice business fornito dal manager.'); return; }
      setLoading(true);
      const resolved = await resolveBusinessCode(businessCode);
      setLoading(false);
      if (!resolved) { setError('Codice business non valido. Verifica con il tuo manager.'); return; }
    }

    setLoading(true);
    const base = { email, password, firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim() };
    const result = role === 'manager'
      ? await signUpManager({ ...base, restaurantName: restaurantName.trim(), address: address.trim() })
      : await signUpRider({ ...base, businessCode: businessCode.trim().toUpperCase() });
    setLoading(false);

    if (result.error) { setError(translateAuthError(result.error)); return; }
    if (result.needsEmailConfirm) {
      setNotice("Registrazione completata! Controlla la tua email per confermare l'account, poi accedi.");
      return;
    }
    // Su successo con sessione immediata, il RootNavigator monta la app principale
    // reagendo allo stato dello store — nessuna navigazione manuale necessaria.
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable style={styles.backLink} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={16} color={colors.muted} />
            <Text style={styles.backLinkLabel}>Indietro</Text>
          </Pressable>

          <Text style={styles.title}>Completa il profilo</Text>
          <Text style={styles.subtitle}>Ultimo passo per iniziare</Text>

          <TextField label="Nome" value={firstName} onChangeText={setFirstName} placeholder="Es. Mario" />
          <TextField label="Cognome" value={lastName} onChangeText={setLastName} placeholder="Es. Rossi" />
          <TextField label="Numero di telefono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Es. 333 1234567" />

          {role === 'manager' ? (
            <>
              <TextField label="Nome ristorante" value={restaurantName} onChangeText={setRestaurantName} placeholder="Es. Non Solo Pizza" />
              <TextField label="Indirizzo" value={address} onChangeText={setAddress} placeholder="Es. Via Roma 10, Milano" />
            </>
          ) : (
            <TextField
              label="Codice business"
              value={businessCode}
              onChangeText={setBusinessCode}
              autoCapitalize="characters"
              placeholder="Fornito dal tuo manager"
            />
          )}

          <AuthMessage message={error} />
          <AuthMessage message={notice} notice />
          <PrimaryButton label="Completa registrazione" onPress={handleSubmit} loading={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  content: { padding: spacing.xl },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, alignSelf: 'flex-start' },
  backLinkLabel: { fontSize: 13.5, fontWeight: '700', color: colors.muted },
  title: { fontSize: 22, fontWeight: '800', marginTop: spacing.sm, marginBottom: 2, color: colors.ink },
  subtitle: { fontSize: 13.5, color: colors.muted, marginBottom: spacing.lg },
});
