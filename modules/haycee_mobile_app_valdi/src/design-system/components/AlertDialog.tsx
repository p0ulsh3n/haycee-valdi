import { Style } from 'valdi_core/src/Style';
import { when } from 'valdi_core/src/utils/When';
import { Label, Layout, View } from 'valdi_tsx/src/NativeTemplateElements';
import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { spacing } from '../tokens/spacing';
import { transformText, typography, TextCase } from '../tokens/typography';

export interface AlertDialogViewModel {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Defaults to `upper` for all dialog text. */
  textCase?: TextCase;
  confirmStyle?: 'default' | 'danger';
  /** Defaults to false to match the transparent presentation used by the clean sheet. */
  showOverlay?: boolean;
  /** Used only when showOverlay is true. */
  overlayOpacity?: number;
  dismissOnOverlayTap?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

@NavigationPage(module)
export class AlertDialog extends NavigationPageComponent<AlertDialogViewModel> {
  private handleConfirm = (): void => {
    this.viewModel.onConfirm();
    this.navigationController.dismiss(true);
  };

  private handleCancel = (): void => {
    this.viewModel.onCancel?.();
    this.navigationController.dismiss(true);
  };

  private handleOverlayTap = (): void => {
    if (this.viewModel.dismissOnOverlayTap !== false) {
      this.handleCancel();
    }
  };

  onRender(): void {
    <layout style={styles.root}>
      {when(this.viewModel.showOverlay === true, () => {
        <view
          style={styles.overlay}
          opacity={this.viewModel.overlayOpacity ?? 0.56}
          onTap={this.handleOverlayTap}
        />;
      })}
      <view style={styles.container}>
        <layout style={styles.header}>
          <label
            style={styles.title}
            value={transformText(this.viewModel.title, this.viewModel.textCase)}
            numberOfLines={0}
          />
          {when(this.viewModel.message, message => {
            <label
              style={styles.message}
              value={transformText(message, this.viewModel.textCase)}
              numberOfLines={0}
            />;
          })}
        </layout>
        <view style={styles.divider} />
        <layout style={styles.actions}>
          <view style={styles.action} onTap={this.handleCancel} accessibilityCategory="button">
            <label
              style={styles.cancelLabel}
              value={transformText(this.viewModel.cancelLabel ?? 'Annuler', this.viewModel.textCase)}
              numberOfLines={1}
            />
          </view>
          <view style={styles.actionDivider} />
          <view style={styles.action} onTap={this.handleConfirm} accessibilityCategory="button">
            <label
              style={
                this.viewModel.confirmStyle === 'danger' ? styles.dangerLabel : styles.confirmLabel
              }
              value={transformText(
                this.viewModel.confirmLabel ?? 'Confirmer',
                this.viewModel.textCase,
              )}
              numberOfLines={1}
            />
          </view>
        </layout>
      </view>
    </layout>;
  }
}

const styles = {
  root: new Style<Layout>({
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  }),
  overlay: new Style<View>({
    backgroundColor: colors.backgroundOverlay,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  }),
  container: new Style<View>({
    backgroundColor: colors.backgroundPrimary,
    borderRadius: radius.lg,
    boxShadow: '0 3 12 rgba(0, 0, 0, 0.24)',
    marginLeft: spacing.xl,
    marginRight: spacing.xl,
    width: '100%',
  }),
  header: new Style<Layout>({
    alignItems: 'center',
    padding: spacing.xl,
  }),
  title: typography.headline.extend({ textAlign: 'center' }),
  message: typography.body.extend({
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  }),
  divider: new Style<View>({
    backgroundColor: colors.borderDefault,
    height: 1,
  }),
  actions: new Style<Layout>({
    flexDirection: 'row',
    height: 56,
  }),
  action: new Style<View>({
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
  }),
  actionDivider: new Style<View>({
    backgroundColor: colors.borderDefault,
    width: 1,
  }),
  cancelLabel: typography.button.extend({ color: colors.borderFocus }),
  confirmLabel: typography.button.extend({ color: colors.borderFocus }),
  dangerLabel: typography.button.extend({ color: colors.textDanger }),
};
