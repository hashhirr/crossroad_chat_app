import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from './navigation/types';
import { theme } from './theme';

const logo = require('../assets/logo.png');
const logoText = require('../assets/text.png');

type AuthProps = NativeStackScreenProps<RootStackParamList, 'Auth'>;

export default function Auth({ navigation }: AuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingAction, setLoadingAction] = useState<
    'signIn' | 'signUp' | null
  >(null);

  const insets = useSafeAreaInsets();

  const isLoading = loadingAction !== null;

  async function signInWithEmail() {
    setLoadingAction('signIn');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) Alert.alert(error.message);
    } finally {
      setLoadingAction(null);
    }
  }

  function signUpWithEmail() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      Alert.alert('Please enter your email and password.');
      return;
    }

    navigation.navigate('SignupFullName', {
      email: trimmedEmail,
      password,
    });
  }

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.background} pointerEvents="none">
        <View style={styles.orbTop} />
        <View style={styles.orbBottom} />
      </View>
      <View style={styles.header}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
        <Image source={logoText} style={styles.logoText} resizeMode="contain" />
        <Text style={styles.tagline}>
          Sign in to keep your conversations moving.
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
        style={styles.body}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        >
          <View style={styles.form}>
            <Text style={styles.cardEyebrow}>Get started</Text>
            <Text style={styles.cardTitle}>Sign in or create an account</Text>
            <Text style={styles.cardSubtitle}>
              Use your email and password to continue.
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                onChangeText={setEmail}
                value={email}
                placeholder="you@example.com"
                placeholderTextColor={theme.colors.textSubtle}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                selectionColor={theme.colors.primary}
                returnKeyType="next"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                onChangeText={setPassword}
                value={password}
                secureTextEntry
                placeholder="********"
                placeholderTextColor={theme.colors.textSubtle}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="password"
                selectionColor={theme.colors.primary}
                returnKeyType="done"
              />
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  isLoading && styles.buttonDisabled,
                ]}
                activeOpacity={0.85}
                disabled={isLoading}
                onPress={signUpWithEmail}
              >
                {loadingAction === 'signUp' ? (
                  <ActivityIndicator color={theme.colors.buttonTextDark} />
                ) : (
                  <Text style={styles.primaryButtonLabel}>Create account</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  isLoading && styles.buttonDisabled,
                ]}
                activeOpacity={0.85}
                disabled={isLoading}
                onPress={signInWithEmail}
              >
                <Text style={styles.secondaryButtonLabel}>
                  {loadingAction === 'signIn' ? 'Signing in…' : 'Sign in'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.helperText}>
              We keep your session active while you stay signed in.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  orbTop: {
    position: 'absolute',
    top: -120,
    right: -120,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: theme.colors.softPrimary,
  },
  orbBottom: {
    position: 'absolute',
    bottom: -160,
    left: -140,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: theme.colors.softSecondary,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 96,
    height: 96,
  },
  logoText: {
    width: 220,
    height: 40,
    marginTop: 10,
  },
  tagline: {
    marginTop: 6,
    color: theme.colors.textMuted,
    fontSize: 12,
    fontFamily: theme.fonts.medium,
    textAlign: 'center',
    maxWidth: 320,
  },
  body: {
    flex: 1,
  },
  content: {
    paddingHorizontal: '5%',
    paddingTop: 10,
    paddingBottom: 24,
  },
  form: {
    paddingTop: 6,
  },
  cardEyebrow: {
    color: theme.colors.primaryAlt,
    fontSize: 12,
    fontFamily: theme.fonts.bold,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  cardTitle: {
    color: theme.colors.accent,
    fontSize: 24,
    fontFamily: theme.fonts.bold,
    marginBottom: 6,
  },
  cardSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
    fontFamily: theme.fonts.medium,
  },
  field: {
    marginBottom: 18,
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontFamily: theme.fonts.semiBold,
    marginBottom: 6,
  },
  input: {
    backgroundColor: theme.colors.inputBg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontFamily: theme.fonts.regular,
  },
  actions: {
    marginTop: 4,
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.borderStrong,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 12,
    ...theme.shadows.button,
  },
  primaryButtonLabel: {
    color: theme.colors.buttonTextDark,
    fontSize: 15,
    fontFamily: theme.fonts.bold,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderColor: theme.colors.borderStrong,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 12,
  },
  secondaryButtonLabel: {
    color: theme.colors.secondary,
    fontSize: 15,
    fontFamily: theme.fonts.semiBold,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  helperText: {
    marginTop: 14,
    color: theme.colors.textSubtle,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: theme.fonts.regular,
  },
});
