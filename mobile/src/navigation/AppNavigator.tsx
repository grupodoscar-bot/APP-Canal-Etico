import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

// Auth screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';

// Main screens
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { InvoiceListScreen } from '../screens/invoices/InvoiceListScreen';
import { InvoiceDetailScreen } from '../screens/invoices/InvoiceDetailScreen';
import { CreateInvoiceScreen } from '../screens/invoices/CreateInvoiceScreen';
import { ClientListScreen } from '../screens/clients/ClientListScreen';
import { ClientFormScreen } from '../screens/clients/ClientFormScreen';
import { ProductListScreen } from '../screens/products/ProductListScreen';
import { ProductFormScreen } from '../screens/products/ProductFormScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';

import { ActivityIndicator, View } from 'react-native';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: colors.white,
  headerTitleStyle: { fontWeight: '600' as const },
};

function InvoicesStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="InvoiceList" component={InvoiceListScreen} options={{ title: 'Facturas' }} />
      <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} options={{ title: 'Detalle factura' }} />
      <Stack.Screen name="CreateInvoice" component={CreateInvoiceScreen} options={{ title: 'Nueva factura' }} />
    </Stack.Navigator>
  );
}

function ClientsStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="ClientList" component={ClientListScreen} options={{ title: 'Clientes' }} />
      <Stack.Screen name="ClientForm" component={ClientFormScreen} options={({ route }: any) => ({
        title: route.params?.clientId ? 'Editar cliente' : 'Nuevo cliente',
      })} />
    </Stack.Navigator>
  );
}

function ProductsStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="ProductList" component={ProductListScreen} options={{ title: 'Productos' }} />
      <Stack.Screen name="ProductForm" component={ProductFormScreen} options={({ route }: any) => ({
        title: route.params?.productId ? 'Editar producto' : 'Nuevo producto',
      })} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.divider,
          paddingBottom: 4,
          height: 56,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Inicio"
        component={DashboardScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Inicio',
        }}
      />
      <Tab.Screen
        name="Facturas"
        component={InvoicesStack}
        options={{
          headerShown: false,
          tabBarLabel: 'Facturas',
        }}
      />
      <Tab.Screen
        name="Clientes"
        component={ClientsStack}
        options={{
          headerShown: false,
          tabBarLabel: 'Clientes',
        }}
      />
      <Tab.Screen
        name="Productos"
        component={ProductsStack}
        options={{
          headerShown: false,
          tabBarLabel: 'Productos',
        }}
      />
      <Tab.Screen
        name="Ajustes"
        component={SettingsScreen}
        options={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.white,
          tabBarLabel: 'Ajustes',
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
