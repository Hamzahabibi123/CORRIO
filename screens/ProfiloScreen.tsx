import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../constants/colors';
import { useAuthStore } from '../hooks/useAuthStore';
import { Card } from '../components/Card';
import { TextField } from '../components/TextField';
import { PrimaryButton } from '../components/PrimaryButton';
import { Icon } from '../components/Icon';

function initials(firstName: string, lastName: string) {
  return `${(firstName[0] || '').toUpperCase()}${(lastName[0] || '').toUpperCase()}`;
}

// Equivalente 1:1 di #profileView nel riferimento CORRIO: un'unica card con
// riga avatar, campi Nome/Cognome/Email/Telefono modificabili, pulsante
// "Salva profilo" e link "Esci" centrato sotto.
export function ProfiloScreen() {
  const profile = useAuthStore((s) => s.profile);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const logout = useAuthStore((s) => s.logout);

  const [firstName, setFirstName] = useState(profile?.firstName ?? '');
  const [lastName, setLastName] = useState(profile?.lastName ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Dati mancanti', 'Nome e cognome non possono essere vuoti.');
      return;
    }
    setSaving(true);
    const { error } = await updateProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
    });
    setSaving(false);
    if (error) Alert.alert('Errore', error);
  }

  function handleLogout() {
    Alert.alert('Esci', 'Vuoi disconnetterti dal tuo account?', [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Esci', style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card>
          <Text style={styles.title}>Il mio profilo</Text>

          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(profile?.firstName ?? '', profile?.lastName ?? '') || '?'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{profile?.firstName || profile?.lastName ? `${profile?.firstName} ${profile?.lastName}` : 'Nome non impostato'}</Text>
              <Text style={styles.email}>{profile?.email || '—'}</Text>
            </View>
          </View>

          <TextField label="Nome" value={firstName} onChangeText={setFirstName} placeholder="Es. Mario" autoCapitalize="words" />
          <TextField label="Cognome" value={lastName} onChangeText={setLastName} placeholder="Es. Rossi" autoCapitalize="words" />
          <TextField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="Es. mario.rossi@email.it" editable={false} />
          <TextField label="Numero di telefono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Es. 333 1234567" />

          <PrimaryButton label="Salva profilo" onPress={handleSave} loading={saving} />

          <Pressable style={styles.logoutLink} onPress={handleLogout}>
            <Icon name="logout" size={16} color={colors.danger} />
            <Text style={styles.logoutLabel}>Esci</Text>
          </Pressable>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 14, paddingBottom: 40 },
  title: { fontSize: 15, fontWeight: '700', color: colors.ink, marginBottom: spacing.md },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  avatar: {
    width: 54, height: 54, borderRadius: 18, backgroundColor: colors.accent2Bg,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 19, fontWeight: '800', color: colors.accent2 },
  name: { fontSize: 17, fontWeight: '800', color: colors.ink },
  email: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
  logoutLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, paddingVertical: 10 },
  logoutLabel: { fontSize: 13.5, fontWeight: '700', color: colors.danger },
});
