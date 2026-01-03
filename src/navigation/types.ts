export type RootStackParamList = {
  Auth: undefined;
  SignupFullName: { email: string; password: string };
  SignupProfilePicture: { email: string; password: string; fullName: string };
  ChatList: undefined;
  ChatThread: {
    userId: string;
    conversationId: string;
    profileId: string;
    profileName?: string | null;
    profileEmail?: string | null;
    profileAvatarUrl?: string | null;
  };
};
