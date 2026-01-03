import React, { useState } from 'react';
import {
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from './navigation/types';
import { theme } from './theme';

const logo = require('../assets/logo.png');
const logoText = require('../assets/text.png');

type SignupFullNameProps = NativeStackScreenProps<
  RootStackParamList,
  'SignupFullName'
>;

export default function SignupFullName({
  navigation,
  route,
}: SignupFullNameProps) {
  const { email, password } = route.params;
  const [fullName, setFullName] = useState('');
  const insets = useSafeAreaInsets();

  function handleContinue() {
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      Alert.alert('Please enter your full name.');
      return;
    }

    if (!trimmedEmail || !password) {
      Alert.alert('Missing signup details. Please try again.');
      navigation.navigate('Auth');
      return;
    }

    navigation.navigate('SignupProfilePicture', {
      email: trimmedEmail,
      password,
      fullName: trimmedName,
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

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.85}
      >
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
        <Image source={logoText} style={styles.logoText} resizeMode="contain" />
        <Text style={styles.tagline}>
          Tell people who they are chatting with.
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
        >
          <View style={styles.form}>
            <Text style={styles.cardEyebrow}>Almost there</Text>
            <Text style={styles.cardTitle}>What should we call you?</Text>
            <Text style={styles.cardSubtitle}>
              This name appears in your conversations.
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>Full name</Text>
              <TextInput
                style={styles.input}
                onChangeText={setFullName}
                value={fullName}
                placeholder="Your full name"
                placeholderTextColor={theme.colors.textSubtle}
                autoCapitalize="words"
                autoCorrect={false}
                selectionColor={theme.colors.primary}
                returnKeyType="done"
              />
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Account email</Text>
              <Text style={styles.metaValue} numberOfLines={1}>
                {email}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.85}
              onPress={handleContinue}
            >
              <Text style={styles.primaryButtonLabel}>Continue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Auth')}
            >
              <Text style={styles.secondaryButtonLabel}>Back to sign in</Text>
            </TouchableOpacity>
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
  backButton: {
    alignSelf: 'flex-start',
    marginLeft: 16,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.overlay,
  },
  backText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontFamily: theme.fonts.semiBold,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 88,
    height: 88,
  },
  logoText: {
    width: 200,
    height: 36,
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
    paddingTop: 6,
    paddingBottom: 24,
  },
  form: {
    paddingTop: 4,
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
    marginBottom: 16,
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
  metaRow: {
    marginBottom: 18,
  },
  metaLabel: {
    color: theme.colors.textSubtle,
    fontSize: 12,
    fontFamily: theme.fonts.semiBold,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  metaValue: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontFamily: theme.fonts.medium,
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.borderStrong,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 6,
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
    paddingVertical: 12,
    marginTop: 10,
  },
  secondaryButtonLabel: {
    color: theme.colors.secondary,
    fontSize: 13,
    fontFamily: theme.fonts.semiBold,
  },
});
