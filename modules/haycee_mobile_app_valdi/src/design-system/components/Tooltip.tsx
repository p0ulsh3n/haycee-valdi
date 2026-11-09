import { AnimationCurve } from 'valdi_core/src/AnimationOptions';
import { StatefulComponent } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { Label, View } from 'valdi_tsx/src/NativeTemplateElements';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { spacing } from '../tokens/spacing';
import { typography } from '../tokens/typography';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipViewModel {
  /** Simple text mode. Use `renderContent` for rich inline content. */
  message?: string;
  /** Rich content slot for combinations such as an avatar, icon and text. */
  renderContent?: () => void;
  visible?: boolean;
  placement?: TooltipPlacement;
  maxWidth?: number;
  surfaceColor?: string;
  contentColor?: string;
  /** Enables a native Valdi long-press trigger on the wrapped content. */
  showOnLongPress?: boolean;
  children?: () => void;
  onShow?: () => void;
  onDismiss?: () => void;
}

interface TooltipState {
  isMounted: boolean;
  opacity: number;
  scale: number;
  translationY: number;
}

/** Reusable animated tooltip. The visual popup is not a native Valdi widget. */
export class Tooltip extends StatefulComponent<TooltipViewModel, TooltipState> {
  state: TooltipState = {
    isMounted: false,
    opacity: 0,
    scale: 0.94,
    translationY: 8,
  };
  private transitionToken = 0;

  onCreate(): void {
    if (this.viewModel.visible === true) {
      this.show();
    }
  }

  onViewModelUpdate(previous?: TooltipViewModel): void {
    const wasVisible = previous?.visible === true;
    const isVisible = this.viewModel.visible === true;

    if (wasVisible === isVisible) {
      return;
    }

    if (isVisible) {
      this.show();
    } else {
      this.dismiss();
    }
  }

  private show = (): void => {
    if (this.state.isMounted && this.state.opacity >= 1) {
      return;
    }
    const token = ++this.transitionToken;
    const startTranslation = this.getEntryTranslation();
    this.setState({ isMounted: true, opacity: 0, scale: 0.88, translationY: startTranslation });
    this.viewModel.onShow?.();

    this.setTimeoutDisposable(() => {
      if (this.isDestroyed() || token !== this.transitionToken) {
        return;
      }

      this.setStateAnimated(
        { opacity: 1, scale: 1, translationY: 0 },
        { stiffness: 460, damping: 34, beginFromCurrentState: true },
      );
    }, 0);
  };

  private dismiss = (): void => {
    if (!this.state.isMounted) {
      return;
    }

    const token = ++this.transitionToken;
    void this.setStateAnimatedPromise(
      { opacity: 0, scale: 0.9, translationY: this.getEntryTranslation() * 0.6 },
      { duration: 0.18, curve: AnimationCurve.EaseIn, beginFromCurrentState: true },
    ).then(() => {
      if (!this.isDestroyed() && token === this.transitionToken) {
        this.setState({ isMounted: false });
      }
    });
  };

  private handleLongPress = (): void => {
    if (this.viewModel.showOnLongPress) {
      this.show();
    }
  };

  private handleTooltipTap = (): void => {
    this.viewModel.onDismiss?.();
    this.dismiss();
  };

  private getTooltipStyle(): Style<View> {
    switch (this.viewModel.placement ?? 'top') {
      case 'bottom':
        return styles.tooltipBottom;
      case 'left':
        return styles.tooltipLeft;
      case 'right':
        return styles.tooltipRight;
      case 'top':
      default:
        return styles.tooltipTop;
    }
  }

  private getEntryTranslation(): number {
    switch (this.viewModel.placement ?? 'top') {
      case 'bottom':
        return -8;
      case 'left':
      case 'right':
        return 0;
      case 'top':
      default:
        return 8;
    }
  }

  private getArrowStyle(): Style<View> {
    switch (this.viewModel.placement ?? 'top') {
      case 'bottom':
        return styles.arrowBottom;
      case 'left':
        return styles.arrowLeft;
      case 'right':
        return styles.arrowRight;
      case 'top':
      default:
        return styles.arrowTop;
    }
  }

  onRender(): void {
    <view
      style={styles.anchor}
      onLongPress={this.viewModel.showOnLongPress ? this.handleLongPress : undefined}
    >
      {this.viewModel.children?.()}
      {this.state.isMounted ? (
        <view
          style={this.getTooltipStyle().extend({
            backgroundColor: this.viewModel.surfaceColor ?? colors.backgroundPrimary,
            maxWidth: this.viewModel.maxWidth ?? 320,
          })}
          opacity={this.state.opacity}
          scaleX={this.state.scale}
          scaleY={this.state.scale}
          translationY={this.state.translationY}
          onTap={this.handleTooltipTap}
          accessibilityCategory="button"
        >
          {this.viewModel.renderContent?.()}
          {!this.viewModel.renderContent && this.viewModel.message ? (
            <label
              style={styles.message.extend({ color: this.viewModel.contentColor ?? colors.textPrimary })}
              value={this.viewModel.message}
              numberOfLines={0}
            />
          ) : null}
          <view style={this.getArrowStyle().extend({ backgroundColor: this.viewModel.surfaceColor ?? colors.backgroundPrimary })} />
        </view>
      ) : null}
    </view>;
  }
}

const tooltipBase = {
  alignItems: 'center' as const,
  backgroundColor: colors.backgroundPrimary,
  borderRadius: radius.sm,
  boxShadow: '0 4 16 rgba(0, 0, 0, 0.22)',
  justifyContent: 'center' as const,
  paddingBottom: spacing.sm,
  paddingLeft: spacing.md,
  paddingRight: spacing.md,
  paddingTop: spacing.sm,
  position: 'absolute' as const,
  zIndex: 200,
};

const arrowBase = {
  backgroundColor: colors.backgroundPrimary,
  height: 8,
  position: 'absolute' as const,
  width: 8,
};

const styles = {
  anchor: new Style<View>({
    position: 'relative',
  }),
  tooltipTop: new Style<View>({
    ...tooltipBase,
    bottom: '100%',
    left: 0,
    marginBottom: spacing.sm,
    right: 0,
  }),
  tooltipBottom: new Style<View>({
    ...tooltipBase,
    left: 0,
    marginTop: spacing.sm,
    right: 0,
    top: '100%',
  }),
  tooltipLeft: new Style<View>({
    ...tooltipBase,
    bottom: 0,
    marginRight: spacing.sm,
    right: '100%',
    top: 0,
  }),
  tooltipRight: new Style<View>({
    ...tooltipBase,
    bottom: 0,
    left: '100%',
    marginLeft: spacing.sm,
    top: 0,
  }),
  arrowTop: new Style<View>({
    ...arrowBase,
    bottom: -4,
    left: '50%',
    rotation: Math.PI / 4,
    translationX: -4,
  }),
  arrowBottom: new Style<View>({
    ...arrowBase,
    left: '50%',
    rotation: Math.PI / 4,
    top: -4,
    translationX: -4,
  }),
  arrowLeft: new Style<View>({
    ...arrowBase,
    right: -4,
    rotation: Math.PI / 4,
    top: '50%',
    translationY: -4,
  }),
  arrowRight: new Style<View>({
    ...arrowBase,
    left: -4,
    rotation: Math.PI / 4,
    top: '50%',
    translationY: -4,
  }),
  message: typography.caption.extend({
    color: colors.textPrimary,
    textAlign: 'center',
  }),
};
