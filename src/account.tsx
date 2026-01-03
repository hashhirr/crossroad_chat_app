import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { theme } from './theme';

type AccountProps = {
  email?: string | null;
  name?: string | null;
};

export default function Account({ email, name }: AccountProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function signOut() {
    setIsSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) Alert.alert(error.message);
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardEyebrow}>Signed in</Text>
      <Text style={styles.cardTitle}>Welcome back</Text>
      <Text style={styles.cardSubtitle}>
        {name
          ? `Signed in as ${name}${email ? ` (${email})` : ''}`
          : email ?? 'Session active on this device.'}
      </Text>
      <TouchableOpacity
        style={[styles.button, isSigningOut && styles.buttonDisabled]}
        activeOpacity={0.85}
        disabled={isSigningOut}
        onPress={signOut}
      >
        {isSigningOut ? (
          <ActivityIndicator color={theme.colors.buttonTextDark} />
        ) : (
          <Text style={styles.buttonLabel}>Sign Out</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    ...theme.shadows.card,
    marginTop: 10,
  },
  cardEyebrow: {
    color: theme.colors.primaryAlt,
    fontSize: 12,
    fontFamily: theme.fonts.bold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  cardTitle: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontFamily: theme.fonts.bold,
    marginBottom: 6,
  },
  cardSubtitle: {
    color: theme.colors.textSubtle,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
    fontFamily: theme.fonts.regular,
  },
  button: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.borderStrong,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
  },
  buttonLabel: {
    color: theme.colors.buttonTextDark,
    fontSize: 15,
    fontFamily: theme.fonts.bold,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
});
