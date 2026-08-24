import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { radius } from '../constants/colors';

type IconSet = 'ionicons' | 'material-community';

interface Props {
  name: string;
  set?: IconSet;
  bg: string;
  fg: string;
  size?: number;
}

// Quadrato con angoli arrotondati + icona vettoriale monocolore: lo stesso
// pattern usato da Factorial per "Timbra", "Documenti", "Assenze", ecc.
export function IconBadge({ name, set = 'ionicons', bg, fg, size = 44 }: Props) {
  const IconComponent = set === 'material-community' ? MaterialCommunityIcons : Ionicons;
  return (
    <View style={[styles.badge, { width: size, height: size, backgroundColor: bg, borderRadius: size * 0.32 }]}>
      <IconComponent name={name as never} size={size * 0.5} color={fg} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center' },
});
