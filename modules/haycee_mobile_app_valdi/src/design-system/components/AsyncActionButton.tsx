import { StatefulComponent } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { Asset } from 'valdi_tsx/src/Asset';
import { Label, SpinnerView, View } from 'valdi_tsx/src/NativeTemplateElements';

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
  spinnerColor: string;
  accessibilityLabel?: string;
  loading?: boolean;
  disabled?: boolean;
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
    if (this.isBusy()) return;

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

  private isBusy = (): boolean => Boolean(
    this.invocationPending || this.state.isLoading || this.viewModel.loading || this.viewModel.disabled,
  );

  onRender(): void {
    const busy = this.isBusy();
    const { title, icon, iconSize = 18, iconTint, spinnerColor, accessibilityLabel } = this.viewModel;

    <view
      style={this.viewModel.buttonStyle}
      onTap={this.handleTap}
      onTapDisabled={busy}
      accessibilityCategory="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityStateDisabled={busy}
    >
      <view style={this.viewModel.contentStyle} opacity={busy ? 0 : 1}>
        {icon ? (
          <view style={this.viewModel.iconStyle}>
            <image src={icon} tint={iconTint} width={iconSize} height={iconSize} objectFit="contain" />
          </view>
        ) : null}
        <label value={this.viewModel.title} style={this.viewModel.labelStyle} numberOfLines={1} />
      </view>
      {busy ? (
        <view style={styles.spinnerOverlay}>
          <spinner color={spinnerColor} style={spinnerStyle} />
        </view>
      ) : null}
    </view>;
  }
}

const styles = {
  spinnerOverlay: new Style<View>({ alignItems: 'center', bottom: 0, justifyContent: 'center', left: 0, position: 'absolute', right: 0, top: 0 }),
};
