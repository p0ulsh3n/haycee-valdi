export interface MessagingApiConfiguration {
  /** API root, for example https://api.example.com/v1. Never ship secrets in this value. */
  baseUrl: string;
  getAccessToken: () => string | undefined;
  getCurrentUserId: () => string;
}

export interface ConversationParticipant {
  id: string;
  username?: string;
  displayName: string;
  avatarUrl?: string;
  isOnline?: boolean;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  senderId: string;
  type: 'text' | 'image' | 'video' | 'voice';
  content: {
    text?: string;
    mediaUri?: string;
    thumbnailUri?: string;
    durationMillis?: number;
    /** 32 normalized (0–1) peak-amplitude samples from the voice audio; APIs should persist and return this metadata. */
    waveform?: number[];
  };
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  sentAt: number;
}

/** API-facing shape based on the Haycee messaging guide. */
export interface MessagingConversation {
  id: string;
  type: 'direct' | 'group';
  participants: ConversationParticipant[];
  lastMessage: ConversationMessage | null;
  lastMessageAt: number;
  unreadCount: number;
  isPinned?: boolean;
  isMuted?: boolean;
  groupName?: string;
}

/** Small display model passed from the inbox tab into a pushed chat page. */
export interface ConversationPreview {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  isOnline: boolean;
}

export interface MessagingConversationResponse {
  conversations: MessagingConversation[];
}

export interface ConversationMessagesResponse {
  messages: ConversationMessage[];
}
