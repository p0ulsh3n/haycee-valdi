import { StatefulComponent } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { Label, Layout, View } from 'valdi_tsx/src/NativeTemplateElements';
import { colors } from '../../design-system/tokens/colors';
import { radius } from '../../design-system/tokens/radius';
import { spacing } from '../../design-system/tokens/spacing';
import { fontSize, montserrat } from '../../design-system/tokens/typography';

export interface JoinAlertViewModel {
  username: string;
}

interface JoinAlertState {
  isVisible: boolean;
}

/** Short, isolated viewer-arrival notice, matching the segmented Live engine pattern. */
export class JoinAlert extends StatefulComponent<JoinAlertViewModel, JoinAlertState> {
  state: JoinAlertState = { isVisible: true };

  onCreate(): void {
    this.setTimeoutDisposable(() => this.setState({ isVisible: false }), 4200);
  }

  onRender(): void {
    if (!this.state.isVisible) return;

    const initial = this.viewModel.username.charAt(0).toUpperCase();
    <view style={styles.pill} touchEnabled={false}>
      <view style={styles.avatar}>
        <label value={initial} style={styles.avatarLabel} numberOfLines={1} />
      </view>
      <layout style={styles.copy}>
        <label value={this.viewModel.username} style={styles.username} numberOfLines={1} />
        <label value="vient de rejoindre le live" style={styles.message} numberOfLines={1} />
      </layout>
    </view>;
  }
}

const styles = {
  pill: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.liveControlSurface,
    borderRadius: radius.full,
    flexDirection: 'row',
    paddingBottom: spacing.xs,
    paddingLeft: spacing.xs,
    paddingRight: spacing.md,
    paddingTop: spacing.xs,
  }),
  avatar: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.livePanelLavender,
    borderRadius: radius.full,
    height: 28,
    justifyContent: 'center',
    marginRight: spacing.sm,
    width: 28,
  }),
  avatarLabel: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.metadata) }),
  copy: new Style<Layout>({ flexDirection: 'column' }),
  username: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.product) }),
  message: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.nano) }),
};
