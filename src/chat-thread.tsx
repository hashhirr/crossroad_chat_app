import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { RootStackParamList } from './navigation/types';
import { theme } from './theme';

type ChatThreadProps = NativeStackScreenProps<RootStackParamList, 'ChatThread'>;

type Message = {
  id: string | number;
  created_at: string;
  sender_id: string;
  body: string;
  conversation_id: string;
};

export default function ChatThread({ navigation, route }: ChatThreadProps) {
  const {
    userId,
    conversationId,
    profileName,
    profileEmail,
    profileAvatarUrl,
  } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const insets = useSafeAreaInsets();

  useEffect(() => {
    setMessages([]);
  }, [conversationId]);

  useEffect(() => {
    let isMounted = true;

    async function loadMessages() {
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from('messages')
        .select('id, created_at, sender_id, body, conversation_id')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (!isMounted) return;

      if (error) {
        Alert.alert(error.message);
        setLoadingMessages(false);
        return;
      }

      setMessages(data ?? []);
      setLoadingMessages(false);
    }

    loadMessages();

    return () => {
      isMounted = false;
    };
  }, [conversationId, refreshToken]);

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        payload => {
          const newMessage = payload.new as Message;
          setMessages(prev => {
            if (prev.some(message => message.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  async function sendMessage() {
    const trimmed = messageText.trim();
    if (!trimmed) return;
    if (sendingMessage) return;

    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      created_at: new Date().toISOString(),
      sender_id: userId,
      body: trimmed,
      conversation_id: conversationId,
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setMessageText('');
    setSendingMessage(true);

    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: userId,
        conversation_id: conversationId,
        body: trimmed,
      })
      .select('id, created_at, sender_id, body, conversation_id')
      .single();

    if (error) {
      setMessages(prev => prev.filter(message => message.id !== optimisticId));
      setMessageText(trimmed);
      Alert.alert(error.message);
      setSendingMessage(false);
      return;
    }

    if (data) {
      setMessages(prev =>
        prev.map(message => (message.id === optimisticId ? data : message)),
      );
    }

    setSendingMessage(false);
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.backChevron}>‹</Text>
        </TouchableOpacity>

        <View style={styles.headerAvatar}>
          {profileAvatarUrl ? (
            <Image source={{ uri: profileAvatarUrl }} style={styles.headerAvatarImage} />
          ) : (
            <Text style={styles.headerAvatarText}>
              {(profileName?.trim()?.[0] ??
                profileEmail?.trim()?.[0] ??
                '?'
              ).toUpperCase()}
            </Text>
          )}
        </View>

        <View style={styles.headerBody}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {profileName?.trim() || profileEmail || 'Chat'}
          </Text>
        </View>

      </View>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {loadingMessages ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            data={[...messages].reverse()}
            keyExtractor={item => String(item.id)}
            inverted
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.messageListContent}
            onRefresh={() => setRefreshToken(prev => prev + 1)}
            refreshing={loadingMessages}
            renderItem={({ item }) => {
              const isMine = item.sender_id === userId;
              return (
                <View style={[styles.messageRow, isMine ? styles.messageRowMine : styles.messageRowOther]}>
                  <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
                    <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>
                      {item.body}
                    </Text>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>No messages yet. Say hello!</Text>
              </View>
            }
          />
        )}

        <View style={[styles.composerWrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <View style={styles.composer}>
            <TextInput
              style={styles.input}
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Message"
              placeholderTextColor={theme.colors.textSubtle}
              editable={!sendingMessage}
              selectionColor={theme.colors.primary}
              multiline
            />

            <TouchableOpacity
              style={[styles.sendButton, sendingMessage && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={sendingMessage}
              activeOpacity={0.85}
            >
              <Text style={styles.sendIcon}>➤</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSoft,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  backChevron: {
    color: theme.colors.textSecondary,
    fontSize: 28,
    fontFamily: theme.fonts.bold,
    marginTop: -2,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.softSecondary,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  headerAvatarImage: {
    width: '100%',
    height: '100%',
  },
  headerAvatarText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontFamily: theme.fonts.bold,
  },
  headerBody: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontFamily: theme.fonts.bold,
  },
  body: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageListContent: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
  },
  messageRow: {
    marginBottom: 8,
    flexDirection: 'row',
  },
  messageRowMine: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },
  bubbleMine: {
    backgroundColor: theme.colors.softPrimary,
    borderColor: theme.colors.borderStrong,
    borderTopRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.borderSoft,
    borderTopLeftRadius: 4,
  },
  bubbleText: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: theme.fonts.regular,
  },
  bubbleTextMine: {
    color: theme.colors.textPrimary,
  },
  emptyWrap: {
    paddingTop: 18,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.textSubtle,
    fontSize: 13,
    fontFamily: theme.fonts.regular,
  },
  composerWrap: {
    paddingTop: 10,
    paddingHorizontal: 10,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSoft,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: theme.colors.inputBg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontFamily: theme.fonts.regular,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    marginBottom: 2,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendIcon: {
    color: theme.colors.buttonTextDark,
    fontSize: 18,
    fontFamily: theme.fonts.bold,
    marginLeft: 2,
  },
});
