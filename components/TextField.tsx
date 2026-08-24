import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, radius, spacing } from '../constants/colors';

interface Props extends TextInputProps {
  label: string;
}

// Equivalente di .field { label + input } nell'app web.
export function TextField({ label, style, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { fontSize: 12.5, fontWeight: '600', color: colors.muted, marginBottom: 5 },
  input: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    color: colors.ink,
  },
});
