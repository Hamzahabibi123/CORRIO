import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '../constants/colors';

interface Props {
  message: string | null;
  notice?: boolean;
}

// Equivalente di .auth-error / .auth-error.notice nell'app web.
export function AuthMessage({ message, notice }: Props) {
  if (!message) return null;
  return (
    <Text style={[styles.base, notice ? styles.notice : styles.error]}>{message}</Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontSize: 12.5,
    fontWeight: '700',
    padding: 9,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  error: { backgroundColor: '#fdeaea', color: colors.danger },
  notice: { backgroundColor: '#eaf4ff', color: '#1d4ed8' },
});
