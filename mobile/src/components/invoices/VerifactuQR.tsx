import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { colors, spacing, typography, borderRadius } from '../../theme';

interface VerifactuQRProps {
  url: string;
  size?: number;
}

export function VerifactuQR({ url, size = 180 }: VerifactuQRProps) {
  return (
    <View style={styles.container}>
      <View style={styles.qrWrapper}>
        <QRCode
          value={url}
          size={size}
          color={colors.text}
          backgroundColor={colors.white}
        />
      </View>
      <Text style={styles.label}>Código QR Verifactu</Text>
      <Text style={styles.hint}>Escanea para verificar en la AEAT</Text>
      <Text style={styles.url} numberOfLines={2}>{url}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: spacing.md,
  },
  qrWrapper: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  hint: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  url: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textLight,
    marginTop: spacing.xs,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
});
