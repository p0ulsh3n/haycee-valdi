import { AnimationCurve } from 'valdi_core/src/AnimationOptions';
import { ElementRef } from 'valdi_core/src/ElementRef';
import { StatefulComponent } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { Asset } from 'valdi_tsx/src/Asset';
import { TouchEvent, TouchEventState } from 'valdi_tsx/src/GestureEvents';
import { ElementFrame } from 'valdi_tsx/src/Geometry';
import { Label, SpinnerView, View } from 'valdi_tsx/src/NativeTemplateElements';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { layout, spacing } from '../tokens/spacing';
import { fontSize, montserrat } from '../tokens/typography';

export interface VideoPlaybackControlsViewModel {
  /** Source-of-truth playback position reported by the native player, in milliseconds. */
  positionMilliseconds: number;
  /** Native duration; zero means metadata has not arrived yet. */
  durationMilliseconds: number;
  isPlaying: boolean;
  isBuffering?: boolean;
  bottomInset?: number;
  playIcon: Asset;
  pauseIcon: Asset;
  onTogglePlayback: () => void;
  /** The latest requested seek as a normalized fraction, including before duration is known. */
  onSeekFraction: (fraction: number) => void;
}

interface VideoPlaybackControlsState {
  timelineWidth: number;
  isScrubbing: boolean;
  scrubFraction: number;
  pendingFraction?: number;
  feedbackIconIsPlaying: boolean;
  lastTouchEndEventTime?: number;
  lastTouchEndFraction?: number;
}

/** Shared, native-gesture video playback overlay with a progress-synced seek timeline. */
export class VideoPlaybackControls extends StatefulComponent<VideoPlaybackControlsViewModel, VideoPlaybackControlsState> {
  state: VideoPlaybackControlsState = {
    timelineWidth: 0,
    isScrubbing: false,
    scrubFraction: 0,
    feedbackIconIsPlaying: false,
  };

  private readonly feedbackRef = new ElementRef<View>();
  private feedbackToken = 0;

  onViewModelUpdate(): void {
    const pending = this.state.pendingFraction;
    if (pending === undefined || this.state.isScrubbing || this.viewModel.durationMilliseconds <= 0) return;

    const targetMilliseconds = pending * this.viewModel.durationMilliseconds;
    const toleranceMilliseconds = Math.min(
      layout.feed.videoPlayer.seekSettleToleranceMilliseconds,
      Math.max(250, this.viewModel.durationMilliseconds * 0.025),
    );
    if (Math.abs(this.viewModel.positionMilliseconds - targetMilliseconds) <= toleranceMilliseconds) {
      this.setState({ pendingFraction: undefined });
    }
  }

  private reportedFraction(): number {
    const duration = this.viewModel.durationMilliseconds;
    if (duration <= 0) return 0;
    return Math.max(0, Math.min(1, this.viewModel.positionMilliseconds / duration));
  }

  private displayFraction(): number {
    if (this.state.isScrubbing) return this.state.scrubFraction;
    if (this.state.pendingFraction !== undefined) return this.state.pendingFraction;
    return this.reportedFraction();
  }

  private updateScrub(event: TouchEvent): number {
    const width = this.state.timelineWidth;
    if (width <= 0) return this.displayFraction();
    return Math.max(0, Math.min(1, event.x / width));
  }

  private handleTimelineTouch = (event: TouchEvent): void => {
    const fraction = this.updateScrub(event);
    if (event.state === TouchEventState.Started || event.state === TouchEventState.Changed) {
      this.setState({ isScrubbing: true, scrubFraction: fraction });
      return;
    }
    if (event.state === TouchEventState.Ended) {
      this.commitTimelineSeek(fraction, event.eventTime);
    }
  };

  private handleTimelineTap = (event: TouchEvent): void => {
    this.commitTimelineSeek(this.updateScrub(event), event.eventTime);
  };

  private commitTimelineSeek(fraction: number, eventTime?: number): void {
    const lastEventTime = this.state.lastTouchEndEventTime;
    const lastFraction = this.state.lastTouchEndFraction;
    const isDuplicateTouchRelease =
      eventTime !== undefined &&
      lastEventTime !== undefined &&
      Math.abs(eventTime - lastEventTime) <= 0.12 &&
      lastFraction !== undefined &&
      Math.abs(fraction - lastFraction) <= 0.01;

    this.setState({
      isScrubbing: false,
      scrubFraction: fraction,
      pendingFraction: fraction,
      lastTouchEndEventTime: eventTime,
      lastTouchEndFraction: fraction,
    });
    if (!isDuplicateTouchRelease) this.viewModel.onSeekFraction(fraction);
  }

  private handleTimelineLayout = (frame: ElementFrame): void => {
    const width = Math.max(0, frame.width);
    if (width !== this.state.timelineWidth) this.setState({ timelineWidth: width });
  };

  private handlePlaybackTap = (): void => {
    const nextIsPlaying = !this.viewModel.isPlaying;
    const token = ++this.feedbackToken;
    this.setState({ feedbackIconIsPlaying: nextIsPlaying });
    this.viewModel.onTogglePlayback();

    const feedback = this.feedbackRef.single();
    if (feedback) {
      feedback.setAttribute('opacity', 0);
      feedback.setAttribute('scaleX', 0.78);
      feedback.setAttribute('scaleY', 0.78);
      this.animate(
        { duration: 0.18, curve: AnimationCurve.EaseOut, beginFromCurrentState: true },
        () => {
          feedback.setAttribute('opacity', 1);
          feedback.setAttribute('scaleX', 1);
          feedback.setAttribute('scaleY', 1);
        },
      );
    }

    this.setTimeoutDisposable(() => {
      if (this.isDestroyed() || token !== this.feedbackToken) return;
      const currentFeedback = this.feedbackRef.single();
      if (!currentFeedback) return;
      this.animate(
        { duration: 0.24, curve: AnimationCurve.EaseIn, beginFromCurrentState: true },
        () => {
          currentFeedback.setAttribute('opacity', 0);
          currentFeedback.setAttribute('scaleX', 0.78);
          currentFeedback.setAttribute('scaleY', 0.78);
        },
      );
    }, layout.feed.videoPlayer.feedbackHoldMilliseconds);
  };

  private formatTime(milliseconds: number): string {
    if (this.viewModel.durationMilliseconds <= 0) return '--:--';
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  onRender(): void {
    const fraction = this.displayFraction();
    const bottomInset = Math.max(0, this.viewModel.bottomInset ?? 0);
    const progressWidth = `${fraction * 100}%`;
    const thumbLeft = Math.max(
      0,
      Math.min(
        Math.max(0, this.state.timelineWidth - layout.feed.videoPlayer.seekThumbSize),
        this.state.timelineWidth * fraction - layout.feed.videoPlayer.seekThumbSize / 2,
      ),
    );

    <view style={styles.root}>
      <view
        style={styles.centerTapArea.extend({
          bottom: bottomInset + layout.feed.videoPlayer.centerTapBottomInset,
          top: layout.feed.videoPlayer.centerTapTopInset,
        })}
        onTap={this.handlePlaybackTap}
        accessibilityCategory="button"
        accessibilityLabel={this.viewModel.isPlaying ? 'Mettre la vidéo en pause' : 'Lire la vidéo'}
      >
        <view ref={this.feedbackRef} style={styles.feedback} opacity={0} scaleX={0.78} scaleY={0.78}>
          <image
            src={this.state.feedbackIconIsPlaying ? this.viewModel.pauseIcon : this.viewModel.playIcon}
            tint={colors.textInverted}
            width={30}
            height={30}
            objectFit="contain"
          />
        </view>
        {this.viewModel.isBuffering ? <spinner style={styles.spinner} color={colors.textInverted} /> : null}
      </view>

      <view style={styles.timeline.extend({ bottom: bottomInset + layout.feed.videoPlayer.timelineBottomInset })}>
        <view style={styles.timeRow}>
          <label value={this.formatTime(this.state.isScrubbing ? fraction * this.viewModel.durationMilliseconds : (this.state.pendingFraction ?? this.reportedFraction()) * this.viewModel.durationMilliseconds)} style={styles.timeLabel} numberOfLines={1} />
          <label value={this.formatTime(this.viewModel.durationMilliseconds)} style={styles.timeLabel} numberOfLines={1} />
        </view>
        <view
          style={styles.seekHitArea}
          onLayout={this.handleTimelineLayout}
          onTouch={this.handleTimelineTouch}
          onTap={this.handleTimelineTap}
          accessibilityCategory="button"
          accessibilityLabel="Position de lecture vidéo"
        >
          <view style={styles.seekTrack}>
            <view style={styles.seekProgress.extend({ width: progressWidth })} />
          </view>
          <view style={styles.seekThumb.extend({ left: thumbLeft })} />
        </view>
      </view>
    </view>;
  }
}

const styles = {
  root: new Style<View>({ bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }),
  centerTapArea: new Style<View>({ alignItems: 'center', justifyContent: 'center', left: 0, position: 'absolute', right: layout.feed.verticalActionRail.width + spacing.xxl }),
  feedback: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundProfileHeader, borderRadius: radius.full, height: layout.feed.videoPlayer.centerControlSize, justifyContent: 'center', width: layout.feed.videoPlayer.centerControlSize }),
  spinner: new Style<SpinnerView>({ height: 30, position: 'absolute', width: 30 }),
  timeline: new Style<View>({ left: spacing.lg, position: 'absolute', right: spacing.lg }),
  timeRow: new Style<View>({ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }),
  timeLabel: new Style<Label>({ color: colors.textInverted, font: montserrat.semiBold(fontSize.tiny), textShadow: 'rgba(0, 0, 0, 0.72) 1 1 0 1' }),
  seekHitArea: new Style<View>({ height: layout.feed.videoPlayer.seekBarHitHeight, justifyContent: 'center', position: 'relative', width: '100%' }),
  seekTrack: new Style<View>({ backgroundColor: colors.mediaIndicatorInactive, borderRadius: radius.full, height: layout.feed.videoPlayer.seekBarHeight, width: '100%' }),
  seekProgress: new Style<View>({ backgroundColor: colors.mediaIndicatorActive, borderRadius: radius.full, height: layout.feed.videoPlayer.seekBarHeight, left: 0, position: 'absolute', top: (layout.feed.videoPlayer.seekBarHitHeight - layout.feed.videoPlayer.seekBarHeight) / 2 }),
  seekThumb: new Style<View>({ backgroundColor: colors.mediaIndicatorActive, borderRadius: radius.full, height: layout.feed.videoPlayer.seekThumbSize, position: 'absolute', top: (layout.feed.videoPlayer.seekBarHitHeight - layout.feed.videoPlayer.seekThumbSize) / 2, width: layout.feed.videoPlayer.seekThumbSize }),
};
