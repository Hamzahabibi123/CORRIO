import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../constants/colors';
import { useAuthStore } from '../hooks/useAuthStore';
import { Card } from '../components/Card';
import { TextField } from '../components/TextField';
import { PrimaryButton } from '../components/PrimaryButton';
import { Icon } from '../components/Icon';

function initials(firstName: string, lastName: string) {
  return `${(firstName[0] || '').toUpperCase()}${(lastName[0] || '').toUpperCase()}`;
}

// Equivalente 1:1 di #mgrProfileView nel riferimento CORRIO: card con codice
// business (da condividere con i rider), campi anagrafici del manager e del
// ristorante, pulsante "Salva profilo" e link "Esci".
export function ManagerProfiloScreen() {
  const profile = useAuthStore((s) => s.profile);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const logout = useAuthStore((s) => s.logout);

  const [firstName, setFirstName] = useState(profile?.firstName ?? '');
  const [lastName, setLastName] = useState(profile?.lastName ?? '');
  const [restaurantName, setRestaurantName] = useState(profile?.restaurantName ?? '');
  const [address, setAddress] = useState(profile?.address ?? '');
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
      restaurantName: restaurantName.trim(),
      address: address.trim(),
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

  async function handleShareCode() {
    if (!profile?.businessCode) return;
    try {
      await Share.share({ message: `Codice business CORRIO: ${profile.businessCode}` });
    } catch {
      // utente ha annullato la condivisione, nessuna azione necessaria
    }
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

          <View style={styles.codeWrap}>
            <Text style={styles.codeLabel}>Codice business</Text>
            <View style={styles.codeRow}>
              <Text style={styles.codeValue} selectable>{profile?.businessCode || '------'}</Text>
              <Pressable style={styles.copyBtn} onPress={handleShareCode}>
                <Icon name="copy" size={16} color={colors.brand} />
              </Pressable>
            </View>
            <Text style={styles.codeHint}>Condividi questo codice con i rider per farli registrare al tuo business.</Text>
          </View>

          <TextField label="Nome" value={firstName} onChangeText={setFirstName} placeholder="Es. Mario" autoCapitalize="words" />
          <TextField label="Cognome" value={lastName} onChangeText={setLastName} placeholder="Es. Rossi" autoCapitalize="words" />
          <TextField label="Nome ristorante" value={restaurantName} onChangeText={setRestaurantName} placeholder="Es. Non Solo Pizza" />
          <TextField label="Indirizzo" value={address} onChangeText={setAddress} placeholder="Es. Via Roma 10, Milano" />
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

  codeWrap: { marginBottom: spacing.lg },
  codeLabel: { fontSize: 12.5, fontWeight: '600', color: colors.muted, marginBottom: 5 },
  codeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
    backgroundColor: colors.white, paddingVertical: 10, paddingHorizontal: 12,
  },
  codeValue: { fontSize: 18, fontWeight: '800', letterSpacing: 2, color: colors.ink },
  copyBtn: { padding: 6 },
  codeHint: { fontSize: 12, color: colors.muted, marginTop: 6 },

  logoutLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, paddingVertical: 10 },
  logoutLabel: { fontSize: 13.5, fontWeight: '700', color: colors.danger },
});
