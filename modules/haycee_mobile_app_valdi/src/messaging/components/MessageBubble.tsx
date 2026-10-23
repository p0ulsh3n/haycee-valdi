import { AnimationCurve } from 'valdi_core/src/AnimationOptions';
import { StatefulComponent } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { ImageView, Label, Layout, SpinnerView, View } from 'valdi_tsx/src/NativeTemplateElements';
import { colors, palette } from '../../design-system/tokens/colors';
import { radius } from '../../design-system/tokens/radius';
import { spacing } from '../../design-system/tokens/spacing';
import { fontSize, metropolis } from '../../design-system/tokens/typography';
import { ConversationMessage } from '../MessagingTypes';
import { playVoice, stopVoice } from '../MediaBridgeNative';
import navigationIcons from '../../../res/navigation-icons';

interface MessageBubbleState {
  isVoiceLoading: boolean;
  isVoicePlaying: boolean;
}

interface MessageBubbleViewModel {
  message: ConversationMessage;
  isMine: boolean;
  senderAvatarUrl?: string;
  senderInitials: string;
}

/** Lightweight message row with text, image/video previews, and voice playback. */
export class MessageBubble extends StatefulComponent<MessageBubbleViewModel, MessageBubbleState> {
  state: MessageBubbleState = { isVoiceLoading: false, isVoicePlaying: false };

  private static activeVoiceBubble?: MessageBubble;
  private playbackRequest = 0;
  private playbackTimer?: number;

  onDestroy(): void {
    if (MessageBubble.activeVoiceBubble === this) {
      this.stopVoicePlayback(true);
    }
    if (this.playbackTimer !== undefined) clearTimeout(this.playbackTimer);
  }

  onRender(): void {
    const { message, isMine, senderAvatarUrl, senderInitials } = this.viewModel;
    const time = new Date(message.sentAt);
    const timeLabel = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;
    const waveformColor = isMine ? colors.textMessageSent : colors.textPrimary;

    <layout style={isMine ? styles.rowMine : styles.rowOther}>
      {!isMine ? (
        <view style={styles.avatar}>
          {senderAvatarUrl ? (
            <image src={senderAvatarUrl} style={styles.avatarImage} objectFit="cover" />
          ) : (
            <label value={senderInitials} style={styles.avatarInitials} numberOfLines={1} />
          )}
        </view>
      ) : null}
      <layout style={isMine ? styles.contentMine : styles.contentOther}>
        <view style={isMine ? styles.bubbleMine : styles.bubbleOther}>
          {(message.type === 'image' || message.type === 'video') && (message.content.thumbnailUri || message.content.mediaUri) ? (
            <view style={styles.mediaMessage}>
              <image src={message.content.thumbnailUri ?? message.content.mediaUri!} style={styles.messageImage} objectFit="cover" />
              {message.type === 'video' ? (
                <view style={styles.videoBadge}><label value="VIDÉO" style={styles.videoBadgeText} numberOfLines={1} /></view>
              ) : null}
            </view>
          ) : message.type === 'voice' && message.content.mediaUri ? (
            <view style={styles.voiceMessage} onTap={() => this.toggleVoicePlayback(message.content.mediaUri!, message.content.durationMillis ?? 0)} accessibilityCategory="button">
              <view style={styles.voiceControl}>
                {this.state.isVoiceLoading ? <spinner style={styles.voiceSpinner} color={isMine ? colors.textMessageSent : colors.textPrimary} width={38} height={38} /> : null}
                <image
                  src={navigationIcons.playBold}
                  style={styles.voiceIcon}
                  opacity={this.state.isVoicePlaying ? 0 : 1}
                  tint={isMine ? colors.textMessageSent : colors.textPrimary}
                  width={22}
                  height={22}
                  objectFit="contain"
                />
                <image
                  src={navigationIcons.pauseBold}
                  style={styles.voiceIcon}
                  opacity={this.state.isVoicePlaying ? 1 : 0}
                  tint={isMine ? colors.textMessageSent : colors.textPrimary}
                  width={22}
                  height={22}
                  objectFit="contain"
                />
              </view>
              <layout style={styles.voiceWaveform}>
                {waveformHeights(message.content.waveform ?? []).map((height, index) => (
                  <view
                    key={`${message.id}-wave-${index}`}
                    style={styles.voiceWaveBar.extend({ backgroundColor: waveformColor, height })}
                  />
                ))}
              </layout>
              <label value={this.formatDuration(message.content.durationMillis ?? 0)} style={isMine ? styles.messageTextMine : styles.messageTextOther} numberOfLines={1} />
            </view>
          ) : (
            <label value={message.content.text ?? ''} style={isMine ? styles.messageTextMine : styles.messageTextOther} numberOfLines={0} />
          )}
        </view>
        <layout style={styles.metadata}>
          <label value={timeLabel} style={styles.time} numberOfLines={1} />
          {isMine && message.status === 'read' ? <label value='Lu' style={styles.readStatus} numberOfLines={1} /> : null}
          {isMine && message.status === 'failed' ? (
            <label value='Échec d’envoi' style={styles.failedStatus} numberOfLines={1} />
          ) : null}
        </layout>
      </layout>
    </layout>;
  }

  private toggleVoicePlayback = async (fileUri: string, durationMillis: number): Promise<void> => {
    if (MessageBubble.activeVoiceBubble === this && (this.state.isVoicePlaying || this.state.isVoiceLoading)) {
      this.stopVoicePlayback(true);
      return;
    }

    MessageBubble.activeVoiceBubble?.stopVoicePlayback(true);
    MessageBubble.activeVoiceBubble = this;
    const request = ++this.playbackRequest;
    if (this.playbackTimer !== undefined) clearTimeout(this.playbackTimer);
    this.setState({ isVoiceLoading: true, isVoicePlaying: false });

    try {
      const started = await playVoice(fileUri);
      if (this.isDestroyed() || request !== this.playbackRequest || MessageBubble.activeVoiceBubble !== this) return;
      if (!started) {
        MessageBubble.activeVoiceBubble = undefined;
        this.setState({ isVoiceLoading: false, isVoicePlaying: false });
        return;
      }

      this.setStateAnimated(
        { isVoiceLoading: false, isVoicePlaying: true },
        { duration: 0.18, curve: AnimationCurve.EaseInOut, beginFromCurrentState: true },
      );
      this.playbackTimer = this.setTimeoutDisposable(() => {
        if (this.isDestroyed() || request !== this.playbackRequest) return;
        if (MessageBubble.activeVoiceBubble === this) MessageBubble.activeVoiceBubble = undefined;
        this.setStateAnimated(
          { isVoiceLoading: false, isVoicePlaying: false },
          { duration: 0.16, curve: AnimationCurve.EaseInOut, beginFromCurrentState: true },
        );
      }, Math.max(0, durationMillis));
    } catch (error) {
      if (!this.isDestroyed() && request === this.playbackRequest) {
        if (MessageBubble.activeVoiceBubble === this) MessageBubble.activeVoiceBubble = undefined;
        this.setState({ isVoiceLoading: false, isVoicePlaying: false });
      }
      console.warn('Unable to prepare voice message for playback.', error);
    }
  };

  private stopVoicePlayback = (stopNativePlayback: boolean): void => {
    ++this.playbackRequest;
    if (this.playbackTimer !== undefined) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = undefined;
    }
    if (MessageBubble.activeVoiceBubble === this) MessageBubble.activeVoiceBubble = undefined;
    if (stopNativePlayback) stopVoice();
    if (!this.isDestroyed()) {
      this.setStateAnimated(
        { isVoiceLoading: false, isVoicePlaying: false },
        { duration: 0.16, curve: AnimationCurve.EaseInOut, beginFromCurrentState: true },
      );
    }
  };

  private formatDuration(milliseconds: number): string {
    const seconds = Math.max(0, Math.floor(milliseconds / 1000));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  }
}

const styles = {
  rowMine: new Style<Layout>({ alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }),
  rowOther: new Style<Layout>({ alignItems: 'flex-end', flexDirection: 'row', marginBottom: spacing.md }),
  contentMine: new Style<Layout>({ alignItems: 'flex-end', maxWidth: '82%' }),
  contentOther: new Style<Layout>({ alignItems: 'flex-start', maxWidth: '82%' }),
  avatar: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.full,
    flexShrink: 0,
    height: 30,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    marginRight: spacing.xs,
    width: 30,
  }),
  avatarImage: new Style<ImageView>({ borderRadius: radius.full, height: 30, width: 30 }),
  avatarInitials: new Style<Label>({ color: colors.textSecondary, font: metropolis.medium(fontSize.tiny) }),
  bubbleMine: new Style<View>({
    background: `linear-gradient(${palette.messageBlueLight}, ${colors.backgroundMessageSent})`,
    borderRadius: radius.lg,
    maxWidth: '100%',
    paddingBottom: spacing.md,
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    paddingTop: spacing.md,
  }),
  bubbleOther: new Style<View>({
    background: 'linear-gradient(#F7F7F7, #EAEAEA)',
    borderRadius: radius.lg,
    maxWidth: '100%',
    paddingBottom: spacing.md,
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    paddingTop: spacing.md,
  }),
  messageImage: new Style<ImageView>({ borderRadius: radius.md, height: 220, width: 220 }),
  mediaMessage: new Style<View>({ position: 'relative' }),
  videoBadge: new Style<View>({ backgroundColor: colors.backgroundDark, borderRadius: radius.xs, bottom: spacing.sm, left: spacing.sm, paddingBottom: spacing.xs, paddingLeft: spacing.sm, paddingRight: spacing.sm, paddingTop: spacing.xs, position: 'absolute' }),
  videoBadgeText: new Style<Label>({ color: colors.textInverted, font: metropolis.semiBold(fontSize.tiny) }),
  voiceMessage: new Style<View>({ alignItems: 'center', flexDirection: 'row', minWidth: 210 }),
  voiceControl: new Style<View>({ alignItems: 'center', height: 38, justifyContent: 'center', marginRight: spacing.md, position: 'relative', width: 38 }),
  voiceSpinner: new Style<SpinnerView>({ height: 38, position: 'absolute', width: 38 }),
  voiceIcon: new Style<ImageView>({ position: 'absolute' }),
  voiceWaveform: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', flexGrow: 1, flexShrink: 1, height: 28, justifyContent: 'space-between', marginRight: spacing.md }),
  voiceWaveBar: new Style<View>({ borderRadius: radius.full, width: 2 }),
  messageTextMine: new Style<Label>({ color: colors.textMessageSent, font: metropolis.regular(fontSize.message) }),
  messageTextOther: new Style<Label>({ color: colors.textPrimary, font: metropolis.regular(fontSize.message) }),
  metadata: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', marginTop: spacing.xs }),
  time: new Style<Label>({ color: colors.textSecondary, font: metropolis.medium(fontSize.tiny) }),
  readStatus: new Style<Label>({
    color: colors.backgroundMessageSent,
    font: metropolis.semiBold(fontSize.tiny),
    marginLeft: spacing.xs,
  }),
  failedStatus: new Style<Label>({
    color: colors.textDanger,
    font: metropolis.semiBold(fontSize.tiny),
    marginLeft: spacing.xs,
  }),
};

function waveformHeights(amplitudes: number[]): number[] {
  return amplitudes.map((amplitude) => {
    const normalizedAmplitude = Math.max(0, Math.min(1, Number.isFinite(amplitude) ? amplitude : 0));
    return Math.max(4, Math.round(Math.sqrt(normalizedAmplitude) * 27));
  });
}
