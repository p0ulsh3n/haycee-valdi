import { StatefulComponent } from 'valdi_core/src/Component';
import { AnimationCurve } from 'valdi_core/src/AnimationOptions';
import { Style } from 'valdi_core/src/Style';
import { TouchEvent, TouchEventState } from 'valdi_tsx/src/GestureEvents';
import { EditTextEvent, Label, Layout, TextView, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../../res/navigation-icons';
import { colors } from '../../design-system/tokens/colors';
import { radius } from '../../design-system/tokens/radius';
import { spacing } from '../../design-system/tokens/spacing';
import { fontSize, montserrat } from '../../design-system/tokens/typography';
import { cancelVoiceRecording, finishVoiceRecording, requestVoicePermission, startVoiceRecording } from '../MediaBridgeNative';

interface VoiceClip { fileUri: string; durationMillis: number; waveform: number[] }

interface MessageComposerViewModel {
  onSend: (text: string) => void;
  onOpenGallery: () => void;
  onSendVoice: (clip: VoiceClip) => void;
  onInputBegin?: () => void;
  bottomInset?: number;
}

interface MessageComposerState {
  text: string;
  recording: boolean;
  cancelRecording: boolean;
  recordingError: boolean;
  microphoneReady: boolean;
  recordingElapsedSeconds: number;
  recordingMicVisible: boolean;
  recordingHintArrowVisible: boolean;
  recordingLocked: boolean;
  lockProgress: number;
}

export class MessageComposer extends StatefulComponent<MessageComposerViewModel, MessageComposerState> {
  state: MessageComposerState = {
    text: '', recording: false, cancelRecording: false, recordingError: false,
    microphoneReady: false, recordingElapsedSeconds: 0, recordingMicVisible: true,
    recordingHintArrowVisible: false,
    recordingLocked: false, lockProgress: 0,
  };
  private recordingStarted = false;
  private recordingStartedAt = 0;
  private recordingTimer?: number;
  private releaseBeforePermission = false;
  private recordingTouchActive = false;
  private recordingTouchStartX = 0;
  private recordingTouchStartY = 0;

  onDestroy(): void {
    this.clearRecordingTimer();
    if (this.recordingStarted) cancelVoiceRecording();
  }

  private handleChange = (event: EditTextEvent): void => {
    const wasEmpty = this.state.text.trim().length === 0;
    const isEmpty = event.text.trim().length === 0;
    if (wasEmpty !== isEmpty) this.setStateAnimated({ text: event.text }, { duration: 0.16 });
    else this.setState({ text: event.text });
  };

  private handleEditBegin = (): void => this.viewModel.onInputBegin?.();

  private handleMicTouchStart = async (_event: TouchEvent): Promise<void> => {
    if (this.state.microphoneReady || this.state.recording) return;
    try {
      await requestVoicePermission();
      if (!this.isDestroyed()) this.setState({ microphoneReady: true, recordingError: false });
    } catch (error) {
      if (!this.isDestroyed()) this.setState({ recordingError: true });
      console.warn('Microphone permission was not granted.', error);
    }
  };

  private handleSend = (): void => {
    const text = this.state.text.trim();
    if (!text) return;
    this.setState({ text: '' });
    this.viewModel.onSend(text);
  };

  private handleStartHold = async (_event: TouchEvent): Promise<void> => {
    if (this.state.text.trim() || this.state.recording || !this.state.microphoneReady) return;
    this.releaseBeforePermission = false;
    this.recordingStarted = false;
    this.setStateAnimated(
      {
        recording: true,
        cancelRecording: false,
        recordingError: false,
        recordingElapsedSeconds: 0,
        recordingHintArrowVisible: false,
        recordingLocked: false,
        lockProgress: 0,
      },
      { duration: 0.24, curve: AnimationCurve.EaseInOut, beginFromCurrentState: true },
    );
    try {
      await startVoiceRecording();
      if (this.isDestroyed()) {
        cancelVoiceRecording();
        return;
      }
      if (this.releaseBeforePermission) {
        cancelVoiceRecording();
        this.recordingStarted = false;
        this.setStateAnimated({ recording: false }, { duration: 0.22, curve: AnimationCurve.EaseInOut, beginFromCurrentState: true });
        return;
      }
      this.recordingStarted = true;
      this.startRecordingTimer();
    } catch (error) {
      if (!this.isDestroyed()) {
        this.setStateAnimated({ recording: false, recordingError: true }, { duration: 0.22, curve: AnimationCurve.EaseInOut, beginFromCurrentState: true });
      }
      console.warn('Unable to start voice recording.', error);
    }
  };

  private handleRecordingTouch = (event: TouchEvent): void => {
    if (event.state === TouchEventState.Started) {
      this.recordingTouchActive = true;
      this.recordingTouchStartX = event.absoluteX;
      this.recordingTouchStartY = event.absoluteY;
      return;
    }
    if (!this.recordingTouchActive) return;
    if (event.state === TouchEventState.Changed && this.state.recording) {
      this.updateRecordingGesture(event.absoluteX - this.recordingTouchStartX, event.absoluteY - this.recordingTouchStartY);
      return;
    }
    if (event.state === TouchEventState.Ended) {
      if (this.state.recording) {
        this.updateRecordingGesture(event.absoluteX - this.recordingTouchStartX, event.absoluteY - this.recordingTouchStartY);
        void this.handleEndHold(event);
      }
      this.recordingTouchActive = false;
    }
  };

  private updateRecordingGesture = (deltaX: number, deltaY: number): void => {
    if (!this.state.recording || this.state.recordingLocked) return;
    const lockProgress = Math.max(0, Math.min(1, -deltaY / LOCK_GESTURE_DISTANCE));
    if (lockProgress >= 1) {
      this.setStateAnimated(
        { recordingLocked: true, lockProgress: 1, cancelRecording: false },
        { duration: 0.2, curve: AnimationCurve.EaseOut, beginFromCurrentState: true },
      );
      return;
    }
    const cancelRecording = deltaX < -76;
    if (cancelRecording !== this.state.cancelRecording || Math.abs(lockProgress - this.state.lockProgress) >= 0.08) {
      this.setStateAnimated({ cancelRecording, lockProgress }, { duration: 0.1, curve: AnimationCurve.EaseOut, beginFromCurrentState: true });
    }
  };

  private handleEndHold = async (_event: TouchEvent): Promise<void> => {
    if (!this.state.recording) return;
    if (this.state.recordingLocked) return;
    if (!this.recordingStarted) {
      this.releaseBeforePermission = true;
      return;
    }
    const shouldCancel = this.state.cancelRecording;
    if (shouldCancel) {
      this.cancelRecording();
      return;
    }
    await this.finishAndSendRecording();
  };

  private finishAndSendRecording = async (): Promise<void> => {
    if (!this.recordingStarted) return;
    this.recordingStarted = false;
    this.clearRecordingTimer();
    try {
      const clip = JSON.parse(await finishVoiceRecording()) as VoiceClip;
      if (this.isDestroyed()) return;
      this.setStateAnimated(
        { recording: false, cancelRecording: false, recordingElapsedSeconds: 0, recordingLocked: false, lockProgress: 0 },
        { duration: 0.22, curve: AnimationCurve.EaseInOut, beginFromCurrentState: true },
      );
      this.viewModel.onSendVoice(clip);
    } catch (error) {
      if (!this.isDestroyed()) {
        this.setStateAnimated(
          { recording: false, cancelRecording: false, recordingElapsedSeconds: 0, recordingLocked: false, lockProgress: 0, recordingError: true },
          { duration: 0.22, curve: AnimationCurve.EaseInOut, beginFromCurrentState: true },
        );
      }
      console.warn('Unable to finish voice recording.', error);
    }
  };

  private cancelRecording = (): void => {
    this.recordingStarted = false;
    this.clearRecordingTimer();
    cancelVoiceRecording();
    this.setStateAnimated(
      { recording: false, cancelRecording: false, recordingElapsedSeconds: 0, recordingLocked: false, lockProgress: 0 },
      { duration: 0.22, curve: AnimationCurve.EaseInOut, beginFromCurrentState: true },
    );
  };

  private handleCancelLockedRecording = (): void => {
    if (!this.state.recordingLocked) return;
    this.cancelRecording();
  };

  private handleSendLockedRecording = (): void => {
    if (!this.state.recordingLocked || !this.recordingStarted) return;
    void this.finishAndSendRecording();
  };

  private clearRecordingError = (): void => this.setState({ recordingError: false });

  private startRecordingTimer = (): void => {
    this.clearRecordingTimer();
    this.recordingStartedAt = Date.now();
    this.setState({ recordingElapsedSeconds: 0, recordingMicVisible: true });
    const tick = (): void => {
      if (this.isDestroyed() || !this.recordingStarted) return;
      const recordingElapsedSeconds = Math.floor((Date.now() - this.recordingStartedAt) / 1000);
      this.setStateAnimated(
        {
          recordingElapsedSeconds,
          recordingMicVisible: !this.state.recordingMicVisible,
          recordingHintArrowVisible: !this.state.recordingHintArrowVisible,
        },
        { duration: 0.24, curve: AnimationCurve.EaseInOut, beginFromCurrentState: true },
      );
      this.recordingTimer = this.setTimeoutDisposable(tick, 500);
    };
    this.recordingTimer = this.setTimeoutDisposable(tick, 500);
  };

  private clearRecordingTimer = (): void => {
    if (this.recordingTimer !== undefined) {
      clearTimeout(this.recordingTimer);
      this.recordingTimer = undefined;
    }
  };

  private formatRecordingTime = (seconds: number): string =>
    `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  onRender(): void {
    const hasText = this.state.text.trim().length > 0;
    <view style={styles.composer}>
      {this.state.recordingError ? (
        <view style={styles.errorBanner} onTap={this.clearRecordingError}>
          <label value="Micro indisponible ou permission refusée." style={styles.errorText} numberOfLines={1} />
        </view>
      ) : null}
      <view style={this.viewModel.bottomInset
        ? styles.composerRow.extend({ paddingBottom: this.viewModel.bottomInset + spacing.sm })
        : styles.composerRow}
      >
        <view
          style={styles.recordingBackdrop}
          opacity={this.state.recording ? 1 : 0}
          translationX={this.state.recording ? 0 : -24}
          onTapDisabled={true}
        />
        <view style={styles.composerControls}>
          <view
            style={styles.cameraButton}
            opacity={this.state.recording ? 0 : 1}
            translationX={this.state.recording ? -20 : 0}
            onTapDisabled={this.state.recording}
            accessibilityCategory="button"
          >
            <image src={navigationIcons.camera01} tint={colors.textInverted} width={22} height={22} objectFit="contain" />
          </view>
          <view style={this.state.recording ? styles.inputContainerRecording : styles.inputContainer}>
            <view
              style={styles.inputTextSlot}
              opacity={this.state.recording ? 0 : 1}
              translationX={this.state.recording ? -14 : 0}
              onTapDisabled={this.state.recording}
            >
              <textview
                style={styles.input}
                value={this.state.text}
                placeholder="Écrire un message"
                placeholderColor={colors.textTertiary}
                onChange={this.handleChange}
                onEditBegin={this.handleEditBegin}
                returnType="linereturn"
                textGravity="center"
                closesWhenReturnKeyPressed={false}
                autocorrection="default"
              />
            </view>
            <view style={styles.inputActions}>
              <view
                style={styles.inputIconButton}
                opacity={this.state.recording ? 0 : 1}
                translationX={this.state.recording ? 14 : 0}
                onTap={this.viewModel.onOpenGallery}
                onTapDisabled={this.state.recording}
                accessibilityCategory="button"
              >
                <image src={navigationIcons.album02} tint={colors.textSecondary} width={21} height={21} objectFit="contain" />
              </view>
              {!hasText ? (
                <view
                  style={this.state.recording ? styles.recordingMicButton : styles.inputIconButton}
                  opacity={this.state.recordingLocked ? 0 : 1}
                  onTouchStart={this.handleMicTouchStart}
                  onLongPress={this.handleStartHold}
                  onTouch={this.handleRecordingTouch}
                  onTapDisabled={this.state.recordingLocked}
                  longPressDuration={0.38}
                  touchAreaExtension={12}
                  accessibilityCategory="button"
                >
                  <image
                    src={navigationIcons.mic02}
                    tint={this.state.recording ? colors.textInverted : colors.textSecondary}
                    width={21}
                    height={21}
                    objectFit="contain"
                  />
                </view>
              ) : null}
            </view>
          </view>
          {hasText ? (
            <view style={styles.sendButton} onTap={this.handleSend} accessibilityCategory="button">
              <image src={navigationIcons.sent} tint={colors.textInverted} width={22} height={22} objectFit="contain" />
            </view>
          ) : null}
        </view>
        <view
          style={this.state.recordingLocked ? styles.recordingOverlayLocked : this.state.cancelRecording ? styles.recordingOverlayCancel : styles.recordingOverlay}
          opacity={this.state.recording ? 1 : 0}
          translationX={this.state.recording ? 0 : -24}
        >
          <view
            style={styles.recordingDeleteButton}
            opacity={this.state.recordingLocked ? 1 : 0}
            translationX={this.state.recordingLocked ? 0 : -16}
            onTap={this.handleCancelLockedRecording}
            onTapDisabled={!this.state.recordingLocked}
            accessibilityCategory="button"
          >
            <image src={navigationIcons.delete02} tint={colors.textInverted} width={21} height={21} objectFit="contain" />
          </view>
          <view style={this.state.recordingLocked ? styles.recordingMainLocked : styles.recordingMain}>
            <view style={this.state.recordingLocked ? styles.recordingStatusLocked : styles.recordingStatus}>
            <image
              src={navigationIcons.mic02}
              tint={colors.textDanger}
              opacity={this.state.recordingMicVisible ? 1 : 0.22}
              width={21}
              height={21}
              objectFit="contain"
            />
            <label value={this.formatRecordingTime(this.state.recordingElapsedSeconds)} style={styles.recordingTimer} numberOfLines={1} />
            </view>
            {!this.state.recordingLocked ? (
              <view style={styles.recordingPrompt}>
                <image
                  src={navigationIcons.arrowLeftDoubleRound}
                  tint={this.state.cancelRecording ? colors.textDanger : colors.textSecondary}
                  opacity={this.state.cancelRecording ? 0 : this.state.recordingHintArrowVisible ? 0.3 : 1}
                  translationX={this.state.recordingHintArrowVisible ? -7 : 0}
                  width={20}
                  height={20}
                  objectFit="contain"
                />
                <label
                  value={this.state.cancelRecording ? 'Relâchez pour annuler' : 'Glissez pour annuler'}
                  style={this.state.cancelRecording ? styles.recordingTextCancel : styles.recordingText}
                  numberOfLines={1}
                />
              </view>
            ) : null}
          </view>
          <view
            style={styles.recordingSendButton}
            opacity={this.state.recordingLocked ? 1 : 0}
            translationX={this.state.recordingLocked ? 0 : 16}
            onTap={this.handleSendLockedRecording}
            onTapDisabled={!this.state.recordingLocked}
            accessibilityCategory="button"
          >
            <image src={navigationIcons.sent} tint={colors.textInverted} width={21} height={21} objectFit="contain" />
          </view>
        </view>
        {this.state.recording && !this.state.recordingLocked ? (
          <view
            style={styles.lockPillPosition}
            opacity={1}
            translationY={this.state.lockProgress > 0 ? -8 : 8}
          >
            <view style={styles.lockPill}>
              <view style={styles.lockPillTrack}>
                <view style={styles.lockPillFill.extend({ width: `${Math.round(this.state.lockProgress * 100)}%` })} />
              </view>
              <view style={styles.lockPillContent}>
                <image
                  src={this.state.lockProgress >= 1 ? navigationIcons.circleLock01 : navigationIcons.circleUnlock01}
                  tint={colors.textPrimary}
                  width={22}
                  height={22}
                  objectFit="contain"
                />
                <image src={navigationIcons.arrowUpDoubleRound} tint={colors.textPrimary} width={17} height={17} objectFit="contain" />
              </view>
            </view>
          </view>
        ) : null}
      </view>
    </view>;
  }
}

const styles = {
  composer: new Style<View>({ backgroundColor: colors.backgroundPrimary, flexDirection: 'column' }),
  composerRow: new Style<View>({
    alignItems: 'flex-end', backgroundColor: colors.backgroundPrimary, flexDirection: 'row',
    overflow: 'visible', paddingBottom: spacing.sm, paddingLeft: spacing.md, paddingRight: spacing.md, paddingTop: spacing.sm,
  }),
  composerControls: new Style<View>({ alignItems: 'flex-end', flexDirection: 'row', flexGrow: 1, flexShrink: 1, zIndex: 1 }),
  cameraButton: new Style<View>({
    alignItems: 'center', backgroundColor: colors.backgroundDark, borderRadius: radius.full, flexShrink: 0,
    height: 40, justifyContent: 'center', marginRight: spacing.sm, width: 40,
  }),
  input: new Style<TextView>({
    color: colors.textPrimary, flexGrow: 1, flexShrink: 1, font: montserrat.regular(fontSize.body), maxHeight: 100,
    minHeight: 24, textGravity: 'center',
  }),
  inputContainer: new Style<View>({
    alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: radius.lg, flexDirection: 'row',
    flexGrow: 1, flexShrink: 1, minHeight: 40, paddingBottom: spacing.xs, paddingLeft: spacing.md,
    paddingRight: spacing.xs, paddingTop: spacing.xs,
  }),
  inputContainerRecording: new Style<View>({
    alignItems: 'center', backgroundColor: 'transparent', borderRadius: radius.lg, flexDirection: 'row',
    flexGrow: 1, flexShrink: 1, minHeight: 40, paddingBottom: spacing.xs, paddingLeft: spacing.md,
    paddingRight: spacing.xs, paddingTop: spacing.xs,
  }),
  inputTextSlot: new Style<View>({ flexGrow: 1, flexShrink: 1 }),
  inputActions: new Style<View>({ alignItems: 'center', flexDirection: 'row', flexShrink: 0 }),
  inputIconButton: new Style<View>({ alignItems: 'center', borderRadius: radius.full, height: 34, justifyContent: 'center', width: 34 }),
  recordingMicButton: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundMessageSent, borderRadius: radius.full, height: 34, justifyContent: 'center', width: 34 }),
  sendButton: new Style<View>({
    alignItems: 'center', backgroundColor: colors.backgroundMessageSent, borderRadius: radius.full, flexShrink: 0,
    height: 40, justifyContent: 'center', marginLeft: spacing.sm, width: 40,
  }),
  recordingBackdrop: new Style<View>({ backgroundColor: colors.backgroundSecondary, borderRadius: radius.lg, bottom: spacing.sm, left: spacing.md, position: 'absolute', right: spacing.md, top: spacing.sm, zIndex: 0 }),
  recordingOverlay: new Style<View>({ alignItems: 'center', bottom: spacing.sm, flexDirection: 'row', justifyContent: 'center', left: spacing.md, paddingBottom: spacing.xs, paddingTop: spacing.xs, position: 'absolute', right: spacing.md, top: spacing.sm, zIndex: 2 }),
  recordingOverlayCancel: new Style<View>({ alignItems: 'center', bottom: spacing.sm, flexDirection: 'row', justifyContent: 'space-between', left: spacing.md, paddingBottom: spacing.xs, paddingTop: spacing.xs, position: 'absolute', right: spacing.md, top: spacing.sm, zIndex: 2 }),
  recordingOverlayLocked: new Style<View>({ alignItems: 'center', bottom: spacing.sm, flexDirection: 'row', justifyContent: 'space-between', left: spacing.md, paddingBottom: spacing.xs, paddingTop: spacing.xs, position: 'absolute', right: spacing.md, top: spacing.sm, zIndex: 2 }),
  recordingMain: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', justifyContent: 'center', position: 'relative', width: '100%' }),
  recordingMainLocked: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', justifyContent: 'center', left: 48, position: 'absolute', right: 48 }),
  recordingStatus: new Style<View>({ alignItems: 'center', flexDirection: 'row', flexShrink: 0, left: spacing.sm, position: 'absolute' }),
  recordingStatusLocked: new Style<View>({ alignItems: 'center', flexDirection: 'row', flexShrink: 0 }),
  recordingPrompt: new Style<View>({ alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }),
  recordingTimer: new Style<Label>({ color: colors.textDanger, font: montserrat.semiBold(fontSize.body), marginLeft: spacing.sm }),
  recordingText: new Style<Label>({ color: colors.textSecondary, font: montserrat.semiBold(fontSize.metadata), marginLeft: spacing.md }),
  recordingTextCancel: new Style<Label>({ color: colors.textDanger, font: montserrat.semiBold(fontSize.metadata) }),
  recordingDeleteButton: new Style<View>({ alignItems: 'center', backgroundColor: colors.textDanger, borderRadius: radius.full, height: 40, justifyContent: 'center', left: 0, position: 'absolute', width: 40 }),
  recordingSendButton: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundMessageSent, borderRadius: radius.full, height: 40, justifyContent: 'center', position: 'absolute', right: 0, width: 40 }),
  lockPillPosition: new Style<View>({ alignItems: 'center', position: 'absolute', right: spacing.md, top: -76, zIndex: 2 }),
  lockPill: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundDark, borderRadius: radius.full, flexDirection: 'column', height: 72, justifyContent: 'center', position: 'relative', width: 42 }),
  lockPillTrack: new Style<View>({ backgroundColor: colors.backgroundSecondary, borderRadius: radius.full, bottom: 0, left: 0, position: 'absolute', right: 0, top: 0, zIndex: 0 }),
  lockPillFill: new Style<View>({ background: 'linear-gradient(#D6FF56, #A7E500)', borderRadius: radius.full, bottom: 0, left: 0, position: 'absolute', top: 0, zIndex: 1 }),
  lockPillContent: new Style<View>({ alignItems: 'center', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between', paddingBottom: spacing.md, paddingTop: spacing.md, zIndex: 2 }),
  errorBanner: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundSecondary, padding: spacing.xs }),
  errorText: new Style<Label>({ color: colors.textDanger, font: montserrat.semiBold(fontSize.tiny) }),
};

const LOCK_GESTURE_DISTANCE = 84;
