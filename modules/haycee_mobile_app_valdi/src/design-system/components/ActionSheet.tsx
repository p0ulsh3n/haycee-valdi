import { Style } from 'valdi_core/src/Style';
import { createReusableCallback } from 'valdi_core/src/utils/Callback';
import { when } from 'valdi_core/src/utils/When';
import { Label, Layout, View } from 'valdi_tsx/src/NativeTemplateElements';
import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageStatefulComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { spacing } from '../tokens/spacing';
import { transformText, typography, TextCase } from '../tokens/typography';
import { AsyncActionButton } from './AsyncActionButton';

export interface ActionSheetOption {
  label: string;
  style?: 'default' | 'danger' | 'cancel';
  onTap: () => void | Promise<unknown>;
}

export interface ActionSheetViewModel {
  title?: string;
  options: ActionSheetOption[];
  /** Defaults to `upper` for the sheet title and action labels. */
  textCase?: TextCase;
  /** Defaults to false to match the transparent presentation used by the clean sheet. */
  showOverlay?: boolean;
  /** Used only when showOverlay is true. */
  overlayOpacity?: number;
  dismissOnOverlayTap?: boolean;
}

interface ActionSheetState {
  pendingOptionIndex: number;
}

@NavigationPage(module)
export class ActionSheet extends NavigationPageStatefulComponent<ActionSheetViewModel, ActionSheetState> {
  state: ActionSheetState = { pendingOptionIndex: -1 };
  private actionPending = false;

  private handleOption = (option: ActionSheetOption, index: number): void | Promise<void> => {
    if (this.actionPending) return;
    this.actionPending = true;

    let result: void | Promise<unknown>;
    try {
      result = option.onTap();
    } catch (error) {
      this.actionPending = false;
      throw error;
    }

    if (!result || typeof result.then !== 'function') {
      this.navigationController.dismiss(true);
      return;
    }

    this.setState({ pendingOptionIndex: index });
    return result.then(
      () => {
        if (!this.isDestroyed()) this.navigationController.dismiss(true);
      },
      error => {
        if (!this.isDestroyed()) this.setState({ pendingOptionIndex: -1 });
        console.warn(`Action sheet option failed: ${option.label}`, error);
      },
    ).finally(() => {
      this.actionPending = false;
    });
  };

  private handleCancel = (): void => {
    if (this.actionPending) return;
    const cancelOption = this.viewModel.options.find(option => option.style === 'cancel');
    cancelOption?.onTap();
    this.navigationController.dismiss(true);
  };

  private handleOverlayTap = (): void => {
    if (this.viewModel.dismissOnOverlayTap !== false) {
      this.handleCancel();
    }
  };

  onRender(): void {
    const options = this.viewModel.options.filter(option => option.style !== 'cancel');

    <layout style={styles.root}>
      {when(this.viewModel.showOverlay === true, () => {
        <view
          style={styles.overlay}
          opacity={this.viewModel.overlayOpacity ?? 0.56}
          onTapDisabled={this.state.pendingOptionIndex >= 0}
          onTap={this.handleOverlayTap}
        />;
      })}
      <view style={styles.panel}>
        {when(this.viewModel.title, title => {
          <layout>
            <layout style={styles.header}>
              <label
                style={styles.headerLabel}
                value={transformText(title, this.viewModel.textCase)}
                numberOfLines={0}
              />
            </layout>
            <view style={styles.divider} />
          </layout>;
        })}
        {options.map((option, index) => (
          <layout key={`option-${index}`}>
            {when(index > 0, () => {
              <view style={styles.divider} />;
            })}
            <AsyncActionButton
              title={transformText(option.label, this.viewModel.textCase)}
              onTap={createReusableCallback(() => this.handleOption(option, index))}
              buttonStyle={styles.option}
              labelStyle={option.style === 'danger' ? styles.dangerLabel : styles.optionLabel}
              contentStyle={styles.optionContent}
              spinnerColor={option.style === 'danger' ? colors.textDanger : colors.borderFocus}
              disabled={this.state.pendingOptionIndex >= 0 && this.state.pendingOptionIndex !== index}
              loading={this.state.pendingOptionIndex === index}
            />
          </layout>
        ))}
      </view>
      <view
        style={styles.cancel}
        onTapDisabled={this.state.pendingOptionIndex >= 0}
        onTap={this.handleCancel}
        accessibilityCategory="button"
      >
        <label
          style={styles.cancelLabel}
          value={transformText(
            this.viewModel.options.find(option => option.style === 'cancel')?.label ?? 'Annuler',
            this.viewModel.textCase,
          )}
          numberOfLines={1}
        />
      </view>
    </layout>;
  }
}

const styles = {
  root: new Style<Layout>({
    bottom: 0,
    justifyContent: 'flex-end',
    left: 0,
    padding: spacing.sm,
    position: 'absolute',
    right: 0,
    top: 0,
  }),
  overlay: new Style<View>({
    backgroundColor: colors.backgroundOverlay,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  }),
  panel: new Style<View>({
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.lg,
    boxShadow: '0 3 12 rgba(0, 0, 0, 0.24)',
    marginBottom: spacing.sm,
  }),
  header: new Style<Layout>({
    alignItems: 'center',
    padding: spacing.lg,
  }),
  headerLabel: typography.caption.extend({ color: colors.textSecondary, textAlign: 'center' }),
  option: new Style<View>({
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 56,
    width: '100%',
  }),
  optionContent: new Style<View>({ alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }),
  divider: new Style<View>({
    backgroundColor: colors.borderDefault,
    height: 1,
    marginLeft: spacing.lg,
    marginRight: spacing.lg,
  }),
  optionLabel: typography.button.extend({ color: colors.borderFocus }),
  dangerLabel: typography.button.extend({ color: colors.textDanger }),
  cancel: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundPrimary,
    borderRadius: radius.lg,
    justifyContent: 'center',
    minHeight: 56,
  }),
  cancelLabel: typography.button.extend({ color: colors.borderFocus }),
};
