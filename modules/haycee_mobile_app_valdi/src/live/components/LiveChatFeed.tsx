import { ElementRef } from 'valdi_core/src/ElementRef';
import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { ElementFrame } from 'valdi_tsx/src/Geometry';
import { ScrollEvent } from 'valdi_tsx/src/GestureEvents';
import { ImageView, Label, Layout, ScrollView, ScrollViewInteractive, View } from 'valdi_tsx/src/NativeTemplateElements';
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
}

const LIVE_CHAT_MASK_IMAGE =
  'linear-gradient(#00000000 0%, #000000 14%, #000000 86%, #00000000 100%)';
const LIVE_CHAT_MASK_IMAGE_AT_TOP =
  'linear-gradient(#000000 0%, #000000 86%, #00000000 100%)';
const LIVE_CHAT_MASK_IMAGE_AT_BOTTOM =
  'linear-gradient(#00000000 0%, #000000 14%, #000000 100%)';
const LIVE_CHAT_MASK_IMAGE_NO_SCROLL = 'linear-gradient(#000000 0%, #000000 100%)';
const SCROLL_EDGE_THRESHOLD = 1;

class LiveChatMessageRow extends Component<{ message: LiveViewerMessage }> {
  onRender(): void {
    const { message } = this.viewModel;
    const username = normalizeUsername(message.username);
    <view style={styles.messageRow}>
      <view style={styles.avatarSlot}>
        <view style={styles.avatarFallback}>
          <label value={username.slice(0, 1).toUpperCase()} style={styles.avatarInitial} numberOfLines={1} />
        </view>
        {message.avatarUrl ? <image src={message.avatarUrl} style={styles.avatar} objectFit="cover" /> : null}
      </view>
      <view style={styles.messageCopy}>
        <label
          value={username}
          style={styles.username}
          numberOfLines={1}
        />
        <label value={message.text} style={styles.messageText} numberOfLines={2} />
      </view>
    </view>;
  }
}

/** Bounded, independently rendered comment viewport above the live composer. */
export class LiveChatFeed extends Component<LiveChatFeedViewModel> {
  private readonly scrollRef = new ElementRef<ScrollViewInteractive>();
  private readonly maskRef = new ElementRef<View>();
  private scrollOffsetY = 0;
  private messageContentHeight = 0;
  private scrollViewportHeight = 0;
  private appliedMaskImage = LIVE_CHAT_MASK_IMAGE_NO_SCROLL;
  private lastMessageId?: string;
  private shouldScrollToBottom = true;
  private animateNextScroll = false;

  private handleContentSizeChange = (size: { width: number; height: number }): void => {
    this.messageContentHeight = size.height;
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
    this.shouldScrollToBottom = false;
    this.animateNextScroll = false;
  };

  private handleScroll = (event: ScrollEvent): void => {
    const maxOffset = Math.max(0, this.messageContentHeight - this.scrollViewportHeight);
    this.scrollOffsetY = Math.min(maxOffset, Math.max(0, event.y));
    this.updateMaskImage();
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

  private renderMessagesScroll(messages: LiveViewerMessage[]): void {
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
        {messages.map(message => <LiveChatMessageRow key={message.id} message={message} />)}
      </layout>
    </scroll>;
  }

  onRender(): void {
    const visibleMessages = this.viewModel.messages.slice(-30);
    const latestMessageId = visibleMessages[visibleMessages.length - 1]?.id;
    if (latestMessageId !== this.lastMessageId) {
      this.animateNextScroll = this.lastMessageId !== undefined;
      this.lastMessageId = latestMessageId;
      this.shouldScrollToBottom = true;
    }

    <OpacityMask
      style={styles.maskViewport}
      maskRef={this.maskRef}
      maskImage={this.getMaskImage()}
      renderContent={() => this.renderMessagesScroll(visibleMessages)}
    />;
  }
}

const styles = {
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
    borderColor: 'rgba(255, 255, 255, 0.82)',
    borderRadius: radius.full,
    borderWidth: 1,
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
    borderColor: 'rgba(255, 255, 255, 0.82)',
    borderRadius: radius.full,
    borderWidth: 1,
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
  username: new Style<Label>({ color: colors.textInverted, font: montserrat.semiBold(fontSize.body) }),
  messageText: new Style<Label>({ color: colors.textInverted, font: montserrat.regular(fontSize.metadata), marginTop: 1 }),
};
