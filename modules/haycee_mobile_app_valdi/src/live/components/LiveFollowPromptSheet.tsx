import { Device } from 'valdi_core/src/Device';
import { AnimationCurve } from 'valdi_core/src/AnimationOptions';
import { ElementRef } from 'valdi_core/src/ElementRef';
import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageStatefulComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { Style } from 'valdi_core/src/Style';
import { DragEvent, TouchEventState } from 'valdi_tsx/src/GestureEvents';
import { Label, Layout, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../../res/navigation-icons';
import { BOTTOM_SHEET_DEFAULTS, bottomSheetSurfaceStyle } from '../../design-system/components/BottomSheet';
import { colors } from '../../design-system/tokens/colors';
import { radius } from '../../design-system/tokens/radius';
import { layout, spacing } from '../../design-system/tokens/spacing';
import { fontSize, montserrat } from '../../design-system/tokens/typography';
import { DSButton } from '../../design-system/components/DSButton';
import { registerLiveSheet } from '../LiveSheetVisibility';

export interface LiveFollowPromptSheetViewModel {
  sellerName: string;
  sellerAvatarUrl?: string;
  onFollow: () => void;
  /** Selects the follow-or-exit confirmation used by the Live close action. */
  mode?: 'follow-prompt' | 'exit-confirmation';
  /** The owning Live page exits after the sheet has finished dismissing. */
  onExit?: () => void;
  showOverlay?: boolean;
  showHandle?: boolean;
  enableGestures?: boolean;
  roundBottomCorners?: boolean;
  overlayOpacity?: number;
}

interface LiveFollowPromptSheetState {
  isActionPending: boolean;
}

/** One-shot follow invitation presented above a live when the viewer is not following. */
@NavigationPage(module)
export class LiveFollowPromptSheet extends NavigationPageStatefulComponent<
  LiveFollowPromptSheetViewModel,
  LiveFollowPromptSheetState
> {
  state: LiveFollowPromptSheetState = { isActionPending: false };
  private readonly sheetRef = new ElementRef<View>();
  private isDismissing = false;
  private releaseSheetRegistration?: () => void;

  onCreate(): void {
    this.releaseSheetRegistration = registerLiveSheet();
  }

  onDestroy(): void {
    this.releaseSheetRegistration?.();
    this.releaseSheetRegistration = undefined;
  }

  private handleDrag = (event: DragEvent): void => {
    const sheet = this.sheetRef.single();
    if (!sheet) return;

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

  private dismiss = (): void => {
    if (this.isDismissing) return;
    this.isDismissing = true;
    this.navigationController.dismiss(true);
  };

  private handleFollow = (): void => {
    if (this.state.isActionPending || this.isDismissing) return;
    this.setState({ isActionPending: true });
    try {
      this.viewModel.onFollow();
      if (this.viewModel.mode === 'exit-confirmation') this.viewModel.onExit?.();
      this.dismiss();
    } catch (error) {
      this.setState({ isActionPending: false });
      throw error;
    }
  };

  private handleExit = (): void => {
    if (this.state.isActionPending || this.isDismissing) return;
    this.setState({ isActionPending: true });
    try {
      this.viewModel.onExit?.();
      this.dismiss();
    } catch (error) {
      this.setState({ isActionPending: false });
      throw error;
    }
  };

  private renderExitConfirmation(bottomInset: number): void {
    <view style={styles.exitContent}>
      <view style={styles.exitIllustration}>
        <view style={styles.exitAvatarGroup}>
          <view style={styles.exitAvatar.extend({
            height: layout.live.viewer.exitFollowSheet.avatarSize,
            width: layout.live.viewer.exitFollowSheet.avatarSize,
          })}>
            {this.viewModel.sellerAvatarUrl ? (
              <image src={this.viewModel.sellerAvatarUrl} style={styles.exitAvatarImage} objectFit="cover" />
            ) : (
              <label value={sellerInitials(this.viewModel.sellerName)} style={styles.exitAvatarInitials} numberOfLines={1} />
            )}
          </view>
          <view style={styles.hostBadge}>
            <image src={navigationIcons.store03} tint={colors.textInverted} width={14} height={14} objectFit="contain" />
            <label value="Hôte" style={styles.hostBadgeLabel} numberOfLines={1} />
          </view>
        </view>
      </view>
      <label
        value="Suivez la boutique pour ne pas manquer ses prochaines ventes en direct !"
        style={styles.exitMessage}
        numberOfLines={2}
      />
      <view style={styles.exitActions}>
        <DSButton
          title="Suivre et quitter"
          variant="cta"
          size="fullWidth"
          textCase="none"
          onTap={this.handleFollow}
          disabled={this.state.isActionPending || this.isDismissing}
          accessibilityLabel={`Suivre ${this.viewModel.sellerName} et quitter le Live`}
        />
        <view style={styles.exitSecondaryAction}>
          <DSButton
            title="Quitter le live"
            variant="outline"
            size="fullWidth"
            textCase="none"
            onTap={this.handleExit}
            disabled={this.state.isActionPending || this.isDismissing}
          />
        </view>
      </view>
      <view style={styles.exitBottomSpace.extend({ height: bottomInset })} />
    </view>;
  }

  private renderFollowPrompt(showHandle: boolean): void {
    <layout style={styles.promptContent}>
      {showHandle ? (
        <layout style={styles.handleContainer}>
          <view style={styles.handle} />
        </layout>
      ) : null}
      <view style={styles.avatar}>
        {this.viewModel.sellerAvatarUrl ? (
          <image src={this.viewModel.sellerAvatarUrl} style={styles.avatarImage} objectFit="cover" />
        ) : (
          <label value={sellerInitials(this.viewModel.sellerName)} style={styles.avatarInitials} numberOfLines={1} />
        )}
      </view>
      <label value="Suis ce vendeur !" style={styles.title} numberOfLines={1} />
      <label
        value={`Tu aimes ce live ? Suis ${this.viewModel.sellerName} pour être au courant de ses prochains lives !`}
        style={styles.message}
        numberOfLines={2}
      />
      <layout style={styles.actions}>
        <DSButton
          title="Pas maintenant"
          variant="outline"
          size="fullWidth"
          textCase="none"
          marginRight={spacing.sm}
          onTap={this.dismiss}
          disabled={this.state.isActionPending || this.isDismissing}
        />
        <DSButton
          title="Suivre le vendeur"
          variant="cta"
          size="fullWidth"
          textCase="none"
          marginLeft={spacing.sm}
          onTap={this.handleFollow}
          disabled={this.state.isActionPending || this.isDismissing}
        />
      </layout>
    </layout>;
  }

  onRender(): void {
    const bottomInset = Math.max(0, Device.getDisplayBottomInset());
    const showOverlay = this.viewModel.showOverlay ?? BOTTOM_SHEET_DEFAULTS.showOverlay;
    const showHandle = this.viewModel.showHandle ?? BOTTOM_SHEET_DEFAULTS.showHandle;
    const enableGestures = this.viewModel.enableGestures ?? BOTTOM_SHEET_DEFAULTS.enableGestures;
    const roundBottomCorners = this.viewModel.roundBottomCorners ?? BOTTOM_SHEET_DEFAULTS.roundBottomCorners;
    const isExitConfirmation = this.viewModel.mode === 'exit-confirmation';
    const sheetStyle = bottomSheetSurfaceStyle.extend({
      backgroundColor: colors.backgroundPrimary,
      borderRadius: roundBottomCorners ? radius.xl : `${radius.xl} ${radius.xl} 0 0`,
      flexDirection: 'column',
      height: isExitConfirmation ? layout.live.viewer.exitFollowSheet.height : '36%',
      justifyContent: isExitConfirmation ? 'flex-start' : 'center',
      paddingBottom: isExitConfirmation ? spacing.sm : bottomInset + spacing.lg,
      paddingLeft: isExitConfirmation ? spacing.lg : spacing.xl,
      paddingRight: isExitConfirmation ? spacing.lg : spacing.xl,
      paddingTop: spacing.lg,
    });

    <view style={styles.root}>
      {showOverlay ? (
        <view
          style={styles.scrim}
          opacity={this.viewModel.overlayOpacity ?? BOTTOM_SHEET_DEFAULTS.overlayOpacity}
          onTapDisabled={!enableGestures}
          onTap={this.dismiss}
        />
      ) : null}
      <view
        ref={this.sheetRef}
        style={sheetStyle}
        onDragDisabled={!enableGestures}
        onDrag={this.handleDrag}
      >
        {isExitConfirmation ? this.renderExitConfirmation(bottomInset) : this.renderFollowPrompt(showHandle)}
      </view>
    </view>;
  }
}

function sellerInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
}

const styles = {
  root: new Style<Layout>({ height: '100%', width: '100%' }),
  scrim: new Style<View>({
    backgroundColor: colors.backgroundOverlay,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  }),
  avatar: new Style<View>({
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.full,
    height: 48,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: 48,
  }),
  avatarImage: new Style<View>({ borderRadius: radius.full, height: '100%', width: '100%' }),
  avatarInitials: new Style<Label>({ color: colors.textSecondary, font: montserrat.semiBold(fontSize.body) }),
  title: new Style<Label>({
    alignSelf: 'center',
    color: colors.textPrimary,
    font: montserrat.extraBold(fontSize.product),
    marginBottom: spacing.sm,
    textAlign: 'center',
  }),
  message: new Style<Label>({
    alignSelf: 'center',
    color: colors.textSecondary,
    font: montserrat.semiBold(fontSize.metadata),
    marginBottom: spacing.lg,
    textAlign: 'center',
  }),
  actions: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', width: '100%' }),
  promptContent: new Style<Layout>({ alignItems: 'center', flexDirection: 'column', width: '100%' }),
  handleContainer: new Style<Layout>({ alignItems: 'center', paddingBottom: spacing.lg, width: '100%' }),
  handle: new Style<View>({ backgroundColor: colors.borderDefault, borderRadius: radius.full, height: 5, width: 48 }),
  exitContent: new Style<Layout>({ alignItems: 'center', flexDirection: 'column', width: '100%' }),
  exitIllustration: new Style<View>({
    alignItems: 'center',
    height: layout.live.viewer.exitFollowSheet.illustrationHeight,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: '100%',
  }),
  exitAvatarGroup: new Style<View>({
    height: layout.live.viewer.exitFollowSheet.avatarSize,
    position: 'relative',
    width: layout.live.viewer.exitFollowSheet.avatarSize,
  }),
  exitAvatar: new Style<View>({
    alignItems: 'center',
    borderRadius: radius.full,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    top: 0,
  }),
  exitAvatarImage: new Style<View>({ borderRadius: radius.full, height: '100%', width: '100%' }),
  exitAvatarInitials: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.section) }),
  hostBadge: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.offerWarning,
    borderRadius: radius.full,
    bottom: -spacing.xs,
    flexDirection: 'row',
    justifyContent: 'center',
    left: (layout.live.viewer.exitFollowSheet.avatarSize - layout.live.viewer.exitFollowSheet.badgeWidth) / 2,
    paddingBottom: 2,
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
    paddingTop: 2,
    position: 'absolute',
    width: layout.live.viewer.exitFollowSheet.badgeWidth,
  }),
  hostBadgeLabel: new Style<Label>({ color: colors.textInverted, font: montserrat.semiBold(fontSize.metadata), marginLeft: spacing.xs }),
  exitMessage: new Style<Label>({
    alignSelf: 'center',
    color: colors.textPrimary,
    font: montserrat.extraBold(fontSize.product),
    marginBottom: spacing.md,
    textAlign: 'center',
  }),
  exitActions: new Style<Layout>({ alignItems: 'center', flexDirection: 'column', width: '100%' }),
  exitSecondaryAction: new Style<View>({ marginTop: spacing.sm, width: '100%' }),
  exitBottomSpace: new Style<View>({ flexShrink: 0, width: '100%' }),
};
