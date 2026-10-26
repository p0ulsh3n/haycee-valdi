import { ElementRef } from 'valdi_core/src/ElementRef';
import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { ElementFrame } from 'valdi_tsx/src/Geometry';
import { ScrollEvent } from 'valdi_tsx/src/GestureEvents';
import { ImageView, Label, Layout, ScrollView, ScrollViewInteractive, View } from 'valdi_tsx/src/NativeTemplateElements';
import { noBounceScrollAttributes } from '../../design-system/tokens/scrollBehavior';
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
const TOP_EDGE_THRESHOLD = 1;

class LiveChatMessageRow extends Component<{ message: LiveViewerMessage }> {
  onRender(): void {
    const { message } = this.viewModel;
    <view style={styles.messageRow}>
      {message.avatarUrl ? (
        <image src={message.avatarUrl} style={styles.avatar} objectFit="cover" />
      ) : (
        <view style={styles.avatarFallback}>
          <label value={message.username.slice(0, 1).toUpperCase()} style={styles.avatarInitial} numberOfLines={1} />
        </view>
      )}
      <view style={styles.messageCopy}>
        <label
          value={message.username}
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
  private isAtTop = true;
  private messageContentHeight = 0;
  private scrollViewportHeight = 0;
  private lastMessageId?: string;
  private shouldScrollToBottom = true;
  private animateNextScroll = false;

  private handleContentSizeChange = (size: { width: number; height: number }): void => {
    this.messageContentHeight = size.height;
    this.scrollToBottom();
  };

  private handleScrollLayout = (frame: ElementFrame): void => {
    this.scrollViewportHeight = frame.height;
    this.scrollToBottom();
  };

  private scrollToBottom = (): void => {
    if (!this.shouldScrollToBottom || this.messageContentHeight <= 0 || this.scrollViewportHeight <= 0) return;

    const scroll = this.scrollRef.single();
    if (!scroll) return;

    scroll.setAttribute('contentOffsetAnimated', this.animateNextScroll);
    scroll.setAttribute('contentOffsetY', Math.max(0, this.messageContentHeight - this.scrollViewportHeight));
    this.shouldScrollToBottom = false;
    this.animateNextScroll = false;
  };

  private handleScroll = (event: ScrollEvent): void => {
    const isAtTop = event.y <= TOP_EDGE_THRESHOLD;
    if (isAtTop === this.isAtTop) return;

    this.isAtTop = isAtTop;
    this.maskRef.setAttribute(
      'maskImage',
      isAtTop ? LIVE_CHAT_MASK_IMAGE_AT_TOP : LIVE_CHAT_MASK_IMAGE,
    );
  };

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
      maskImage={this.isAtTop ? LIVE_CHAT_MASK_IMAGE_AT_TOP : LIVE_CHAT_MASK_IMAGE}
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
    flexShrink: 0,
    height: 38,
    marginLeft: spacing.xs,
    marginRight: spacing.sm,
    width: 38,
  }),
  avatarFallback: new Style<View>({
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderColor: 'rgba(255, 255, 255, 0.82)',
    borderRadius: radius.full,
    borderWidth: 1,
    flexShrink: 0,
    height: 38,
    justifyContent: 'center',
    marginLeft: spacing.xs,
    marginRight: spacing.sm,
    width: 38,
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
