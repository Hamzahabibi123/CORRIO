import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { RiderTabParamList } from './types';
import { ConsegneScreen } from '../screens/ConsegneScreen';
import { StoricoScreen } from '../screens/StoricoScreen';
import { ProfiloScreen } from '../screens/ProfiloScreen';
import { colors } from '../constants/colors';
import { Icon, type IconName } from '../components/Icon';

const Tab = createBottomTabNavigator<RiderTabParamList>();

const ICONS: Record<keyof RiderTabParamList, IconName> = {
  Profilo: 'user',
  Consegne: 'pin',
  Storico: 'clock',
};

// Equivalente 1:1 di .bottom-nav#riderNav nel riferimento CORRIO: Profilo / Consegne
// (ordine corretto: profilo a sinistra) / Storico, con pillola rosa dietro
// all'icona attiva e trattino rosso sopra il tab selezionato.
export function RiderTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { borderTopColor: colors.border, height: 62, paddingBottom: 8, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarIcon: ({ color, focused }) => (
          <View style={{ alignItems: 'center' }}>
            <View
              style={{
                width: 24, height: 3, borderRadius: 999, marginBottom: 4,
                backgroundColor: focused ? colors.brand : 'transparent',
              }}
            />
            <View
              style={{
                width: 44, height: 30, borderRadius: 999, alignItems: 'center', justifyContent: 'center',
                backgroundColor: focused ? colors.brandLight : 'transparent',
              }}
            >
              <Icon name={ICONS[route.name as keyof RiderTabParamList]} size={19} color={color} />
            </View>
          </View>
        ),
      })}
    >
      <Tab.Screen name="Profilo" component={ProfiloScreen} />
      <Tab.Screen name="Consegne" component={ConsegneScreen} />
      <Tab.Screen name="Storico" component={StoricoScreen} />
    </Tab.Navigator>
  );
}
