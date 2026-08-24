import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthStack } from './AuthStack';
import { RiderTabNavigator } from './RiderTabNavigator';
import { ManagerTabNavigator } from './ManagerTabNavigator';
import { useAuthStore } from '../hooks/useAuthStore';
import { colors } from '../constants/colors';

// Pattern standard di React Navigation per i flussi di autenticazione: uno stack
// root che monta AuthStack o la navigazione principale a seconda della sessione.
// Rider e Manager hanno bottom tab navigator distinti (sezioni diverse).
export function RootNavigator() {
  const status = useAuthStore((s) => s.status);
  const session = useAuthStore((s) => s.session);
  const restore = useAuthStore((s) => s.restore);

  useEffect(() => {
    restore();
  }, [restore]);

  if (status !== 'ready') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!session ? <AuthStack /> : session.role === 'rider' ? <RiderTabNavigator /> : <ManagerTabNavigator />}
    </NavigationContainer>
  );
}
