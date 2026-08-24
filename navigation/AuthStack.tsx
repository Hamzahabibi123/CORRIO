import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from './types';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterStep1Screen } from '../screens/RegisterStep1Screen';
import { RegisterStep2Screen } from '../screens/RegisterStep2Screen';
import { colors } from '../constants/colors';

const Stack = createNativeStackNavigator<AuthStackParamList>();

// Equivalente di #authScreen (landing + registrazione + login) nell'app web,
// come stack nativo: ogni "step" del web diventa una screen con back nativo.
export function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.ink,
        headerShadowVisible: false,
        headerBackTitle: 'Indietro',
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: '' }} />
      <Stack.Screen name="RegisterStep1" component={RegisterStep1Screen} options={{ title: '' }} />
      <Stack.Screen name="RegisterStep2" component={RegisterStep2Screen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}
