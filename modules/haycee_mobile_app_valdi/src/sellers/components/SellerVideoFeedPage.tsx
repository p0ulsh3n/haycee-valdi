import { Device } from 'valdi_core/src/Device';
import { ElementRef } from 'valdi_core/src/ElementRef';
import { StatefulComponent } from 'valdi_core/src/Component';
import { setTimeoutInterruptible } from 'valdi_core/src/SetTimeout';
import { Style } from 'valdi_core/src/Style';
import { VideoView, Label, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../../res/navigation-icons';
import { VideoPlaybackControls } from '../../design-system/components/VideoPlaybackControls';
import { colors } from '../../design-system/tokens/colors';
import { radius } from '../../design-system/tokens/radius';
import { layout, spacing } from '../../design-system/tokens/spacing';
import { fontSize, montserrat } from '../../design-system/tokens/typography';
import type { SellerVideoPreview } from '../data/SellerStorefrontData';

export interface SellerVideoFeedPageViewModel {
  video: SellerVideoPreview;
  vendorDisplayName: string;
  isActive: boolean;
  bottomInset: number;
  onBack: () => void;
}

interface SellerVideoFeedPageState {
  currentTimeMilliseconds: number;
  durationMilliseconds: number;
  isPlaying: boolean;
  isBuffering: boolean;
  isSeeking: boolean;
  hasVideoError: boolean;
  pendingSeekMilliseconds?: number;
  pendingSeekFraction?: number;
}

/** One video-feed page; owns only its active native player and playback state. */
export class SellerVideoFeedPage extends StatefulComponent<SellerVideoFeedPageViewModel, SellerVideoFeedPageState> {
  state: SellerVideoFeedPageState = {
    currentTimeMilliseconds: 0,
    durationMilliseconds: 0,
    isPlaying: false,
    isBuffering: false,
    isSeeking: false,
    hasVideoError: false,
  };

  private readonly videoRef = new ElementRef<VideoView>();
  private seekRevision = 0;
  private progressWatchdogRevision = 0;
  private progressWatchdogTimer?: number;

  onCreate(): void {
    this.state = this.initialState();
  }

  private initialState(): SellerVideoFeedPageState {
    const hasVideo = Boolean(this.viewModel.video.videoUrl);
    return {
      currentTimeMilliseconds: 0,
      durationMilliseconds: 0,
      isPlaying: hasVideo && this.viewModel.isActive,
      isBuffering: hasVideo && this.viewModel.isActive,
      isSeeking: false,
      hasVideoError: false,
    };
  }

  onViewModelUpdate(previous?: SellerVideoFeedPageViewModel): void {
    if (previous?.video.id !== this.viewModel.video.id) {
      this.cancelProgressWatchdog();
      this.seekRevision++;
      this.state = this.initialState();
      return;
    }
    if (previous?.video.videoUrl !== this.viewModel.video.videoUrl) {
      this.seekRevision++;
      const hasVideo = Boolean(this.viewModel.video.videoUrl);
      this.setState({
        currentTimeMilliseconds: 0,
        durationMilliseconds: 0,
        isPlaying: hasVideo && this.viewModel.isActive,
        isBuffering: hasVideo && this.viewModel.isActive,
        isSeeking: false,
        hasVideoError: false,
        pendingSeekMilliseconds: undefined,
        pendingSeekFraction: undefined,
      });
      if (hasVideo && this.viewModel.isActive) this.scheduleProgressWatchdog();
      else this.cancelProgressWatchdog();
    }
    if (previous?.isActive !== this.viewModel.isActive) {
      if (this.viewModel.isActive) {
        const hasVideo = Boolean(this.viewModel.video.videoUrl);
        this.setState({
          isPlaying: hasVideo,
          isBuffering: hasVideo && !this.state.hasVideoError,
          hasVideoError: false,
        });
        if (hasVideo) this.scheduleProgressWatchdog();
        else this.cancelProgressWatchdog();
      } else {
        this.cancelProgressWatchdog();
        this.setState({ isPlaying: false, isBuffering: false, isSeeking: false });
      }
    }
  }

  onDestroy(): void {
    this.cancelProgressWatchdog();
  }

  private handleVideoLoaded = (durationMilliseconds: number): void => {
    const duration = Math.max(0, durationMilliseconds);
    const pendingFraction = this.state.pendingSeekFraction;
    this.setState({ durationMilliseconds: duration, isBuffering: this.state.isPlaying });
    if (duration > 0 && pendingFraction !== undefined) {
      this.commitSeekFraction(pendingFraction, duration);
    }
  };

  private handleVideoBeginPlaying = (): void => {
    this.setState({ isBuffering: false, hasVideoError: false });
    this.scheduleProgressWatchdog();
  };

  private handleVideoError = (_error: string): void => {
    this.seekRevision++;
    this.cancelProgressWatchdog();
    this.setState({ isBuffering: false, isSeeking: false, hasVideoError: true });
  };

  private handleVideoProgress = (timeMilliseconds: number, durationMilliseconds: number): void => {
    const time = Math.max(0, timeMilliseconds);
    const duration = Math.max(0, durationMilliseconds);
    const pendingFraction = this.state.pendingSeekFraction;
    const target = this.state.pendingSeekMilliseconds;
    const settleTolerance = Math.min(
      layout.feed.videoPlayer.seekSettleToleranceMilliseconds,
      Math.max(250, duration * 0.025),
    );
    const landed = target !== undefined && Math.abs(time - target) <= settleTolerance;
    if (landed) this.seekRevision++;
    if (this.state.isPlaying && this.viewModel.isActive) this.scheduleProgressWatchdog();
    else this.cancelProgressWatchdog();

    this.setState({
      currentTimeMilliseconds: time,
      durationMilliseconds: duration || this.state.durationMilliseconds,
      isBuffering: false,
      isSeeking: landed ? false : this.state.isSeeking,
      pendingSeekMilliseconds: landed ? undefined : target,
    });
    if (duration > 0 && pendingFraction !== undefined) {
      this.commitSeekFraction(pendingFraction, duration);
    }
  };

  private scheduleProgressWatchdog(): void {
    const revision = ++this.progressWatchdogRevision;
    if (this.progressWatchdogTimer !== undefined) clearTimeout(this.progressWatchdogTimer);
    this.progressWatchdogTimer = setTimeoutInterruptible(() => {
      this.progressWatchdogTimer = undefined;
      if (this.isDestroyed() || revision !== this.progressWatchdogRevision) return;
      if (this.viewModel.isActive && this.state.isPlaying && !this.state.hasVideoError) {
        this.setState({ isBuffering: true });
      }
    }, layout.feed.videoPlayer.progressStallTimeoutMilliseconds);
  }

  private cancelProgressWatchdog(): void {
    this.progressWatchdogRevision++;
    if (this.progressWatchdogTimer !== undefined) {
      clearTimeout(this.progressWatchdogTimer);
      this.progressWatchdogTimer = undefined;
    }
  }

  private handleVideoCompleted = (): void => {
    if (!this.viewModel.isActive || this.state.hasVideoError) return;
    this.commitSeekFraction(0, this.state.durationMilliseconds);
    this.setState({ currentTimeMilliseconds: 0, isPlaying: true, isBuffering: true });
  };

  private handleTogglePlayback = (): void => {
    if (!this.viewModel.video.videoUrl || this.state.hasVideoError) return;
    const isPlaying = !this.state.isPlaying;
    this.cancelProgressWatchdog();
    this.setState({ isPlaying, isBuffering: isPlaying && !this.state.hasVideoError });
    if (isPlaying) this.scheduleProgressWatchdog();
  };

  private handleSeekFraction = (fraction: number): void => {
    const boundedFraction = Math.max(0, Math.min(1, fraction));
    const duration = this.state.durationMilliseconds;
    if (duration <= 0) {
      this.setState({ pendingSeekFraction: boundedFraction });
      return;
    }
    this.commitSeekFraction(boundedFraction, duration);
  };

  private commitSeekFraction(fraction: number, durationMilliseconds: number): void {
    if (durationMilliseconds <= 0) {
      this.setState({ pendingSeekFraction: Math.max(0, Math.min(1, fraction)) });
      return;
    }
    const duration = Math.max(1, durationMilliseconds);
    const target = Math.max(0, Math.min(duration - 1, Math.round(duration * Math.max(0, Math.min(1, fraction)))));
    const revision = ++this.seekRevision;
    this.setState({
      pendingSeekMilliseconds: target,
      pendingSeekFraction: undefined,
      isSeeking: true,
    });
    this.videoRef.single()?.setAttribute('seekToTime', target);

    this.setTimeoutDisposable(() => {
      if (this.isDestroyed() || revision !== this.seekRevision) return;
      this.setState({ isSeeking: false });
    }, layout.feed.videoPlayer.seekIndicatorTimeoutMilliseconds);
  }

  private handleBack = (): void => {
    this.viewModel.onBack();
  };

  onRender(): void {
    const { video, vendorDisplayName, isActive, bottomInset } = this.viewModel;
    const videoUrl = video.videoUrl;
    const hasVideo = Boolean(videoUrl);

    <view style={styles.page.extend({ backgroundColor: video.color })} width="100%" height="100%">
      {video.thumbnailUrl ? <image src={video.thumbnailUrl} style={styles.media} objectFit="cover" /> : null}
      {videoUrl && isActive ? (
        <video
          ref={this.videoRef}
          src={videoUrl}
          style={styles.media}
          volume={1}
          playbackRate={this.state.isPlaying ? 1 : 0}
          onVideoLoaded={this.handleVideoLoaded}
          onBeginPlaying={this.handleVideoBeginPlaying}
          onProgressUpdated={this.handleVideoProgress}
          onCompleted={this.handleVideoCompleted}
          onError={this.handleVideoError}
        />
      ) : null}

      <view style={styles.headerOverlay}>
        <view style={styles.header.extend({ paddingTop: Math.max(0, Device.getDisplayTopInset()) + spacing.sm })}>
          <view
            style={styles.backButton}
            onTap={this.handleBack}
            accessibilityCategory="button"
            accessibilityLabel="Retour au profil vendeur"
          >
            <image src={navigationIcons.arrowLeft01Round} tint={colors.textInverted} width={22} height={22} objectFit="contain" />
          </view>
        </view>
      </view>

      <view style={styles.bottomCopy.extend({ paddingBottom: bottomInset + layout.feed.videoPlayer.centerTapBottomInset })}>
        <label value={vendorDisplayName} style={styles.vendorName} numberOfLines={1} />
        <label value={video.title} style={styles.caption} numberOfLines={3} />
        <view style={styles.viewCount}>
          <image src={navigationIcons.playBold} tint={colors.textInverted} width={14} height={14} objectFit="contain" />
          <label value={video.viewCountLabel} style={styles.viewCountLabel} numberOfLines={1} />
        </view>
      </view>

      {hasVideo && isActive ? (
        <VideoPlaybackControls
          positionMilliseconds={this.state.currentTimeMilliseconds}
          durationMilliseconds={this.state.durationMilliseconds}
          isPlaying={this.state.isPlaying}
          isBuffering={this.state.isBuffering || this.state.isSeeking}
          bottomInset={bottomInset}
          playIcon={navigationIcons.playBold}
          pauseIcon={navigationIcons.pauseBold}
          onTogglePlayback={this.handleTogglePlayback}
          onSeekFraction={this.handleSeekFraction}
        />
      ) : null}
      {this.state.hasVideoError ? (
        <view style={styles.errorState}>
          <label value="Cette vidéo n’a pas pu être lue." style={styles.errorText} numberOfLines={2} />
        </view>
      ) : null}
    </view>;
  }
}

const styles = {
  page: new Style<View>({ height: '100%', position: 'relative', width: '100%' }),
  media: new Style<View>({ height: '100%', left: 0, position: 'absolute', top: 0, width: '100%' }),
  headerOverlay: new Style<View>({ left: 0, position: 'absolute', right: 0, top: 0 }),
  header: new Style<View>({ alignItems: 'flex-start', paddingBottom: spacing.sm, paddingLeft: spacing.lg, width: '100%' }),
  backButton: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundProfileHeader, borderRadius: radius.full, height: 40, justifyContent: 'center', width: 40 }),
  bottomCopy: new Style<View>({ bottom: 0, left: 0, paddingLeft: spacing.lg, paddingRight: layout.feed.verticalActionRail.width + layout.feed.verticalActionRail.rightInset + spacing.md, position: 'absolute', right: 0 }),
  vendorName: new Style<Label>({ color: colors.textInverted, font: montserrat.extraBold(fontSize.product), textShadow: 'rgba(0, 0, 0, 0.72) 1 1 0 1' }),
  caption: new Style<Label>({ color: colors.textInverted, font: montserrat.semiBold(fontSize.body), marginTop: spacing.xs, textShadow: 'rgba(0, 0, 0, 0.72) 1 1 0 1' }),
  viewCount: new Style<View>({ alignItems: 'center', flexDirection: 'row', marginTop: spacing.sm }),
  viewCountLabel: new Style<Label>({ color: colors.textInverted, font: montserrat.semiBold(fontSize.metadata), marginLeft: spacing.xs, textShadow: 'rgba(0, 0, 0, 0.72) 1 1 0 1' }),
  errorState: new Style<View>({ alignItems: 'center', bottom: '45%', left: spacing.xl, position: 'absolute', right: spacing.xl }),
  errorText: new Style<Label>({ color: colors.textInverted, font: montserrat.semiBold(fontSize.body), textAlign: 'center' }),
};
