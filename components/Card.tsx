import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { cardShadow, colors, radius } from '../constants/colors';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

// Equivalente di .card nel riferimento CORRIO: bordo sottile + radius 24 + ombra
// morbida — il contenitore ricorrente per form e sezioni in tutta l'app.
export function Card({ children, style }: Props) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: 18,
    ...cardShadow,
  },
});
