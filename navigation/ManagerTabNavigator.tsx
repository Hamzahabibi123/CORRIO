import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { ManagerTabParamList } from './types';
import { ManagerProfiloScreen } from '../screens/ManagerProfiloScreen';
import { RidersScreen } from '../screens/RidersScreen';
import { ManagerStoricoScreen } from '../screens/ManagerStoricoScreen';
import { StatisticheScreen } from '../screens/StatisticheScreen';
import { colors } from '../constants/colors';
import { Icon, type IconName } from '../components/Icon';

const Tab = createBottomTabNavigator<ManagerTabParamList>();

const ICONS: Record<keyof ManagerTabParamList, IconName> = {
  ProfiloManager: 'user',
  Rider: 'bike',
  StoricoManager: 'clock',
  Statistiche: 'chart',
};

// Equivalente 1:1 di #managerNav nel riferimento CORRIO: Profilo / Rider /
// Storico / Statistiche, stessa pillola rosa + trattino della tab bar rider.
export function ManagerTabNavigator() {
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
              <Icon name={ICONS[route.name as keyof ManagerTabParamList]} size={19} color={color} />
            </View>
          </View>
        ),
      })}
    >
      <Tab.Screen name="ProfiloManager" component={ManagerProfiloScreen} options={{ tabBarLabel: 'Profilo' }} />
      <Tab.Screen name="Rider" component={RidersScreen} />
      <Tab.Screen name="StoricoManager" component={ManagerStoricoScreen} options={{ tabBarLabel: 'Storico' }} />
      <Tab.Screen name="Statistiche" component={StatisticheScreen} />
    </Tab.Navigator>
  );
}
