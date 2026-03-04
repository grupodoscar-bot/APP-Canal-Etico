import React from 'react';
import { StatusBar } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { colors } from './src/theme';

export default function App() {
  return (
    <AuthProvider>
      <StatusBar backgroundColor={colors.primaryDark} barStyle="light-content" />
      <AppNavigator />
    </AuthProvider>
  );
}
