import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import { executeSql, getOne } from '../../services/database';
import { colors, spacing, typography } from '../../theme';
import { validateNIFField } from '../../utils/validators';

export function SettingsScreen() {
  const { user, logout } = useAuth();
  const userId = user?.id || 0;

  const [nif, setNif] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [province, setProvince] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [invoiceSeries, setInvoiceSeries] = useState('F');
  const [loading, setLoading] = useState(false);
  const [hasSettings, setHasSettings] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const row = await getOne<any>(
      'SELECT * FROM company_settings WHERE user_id = ?',
      [userId],
    );
    if (row) {
      setHasSettings(true);
      setNif(row.nif);
      setCompanyName(row.company_name);
      setTradeName(row.trade_name || '');
      setAddress(row.address);
      setCity(row.city);
      setPostalCode(row.postal_code);
      setProvince(row.province);
      setPhone(row.phone || '');
      setEmail(row.email || '');
      setInvoiceSeries(row.invoice_series || 'F');
    }
  };

  const handleSave = async () => {
    const nifError = validateNIFField(nif);
    if (nifError) { Alert.alert('Error', nifError); return; }
    if (!companyName) { Alert.alert('Error', 'La razón social es obligatoria'); return; }
    if (!address || !city || !postalCode || !province) {
      Alert.alert('Error', 'Completa la dirección fiscal');
      return;
    }

    setLoading(true);
    try {
      if (hasSettings) {
        await executeSql(
          `UPDATE company_settings SET nif=?, company_name=?, trade_name=?,
           address=?, city=?, postal_code=?, province=?, phone=?, email=?,
           invoice_series=? WHERE user_id=?`,
          [nif.toUpperCase(), companyName, tradeName || null, address, city,
           postalCode, province, phone || null, email || null, invoiceSeries, userId],
        );
      } else {
        await executeSql(
          `INSERT INTO company_settings (user_id, nif, company_name, trade_name,
           address, city, postal_code, province, phone, email, invoice_series)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [userId, nif.toUpperCase(), companyName, tradeName || null, address,
           city, postalCode, province, phone || null, email || null, invoiceSeries],
        );
        setHasSettings(true);
      }
      Alert.alert('Guardado', 'Datos de empresa guardados correctamente');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.screenTitle}>Ajustes</Text>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Datos de la empresa (emisor)</Text>
          <Text style={styles.sectionSubtitle}>
            Estos datos aparecerán en todas tus facturas y se enviarán a la AEAT
          </Text>

          <Input label="NIF/CIF *" value={nif} onChangeText={setNif} placeholder="B12345678" autoCapitalize="characters" />
          <Input label="Razón social *" value={companyName} onChangeText={setCompanyName} placeholder="Mi Empresa S.L." />
          <Input label="Nombre comercial" value={tradeName} onChangeText={setTradeName} placeholder="Mi Empresa" />
          <Input label="Dirección fiscal *" value={address} onChangeText={setAddress} placeholder="Calle, número, piso" />
          <Input label="Ciudad *" value={city} onChangeText={setCity} placeholder="Madrid" />
          <Input label="Código postal *" value={postalCode} onChangeText={setPostalCode} placeholder="28001" keyboardType="numeric" />
          <Input label="Provincia *" value={province} onChangeText={setProvince} placeholder="Madrid" />
          <Input label="Teléfono" value={phone} onChangeText={setPhone} placeholder="+34 600 000 000" keyboardType="phone-pad" />
          <Input label="Email" value={email} onChangeText={setEmail} placeholder="facturacion@empresa.com" keyboardType="email-address" autoCapitalize="none" />
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Facturación</Text>
          <Input label="Serie de facturación" value={invoiceSeries} onChangeText={setInvoiceSeries} placeholder="F" />
        </Card>

        <Button title="Guardar datos de empresa" onPress={handleSave} loading={loading} />

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Información</Text>
          <Text style={styles.infoText}>Verifactu v1.0.0</Text>
          <Text style={styles.infoText}>Sistema de facturación electrónica</Text>
          <Text style={styles.infoText}>Cumplimiento Real Decreto 1007/2023</Text>
          <Text style={styles.infoText}>Usuario: {user?.email}</Text>
        </Card>

        <Button
          title="Cerrar sesión"
          onPress={handleLogout}
          variant="danger"
          style={styles.logoutBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  screenTitle: {
    ...typography.h1,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    ...typography.caption,
    marginBottom: spacing.md,
  },
  infoText: {
    ...typography.bodySmall,
    marginBottom: spacing.xs,
  },
  logoutBtn: {
    marginTop: spacing.lg,
  },
});
