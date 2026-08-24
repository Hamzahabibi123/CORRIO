import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import { colors, spacing } from '../constants/colors';
import { TextField } from '../components/TextField';
import { PrimaryButton } from '../components/PrimaryButton';
import { AuthMessage } from '../components/AuthMessage';
import { GoogleButton } from '../components/GoogleButton';
import { Icon } from '../components/Icon';
import { roleLabel } from '../services/auth';

type Props = NativeStackScreenProps<AuthStackParamList, 'RegisterStep1'>;

function emailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Equivalente di #authRegisterStep1 (email + password) nell'app web.
// La creazione account vera e propria avviene solo dopo lo step 2 (come nel web),
// così i metadata di profilo vengono passati tutti insieme a signUp().
export function RegisterStep1Screen({ route, navigation }: Props) {
  const { role } = route.params;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleContinue() {
    setError(null);
    const trimmedEmail = email.trim().toLowerCase();
    if (!emailValid(trimmedEmail)) { setError('Inserisci un indirizzo email valido.'); return; }
    if (password.length < 6) { setError('La password deve avere almeno 6 caratteri.'); return; }
    if (password !== confirm) { setError('Le password non coincidono.'); return; }
    navigation.navigate('RegisterStep2', { role, email: trimmedEmail, password });
  }

  function handleGoogle() {
    Alert.alert('Google', 'Login con Google non ancora disponibile per questa app.');
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable style={styles.backLink} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={16} color={colors.muted} />
            <Text style={styles.backLinkLabel}>Indietro</Text>
          </Pressable>

          <Text style={styles.title}>Crea il tuo account</Text>
          <Text style={styles.subtitle}>Registrazione come {roleLabel(role)}</Text>

          <TextField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="mario.rossi@email.it" />
          <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="Almeno 6 caratteri" />
          <TextField label="Conferma password" value={confirm} onChangeText={setConfirm} secureTextEntry placeholder="Ripeti la password" />
          <AuthMessage message={error} />
          <PrimaryButton label="Continua" onPress={handleContinue} />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>oppure</Text>
            <View style={styles.dividerLine} />
          </View>
          <GoogleButton label="Continua con Google" onPress={handleGoogle} />
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
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerLabel: { fontSize: 12.5, fontWeight: '700', color: colors.muted },
});
