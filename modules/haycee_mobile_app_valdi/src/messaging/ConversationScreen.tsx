import { ElementRef } from 'valdi_core/src/ElementRef';
import { Device } from 'valdi_core/src/Device';
import { Style } from 'valdi_core/src/Style';
import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageStatefulComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { ElementFrame } from 'valdi_tsx/src/Geometry';
import { ScrollEvent } from 'valdi_tsx/src/GestureEvents';
import { Label, Layout, ScrollView, ScrollViewInteractive, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../res/navigation-icons';
import { TransientFeedback } from '../design-system/components/SnackBar';
import { getBottomSheetNavigationOptions } from '../design-system/components/BottomSheet';
import { colors } from '../design-system/tokens/colors';
import { noBounceScrollAttributes } from '../design-system/tokens/scrollBehavior';
import { radius } from '../design-system/tokens/radius';
import { spacing } from '../design-system/tokens/spacing';
import { fontSize, montserrat, typography } from '../design-system/tokens/typography';
import { MessageBubble } from './components/MessageBubble';
import { MessageComposer } from './components/MessageComposer';
import { MediaLibrarySheet } from './MediaLibrarySheet';
import { hideKeyboard } from './MediaBridgeNative';
import { MessagingApi } from './MessagingApi';
import { getMessagingApiConfiguration } from './MessagingApiConfiguration';
import { ConversationMessage, ConversationPreview } from './MessagingTypes';

interface ConversationScreenViewModel {
  conversation: ConversationPreview;
}

interface ConversationScreenState {
  messages: ConversationMessage[];
  isLoading: boolean;
}

const DEMO_USER_ID = 'haycee-demo-user';

/** Text conversation page pushed from the Messages bottom tab. */
@NavigationPage(module)
export class ConversationScreen extends NavigationPageStatefulComponent<
  ConversationScreenViewModel,
  ConversationScreenState
> {
  state: ConversationScreenState = { messages: [], isLoading: false };

  private readonly scrollRef = new ElementRef<ScrollViewInteractive>();
  private api?: MessagingApi;
  private localMessageSequence = 0;
  private messageContentHeight = 0;
  private scrollViewportHeight = 0;
  private shouldScrollToBottom = false;
  private viewportResizePending = false;
  private viewportResizeTimer?: number;

  onCreate(): void {
    this.state = { messages: this.demoMessages(), isLoading: false };
    const configuration = getMessagingApiConfiguration();
    if (configuration) {
      try {
        this.api = new MessagingApi(configuration);
        this.registerDisposable(() => this.api?.dispose());
        this.setState({ isLoading: true });
        void this.loadMessages();
      } catch (error) {
        console.warn('Messaging API is not configured; showing local conversation messages.', error);
      }
    }
  }

  private demoMessages = (): ConversationMessage[] => {
    const conversationId = this.viewModel.conversation.id;
    const now = Date.now();
    return [
      this.message(
        'demo-1',
        conversationId,
        'seller',
        'Bonjour, puis-je vous aider avec cet article ?',
        now - 1000 * 60 * 18,
        'read',
      ),
      this.message(
        'demo-2',
        conversationId,
        DEMO_USER_ID,
        'Bonjour, je voulais connaître les dimensions exactes.',
        now - 1000 * 60 * 14,
        'read',
      ),
      this.message(
        'demo-3',
        conversationId,
        'seller',
        'Bien sûr, je vous envoie les mesures dans un instant.',
        now - 1000 * 60 * 12,
        'read',
      ),
      this.message(
        'demo-4',
        conversationId,
        'seller',
        'La longueur est de 62 cm et la largeur de 48 cm.',
        now - 1000 * 60 * 10,
        'read',
      ),
      this.message(
        'demo-5',
        conversationId,
        DEMO_USER_ID,
        'Merci, c’est exactement ce que je cherchais.',
        now - 1000 * 60 * 7,
        'read',
      ),
    ];
  };

  private message = (
    id: string,
    conversationId: string,
    senderId: string,
    text: string,
    sentAt: number,
    status: ConversationMessage['status'],
  ): ConversationMessage => ({
    id,
    conversationId,
    senderId,
    type: 'text',
    content: { text },
    status,
    sentAt,
  });

  private loadMessages = async (): Promise<void> => {
    if (!this.api) return;
    try {
      const response = await this.api.fetchMessages(this.viewModel.conversation.id);
      if (this.isDestroyed()) return;
      const messages = response.messages
        .filter(message => message.type === 'text')
        .sort((first, second) => first.sentAt - second.sentAt)
        .slice(-80);
      this.setState({ messages, isLoading: false });
      this.shouldScrollToBottom = true;
      this.scrollToMeasuredBottom(false);
    } catch (error) {
      if (this.isDestroyed()) return;
      this.setState({ isLoading: false });
      console.warn('Unable to load messages; retaining local conversation preview.', error);
    }
  };

  private handleBack = (): void => {
    this.navigationController.pop();
  };

  private handleMore = (): void => {
    TransientFeedback.show({ message: 'Options de conversation' });
  };

  private handleComposerFocus = (): void => {
    // Start moving to the latest message as soon as the composer receives focus,
    // before Android's adjustResize begins shrinking the message viewport.
    this.shouldScrollToBottom = true;
    this.scrollToMeasuredBottom(true);
  };

  private handleSend = async (text: string): Promise<void> => {
    const senderId = getMessagingApiConfiguration()?.getCurrentUserId() ?? DEMO_USER_ID;
    const message = this.message(
      `local-${Date.now()}-${++this.localMessageSequence}`,
      this.viewModel.conversation.id,
      senderId,
      text,
      Date.now(),
      this.api ? 'pending' : 'sent',
    );
    this.setState({ messages: [...this.state.messages, message] });
    this.shouldScrollToBottom = true;

    if (!this.api) return;
    try {
      await this.api.sendMessage(message);
      if (this.isDestroyed()) return;
      this.updateMessageStatus(message.id, 'sent');
    } catch (error) {
      if (this.isDestroyed()) return;
      this.updateMessageStatus(message.id, 'failed');
      TransientFeedback.show({ message: 'Le message n’a pas pu être envoyé.' });
    }
  };

  private handleSendVoice = (clip: { fileUri: string; durationMillis: number; waveform: number[] }): void => {
    const message: ConversationMessage = {
      id: `local-voice-${Date.now()}-${++this.localMessageSequence}`,
      conversationId: this.viewModel.conversation.id,
      senderId: getMessagingApiConfiguration()?.getCurrentUserId() ?? DEMO_USER_ID,
      type: 'voice',
      content: { mediaUri: clip.fileUri, durationMillis: clip.durationMillis, waveform: clip.waveform },
      status: 'sent',
      sentAt: Date.now(),
    };
    this.setState({ messages: [...this.state.messages, message] });
    this.shouldScrollToBottom = true;
  };

  private handleOpenGallery = async (): Promise<void> => {
    await hideKeyboard();
    const sheetOptions = { transparentPageBackground: true };
    this.navigationController.present(MediaLibrarySheet, {
      onSelect: this.handleSendMedia,
      ...sheetOptions,
    }, {}, { animated: true, wrapInPlatformNavigationController: false, ...getBottomSheetNavigationOptions(sheetOptions) });
  };

  private handleSendMedia = (media: Array<{ mediaUri: string; thumbnailUri: string; kind: 'image' | 'video' }>): void => {
    const sentAt = Date.now();
    const senderId = getMessagingApiConfiguration()?.getCurrentUserId() ?? DEMO_USER_ID;
    const newMessages: ConversationMessage[] = media.map(item => ({
      id: `local-${item.kind}-${sentAt}-${++this.localMessageSequence}`,
      conversationId: this.viewModel.conversation.id,
      senderId,
      type: item.kind,
      content: { mediaUri: item.mediaUri, thumbnailUri: item.thumbnailUri },
      status: 'sent',
      sentAt: sentAt + this.localMessageSequence,
    }));
    this.setState({ messages: [...this.state.messages, ...newMessages] });
    this.shouldScrollToBottom = true;
  };

  private updateMessageStatus = (messageId: string, status: ConversationMessage['status']): void => {
    this.setState({
      messages: this.state.messages.map(message => (message.id === messageId ? { ...message, status } : message)),
    });
  };

  private handleScroll = (_event: ScrollEvent): void => {
    // The native scroll view owns scrolling; no state updates are done per frame.
  };

  private handleContentSizeChange = (size: { width: number; height: number }): void => {
    this.messageContentHeight = size.height;
    if (!this.viewportResizePending) {
      this.scrollToMeasuredBottom(true);
    }
  };

  private handleScrollLayout = (frame: ElementFrame): void => {
    const previousViewportHeight = this.scrollViewportHeight;
    this.scrollViewportHeight = frame.height;
    // Android adjustResize changes this viewport while the keyboard opens or
    // closes. Follow every layout frame without a separate scroll animation so
    // the latest message, composer, and keyboard stay synchronized in both directions.
    if (previousViewportHeight > 0 && frame.height !== previousViewportHeight) {
      this.shouldScrollToBottom = true;
      this.viewportResizePending = true;
      this.scrollToMeasuredBottom(false);
      if (this.viewportResizeTimer !== undefined) {
        clearTimeout(this.viewportResizeTimer);
      }
      this.viewportResizeTimer = this.setTimeoutDisposable(() => {
        this.viewportResizeTimer = undefined;
        this.viewportResizePending = false;
        this.shouldScrollToBottom = true;
        this.scrollToMeasuredBottom(false);
      }, 90);
      return;
    }
    if (!this.viewportResizePending) {
      this.scrollToMeasuredBottom(false);
    }
  };

  private scrollToMeasuredBottom = (animated: boolean): void => {
    if (!this.shouldScrollToBottom || this.messageContentHeight <= 0 || this.scrollViewportHeight <= 0) return;
    this.shouldScrollToBottom = false;
    const scroll = this.scrollRef.single();
    if (!scroll) {
      this.shouldScrollToBottom = true;
      return;
    }
    scroll.setAttribute('contentOffsetAnimated', animated);
    scroll.setAttribute('contentOffsetY', Math.max(0, this.messageContentHeight - this.scrollViewportHeight));
  };

  private isMine = (message: ConversationMessage): boolean => {
    const currentUserId = getMessagingApiConfiguration()?.getCurrentUserId() ?? DEMO_USER_ID;
    return message.senderId === currentUserId;
  };

  onRender(): void {
    const conversation = this.viewModel.conversation;
    const bottomInset = Math.max(0, Device.getDisplayBottomInset());

    <view style={styles.screen}>
      <view style={styles.header.extend({ paddingTop: Device.getDisplayTopInset() + spacing.sm })}>
        <view style={styles.headerButton} onTap={this.handleBack} accessibilityCategory='button'>
          <image
            src={navigationIcons.arrowLeft01Round}
            tint={colors.textPrimary}
            width={23}
            height={23}
            objectFit='contain'
          />
        </view>
        <view style={styles.personAvatar}>
          <label value={conversation.initials} style={styles.avatarInitials} numberOfLines={1} />
          {conversation.isOnline ? <view style={styles.onlineIndicator} /> : null}
        </view>
        <layout style={styles.personDetails}>
          <label value={conversation.name} style={styles.personName} numberOfLines={1} />
          {conversation.isOnline ? <label value='En ligne' style={styles.personStatus} numberOfLines={1} /> : null}
        </layout>
        <view style={styles.headerButton} onTap={this.handleMore} accessibilityCategory='button'>
          <image
            src={navigationIcons.moreHorizontalCircle01}
            tint={colors.textPrimary}
            width={22}
            height={22}
            objectFit='contain'
          />
        </view>
      </view>

      <scroll
        ref={this.scrollRef}
        {...noBounceScrollAttributes}
        style={styles.messagesScroll}
        onLayout={this.handleScrollLayout}
        onContentSizeChange={this.handleContentSizeChange}
        showsVerticalScrollIndicator={false}
        dismissKeyboardOnDrag={true}
        onScroll={this.handleScroll}
      >
        <layout style={styles.messagesContent}>
          <view style={styles.dateDivider}>
            <label value='Aujourd’hui' style={styles.dateLabel} numberOfLines={1} />
          </view>
          {this.state.messages.map(message => {
            const isMine = this.isMine(message);
            return (
              <MessageBubble
                key={message.id}
                message={message}
                isMine={isMine}
                senderAvatarUrl={isMine ? undefined : conversation.avatarUrl}
                senderInitials={conversation.initials}
              />
            );
          })}
          {this.state.isLoading ? (
            <label value='Chargement des messages…' style={styles.loadingLabel} numberOfLines={1} />
          ) : null}
        </layout>
      </scroll>

      <MessageComposer
        onSend={this.handleSend}
        onSendVoice={this.handleSendVoice}
        onOpenGallery={this.handleOpenGallery}
        onInputBegin={this.handleComposerFocus}
        bottomInset={bottomInset}
      />
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
    backgroundColor: colors.backgroundPrimary,
    flexDirection: 'row',
    paddingBottom: spacing.md,
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
  }),
  headerButton: new Style<View>({ alignItems: 'center', height: 40, justifyContent: 'center', width: 40 }),
  personAvatar: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.full,
    height: 42,
    justifyContent: 'center',
    marginLeft: spacing.xs,
    marginRight: spacing.sm,
    position: 'relative',
    width: 42,
  }),
  avatarInitials: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.metadata) }),
  onlineIndicator: new Style<View>({
    backgroundColor: colors.textSuccess,
    borderColor: colors.backgroundPrimary,
    borderRadius: radius.full,
    borderWidth: 2,
    bottom: 0,
    height: 10,
    position: 'absolute',
    right: 0,
    width: 10,
  }),
  personDetails: new Style<Layout>({ flexGrow: 1, minWidth: 0 }),
  personName: typography.productTitle,
  personStatus: new Style<Label>({
    color: colors.textSecondary,
    font: montserrat.regular(fontSize.tiny),
    marginTop: spacing.xs,
  }),
  messagesScroll: new Style<ScrollView>({ backgroundColor: colors.backgroundPrimary, flexGrow: 1, flexShrink: 1 }),
  messagesContent: new Style<Layout>({
    paddingBottom: spacing.xl,
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    paddingTop: spacing.md,
  }),
  dateDivider: new Style<View>({
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.full,
    marginBottom: spacing.xl,
    paddingBottom: spacing.xs,
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
    paddingTop: spacing.xs,
  }),
  dateLabel: new Style<Label>({ color: colors.textSecondary, font: montserrat.semiBold(fontSize.tiny) }),
  loadingLabel: new Style<Label>({
    alignSelf: 'center',
    color: colors.textTertiary,
    font: montserrat.regular(fontSize.metadata),
    marginTop: spacing.md,
  }),
};
