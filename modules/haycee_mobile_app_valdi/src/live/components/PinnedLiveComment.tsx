import { AnimationCurve } from 'valdi_core/src/AnimationOptions';
import { StatefulComponent } from 'valdi_core/src/Component';
import { ElementRef } from 'valdi_core/src/ElementRef';
import { Style } from 'valdi_core/src/Style';
import { ElementFrame } from 'valdi_tsx/src/Geometry';
import { ImageView, Label, Layout, View } from 'valdi_tsx/src/NativeTemplateElements';
import { LiveChatRoleBadge } from '../../design-system/components/LiveChatRoleBadge';
import { colors } from '../../design-system/tokens/colors';
import { radius } from '../../design-system/tokens/radius';
import { layout, spacing } from '../../design-system/tokens/spacing';
import { fontSize, montserrat } from '../../design-system/tokens/typography';
import { normalizeUsername } from '../../design-system/utils/identity';
import type { LiveViewerMessage } from '../data/LiveViewerData';

export interface PinnedLiveCommentViewModel {
  /** The host/moderator comment to keep visible above the scrolling chat. */
  message?: LiveViewerMessage;
  onDismissComplete?: () => void;
}

interface PinnedLiveCommentState {
  message?: LiveViewerMessage;
}

/** Fixed, animated Live chat callout. The regular chat feed remains below it. */
export class PinnedLiveComment extends StatefulComponent<PinnedLiveCommentViewModel, PinnedLiveCommentState> {
  state: PinnedLiveCommentState = {};
  private readonly cardRef = new ElementRef<View>();
  private pendingEntryMessageId?: string;
  private transitionId = 0;
  private isExiting = false;

  onCreate(): void {
    this.state = { message: this.viewModel.message };
    this.pendingEntryMessageId = this.viewModel.message?.id;
  }

  onViewModelUpdate(): void {
    const incoming = this.viewModel.message;
    const current = this.state.message;
    if (incoming?.id === current?.id) return;

    if (!current && incoming) {
      this.isExiting = false;
      this.pendingEntryMessageId = incoming.id;
      this.setState({ message: incoming });
      return;
    }

    if (current && !incoming) {
      this.animateExit(current.id);
      return;
    }

    if (incoming) {
      this.isExiting = false;
      this.pendingEntryMessageId = incoming.id;
      this.setState({ message: incoming });
    }
  }

  private handleLayout = (_frame: ElementFrame): void => {
    const message = this.state.message;
    if (!message || this.pendingEntryMessageId !== message.id) return;
    this.pendingEntryMessageId = undefined;
    const card = this.cardRef.single();
    if (!card) return;
    this.animate(
      { duration: PINNED_COMMENT_ENTER_SECONDS, curve: AnimationCurve.EaseOut, beginFromCurrentState: true },
      () => {
        card.setAttribute('opacity', 1);
        card.setAttribute('translationY', 0);
      },
    );
  };

  private animateExit(messageId: string): void {
    if (this.isExiting) return;
    this.isExiting = true;
    const transitionId = ++this.transitionId;
    const card = this.cardRef.single();
    if (!card) {
      this.setState({ message: undefined });
      this.viewModel.onDismissComplete?.();
      return;
    }
    this.animate(
      {
        duration: PINNED_COMMENT_EXIT_SECONDS,
        curve: AnimationCurve.EaseInOut,
        beginFromCurrentState: true,
        completion: wasCancelled => {
          if (wasCancelled || transitionId !== this.transitionId || this.isDestroyed()) return;
          if (this.state.message?.id === messageId) this.setState({ message: undefined });
          this.isExiting = false;
          this.viewModel.onDismissComplete?.();
        },
      },
      () => {
        card.setAttribute('opacity', 0);
        card.setAttribute('translationY', -PINNED_COMMENT_EXIT_DISTANCE);
      },
    );
  }

  onRender(): void {
    const message = this.state.message;
    if (!message) return;
    const username = normalizeUsername(message.username);
    const startsEntry = this.pendingEntryMessageId === message.id;

    <view
      ref={this.cardRef}
      style={styles.card}
      opacity={startsEntry ? 0 : 1}
      translationY={startsEntry ? -PINNED_COMMENT_ENTER_DISTANCE : 0}
      onLayout={this.handleLayout}
      touchEnabled={false}
      accessibilityLabel={`Commentaire épinglé par le vendeur. ${username} : ${message.text}`}
    >
      <view style={styles.avatarSlot}>
        <view style={styles.avatarFallback}>
          <label value={username.slice(0, 1).toUpperCase()} style={styles.avatarInitial} numberOfLines={1} />
        </view>
        {message.avatarUrl ? <image src={message.avatarUrl} style={styles.avatarImage} objectFit="cover" /> : null}
      </view>
      <view style={styles.copy}>
        <layout style={styles.usernameRow}>
          <label value={username} style={styles.username} numberOfLines={1} textOverflow="ellipsis" />
          {message.role ? <LiveChatRoleBadge role={message.role} /> : null}
        </layout>
        <label value={message.text} style={styles.message} numberOfLines={2} />
      </view>
    </view>;
  }
}

const PINNED_COMMENT_ENTER_SECONDS = 0.3;
const PINNED_COMMENT_EXIT_SECONDS = 0.3;
const PINNED_COMMENT_ENTER_DISTANCE = 9;
const PINNED_COMMENT_EXIT_DISTANCE = 6;

const styles = {
  card: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.liveOverlaySurface,
    borderRadius: radius.md,
    flexDirection: 'row',
    height: layout.live.viewer.pinnedCommentHeight,
    paddingBottom: spacing.xs,
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
    paddingTop: spacing.xs,
    width: '100%',
  }),
  avatarSlot: new Style<View>({
    flexShrink: 0,
    height: layout.live.viewer.sellerAvatarSize,
    marginRight: spacing.sm,
    position: 'relative',
    width: layout.live.viewer.sellerAvatarSize,
  }),
  avatarFallback: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.liveChatAvatarFallback,
    borderRadius: radius.full,
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  }),
  avatarImage: new Style<ImageView>({
    borderRadius: radius.full,
    height: '100%',
    left: 0,
    position: 'absolute',
    top: 0,
    width: '100%',
  }),
  avatarInitial: new Style<Label>({ color: colors.textInverted, font: montserrat.semiBold(fontSize.body) }),
  copy: new Style<View>({ flexDirection: 'column', flexGrow: 1, flexShrink: 1, minWidth: 0 }),
  usernameRow: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', flexShrink: 1, minWidth: 0 }),
  username: new Style<Label>({ color: colors.liveChatUsername, flexShrink: 1, font: montserrat.semiBold(fontSize.body) }),
  message: new Style<Label>({ color: colors.textInverted, font: montserrat.extraBold(fontSize.body), marginTop: 1 }),
};
