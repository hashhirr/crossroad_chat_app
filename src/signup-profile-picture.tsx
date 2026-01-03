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
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../lib/supabase';
import { RootStackParamList } from './navigation/types';
import { theme } from './theme';

const logo = require('../assets/logo.png');
const logoText = require('../assets/text.png');

type SignupProfilePictureProps = NativeStackScreenProps<
  RootStackParamList,
  'SignupProfilePicture'
>;

export default function SignupProfilePicture({
  navigation,
  route,
}: SignupProfilePictureProps) {
  const { email, password, fullName } = route.params;
  const [image, setImage] = useState<Asset | null>(null);
  const [uploading, setUploading] = useState(false);
  const insets = useSafeAreaInsets();

  async function pickImage() {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      includeBase64: true,
      quality: 0.85,
      maxWidth: 1024,
      maxHeight: 1024,
    });

    if (result.didCancel) return;
    const asset = result.assets?.[0];

    if (!asset?.uri || !asset.base64) {
      Alert.alert('Unable to load image. Please try again.');
      return;
    }

    setImage(asset);
  }

  async function handleCreateAccount() {
    if (!image?.base64 || !image.uri) {
      Alert.alert('Please choose a profile photo.');
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      Alert.alert('Missing signup details. Please try again.');
      navigation.navigate('Auth');
      return;
    }

    setUploading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (error) {
        Alert.alert(error.message);
        return;
      }

      let userId = data.session?.user?.id ?? data.user?.id ?? null;

      if (!data.session) {
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password,
          });

        if (signInError) {
          Alert.alert('Account created. Please sign in to continue.');
          navigation.navigate('Auth');
          return;
        }

        userId = signInData.session?.user?.id ?? userId;
      }

      if (!userId) {
        Alert.alert('Account created. Please sign in to continue.');
        navigation.navigate('Auth');
        return;
      }

      const extension =
        image.fileName?.split('.').pop()?.toLowerCase() ?? 'jpg';
      const contentType =
        image.type ?? (extension === 'jpg' ? 'image/jpeg' : `image/${extension}`);
      const filePath = `${userId}/profile.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, decode(image.base64), {
          contentType,
          upsert: true,
        });

      if (uploadError) {
        Alert.alert(uploadError.message);
        return;
      }

      const { data: publicUrl } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = publicUrl.publicUrl;

      const { error: profileError } = await supabase.from('profiles').upsert(
        {
          id: userId,
          name: fullName,
          email: trimmedEmail,
          avatar_url: avatarUrl,
        },
        { onConflict: 'id' },
      );

      if (profileError) {
        Alert.alert(profileError.message);
        return;
      }
    } finally {
      setUploading(false);
    }
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
        <Text style={styles.tagline}>Add a photo so people know it’s you.</Text>
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
            <Text style={styles.cardEyebrow}>Profile photo</Text>
            <Text style={styles.cardTitle}>Upload your picture</Text>
            <Text style={styles.cardSubtitle}>
              This photo will appear on your profile and in chats.
            </Text>

            <View style={styles.photoWrap}>
              {image?.uri ? (
                <Image source={{ uri: image.uri }} style={styles.photo} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderText}>No photo</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={pickImage}
            >
              <Text style={styles.secondaryButtonLabel}>Choose photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                uploading && styles.buttonDisabled,
              ]}
              onPress={handleCreateAccount}
              disabled={uploading}
              activeOpacity={0.85}
            >
              {uploading ? (
                <ActivityIndicator color={theme.colors.buttonTextDark} />
              ) : (
                <Text style={styles.primaryButtonLabel}>Create account</Text>
              )}
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
  photoWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  photo: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: theme.colors.borderStrong,
  },
  photoPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: {
    color: theme.colors.textSubtle,
    fontSize: 12,
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
    marginTop: 10,
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
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 8,
  },
  secondaryButtonLabel: {
    color: theme.colors.secondary,
    fontSize: 13,
    fontFamily: theme.fonts.semiBold,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
});
