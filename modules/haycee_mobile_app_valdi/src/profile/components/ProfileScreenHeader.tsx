import { AnimationCurve } from 'valdi_core/src/AnimationOptions';
import { StatefulComponent } from 'valdi_core/src/Component';
import { Device } from 'valdi_core/src/Device';
import { ElementRef } from 'valdi_core/src/ElementRef';
import { Style } from 'valdi_core/src/Style';
import { ElementFrame } from 'valdi_tsx/src/Geometry';
import { Label, Layout, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../../res/navigation-icons';
import { colors } from '../../design-system/tokens/colors';
import { radius } from '../../design-system/tokens/radius';
import { layout, spacing } from '../../design-system/tokens/spacing';
import { montserrat, fontSize } from '../../design-system/tokens/typography';

export interface ProfileScreenHeaderViewModel {
  displayName: string;
  avatarUrl?: string;
  headerBackgroundVisible: boolean;
  stickyIdentityVisible: boolean;
  onHeaderLayout?: (frame: ElementFrame) => void;
  onSupportTap?: () => void;
  onShareTap?: () => void;
  onSettingsTap?: () => void;
}

interface ProfileScreenHeaderState {
  headerBackgroundVisible: boolean;
  stickyIdentityVisible: boolean;
}

/** Transparent over the profile cover, then white with the profile identity on scroll. */
export class ProfileScreenHeader extends StatefulComponent<ProfileScreenHeaderViewModel, ProfileScreenHeaderState> {
  state: ProfileScreenHeaderState = { headerBackgroundVisible: false, stickyIdentityVisible: false };
  private readonly headerBackgroundRef = new ElementRef<View>();
  private readonly stickyIdentityRef = new ElementRef<View>();

  onCreate(): void {
    this.state = {
      headerBackgroundVisible: this.viewModel.headerBackgroundVisible,
      stickyIdentityVisible: this.viewModel.stickyIdentityVisible,
    };
  }

  onViewModelUpdate(previous?: ProfileScreenHeaderViewModel): void {
    const nextBackgroundVisible = this.viewModel.headerBackgroundVisible;
    const nextIdentityVisible = this.viewModel.stickyIdentityVisible;
    const backgroundChanged = previous?.headerBackgroundVisible !== nextBackgroundVisible;
    const identityChanged = previous?.stickyIdentityVisible !== nextIdentityVisible;
    if (backgroundChanged || identityChanged) {
      this.setState({
        headerBackgroundVisible: nextBackgroundVisible,
        stickyIdentityVisible: nextIdentityVisible,
      });
    }
    if (backgroundChanged) {
      const background = this.headerBackgroundRef.single();
      if (background) {
        this.animate(
          { duration: 0.2, curve: AnimationCurve.EaseInOut, beginFromCurrentState: true },
          () => background.setAttribute('opacity', nextBackgroundVisible ? 1 : 0),
        );
      }
    }
    if (identityChanged) {
      const identity = this.stickyIdentityRef.single();
      if (identity) {
        this.animate(
          { duration: 0.24, curve: AnimationCurve.EaseOut, beginFromCurrentState: true },
          () => {
            identity.setAttribute('opacity', nextIdentityVisible ? 1 : 0);
            identity.setAttribute('translationY', nextIdentityVisible ? 0 : 6);
          },
        );
      }
    }
  }

  onRender(): void {
    const topInset = Math.max(0, Device.getDisplayTopInset());
    const iconTint = this.state.headerBackgroundVisible ? colors.iconDefault : colors.textInverted;

    <view style={styles.overlay}>
      <view
        style={styles.header.extend({ paddingTop: topInset + layout.profile.header.topPadding })}
        onLayout={this.viewModel.onHeaderLayout}
      >
        <view
          ref={this.headerBackgroundRef}
          style={styles.headerBackground.extend({ opacity: this.state.headerBackgroundVisible ? 1 : 0 })}
        />
        <layout style={styles.row}>
          <view
            ref={this.stickyIdentityRef}
            style={styles.identity.extend({
              opacity: this.state.stickyIdentityVisible ? 1 : 0,
              translationY: this.state.stickyIdentityVisible ? 0 : 6,
            })}
          >
            {this.viewModel.avatarUrl ? (
              <image src={this.viewModel.avatarUrl} style={styles.avatar} objectFit="cover" />
            ) : (
              <view style={styles.avatarFallback}>
                <image src={navigationIcons.profileUser} tint={colors.textSecondary} width={16} height={16} objectFit="contain" />
              </view>
            )}
            <label value={this.viewModel.displayName} style={styles.name} numberOfLines={1} />
          </view>
          <layout style={styles.actions}>
            <view
              style={styles.action}
              onTap={this.viewModel.onSupportTap}
              accessibilityCategory="button"
              accessibilityLabel="Service client"
            >
              <image src={navigationIcons.customerSupport} tint={iconTint} width={22} height={22} objectFit="contain" />
            </view>
            <view
              style={styles.action}
              onTap={this.viewModel.onShareTap}
              accessibilityCategory="button"
              accessibilityLabel="Partager mon profil"
            >
              <image src={navigationIcons.share01} tint={iconTint} width={22} height={22} objectFit="contain" />
            </view>
            <view
              style={styles.action}
              onTap={this.viewModel.onSettingsTap}
              accessibilityCategory="button"
              accessibilityLabel="Paramètres"
            >
              <image src={navigationIcons.preferenceHorizontal} tint={iconTint} width={22} height={22} objectFit="contain" />
            </view>
          </layout>
        </layout>
      </view>
    </view>;
  }
}

const styles = {
  overlay: new Style<View>({ left: 0, position: 'absolute', right: 0, top: 0, zIndex: 2 }),
  header: new Style<View>({
    minHeight: 56,
    paddingBottom: layout.profile.header.bottomPadding,
    paddingLeft: layout.profile.header.horizontalPadding,
    paddingRight: layout.profile.header.horizontalPadding,
    position: 'relative',
  }),
  headerBackground: new Style<View>({
    backgroundColor: colors.backgroundPrimary,
    bottom: 0,
    left: 0,
    opacity: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  }),
  row: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', minHeight: layout.profile.header.actionSize, position: 'relative', width: '100%' }),
  identity: new Style<View>({
    alignItems: 'center',
    flexDirection: 'row',
    flexGrow: 1,
    flexShrink: 1,
    marginRight: spacing.md,
    opacity: 0,
    translationY: 6,
  }),
  avatar: new Style<View>({ borderRadius: radius.full, flexShrink: 0, height: 30, width: 30 }),
  avatarFallback: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.full,
    flexShrink: 0,
    height: 30,
    justifyContent: 'center',
    width: 30,
  }),
  name: new Style<Label>({ color: colors.textPrimary, flexShrink: 1, font: montserrat.extraBold(fontSize.body), marginLeft: spacing.sm }),
  actions: new Style<Layout>({ alignItems: 'center', flexDirection: 'row' }),
  action: new Style<View>({
    alignItems: 'center',
    height: layout.profile.header.actionSize,
    justifyContent: 'center',
    marginLeft: layout.profile.header.actionGap,
    width: layout.profile.header.actionSize,
  }),
};
