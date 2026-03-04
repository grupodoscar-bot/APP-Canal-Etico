import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useClients } from '../../hooks/useClients';
import { colors, spacing, typography } from '../../theme';
import { validateNIFField, validateRequired } from '../../utils/validators';

export function ClientFormScreen({ route, navigation }: any) {
  const clientId = route.params?.clientId;
  const isEditing = Boolean(clientId);
  const { user } = useAuth();
  const { addClient, updateClient, getClient } = useClients(user?.id || 0);

  const [nif, setNif] = useState('');
  const [name, setName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [province, setProvince] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditing) {
      loadClient();
    }
  }, [clientId]);

  const loadClient = async () => {
    const client = await getClient(clientId);
    if (client) {
      setNif(client.nif);
      setName(client.name);
      setTradeName(client.tradeName || '');
      setAddress(client.address);
      setCity(client.city);
      setPostalCode(client.postalCode);
      setProvince(client.province);
      setPhone(client.phone || '');
      setEmail(client.email || '');
      setNotes(client.notes || '');
    }
  };

  const handleSave = async () => {
    const nifError = validateNIFField(nif);
    if (nifError) { Alert.alert('Error', nifError); return; }
    if (validateRequired(name)) { Alert.alert('Error', 'El nombre es obligatorio'); return; }
    if (validateRequired(address)) { Alert.alert('Error', 'La dirección es obligatoria'); return; }
    if (validateRequired(city)) { Alert.alert('Error', 'La ciudad es obligatoria'); return; }
    if (validateRequired(postalCode)) { Alert.alert('Error', 'El código postal es obligatorio'); return; }
    if (validateRequired(province)) { Alert.alert('Error', 'La provincia es obligatoria'); return; }

    setLoading(true);
    try {
      const clientData = {
        nif: nif.toUpperCase(),
        name,
        tradeName: tradeName || undefined,
        address,
        city,
        postalCode,
        province,
        country: 'ES',
        phone: phone || undefined,
        email: email || undefined,
        notes: notes || undefined,
      };

      if (isEditing) {
        await updateClient(clientId, clientData);
        Alert.alert('Guardado', 'Cliente actualizado');
      } else {
        await addClient(clientData as any);
        Alert.alert('Guardado', 'Cliente creado');
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Input label="NIF/CIF *" value={nif} onChangeText={setNif} placeholder="12345678A" autoCapitalize="characters" />
        <Input label="Nombre / Razón social *" value={name} onChangeText={setName} placeholder="Empresa S.L." />
        <Input label="Nombre comercial" value={tradeName} onChangeText={setTradeName} placeholder="Nombre comercial" />
        <Input label="Dirección *" value={address} onChangeText={setAddress} placeholder="Calle, número, piso" />
        <Input label="Ciudad *" value={city} onChangeText={setCity} placeholder="Madrid" />
        <Input label="Código postal *" value={postalCode} onChangeText={setPostalCode} placeholder="28001" keyboardType="numeric" />
        <Input label="Provincia *" value={province} onChangeText={setProvince} placeholder="Madrid" />
        <Input label="Teléfono" value={phone} onChangeText={setPhone} placeholder="+34 600 000 000" keyboardType="phone-pad" />
        <Input label="Email" value={email} onChangeText={setEmail} placeholder="contacto@empresa.com" keyboardType="email-address" autoCapitalize="none" />
        <Input label="Notas" value={notes} onChangeText={setNotes} placeholder="Notas adicionales" multiline numberOfLines={3} />

        <Button
          title={isEditing ? 'Guardar cambios' : 'Crear cliente'}
          onPress={handleSave}
          loading={loading}
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
});
