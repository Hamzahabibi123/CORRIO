import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../constants/colors';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline';
  /** Icona vettoriale opzionale a sinistra del testo, come il bottone "Timbra" di Factorial. */
  icon?: React.ReactNode;
}

// Equivalente di .btn-primary nell'app web (pillola rossa piena larghezza).
export function PrimaryButton({ label, onPress, loading, disabled, variant = 'primary', icon }: Props) {
  const isOutline = variant === 'outline';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        isOutline ? styles.outline : styles.primary,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && !loading && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? colors.brand : colors.white} />
      ) : (
        <View style={styles.row}>
          {icon}
          <Text style={[styles.label, isOutline && styles.labelOutline, !!icon && styles.labelWithIcon]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
    paddingVertical: 17,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.brand },
  outline: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.brand },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.85 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  label: { color: colors.white, fontSize: 15.5, fontWeight: '700' },
  labelOutline: { color: colors.brand },
  labelWithIcon: { marginLeft: 8 },
});
