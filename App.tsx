import 'react-native-url-polyfill/auto';
import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { StatusBar, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from './lib/supabase';
import Auth from './src/auth';
import ChatList from './src/chat';
import ChatThread from './src/chat-thread';
import SignupFullName from './src/signup-fullname';
import SignupProfilePicture from './src/signup-profile-picture';
import { RootStackParamList } from './src/navigation/types';
import { theme } from './src/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  const isAuthenticated = Boolean(session?.user);

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <NavigationContainer>
        {isAuthenticated && session ? (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ChatList">
              {props => <ChatList {...props} userId={session.user.id} />}
            </Stack.Screen>
            <Stack.Screen name="ChatThread">
              {props => <ChatThread {...props} />}
            </Stack.Screen>
          </Stack.Navigator>
        ) : (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Auth" component={Auth} />
            <Stack.Screen name="SignupFullName" component={SignupFullName} />
            <Stack.Screen
              name="SignupProfilePicture"
              component={SignupProfilePicture}
            />
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
