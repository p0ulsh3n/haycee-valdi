import { Device } from 'valdi_core/src/Device';
import { AnimationCurve } from 'valdi_core/src/AnimationOptions';
import { ElementRef } from 'valdi_core/src/ElementRef';
import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageStatefulComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { Style } from 'valdi_core/src/Style';
import { DragEvent, TouchEventState } from 'valdi_tsx/src/GestureEvents';
import { Label, Layout, View } from 'valdi_tsx/src/NativeTemplateElements';
import { BOTTOM_SHEET_DEFAULTS, bottomSheetSurfaceStyle } from '../../design-system/components/BottomSheet';
import { colors } from '../../design-system/tokens/colors';
import { radius } from '../../design-system/tokens/radius';
import { spacing } from '../../design-system/tokens/spacing';
import { fontSize, montserrat } from '../../design-system/tokens/typography';
import { DSButton } from '../../design-system/components/DSButton';
import { registerLiveSheet } from '../LiveSheetVisibility';

export interface LiveFollowPromptSheetViewModel {
  sellerName: string;
  sellerAvatarUrl?: string;
  onFollow: () => void;
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
      this.dismiss();
    } catch (error) {
      this.setState({ isActionPending: false });
      throw error;
    }
  };

  onRender(): void {
    const bottomInset = Math.max(0, Device.getDisplayBottomInset());
    const showOverlay = this.viewModel.showOverlay ?? BOTTOM_SHEET_DEFAULTS.showOverlay;
    const showHandle = this.viewModel.showHandle ?? BOTTOM_SHEET_DEFAULTS.showHandle;
    const enableGestures = this.viewModel.enableGestures ?? BOTTOM_SHEET_DEFAULTS.enableGestures;
    const roundBottomCorners = this.viewModel.roundBottomCorners ?? BOTTOM_SHEET_DEFAULTS.roundBottomCorners;
    const sheetStyle = bottomSheetSurfaceStyle.extend({
      backgroundColor: colors.backgroundPrimary,
      borderRadius: roundBottomCorners ? radius.xl : `${radius.xl} ${radius.xl} 0 0`,
      flexDirection: 'column',
      height: '36%',
      justifyContent: 'center',
      paddingBottom: bottomInset + spacing.lg,
      paddingLeft: spacing.xl,
      paddingRight: spacing.xl,
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
  handleContainer: new Style<Layout>({ alignItems: 'center', paddingBottom: spacing.lg, width: '100%' }),
  handle: new Style<View>({ backgroundColor: colors.borderDefault, borderRadius: radius.full, height: 5, width: 48 }),
};
