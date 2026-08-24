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
import { translateAuthError, roleLabel } from '../services/auth';
import { useAuthStore } from '../hooks/useAuthStore';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

function emailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Equivalente di #authLoginView nell'app web (loginSubmit).
export function LoginScreen({ route, navigation }: Props) {
  const { role } = route.params;
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    const trimmedEmail = email.trim().toLowerCase();
    if (!emailValid(trimmedEmail)) { setError('Inserisci un indirizzo email valido.'); return; }
    if (!password) { setError('Inserisci la password.'); return; }

    setLoading(true);
    const { error: loginError } = await login(trimmedEmail, password, role);
    setLoading(false);
    if (loginError) setError(translateAuthError(loginError));
    // Su successo, il RootNavigator reagisce automaticamente al cambio di `session`
    // nello store e monta la navigazione principale — nessuna navigate() manuale qui.
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

          <Text style={styles.title}>Accedi</Text>
          <Text style={styles.subtitle}>Accesso come {roleLabel(role)}</Text>

          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder="mario.rossi@email.it"
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Password"
          />
          <AuthMessage message={error} />
          <PrimaryButton label="Accedi" onPress={handleSubmit} loading={loading} />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>oppure</Text>
            <View style={styles.dividerLine} />
          </View>
          <GoogleButton label="Accedi con Google" onPress={handleGoogle} />
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
