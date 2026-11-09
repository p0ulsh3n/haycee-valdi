import { Device } from 'valdi_core/src/Device';
import { AnimationCurve } from 'valdi_core/src/AnimationOptions';
import { ElementRef } from 'valdi_core/src/ElementRef';
import { StatefulComponent } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { Asset } from 'valdi_tsx/src/Asset';
import { DragEvent, TouchEventState } from 'valdi_tsx/src/GestureEvents';
import { AnimatedImage, ImageView, Label, Layout, ScrollView, SpinnerView, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../../res/navigation-icons';
import { BOTTOM_SHEET_DEFAULTS, bottomSheetSurfaceStyle } from './BottomSheet';
import { AsyncActionButton } from './AsyncActionButton';
import { noBounceScrollAttributes } from '../tokens/scrollBehavior';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { spacing } from '../tokens/spacing';
import { fontSize, montserrat } from '../tokens/typography';

export type MediaActionSheetMediaType = 'image' | 'animated' | 'video';
export type MediaActionSheetTone = 'light' | 'dark';
export type MediaActionSheetButtonTone = 'brand' | 'black' | 'neutral' | 'light';
export type MediaActionLayout = 'vertical' | 'horizontal';

export interface MediaActionSheetBenefit {
  title: string;
  description?: string;
  icon?: string | Asset;
}

/** Shared content and behavior for the app's feature-discovery and offer sheets. */
export interface MediaActionSheetViewModel {
  eyebrow?: string;
  title: string;
  message: string;
  mediaUrl?: string;
  mediaAsset?: Asset;
  mediaType?: MediaActionSheetMediaType;
  mediaPosterUrl?: string;
  mediaPosterAsset?: Asset;
  mediaAspectRatio?: number;
  mediaLoop?: boolean;
  mediaAutoplay?: boolean;
  mediaPlaybackRate?: number;
  mediaVolume?: number;
  mediaFallbackLabel?: string;
  mediaBackgroundColor?: string;
  benefits?: MediaActionSheetBenefit[];
  footnote?: string;
  primaryLabel: string;
  primaryButtonTone?: MediaActionSheetButtonTone;
  primaryIcon?: string | Asset;
  primaryIconSize?: number;
  onPrimaryAction?: () => void | Promise<unknown>;
  secondaryLabel?: string;
  secondaryButtonTone?: MediaActionSheetButtonTone;
  secondaryIcon?: string | Asset;
  secondaryIconSize?: number;
  onSecondaryAction?: () => void | Promise<unknown>;
  onDismiss?: () => void;
  tone?: MediaActionSheetTone;
  actionLayout?: MediaActionLayout;
  sheetHeight?: number | string;
  contentScrollable?: boolean;
  showCloseButton?: boolean;
  showOverlay?: boolean;
  showHandle?: boolean;
  enableGestures?: boolean;
  dismissOnOverlayTap?: boolean;
  roundBottomCorners?: boolean;
  overlayOpacity?: number;
}

interface MediaActionSheetContentViewModel extends MediaActionSheetViewModel {
  dismiss: () => void;
}

interface MediaActionSheetContentState {
  mediaLoading: boolean;
  mediaFailed: boolean;
  pendingAction: 'primary' | 'secondary' | '';
}

/** Internal implementation shared by the two public navigation sheets. */
export class MediaActionSheetContent extends StatefulComponent<MediaActionSheetContentViewModel, MediaActionSheetContentState> {
  state: MediaActionSheetContentState = {
    mediaLoading: false,
    mediaFailed: false,
    pendingAction: '',
  };

  private actionPending = false;
  private readonly sheetRef = new ElementRef<View>();

  onCreate(): void {
    this.state = {
      mediaLoading: Boolean(this.mediaSource()),
      mediaFailed: false,
      pendingAction: '',
    };
  }

  onViewModelUpdate(previous?: MediaActionSheetContentViewModel): void {
    if (
      previous?.mediaUrl !== this.viewModel.mediaUrl
      || previous?.mediaAsset !== this.viewModel.mediaAsset
      || previous?.mediaType !== this.viewModel.mediaType
    ) {
      this.setState({
        mediaLoading: Boolean(this.mediaSource()),
        mediaFailed: false,
        pendingAction: this.state.pendingAction,
      });
    }
  }

  private mediaSource = (): string | Asset | undefined => this.viewModel.mediaType === 'video'
    ? this.viewModel.mediaUrl
    : this.viewModel.mediaAsset ?? this.viewModel.mediaUrl;

  private mediaLoaded = (): void => {
    if (this.isDestroyed()) return;
    this.setState({ mediaLoading: false, mediaFailed: false, pendingAction: this.state.pendingAction });
  };

  private mediaLoadFailed = (error?: string): void => {
    if (this.isDestroyed()) return;
    this.setState({ mediaLoading: false, mediaFailed: true, pendingAction: this.state.pendingAction });
    if (error) console.warn('Informational sheet media could not be loaded.', error);
  };

  private dismiss = (): void => {
    if (this.actionPending) return;
    this.viewModel.dismiss();
  };

  private runAction = (kind: 'primary' | 'secondary'): void | Promise<unknown> => {
    if (this.actionPending) return;
    this.actionPending = true;
    this.setState({ mediaLoading: this.state.mediaLoading, mediaFailed: this.state.mediaFailed, pendingAction: kind });

    const action = kind === 'primary' ? this.viewModel.onPrimaryAction : this.viewModel.onSecondaryAction;
    let result: void | Promise<unknown>;
    try {
      result = action?.();
    } catch (error) {
      this.finishFailedAction(error);
      return;
    }

    if (!result || typeof result.then !== 'function') {
      this.viewModel.dismiss();
      return;
    }

    return result.then(
      () => {
        if (!this.isDestroyed()) this.viewModel.dismiss();
      },
      error => this.finishFailedAction(error),
    ).finally(() => {
      this.actionPending = false;
      if (!this.isDestroyed()) {
        this.setState({ mediaLoading: this.state.mediaLoading, mediaFailed: this.state.mediaFailed, pendingAction: '' });
      }
    });
  };

  private finishFailedAction = (error: unknown): void => {
    this.actionPending = false;
    console.warn('Informational sheet action failed; the sheet stays open for retry.', error);
    if (!this.isDestroyed()) {
      this.setState({ mediaLoading: this.state.mediaLoading, mediaFailed: this.state.mediaFailed, pendingAction: '' });
    }
  };

  private handleOverlayTap = (): void => {
    if ((this.viewModel.dismissOnOverlayTap ?? true) && !this.actionPending) this.dismiss();
  };

  private handleDrag = (event: DragEvent): void => {
    const sheet = this.sheetRef.single();
    if (!sheet || this.actionPending) return;
    if (event.state === TouchEventState.Ended) {
      if (event.velocityY > 600) {
        this.dismiss();
        return;
      }
      this.animate(
        { duration: 0.22, curve: AnimationCurve.EaseOut, beginFromCurrentState: true },
        () => sheet.setAttribute('translationY', 0),
      );
      return;
    }
    sheet.setAttribute('translationY', Math.max(0, event.deltaY));
  };

  private buttonStyle(tone: MediaActionSheetButtonTone): Style<View> {
    switch (tone) {
      case 'black':
        return styles.actionButton.extend({ backgroundColor: colors.buttonSecondary });
      case 'neutral':
        return styles.actionButton.extend({ backgroundColor: this.surfaceSecondary() });
      case 'light':
        return styles.actionButton.extend({ backgroundColor: colors.backgroundPrimary });
      default:
        return styles.actionButton.extend({ backgroundColor: colors.buttonPrimary });
    }
  }

  private buttonLabelStyle(tone: MediaActionSheetButtonTone): Style<Label> {
    if (tone === 'neutral') return styles.actionLabel.extend({ color: this.primaryTextColor() });
    if (tone === 'light') return styles.actionLabel.extend({ color: colors.textPrimary });
    return styles.actionLabel.extend({ color: colors.textInverted });
  }

  private buttonTextColor(tone: MediaActionSheetButtonTone): string {
    if (tone === 'neutral') return this.primaryTextColor();
    if (tone === 'light') return colors.textPrimary;
    return colors.textInverted;
  }

  private surfaceColor(): string {
    return this.viewModel.tone === 'dark' ? colors.backgroundDarkElevated : colors.backgroundPrimary;
  }

  private surfaceSecondary(): string {
    return this.viewModel.tone === 'dark' ? colors.backgroundDarkSecondary : colors.backgroundSecondary;
  }

  private primaryTextColor(): string {
    return this.viewModel.tone === 'dark' ? colors.textInverted : colors.textPrimary;
  }

  private secondaryTextColor(): string {
    return this.viewModel.tone === 'dark' ? colors.textOnDarkSecondary : colors.textSecondary;
  }

  private renderMedia(): void {
    const source = this.mediaSource();
    if (!source) return;

    const frame = styles.mediaFrame.extend({
      aspectRatio: this.viewModel.mediaAspectRatio ?? 1.78,
      backgroundColor: this.viewModel.mediaBackgroundColor ?? this.surfaceSecondary(),
    });
    <view style={frame}>
      {this.renderSelectedMedia(source)}
      {this.state.mediaLoading ? (
        <view style={styles.mediaLoading}>
          <spinner style={styles.spinner} color={this.viewModel.tone === 'dark' ? colors.textInverted : colors.borderFocus} />
        </view>
      ) : null}
      {this.state.mediaFailed && this.viewModel.mediaFallbackLabel ? (
        <view style={styles.mediaFallback}>
          <label value={this.viewModel.mediaFallbackLabel} style={styles.mediaFallbackLabel.extend({ color: this.primaryTextColor() })} numberOfLines={2} />
        </view>
      ) : null}
    </view>;
  }

  private renderSelectedMedia(source: string | Asset): void {
    const mediaType = this.viewModel.mediaType ?? 'image';
    if (mediaType === 'video') {
      this.renderVideo();
    } else if (mediaType === 'animated') {
      this.renderAnimatedImage(source);
    } else {
      this.renderImage(source);
    }
  }

  private renderImage(source: string | Asset): void {
    <image
      src={source}
      style={styles.mediaImage}
      objectFit="cover"
      onAssetLoad={(success, error) => success ? this.mediaLoaded() : this.mediaLoadFailed(error)}
    />;
  }

  private renderAnimatedImage(source: string | Asset): void {
    <animatedimage
      src={source}
      style={styles.mediaAnimated}
      objectFit="cover"
      loop={this.viewModel.mediaLoop ?? true}
      advanceRate={this.viewModel.mediaAutoplay === false ? 0 : 1}
      onAssetLoad={(success, error) => success ? this.mediaLoaded() : this.mediaLoadFailed(error)}
    />;
  }

  private renderVideo(): void {
    const source = this.mediaSource();
    if (!source) return;
    const poster = this.viewModel.mediaPosterAsset ?? this.viewModel.mediaPosterUrl;
    {poster ? <image src={poster} style={styles.mediaImage} objectFit="cover" /> : null}
    <video
      src={source}
      style={styles.mediaVideo}
      volume={clamp(this.viewModel.mediaVolume ?? 0, 0, 1)}
      playbackRate={this.viewModel.mediaAutoplay === false ? 0 : clamp(this.viewModel.mediaPlaybackRate ?? 1, 0.25, 2)}
      onVideoLoaded={this.mediaLoaded}
      onError={this.mediaLoadFailed}
    />;
  }

  private renderBenefits(): void {
    const benefits = (this.viewModel.benefits ?? []).slice(0, 5);
    if (benefits.length === 0) return;
    <view style={styles.benefits}>
      {benefits.map((benefit, index) => (
        <view key={`benefit-${index}`} style={styles.benefitRow}>
          {benefit.icon ? (
            <image src={benefit.icon} tint={this.viewModel.tone === 'dark' ? colors.textInverted : colors.iconDefault} width={20} height={20} objectFit="contain" />
          ) : (
            <view style={styles.benefitMark.extend({ backgroundColor: this.viewModel.tone === 'dark' ? colors.textInverted : colors.interactivePrimary })} />
          )}
          <view style={styles.benefitCopy}>
            <label value={benefit.title} style={styles.benefitTitle.extend({ color: this.primaryTextColor() })} numberOfLines={2} />
            {benefit.description ? <label value={benefit.description} style={styles.benefitDescription.extend({ color: this.secondaryTextColor() })} numberOfLines={2} /> : null}
          </view>
        </view>
      ))}
    </view>;
  }

  private renderBody(): void {
    <view style={styles.bodyContent}>
      {this.renderMedia()}
      {this.viewModel.eyebrow ? (
        <view
          style={styles.eyebrowContainer.extend({
            backgroundColor: this.viewModel.tone === 'dark' ? colors.backgroundDarkSecondary : colors.backgroundBrand,
          })}
        >
          <label
            value={this.viewModel.eyebrow}
            style={styles.eyebrow.extend({ color: colors.textInverted })}
            numberOfLines={1}
          />
        </view>
      ) : null}
      <label value={this.viewModel.title} style={styles.title.extend({ color: this.primaryTextColor() })} numberOfLines={0} />
      <label value={this.viewModel.message} style={styles.message.extend({ color: this.secondaryTextColor() })} numberOfLines={0} />
      {this.renderBenefits()}
      {this.viewModel.footnote ? <label value={this.viewModel.footnote} style={styles.footnote.extend({ color: this.secondaryTextColor() })} numberOfLines={0} /> : null}
    </view>;
  }

  onRender(): void {
    const bottomInset = Math.max(0, Device.getDisplayBottomInset());
    const showOverlay = this.viewModel.showOverlay ?? BOTTOM_SHEET_DEFAULTS.showOverlay;
    const showHandle = this.viewModel.showHandle ?? BOTTOM_SHEET_DEFAULTS.showHandle;
    const enableGestures = this.viewModel.enableGestures ?? BOTTOM_SHEET_DEFAULTS.enableGestures;
    const roundBottomCorners = this.viewModel.roundBottomCorners ?? BOTTOM_SHEET_DEFAULTS.roundBottomCorners;
    const primaryTone = this.viewModel.primaryButtonTone ?? 'brand';
    const secondaryTone = this.viewModel.secondaryButtonTone ?? (this.viewModel.tone === 'dark' ? 'light' : 'neutral');
    const isScrollable = this.viewModel.contentScrollable ?? false;
    const horizontalActions = this.viewModel.actionLayout === 'horizontal';
    const primaryButtonStyle = this.buttonStyle(primaryTone).extend({
      marginBottom: horizontalActions ? 0 : spacing.sm,
      marginRight: horizontalActions && this.viewModel.secondaryLabel ? spacing.xs : 0,
      width: horizontalActions ? '50%' : '100%',
    });
    const secondaryButtonStyle = this.buttonStyle(secondaryTone).extend({
      marginBottom: 0,
      marginLeft: horizontalActions ? spacing.xs : 0,
      width: horizontalActions ? '50%' : '100%',
    });
    const sheetStyle = bottomSheetSurfaceStyle.extend({
      backgroundColor: this.surfaceColor(),
      borderRadius: roundBottomCorners ? radius.xl : `${radius.xl} ${radius.xl} 0 0`,
      flexDirection: 'column',
      height: this.viewModel.sheetHeight ?? '90%',
      maxHeight: '96%',
      paddingBottom: bottomInset + spacing.lg,
      paddingLeft: spacing.xl,
      paddingRight: spacing.xl,
      paddingTop: spacing.md,
    });

    <layout style={styles.root}>
      {showOverlay ? (
        <view
          style={styles.overlay}
          opacity={this.viewModel.overlayOpacity ?? BOTTOM_SHEET_DEFAULTS.overlayOpacity}
          onTapDisabled={!enableGestures || this.viewModel.dismissOnOverlayTap === false || this.actionPending}
          onTap={this.handleOverlayTap}
        />
      ) : null}
      <view
        ref={this.sheetRef}
        style={sheetStyle}
        onDragDisabled={!enableGestures || this.actionPending}
        onDrag={this.handleDrag}
      >
        {showHandle ? (
          <layout style={styles.handleContainer}>
            <view style={styles.handle.extend({ backgroundColor: this.viewModel.tone === 'dark' ? colors.backgroundTertiary : colors.borderDefault })} />
          </layout>
        ) : null}
        <layout style={styles.topBar}>
          <view style={styles.topBarSpacer} />
          {this.viewModel.showCloseButton !== false ? (
            <view
              style={styles.closeButton.extend({ backgroundColor: this.surfaceSecondary() })}
              onTap={this.dismiss}
              onTapDisabled={this.actionPending}
              accessibilityCategory="button"
              accessibilityLabel="Fermer"
              accessibilityStateDisabled={this.actionPending}
            >
              <image src={navigationIcons.cancel01} tint={this.primaryTextColor()} width={18} height={18} objectFit="contain" />
            </view>
          ) : <view style={styles.topBarSpacer} />}
        </layout>
        {isScrollable ? (
          <scroll {...noBounceScrollAttributes} style={styles.bodyScroll} showsVerticalScrollIndicator={false}>
            {this.renderBody()}
          </scroll>
        ) : (
          <view style={styles.bodyStatic}>
            {this.renderBody()}
          </view>
        )}
        <layout style={horizontalActions ? styles.actionsHorizontal : styles.actionsVertical}>
          <AsyncActionButton
            title={this.viewModel.primaryLabel}
            onTap={() => this.runAction('primary')}
            buttonStyle={primaryButtonStyle}
            labelStyle={this.buttonLabelStyle(primaryTone)}
            contentStyle={styles.actionContent}
            icon={this.viewModel.primaryIcon}
            iconSize={this.viewModel.primaryIconSize ?? 18}
            iconTint={this.buttonTextColor(primaryTone)}
            spinnerColor={this.buttonTextColor(primaryTone)}
            disabled={this.state.pendingAction !== ''}
            loading={this.state.pendingAction === 'primary'}
            textCase="none"
          />
          {this.viewModel.secondaryLabel ? (
            <AsyncActionButton
              title={this.viewModel.secondaryLabel}
              onTap={() => this.runAction('secondary')}
              buttonStyle={secondaryButtonStyle}
              labelStyle={this.buttonLabelStyle(secondaryTone)}
              contentStyle={styles.actionContent}
              icon={this.viewModel.secondaryIcon}
              iconSize={this.viewModel.secondaryIconSize ?? 18}
              iconTint={this.buttonTextColor(secondaryTone)}
              spinnerColor={this.buttonTextColor(secondaryTone)}
              disabled={this.state.pendingAction !== ''}
              loading={this.state.pendingAction === 'secondary'}
              textCase="none"
            />
          ) : null}
        </layout>
      </view>
    </layout>;
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

const styles = {
  root: new Style<Layout>({ height: '100%', width: '100%' }),
  overlay: new Style<View>({ backgroundColor: colors.backgroundOverlay, bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }),
  handleContainer: new Style<Layout>({ alignItems: 'center', flexShrink: 0, height: 12, justifyContent: 'center', width: '100%' }),
  handle: new Style<View>({ borderRadius: radius.full, height: 5, width: 48 }),
  topBar: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', flexShrink: 0, height: 42, justifyContent: 'space-between', marginBottom: spacing.sm, width: '100%' }),
  topBarSpacer: new Style<View>({ height: 38, width: 38 }),
  closeButton: new Style<View>({ alignItems: 'center', borderRadius: radius.full, height: 38, justifyContent: 'center', width: 38 }),
  bodyScroll: new Style<ScrollView>({ flexGrow: 1, flexShrink: 1, width: '100%' }),
  bodyStatic: new Style<View>({ flexGrow: 1, flexShrink: 1, width: '100%' }),
  bodyContent: new Style<View>({ alignItems: 'center', flexDirection: 'column', flexGrow: 1, flexShrink: 0, paddingBottom: spacing.md, width: '100%' }),
  mediaFrame: new Style<View>({ alignItems: 'center', borderRadius: radius.lg, flexShrink: 0, justifyContent: 'center', marginBottom: spacing.xl, maxHeight: 300, width: '100%' }),
  mediaImage: new Style<ImageView>({ borderRadius: radius.lg, height: '100%', width: '100%' }),
  mediaAnimated: new Style<AnimatedImage>({ borderRadius: radius.lg, height: '100%', width: '100%' }),
  mediaVideo: new Style<View>({ borderRadius: radius.lg, height: '100%', width: '100%' }),
  mediaLoading: new Style<View>({ alignItems: 'center', bottom: 0, justifyContent: 'center', left: 0, position: 'absolute', right: 0, top: 0 }),
  spinner: new Style<SpinnerView>({ height: 28, width: 28 }),
  mediaFallback: new Style<View>({ alignItems: 'center', bottom: 0, justifyContent: 'center', left: 0, position: 'absolute', right: 0, top: 0 }),
  mediaFallbackLabel: new Style<Label>({ font: montserrat.semiBold(fontSize.metadata), textAlign: 'center' }),
  eyebrowContainer: new Style<View>({ alignSelf: 'center', borderRadius: radius.xs, marginBottom: spacing.sm, paddingBottom: spacing.xs, paddingLeft: spacing.sm, paddingRight: spacing.sm, paddingTop: spacing.xs }),
  eyebrow: new Style<Label>({ font: montserrat.semiBold(fontSize.metadata), textAlign: 'center' }),
  title: new Style<Label>({ alignSelf: 'center', font: montserrat.extraBold(fontSize.section), marginBottom: spacing.sm, textAlign: 'center' }),
  message: new Style<Label>({ alignSelf: 'center', font: montserrat.regular(fontSize.product), marginBottom: spacing.md, textAlign: 'center' }),
  benefits: new Style<View>({ flexDirection: 'column', marginBottom: spacing.md, width: '100%' }),
  benefitRow: new Style<Layout>({ alignItems: 'flex-start', flexDirection: 'row', marginBottom: spacing.md, width: '100%' }),
  benefitMark: new Style<View>({ borderRadius: radius.full, height: 8, marginRight: spacing.md, marginTop: 6, width: 8 }),
  benefitCopy: new Style<View>({ flexDirection: 'column', flexGrow: 1, flexShrink: 1 }),
  benefitTitle: new Style<Label>({ font: montserrat.semiBold(fontSize.body) }),
  benefitDescription: new Style<Label>({ font: montserrat.regular(fontSize.metadata), marginTop: spacing.xs }),
  footnote: new Style<Label>({ font: montserrat.regular(fontSize.tiny), marginBottom: spacing.sm, textAlign: 'center' }),
  actionsVertical: new Style<Layout>({ flexDirection: 'column', flexShrink: 0, width: '100%' }),
  actionsHorizontal: new Style<Layout>({ flexDirection: 'row', flexShrink: 0, width: '100%' }),
  actionButton: new Style<View>({ alignItems: 'center', borderRadius: radius.full, flexGrow: 1, flexShrink: 1, justifyContent: 'center', minHeight: 50, paddingBottom: spacing.sm, paddingLeft: spacing.lg, paddingRight: spacing.lg, paddingTop: spacing.sm }),
  actionLabel: new Style<Label>({ font: montserrat.semiBold(fontSize.product), textAlign: 'center' }),
  actionContent: new Style<View>({ alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }),
};
