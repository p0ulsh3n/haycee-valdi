import { StatefulComponent } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { Asset } from 'valdi_tsx/src/Asset';
import { Label, SpinnerView, View } from 'valdi_tsx/src/NativeTemplateElements';
import { spacing } from '../tokens/spacing';

export interface AsyncActionButtonViewModel {
  title: string;
  onTap: () => void | Promise<unknown>;
  buttonStyle: Style<View>;
  labelStyle: Style<Label>;
  contentStyle: Style<View>;
  iconStyle?: Style<View>;
  icon?: string | Asset;
  iconSize?: number;
  iconTint?: string;
  iconAlignment?: 'centered' | 'fixedLeading';
  spinnerColor: string;
  accessibilityLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  interactionDisabled?: boolean;
  textCase?: 'upper' | 'lower' | 'capitalize' | 'none';
}

interface AsyncActionButtonState {
  isLoading: boolean;
}

const spinnerStyle = new Style<SpinnerView>({ height: 20, width: 20 });

/**
 * Shared action button. Pending actions are single-flight; the hidden label
 * stays in layout under the native spinner so the button never resizes.
 */
export class AsyncActionButton extends StatefulComponent<AsyncActionButtonViewModel, AsyncActionButtonState> {
  state: AsyncActionButtonState = { isLoading: false };
  private invocationPending = false;

  private handleTap = (): void => {
    if (this.isInteractionBlocked()) return;

    this.invocationPending = true;
    try {
      const result = this.viewModel.onTap();
      if (!result || typeof result.then !== 'function') {
        this.invocationPending = false;
        return;
      }

      this.setState({ isLoading: true });
      void result.then(this.finishAction, this.finishAction);
    } catch (error) {
      this.finishAction();
      throw error;
    }
  };

  private finishAction = (): void => {
    this.invocationPending = false;
    if (!this.isDestroyed()) this.setState({ isLoading: false });
  };

  private isLoading = (): boolean => Boolean(this.state.isLoading || this.viewModel.loading);

  private isInteractionBlocked = (): boolean => Boolean(
    this.invocationPending || this.isLoading() || this.viewModel.disabled || this.viewModel.interactionDisabled,
  );

  onRender(): void {
    const loading = this.isLoading();
    const interactionBlocked = this.isInteractionBlocked();
    const { title, icon, iconSize = 18, iconTint, spinnerColor, accessibilityLabel } = this.viewModel;
    const fixedLeadingIcon = this.viewModel.iconAlignment === 'fixedLeading';
    const contentStyle = fixedLeadingIcon
      ? styles.fixedLeadingContent
      : this.viewModel.contentStyle;
    const iconStyle = fixedLeadingIcon
      ? styles.fixedLeadingIcon.extend({ width: iconSize + spacing.sm })
      : this.viewModel.iconStyle;
    const labelStyle = fixedLeadingIcon
      ? this.viewModel.labelStyle.extend({ flexGrow: 1, flexShrink: 1, textAlign: 'center' })
      : this.viewModel.labelStyle;

    <view
      style={this.viewModel.buttonStyle}
      onTap={this.handleTap}
      onTapDisabled={interactionBlocked}
      accessibilityCategory="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityStateDisabled={interactionBlocked}
    >
      <view style={contentStyle} opacity={loading ? 0 : 1}>
        {icon ? (
          <view style={iconStyle}>
            <image src={icon} tint={iconTint} width={iconSize} height={iconSize} objectFit="contain" />
          </view>
        ) : null}
        <label value={this.viewModel.title} style={labelStyle} numberOfLines={1} />
      </view>
      {loading ? (
        <view style={styles.spinnerOverlay}>
          <spinner color={spinnerColor} style={spinnerStyle} />
        </view>
      ) : null}
    </view>;
  }
}

const styles = {
  fixedLeadingContent: new Style<View>({ alignItems: 'center', flexDirection: 'row', width: '100%' }),
  fixedLeadingIcon: new Style<View>({ alignItems: 'center', flexShrink: 0, justifyContent: 'center' }),
  spinnerOverlay: new Style<View>({ alignItems: 'center', bottom: 0, justifyContent: 'center', left: 0, position: 'absolute', right: 0, top: 0 }),
};
