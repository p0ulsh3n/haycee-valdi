import { Component, StatefulComponent } from 'valdi_core/src/Component';
import { Device } from 'valdi_core/src/Device';
import { Style } from 'valdi_core/src/Style';
import { createReusableCallback } from 'valdi_core/src/utils/Callback';
import { EditTextEvent, Label, Layout, ScrollView, TextField, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../res/navigation-icons';
import { TransientFeedback } from '../design-system/components/SnackBar';
import { colors } from '../design-system/tokens/colors';
import { noBounceScrollAttributes } from '../design-system/tokens/scrollBehavior';
import { radius } from '../design-system/tokens/radius';
import { layout, spacing } from '../design-system/tokens/spacing';
import { fontSize, lineHeight, montserrat, typography } from '../design-system/tokens/typography';
import { MessagingApi } from './MessagingApi';
import { getMessagingApiConfiguration } from './MessagingApiConfiguration';
import { ConversationPreview } from './MessagingTypes';

interface ConversationRowViewModel {
  conversation: ConversationPreview;
  onTap: () => void;
}

interface MessagesInboxState {
  searchQuery: string;
  showUnreadOnly: boolean;
  conversations: ConversationPreview[];
}

export interface MessagesInboxViewModel {
  onConversationTap?: (conversation: ConversationPreview) => void;
}

const conversationPreviews: ConversationPreview[] = [
  { id: 'maya', name: 'Maya Laurent', initials: 'ML', avatarUrl: 'https://i.pravatar.cc/100?img=47', lastMessage: 'La veste est toujours disponible ?', time: '09:42', unreadCount: 2, isOnline: true },
  { id: 'ines', name: 'Inès Moreau', initials: 'IM', avatarUrl: 'https://i.pravatar.cc/100?img=32', lastMessage: 'Vous : Merci, je viens de valider la commande.', time: '08:56', unreadCount: 0, isOnline: false },
  { id: 'atelier-nord', name: 'Atelier du Nord', initials: 'AN', avatarUrl: 'https://i.pravatar.cc/100?img=12', lastMessage: 'Votre colis sera expédié demain.', time: 'Hier', unreadCount: 1, isOnline: true },
  { id: 'sarah', name: 'Sarah Benali', initials: 'SB', avatarUrl: 'https://i.pravatar.cc/100?img=44', lastMessage: 'Est-ce que la taille est ajustable ?', time: 'Hier', unreadCount: 0, isOnline: false },
  { id: 'camille', name: 'Camille Petit', initials: 'CP', avatarUrl: 'https://i.pravatar.cc/100?img=5', lastMessage: 'Vous : Je vous envoie les détails dans un instant.', time: 'Mar.', unreadCount: 0, isOnline: false },
  { id: 'les-creations', name: 'Les Créations', initials: 'LC', avatarUrl: 'https://i.pravatar.cc/100?img=25', lastMessage: 'Nouvelle collection disponible en boutique.', time: 'Lun.', unreadCount: 3, isOnline: false },
  { id: 'nora', name: 'Nora Diallo', initials: 'ND', avatarUrl: 'https://i.pravatar.cc/100?img=49', lastMessage: 'Parfait, merci pour votre réponse.', time: 'Dim.', unreadCount: 0, isOnline: false },
  { id: 'julie', name: 'Julie Martin', initials: 'JM', avatarUrl: 'https://i.pravatar.cc/100?img=20', lastMessage: 'Vous : La commande est bien partie.', time: 'Sam.', unreadCount: 0, isOnline: false },
];

class ConversationRow extends Component<ConversationRowViewModel> {
  onRender(): void {
    const { conversation, onTap } = this.viewModel;

    <view style={styles.conversationRow} onTap={onTap} accessibilityCategory="button">
      <view style={styles.avatar}>
        <label value={conversation.initials} style={styles.avatarInitials} numberOfLines={1} />
        {conversation.isOnline ? <view style={styles.onlineIndicator} /> : null}
      </view>
      <layout style={styles.conversationCopy}>
        <layout style={styles.conversationHeading}>
          <label value={conversation.name} style={styles.conversationName} numberOfLines={1} />
          <label value={conversation.time} style={styles.timeLabel} numberOfLines={1} />
        </layout>
        <layout style={styles.conversationPreview}>
          <label
            value={conversation.lastMessage}
            style={conversation.unreadCount > 0 ? styles.previewUnread : styles.preview}
            numberOfLines={1}
          />
          {conversation.unreadCount > 0 ? (
            <view style={styles.unreadBadge}>
              <label value={String(conversation.unreadCount)} style={styles.unreadCount} numberOfLines={1} />
            </view>
          ) : null}
        </layout>
      </layout>
    </view>;
  }
}

/** Inbox shown inside the Messages bottom tab; the data stays local until an API is connected. */
export class MessagesInbox extends StatefulComponent<MessagesInboxViewModel, MessagesInboxState> {
  state: MessagesInboxState = {
    searchQuery: '',
    showUnreadOnly: false,
    conversations: conversationPreviews,
  };

  private api?: MessagingApi;

  onCreate(): void {
    const configuration = getMessagingApiConfiguration();
    if (!configuration) return;
    try {
      this.api = new MessagingApi(configuration);
      this.registerDisposable(() => this.api?.dispose());
      void this.loadConversations();
    } catch (error) {
      console.warn('Messaging API is not configured; showing local inbox data.', error);
    }
  }

  private loadConversations = async (): Promise<void> => {
    if (!this.api) return;
    try {
      const response = await this.api.fetchConversations();
      if (this.isDestroyed()) return;
      const conversations = response.conversations.map((conversation): ConversationPreview => {
        const participant = conversation.participants.find(
          (person) => person.id !== getMessagingApiConfiguration()?.getCurrentUserId(),
        ) ?? conversation.participants[0];
        const name = conversation.type === 'group'
          ? conversation.groupName ?? 'Conversation de groupe'
          : participant?.displayName ?? 'Conversation';
        const text = conversation.lastMessage?.content.text ?? '';
        const isMine = conversation.lastMessage?.senderId === getMessagingApiConfiguration()?.getCurrentUserId();
        return {
          id: conversation.id,
          name,
          initials: this.initials(name),
          avatarUrl: participant?.avatarUrl,
          lastMessage: `${isMine ? 'Vous : ' : ''}${text}`,
          time: this.formatConversationTime(conversation.lastMessageAt),
          unreadCount: conversation.unreadCount,
          isOnline: participant?.isOnline ?? false,
        };
      });
      this.setState({ conversations });
    } catch (error) {
      if (!this.isDestroyed()) console.warn('Unable to load conversations; keeping the local inbox preview.', error);
    }
  };

  private initials = (name: string): string => name
    .split(' ')
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  private formatConversationTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
    return 'Hier';
  };

  private handleSearchChange = (event: EditTextEvent): void => {
    this.setState({ searchQuery: event.text });
  };

  private handleShowAll = (): void => {
    this.setState({ showUnreadOnly: false });
  };

  private handleShowUnread = (): void => {
    this.setState({ showUnreadOnly: true });
  };

  private handleCompose = (): void => {
    TransientFeedback.show({ message: 'La création de conversation sera bientôt disponible.' });
  };

  private handleConversationTap = (conversation: ConversationPreview): void => {
    const onConversationTap = this.viewModel.onConversationTap;
    if (onConversationTap) {
      onConversationTap(conversation);
      return;
    }
    TransientFeedback.show({ message: `Conversation avec ${conversation.name}` });
  };

  onRender(): void {
    const query = this.state.searchQuery.trim().toLowerCase();
    const visibleConversations = this.state.conversations.filter((conversation) => {
      const matchesQuery = query.length === 0 || conversation.name.toLowerCase().includes(query) || conversation.lastMessage.toLowerCase().includes(query);
      return matchesQuery && (!this.state.showUnreadOnly || conversation.unreadCount > 0);
    });
    const topInset = Math.max(0, Device.getDisplayTopInset());

    <view style={styles.screen}>
      <view style={styles.header.extend({ paddingTop: topInset + spacing.xl })}>
        <layout style={styles.headerCopy}>
          <label value="Messages" style={styles.title} accessibilityCategory="header" numberOfLines={1} />
          <label value="Vos conversations" style={styles.subtitle} numberOfLines={1} />
        </layout>
        <view style={styles.composeButton} onTap={this.handleCompose} accessibilityCategory="button">
          <image src={navigationIcons.add02} tint={colors.textPrimary} width={22} height={22} objectFit="contain" />
        </view>
      </view>

      <view style={styles.searchContainer}>
        <image src={navigationIcons.search02} tint={colors.textTertiary} width={20} height={20} objectFit="contain" />
        <textfield
          style={styles.searchField}
          placeholder="Rechercher une conversation"
          placeholderColor={colors.textTertiary}
          value={this.state.searchQuery}
          onChange={this.handleSearchChange}
          contentType="default"
          autocapitalization="none"
          autocorrection="none"
          returnKeyText="search"
        />
      </view>

      <layout style={styles.filterRow}>
        <view
          style={this.state.showUnreadOnly ? styles.filterPill : styles.filterPillActive}
          onTap={this.handleShowAll}
          accessibilityCategory="button"
          accessibilityStateSelected={!this.state.showUnreadOnly}
        >
          <label value="Toutes" style={this.state.showUnreadOnly ? styles.filterLabel : styles.filterLabelActive} numberOfLines={1} />
        </view>
        <view
          style={this.state.showUnreadOnly ? styles.filterPillActive : styles.filterPill}
          onTap={this.handleShowUnread}
          accessibilityCategory="button"
          accessibilityStateSelected={this.state.showUnreadOnly}
        >
          <label value="Non lues" style={this.state.showUnreadOnly ? styles.filterLabelActive : styles.filterLabel} numberOfLines={1} />
        </view>
      </layout>

      <scroll
        {...noBounceScrollAttributes}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        dismissKeyboardOnDrag={true}
      >
        {visibleConversations.length > 0 ? (
          <layout style={styles.listContent}>
            {visibleConversations.map((conversation) => (
              <ConversationRow
                key={conversation.id}
                conversation={conversation}
                onTap={createReusableCallback(() => this.handleConversationTap(conversation))}
              />
            ))}
          </layout>
        ) : (
          <layout style={styles.emptyState}>
            <image src={navigationIcons.messages} tint={colors.textTertiary} width={34} height={34} objectFit="contain" />
            <label value={this.state.showUnreadOnly ? 'Aucun message non lu' : 'Aucune conversation trouvée'} style={styles.emptyTitle} numberOfLines={2} />
            <label value="Essayez une autre recherche." style={styles.emptyMessage} numberOfLines={2} />
          </layout>
        )}
      </scroll>;
    </view>;
  }
}

const styles = {
  screen: new Style<View>({
    backgroundColor: colors.backgroundPrimary,
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 1,
  }),
  header: new Style<View>({
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: spacing.lg,
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
  }),
  headerCopy: new Style<Layout>({ flexGrow: 1 }),
  title: typography.title1,
  subtitle: new Style<Label>({
    color: colors.textSecondary,
    font: montserrat.regular(fontSize.metadata),
    lineHeight: lineHeight.label / fontSize.metadata,
    marginTop: spacing.xs,
  }),
  composeButton: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.full,
    height: 42,
    justifyContent: 'center',
    width: 42,
  }),
  searchContainer: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.md,
    flexDirection: 'row',
    height: 46,
    marginLeft: spacing.lg,
    marginRight: spacing.lg,
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
  }),
  searchField: new Style<TextField>({
    color: colors.textPrimary,
    flexGrow: 1,
    font: montserrat.regular(fontSize.body),
    marginLeft: spacing.sm,
    minWidth: 0,
  }),
  filterRow: new Style<Layout>({
    alignItems: 'center',
    flexDirection: 'row',
    paddingBottom: spacing.sm,
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    paddingTop: spacing.lg,
  }),
  filterPill: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.full,
    height: 34,
    justifyContent: 'center',
    marginRight: spacing.sm,
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
  }),
  filterPillActive: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.textPrimary,
    borderRadius: radius.full,
    height: 34,
    justifyContent: 'center',
    marginRight: spacing.sm,
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
  }),
  filterLabel: new Style<Label>({ color: colors.textSecondary, font: montserrat.semiBold(fontSize.metadata) }),
  filterLabelActive: new Style<Label>({ color: colors.textInverted, font: montserrat.semiBold(fontSize.metadata) }),
  list: new Style<ScrollView>({ flexGrow: 1, flexShrink: 1 }),
  listContent: new Style<Layout>({ paddingBottom: spacing.lg }),
  conversationRow: new Style<View>({
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 76,
    paddingBottom: spacing.sm,
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    paddingTop: spacing.sm,
    width: '100%',
  }),
  avatar: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.full,
    height: 54,
    justifyContent: 'center',
    marginRight: spacing.md,
    position: 'relative',
    width: 54,
  }),
  avatarInitials: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.semiBold(fontSize.body),
    textAlign: 'center',
  }),
  onlineIndicator: new Style<View>({
    backgroundColor: colors.textSuccess,
    borderColor: colors.backgroundPrimary,
    borderRadius: radius.full,
    borderWidth: 2,
    bottom: 0,
    height: 12,
    position: 'absolute',
    right: 0,
    width: 12,
  }),
  conversationCopy: new Style<Layout>({ flexGrow: 1, minWidth: 0 }),
  conversationHeading: new Style<Layout>({ alignItems: 'center', flexDirection: 'row' }),
  conversationName: new Style<Label>({
    color: colors.textPrimary,
    flexGrow: 1,
    font: montserrat.semiBold(fontSize.product),
    lineHeight: lineHeight.product / fontSize.product,
    minWidth: 0,
  }),
  timeLabel: new Style<Label>({
    color: colors.textTertiary,
    font: montserrat.regular(fontSize.tiny),
    marginLeft: spacing.sm,
  }),
  conversationPreview: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', marginTop: spacing.xs }),
  preview: new Style<Label>({
    color: colors.textSecondary,
    flexGrow: 1,
    font: montserrat.regular(fontSize.metadata),
    lineHeight: lineHeight.label / fontSize.metadata,
    minWidth: 0,
  }),
  previewUnread: new Style<Label>({
    color: colors.textPrimary,
    flexGrow: 1,
    font: montserrat.semiBold(fontSize.metadata),
    lineHeight: lineHeight.label / fontSize.metadata,
    minWidth: 0,
  }),
  unreadBadge: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundBrand,
    borderRadius: radius.full,
    height: 20,
    justifyContent: 'center',
    marginLeft: spacing.sm,
    minWidth: 20,
    paddingLeft: spacing.xs,
    paddingRight: spacing.xs,
  }),
  unreadCount: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.tiny), textAlign: 'center' }),
  emptyState: new Style<Layout>({ alignItems: 'center', flexGrow: 1, justifyContent: 'center', padding: spacing.xxxl }),
  emptyTitle: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.semiBold(fontSize.large),
    marginTop: spacing.lg,
    textAlign: 'center',
  }),
  emptyMessage: new Style<Label>({
    color: colors.textSecondary,
    font: montserrat.regular(fontSize.body),
    marginTop: spacing.sm,
    textAlign: 'center',
  }),
};
