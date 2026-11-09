import { ElementRef } from 'valdi_core/src/ElementRef';
import { AnimationCurve } from 'valdi_core/src/AnimationOptions';
import { Component, StatefulComponent } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { ElementFrame } from 'valdi_tsx/src/Geometry';
import { ScrollEvent } from 'valdi_tsx/src/GestureEvents';
import { ImageView, Label, Layout, ScrollView, ScrollViewInteractive, View } from 'valdi_tsx/src/NativeTemplateElements';
import { LiveChatRoleBadge } from '../../design-system/components/LiveChatRoleBadge';
import { NewMessagesPill } from '../../design-system/components/NewMessagesPill';
import navigationIcons from '../../../res/navigation-icons';
import { noBounceScrollAttributes } from '../../design-system/tokens/scrollBehavior';
import { normalizeUsername } from '../../design-system/utils/identity';
import { OpacityMask } from '../../design-system/components/OpacityMask';
import { colors } from '../../design-system/tokens/colors';
import { radius } from '../../design-system/tokens/radius';
import { layout, spacing } from '../../design-system/tokens/spacing';
import { fontSize, montserrat } from '../../design-system/tokens/typography';
import type { LiveViewerMessage } from '../data/LiveViewerData';

export interface LiveChatFeedViewModel {
  messages: LiveViewerMessage[];
  avatarBorderColor?: string;
}

interface LiveChatFeedState {
  unreadMessageCount: number;
}

const LIVE_CHAT_MASK_IMAGE =
  'linear-gradient(#00000000 0%, #000000 14%, #000000 86%, #00000000 100%)';
const LIVE_CHAT_MASK_IMAGE_AT_TOP =
  'linear-gradient(#000000 0%, #000000 86%, #00000000 100%)';
const LIVE_CHAT_MASK_IMAGE_AT_BOTTOM =
  'linear-gradient(#00000000 0%, #000000 14%, #000000 100%)';
const LIVE_CHAT_MASK_IMAGE_NO_SCROLL = 'linear-gradient(#000000 0%, #000000 100%)';
const SCROLL_EDGE_THRESHOLD = 1;

class LiveChatMessageRow extends Component<{
  message: LiveViewerMessage;
  avatarBorderColor?: string;
  animateEntry?: boolean;
}> {
  private readonly rowRef = new ElementRef<View>();
  private hasAnimatedEntry = false;

  private handleLayout = (_frame: ElementFrame): void => {
    if (!this.viewModel.animateEntry || this.hasAnimatedEntry) return;
    const row = this.rowRef.single();
    if (!row) return;
    this.hasAnimatedEntry = true;
    this.animate(
      { duration: CHAT_MESSAGE_ENTRY_DURATION_SECONDS, curve: AnimationCurve.EaseOut, beginFromCurrentState: true },
      () => {
        row.setAttribute('opacity', 1);
        row.setAttribute('translationY', 0);
      },
    );
  };

  onRender(): void {
    const { message, avatarBorderColor, animateEntry } = this.viewModel;
    const username = normalizeUsername(message.username);
    <view
      ref={this.rowRef}
      style={styles.messageRow}
      opacity={animateEntry ? 0 : 1}
      translationY={animateEntry ? CHAT_MESSAGE_ENTRY_OFFSET : 0}
      onLayout={this.handleLayout}
    >
      <view style={styles.avatarSlot}>
        <view
          style={styles.avatarFallback.extend({
            borderColor: avatarBorderColor ?? 'transparent',
            borderWidth: avatarBorderColor ? 1 : 0,
          })}
        >
          <label value={username.slice(0, 1).toUpperCase()} style={styles.avatarInitial} numberOfLines={1} />
        </view>
        {message.avatarUrl ? (
          <image
            src={message.avatarUrl}
            style={styles.avatar.extend({
              borderColor: avatarBorderColor ?? 'transparent',
              borderWidth: avatarBorderColor ? 1 : 0,
            })}
            objectFit="cover"
          />
        ) : null}
      </view>
      <view style={styles.messageCopy}>
        <layout style={styles.usernameRow}>
          <label value={username} style={styles.username} numberOfLines={1} textOverflow="ellipsis" />
          {message.role ? <LiveChatRoleBadge role={message.role} /> : null}
        </layout>
        <label value={message.text} style={styles.messageText} numberOfLines={2} />
      </view>
    </view>;
  }
}

/** Bounded, independently rendered comment viewport above the live composer. */
export class LiveChatFeed extends StatefulComponent<LiveChatFeedViewModel, LiveChatFeedState> {
  state: LiveChatFeedState = { unreadMessageCount: 0 };
  private readonly scrollRef = new ElementRef<ScrollViewInteractive>();
  private readonly maskRef = new ElementRef<View>();
  private scrollOffsetY = 0;
  private messageContentHeight = 0;
  private scrollViewportHeight = 0;
  private appliedMaskImage = LIVE_CHAT_MASK_IMAGE_NO_SCROLL;
  private lastMessageId?: string;
  private enteringMessageId?: string;
  private shouldScrollToBottom = true;
  private animateNextScroll = false;
  private followingLatest = true;
  private jumpToBottomPending = false;

  onCreate(): void {
    const messages = this.viewModel.messages;
    this.lastMessageId = messages[messages.length - 1]?.id;
  }

  onViewModelUpdate(_previous?: Readonly<LiveChatFeedViewModel>): void {
    const allMessages = this.viewModel.messages;
    const latestMessageId = allMessages[allMessages.length - 1]?.id;
    if (!latestMessageId || latestMessageId === this.lastMessageId) return;

    const isInitialMessage = this.lastMessageId === undefined;
    const previousIndex = this.lastMessageId === undefined
      ? -1
      : allMessages.findIndex(message => message.id === this.lastMessageId);
    const addedCount = previousIndex >= 0 ? allMessages.length - previousIndex - 1 : 1;
    const shouldFollow = isInitialMessage || this.followingLatest || this.isNearBottom();

    this.animateNextScroll = !isInitialMessage && shouldFollow;
    this.enteringMessageId = !isInitialMessage ? latestMessageId : undefined;
    this.lastMessageId = latestMessageId;
    this.followingLatest = shouldFollow;
    if (shouldFollow) {
      this.shouldScrollToBottom = true;
      if (this.state.unreadMessageCount > 0) this.setState({ unreadMessageCount: 0 });
    } else {
      // Appending rows below the viewport leaves the reader's native scroll offset untouched.
      this.shouldScrollToBottom = false;
      this.animateNextScroll = false;
      if (addedCount > 0) {
        this.setState({ unreadMessageCount: this.state.unreadMessageCount + addedCount });
      }
    }
  }

  private handleContentSizeChange = (size: { width: number; height: number }): void => {
    this.messageContentHeight = size.height;
    const maxOffset = Math.max(0, this.messageContentHeight - this.scrollViewportHeight);
    this.scrollOffsetY = Math.min(maxOffset, this.scrollOffsetY);
    this.scrollToBottom();
    this.updateMaskImage();
  };

  private handleScrollLayout = (frame: ElementFrame): void => {
    this.scrollViewportHeight = frame.height;
    this.scrollToBottom();
    this.updateMaskImage();
  };

  private scrollToBottom = (): void => {
    if (!this.shouldScrollToBottom || this.messageContentHeight <= 0 || this.scrollViewportHeight <= 0) return;

    const scroll = this.scrollRef.single();
    if (!scroll) return;

    const bottomOffset = Math.max(0, this.messageContentHeight - this.scrollViewportHeight);
    scroll.setAttribute('contentOffsetAnimated', this.animateNextScroll);
    scroll.setAttribute('contentOffsetY', bottomOffset);
    this.scrollOffsetY = bottomOffset;
    this.followingLatest = true;
    this.shouldScrollToBottom = false;
    this.animateNextScroll = false;
  };

  private isNearBottom(): boolean {
    if (this.messageContentHeight <= 0 || this.scrollViewportHeight <= 0) return true;
    const maxOffset = Math.max(0, this.messageContentHeight - this.scrollViewportHeight);
    return maxOffset - this.scrollOffsetY <= layout.live.viewer.newMessagesBottomThreshold;
  }

  private handleScroll = (event: ScrollEvent): void => {
    const maxOffset = Math.max(0, this.messageContentHeight - this.scrollViewportHeight);
    this.scrollOffsetY = Math.min(maxOffset, Math.max(0, event.y));
    this.followingLatest = this.isNearBottom();
    if (this.followingLatest && this.state.unreadMessageCount > 0) {
      this.setState({ unreadMessageCount: 0 });
    }
    this.updateMaskImage();
  };

  private handleNewMessagesTap = (): void => {
    if (this.jumpToBottomPending || this.state.unreadMessageCount <= 0) return;
    this.jumpToBottomPending = true;
    this.followingLatest = true;
    this.shouldScrollToBottom = true;
    this.animateNextScroll = true;
    this.setState({ unreadMessageCount: 0 });
    this.scrollToBottom();
    this.jumpToBottomPending = false;
  };

  private getMaskImage(): string {
    if (this.messageContentHeight <= 0 || this.scrollViewportHeight <= 0) {
      return LIVE_CHAT_MASK_IMAGE_NO_SCROLL;
    }

    const maxOffset = Math.max(0, this.messageContentHeight - this.scrollViewportHeight);
    if (maxOffset <= SCROLL_EDGE_THRESHOLD) return LIVE_CHAT_MASK_IMAGE_NO_SCROLL;
    if (this.scrollOffsetY <= SCROLL_EDGE_THRESHOLD) return LIVE_CHAT_MASK_IMAGE_AT_TOP;
    if (this.scrollOffsetY >= maxOffset - SCROLL_EDGE_THRESHOLD) return LIVE_CHAT_MASK_IMAGE_AT_BOTTOM;
    return LIVE_CHAT_MASK_IMAGE;
  }

  private updateMaskImage(): void {
    const maskImage = this.getMaskImage();
    if (maskImage === this.appliedMaskImage) return;
    this.appliedMaskImage = maskImage;
    this.maskRef.setAttribute('maskImage', maskImage);
  }

  private renderMessagesScroll(messages: LiveViewerMessage[], enteringMessageId?: string): void {
    <scroll
      ref={this.scrollRef}
      {...noBounceScrollAttributes}
      style={styles.scroll}
      showsVerticalScrollIndicator={false}
      bounces={false}
      bouncesFromDragAtStart={false}
      bouncesFromDragAtEnd={false}
      bouncesVerticalWithSmallContent={false}
      bouncesHorizontalWithSmallContent={false}
      onLayout={this.handleScrollLayout}
      onScroll={this.handleScroll}
      onContentSizeChange={this.handleContentSizeChange}
    >
      <layout style={styles.content}>
        {messages.map(message => (
          <LiveChatMessageRow
            key={message.id}
            message={message}
            avatarBorderColor={this.viewModel.avatarBorderColor}
            animateEntry={message.id === enteringMessageId}
          />
        ))}
      </layout>
    </scroll>;
  }

  onRender(): void {
    const allMessages = this.viewModel.messages;

    <view style={styles.root}>
      <OpacityMask
        style={styles.maskViewport}
        maskRef={this.maskRef}
        maskImage={this.getMaskImage()}
        renderContent={() => this.renderMessagesScroll(allMessages, this.enteringMessageId)}
      />
      <NewMessagesPill
        count={this.state.unreadMessageCount}
        visible={this.state.unreadMessageCount > 0}
        onTap={this.handleNewMessagesTap}
        icon={navigationIcons.arrowDown01Round}
      />
    </view>;
  }
}

const CHAT_MESSAGE_ENTRY_DURATION_SECONDS = 0.22;
const CHAT_MESSAGE_ENTRY_OFFSET = 4;

const styles = {
  root: new Style<View>({
    height: layout.live.viewer.chatHeight,
    position: 'relative',
    width: '100%',
  }),
  maskViewport: new Style<View>({
    flexGrow: 0,
    flexShrink: 1,
    height: layout.live.viewer.chatHeight,
  }),
  scroll: new Style<ScrollView>({
    flexGrow: 0,
    flexShrink: 1,
    height: layout.live.viewer.chatHeight,
  }),
  content: new Style<Layout>({
    flexGrow: 1,
    flexDirection: 'column',
    justifyContent: 'flex-end',
    paddingBottom: spacing.xs,
    paddingRight: spacing.lg,
    paddingTop: spacing.xs,
  }),
  messageRow: new Style<View>({
    alignSelf: 'flex-start',
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: spacing.sm,
    maxWidth: '100%',
  }),
  avatar: new Style<ImageView>({
    borderRadius: radius.full,
    height: layout.live.viewer.sellerAvatarSize,
    left: 0,
    position: 'absolute',
    top: 0,
    width: layout.live.viewer.sellerAvatarSize,
  }),
  avatarSlot: new Style<View>({
    flexShrink: 0,
    height: layout.live.viewer.sellerAvatarSize,
    marginLeft: spacing.xs,
    marginRight: spacing.sm,
    position: 'relative',
    width: layout.live.viewer.sellerAvatarSize,
  }),
  avatarFallback: new Style<View>({
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: radius.full,
    height: layout.live.viewer.sellerAvatarSize,
    justifyContent: 'center',
    width: layout.live.viewer.sellerAvatarSize,
  }),
  avatarInitial: new Style<Label>({
    color: colors.textInverted,
    font: montserrat.semiBold(fontSize.body),
  }),
  messageCopy: new Style<View>({
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 1,
  }),
  usernameRow: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', flexGrow: 1, flexShrink: 1, minWidth: 0 }),
  username: new Style<Label>({ color: colors.liveChatUsername, flexShrink: 1, font: montserrat.semiBold(fontSize.body) }),
  messageText: new Style<Label>({ color: colors.textInverted, font: montserrat.extraBold(fontSize.body), marginTop: 1 }),
};
