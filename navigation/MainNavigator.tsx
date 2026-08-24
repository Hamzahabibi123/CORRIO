import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { useAuthStore } from '../hooks/useAuthStore';

// Placeholder: qui arriveranno i bottom tab navigator per Rider (Consegne/Storico/
// Profilo) e Manager (Profilo/Rider/Storico/Statistiche) — vedi task successivi,
// costruiti schermata per schermata come richiesto.
export function MainNavigator() {
  const profile = useAuthStore((s) => s.profile);
  const session = useAuthStore((s) => s.session);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Ciao {profile?.firstName || ''} 👋</Text>
      <Text style={styles.sub}>
        Sei loggato come {session?.role === 'manager' ? 'Manager' : 'Rider'}.{'\n'}
        Le schermate principali arrivano nei prossimi passaggi.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 20, fontWeight: '800', color: colors.ink, marginBottom: 8 },
  sub: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 20 },
});
