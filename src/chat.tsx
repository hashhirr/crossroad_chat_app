import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { RootStackParamList } from './navigation/types';
import { theme } from './theme';

type ChatListProps = NativeStackScreenProps<RootStackParamList, 'ChatList'> & {
  userId: string;
};

type Profile = {
  id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
};

export default function ChatList({ userId, navigation }: ChatListProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [openingProfileId, setOpeningProfileId] = useState<string | null>(null);

  const insets = useSafeAreaInsets();

  useEffect(() => {
    let isMounted = true;

    async function loadProfiles() {
      setLoadingProfiles(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name, avatar_url')
        .neq('id', userId)
        .order('email', { ascending: true });

      if (!isMounted) return;

      if (error) {
        Alert.alert(error.message);
        setLoadingProfiles(false);
        return;
      }

      setProfiles(data ?? []);
      setLoadingProfiles(false);
    }

    loadProfiles();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  async function signOut() {
    setSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) Alert.alert(error.message);
    } finally {
      setSigningOut(false);
    }
  }

  async function openConversation(profile: Profile) {
    setOpeningProfileId(profile.id);
    try {
      const { data: memberships, error: membershipError } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', userId);

      if (membershipError) {
        Alert.alert(membershipError.message);
        return;
      }

      const conversationIds =
        memberships?.map(member => member.conversation_id) ?? [];

      if (conversationIds.length) {
        const { data: shared, error: sharedError } = await supabase
          .from('conversation_members')
          .select('conversation_id')
          .eq('user_id', profile.id)
          .in('conversation_id', conversationIds)
          .limit(1);

        if (sharedError) {
          Alert.alert(sharedError.message);
          return;
        }

        if (shared && shared.length) {
          navigation.navigate('ChatThread', {
            userId,
            conversationId: shared[0].conversation_id,
            profileId: profile.id,
            profileName: profile.name,
            profileEmail: profile.email,
            profileAvatarUrl: profile.avatar_url,
          });
          return;
        }
      }

      const { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .insert({})
        .select('id')
        .single();

      if (conversationError || !conversation) {
        Alert.alert(conversationError?.message ?? 'Unable to start chat.');
        return;
      }

      const { error: memberInsertError } = await supabase
        .from('conversation_members')
        .insert([
          { conversation_id: conversation.id, user_id: userId },
          { conversation_id: conversation.id, user_id: profile.id },
        ]);

      if (memberInsertError) {
        Alert.alert(memberInsertError.message);
        return;
      }

      navigation.navigate('ChatThread', {
        userId,
        conversationId: conversation.id,
        profileId: profile.id,
        profileName: profile.name,
        profileEmail: profile.email,
        profileAvatarUrl: profile.avatar_url,
      });
    } finally {
      setOpeningProfileId(null);
    }
  }

  const headerSubtitle = useMemo(() => {
    if (loadingProfiles) return 'Loading available users...';
    if (!profiles.length) return 'Create another account to start chatting.';
    return 'Tap someone to open their chat thread.';
  }, [loadingProfiles, profiles.length]);

  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Crossroad</Text>
        <TouchableOpacity
          style={[styles.logoutButton, signingOut && styles.logoutButtonDisabled]}
          onPress={signOut}
          activeOpacity={0.8}
          disabled={signingOut}
        >
          {signingOut ? (
            <ActivityIndicator color={theme.colors.textSecondary} size="small" />
          ) : (
            <Text style={styles.logoutText}>Log out</Text>
          )}
        </TouchableOpacity>
      </View>

      {loadingProfiles ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : profiles.length ? (
        <FlatList
          data={profiles}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.chatListContent}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Chats</Text>
              <Text style={styles.listSubtitle}>{headerSubtitle}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isOpening = openingProfileId === item.id;
            return (
              <TouchableOpacity
                style={styles.chatRow}
                activeOpacity={0.85}
                onPress={() => openConversation(item)}
                disabled={isOpening}
              >
                <View style={styles.avatar}>
                  {isOpening ? (
                    <ActivityIndicator
                      color={theme.colors.primary}
                      size="small"
                    />
                  ) : item.avatar_url ? (
                    <Image
                      source={{ uri: item.avatar_url }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Text style={styles.avatarText}>
                      {(item.name?.trim()?.[0] ??
                        item.email?.trim()?.[0] ??
                        '?'
                      ).toUpperCase()}
                    </Text>
                  )}
                </View>
                <View style={styles.chatRowBody}>
                  <Text style={styles.chatRowTitle} numberOfLines={1}>
                    {item.name?.trim() || item.email || 'Unknown user'}
                  </Text>
                  {!!item.email && (
                    <Text style={styles.chatRowSubtitle} numberOfLines={1}>
                      {item.email}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      ) : (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>No chats yet</Text>
          <Text style={styles.emptyText}>
            No people available yet. Create another account to start chatting.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSoft,
    backgroundColor: theme.colors.surface,
  },
  headerTitle: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontFamily: theme.fonts.bold,
    letterSpacing: 0.2,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.overlay,
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontFamily: theme.fonts.semiBold,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  listTitle: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontFamily: theme.fonts.semiBold,
    marginBottom: 4,
  },
  listSubtitle: {
    color: theme.colors.textSubtle,
    fontSize: 13,
    fontFamily: theme.fonts.regular,
    lineHeight: 18,
  },
  chatListContent: {
    paddingBottom: 12,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSoft,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.softSecondary,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontFamily: theme.fonts.bold,
  },
  chatRowBody: {
    flex: 1,
  },
  chatRowTitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontFamily: theme.fonts.semiBold,
    marginBottom: 3,
  },
  chatRowSubtitle: {
    color: theme.colors.textSubtle,
    fontSize: 12,
    fontFamily: theme.fonts.regular,
  },
  emptyWrap: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  emptyTitle: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontFamily: theme.fonts.bold,
    marginBottom: 6,
  },
  emptyText: {
    color: theme.colors.textFaint,
    fontSize: 13,
    fontFamily: theme.fonts.regular,
  },
});
