import React, { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import type { Role } from '../types';
import { colors, radius, spacing } from '../constants/colors';
import { PrimaryButton } from '../components/PrimaryButton';
import { Icon } from '../components/Icon';
import { DeliveryIllustration } from '../components/DeliveryIllustration';
import { roleLabel } from '../services/auth';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const FADE_MS = 260;

// Equivalente di #authLanding nel riferimento CORRIO: wordmark + swoosh + slogan,
// illustrazione al centro, in basso i pulsanti ruolo che rivelano (con fade-swap,
// come nel web) le azioni Registrati/Accedi una volta scelto Rider o Manager.
export function WelcomeScreen({ navigation }: Props) {
  const [phase, setPhase] = useState<'roles' | 'actions'>('roles');
  const [role, setRole] = useState<Role | null>(null);
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  function swapTo(nextPhase: 'roles' | 'actions', nextRole: Role | null) {
    Animated.timing(opacity, { toValue: 0, duration: FADE_MS, useNativeDriver: true }).start();
    Animated.timing(translateY, { toValue: -10, duration: FADE_MS, useNativeDriver: true }).start(() => {
      setPhase(nextPhase);
      setRole(nextRole);
      translateY.setValue(10);
      requestAnimationFrame(() => {
        Animated.timing(opacity, { toValue: 1, duration: FADE_MS, useNativeDriver: true }).start();
        Animated.timing(translateY, { toValue: 0, duration: FADE_MS, useNativeDriver: true }).start();
      });
    });
  }

  function selectRole(r: Role) {
    swapTo('actions', r);
  }

  function backToRoles() {
    swapTo('roles', null);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.inner}>
        <View style={styles.third}>
          <View style={styles.wordmark}>
            <Text style={styles.appName}>
              CORR<Text style={styles.accent}>IO</Text>
            </Text>
            <Svg width={92} height={8} viewBox="0 0 120 10" style={styles.swoosh}>
              <Path d="M2 5 Q30 -2 60 5 T118 5" fill="none" stroke={colors.brand} strokeWidth={2.5} strokeLinecap="round" />
            </Svg>
            <Text style={styles.slogan}>Dalla cucina alla porta, senza intoppi.</Text>
          </View>
        </View>

        <View style={styles.thirdIllustration}>
          <View style={styles.illustrationBox}>
            <DeliveryIllustration />
          </View>
        </View>

        <View style={styles.thirdActions}>
          <Animated.View style={{ opacity, transform: [{ translateY }] }}>
            {phase === 'roles' ? (
              <View style={styles.rolesRow}>
                <RoleButton label="Rider" icon="bike" onPress={() => selectRole('rider')} />
                <RoleButton label="Manager" icon="briefcase" onPress={() => selectRole('manager')} />
              </View>
            ) : (
              <View style={styles.actions}>
                <Text style={styles.actionsLabel}>Accedi come {roleLabel(role ?? 'rider')}</Text>
                <PrimaryButton label="Registrati" onPress={() => role && navigation.navigate('RegisterStep1', { role })} />
                <View style={{ height: spacing.sm }} />
                <PrimaryButton label="Accedi" variant="outline" onPress={() => role && navigation.navigate('Login', { role })} />
                <Pressable style={styles.backLink} onPress={backToRoles}>
                  <Icon name="arrow-left" size={16} color={colors.muted} />
                  <Text style={styles.backLinkLabel}>Cambia ruolo</Text>
                </Pressable>
              </View>
            )}
          </Animated.View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function RoleButton({ label, icon, onPress }: { label: string; icon: 'bike' | 'briefcase'; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.roleBtn, pressed && styles.roleBtnPressed]} onPress={onPress}>
      <View style={styles.roleBtnIcon}>
        <Icon name={icon} size={22} color={colors.brand} />
      </View>
      <Text style={styles.roleBtnLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  inner: { flex: 1, paddingHorizontal: spacing.xl, paddingVertical: spacing.xl, justifyContent: 'space-between' },
  third: { alignItems: 'center', justifyContent: 'center' },
  wordmark: { alignItems: 'center' },
  appName: { fontSize: 42, fontWeight: '900', letterSpacing: 1, color: colors.ink, lineHeight: 46 },
  accent: { color: colors.brand },
  swoosh: { marginTop: 8 },
  slogan: { fontSize: 14.5, fontWeight: '600', fontStyle: 'italic', color: colors.muted, marginTop: 10, textAlign: 'center' },

  thirdIllustration: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  illustrationBox: { width: '100%', maxWidth: 280, aspectRatio: 300 / 230 },

  thirdActions: { paddingTop: 8 },
  rolesRow: { flexDirection: 'row', gap: 12 },
  roleBtn: {
    flex: 1, alignItems: 'center', gap: 9, paddingVertical: 20, paddingHorizontal: 10,
    borderRadius: radius.xxl, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white,
  },
  roleBtnPressed: { transform: [{ scale: 0.96 }] },
  roleBtnIcon: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: colors.brandLight,
    alignItems: 'center', justifyContent: 'center',
  },
  roleBtnLabel: { fontSize: 15, fontWeight: '800', color: colors.ink },

  actions: { alignItems: 'center' },
  actionsLabel: { fontSize: 13.5, fontWeight: '700', color: colors.muted, marginBottom: 14 },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, marginTop: 4 },
  backLinkLabel: { fontSize: 13.5, fontWeight: '700', color: colors.muted },
});
