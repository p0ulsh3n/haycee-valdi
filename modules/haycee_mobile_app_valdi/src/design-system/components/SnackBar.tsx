import { StatefulComponent } from 'valdi_core/src/Component';
import { Device } from 'valdi_core/src/Device';
import { AnimationCurve } from 'valdi_core/src/AnimationOptions';
import { GeometricPathBuilder } from 'valdi_core/src/utils/GeometricPathBuilder';
import { Style } from 'valdi_core/src/Style';
import { Asset } from 'valdi_tsx/src/Asset';
import { BlurView, Label, Layout, ShapeView, View } from 'valdi_tsx/src/NativeTemplateElements';
import { when } from 'valdi_core/src/utils/When';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { spacing } from '../tokens/spacing';
import { fontSize, montserrat, transformText, typography, TextCase } from '../tokens/typography';

export type SnackBarType = 'default' | 'success' | 'error' | 'warning';

export interface SnackBarConfig {
  message: string;
  /** Optional leading icon displayed before the message. */
  icon?: Asset;
  subtitle?: string;
  type?: SnackBarType;
  duration?: number;
  /** Optional visible countdown for reversible actions. Defaults to the snackbar lifetime. */
  countdownSeconds?: number;
  actionLabel?: string;
  /** Defaults to `upper` for notification text and actions. */
  textCase?: TextCase;
  onAction?: () => void;
  onTap?: () => void;
}

export interface SnackBarViewModel {
  /**
   * Extra space reserved below the snackbar for an app-owned bottom surface,
   * such as BottomTabsNavigation. The device safe-area inset is added by the
   * component automatically.
   */
  bottomOffset?: number;
}

interface SnackBarState {
  config: SnackBarConfig | null;
  isVisible: boolean;
  countdownRemaining: number;
}

/** Root-mounted transient notification controller. */
export class SnackBarManager {
  private static instance?: SnackBarComponent;

  static register(component: SnackBarComponent): void {
    SnackBarManager.instance = component;
  }

  static unregister(component: SnackBarComponent): void {
    if (SnackBarManager.instance === component) {
      SnackBarManager.instance = undefined;
    }
  }

  static show(config: SnackBarConfig): void {
    SnackBarManager.instance?.show(config);
  }

  static hide(): void {
    SnackBarManager.instance?.hide();
  }
}

/**
 * The guide calls this family of UI "transient feedback". It is intentionally
 * a small app-level facade over the mounted SnackBar component.
 */
export class TransientFeedback {
  static show(config: SnackBarConfig): void {
    SnackBarManager.show(config);
  }

  static hide(): void {
    SnackBarManager.hide();
  }
}

export class SnackBarComponent extends StatefulComponent<SnackBarViewModel, SnackBarState> {
  state: SnackBarState = { config: null, isVisible: false, countdownRemaining: 0 };

  private dismissTimer?: ReturnType<typeof setTimeout>;
  private countdownTimer?: ReturnType<typeof setInterval>;
  private countdownTotalSeconds = 0;
  private actionPending = false;
  private transitionToken = 0;

  onCreate(): void {
    SnackBarManager.register(this);
    this.registerDisposable(() => {
      this.clearDismissTimer();
      this.clearCountdownTimer();
      SnackBarManager.unregister(this);
    });
  }

  show(config: SnackBarConfig): void {
    this.clearDismissTimer();
    this.clearCountdownTimer();
    const token = ++this.transitionToken;
    this.actionPending = false;
    const defaultDuration = (config.countdownSeconds ?? (config.actionLabel ? 5 : 3)) * 1000;
    const duration = Math.max(1, config.duration ?? defaultDuration);
    this.countdownTotalSeconds = Math.max(1, Math.ceil(config.countdownSeconds ?? duration / 1000));
    this.setState({ config, isVisible: false, countdownRemaining: this.countdownTotalSeconds });

    this.setTimeoutDisposable(() => {
      if (token === this.transitionToken && !this.isDestroyed()) {
        this.setStateAnimated({ isVisible: true }, { duration: 0.24 });
      }
    }, 0);

    this.dismissTimer = setTimeout(() => this.hide(), duration);
    if (config.actionLabel) {
      this.countdownTimer = setInterval(() => this.tickCountdown(), 1000);
    }
  }

  hide(): void {
    this.clearDismissTimer();
    this.clearCountdownTimer();
    if (!this.state.config) {
      return;
    }

    const token = ++this.transitionToken;
    void this.setStateAnimatedPromise({ isVisible: false }, { duration: 0.2 }).then(() => {
      if (!this.isDestroyed() && token === this.transitionToken) {
        this.setState({ config: null });
      }
    });
  }

  onDestroy(): void {
    this.clearDismissTimer();
    this.clearCountdownTimer();
    SnackBarManager.unregister(this);
  }

  private clearDismissTimer(): void {
    if (this.dismissTimer !== undefined) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = undefined;
    }
  }

  private clearCountdownTimer(): void {
    if (this.countdownTimer !== undefined) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = undefined;
    }
  }

  private tickCountdown = (): void => {
    if (!this.state.config || !this.state.isVisible || this.state.countdownRemaining <= 0) {
      this.clearCountdownTimer();
      return;
    }
    this.setStateAnimated(
      { countdownRemaining: this.state.countdownRemaining - 1 },
      { duration: 1, curve: AnimationCurve.Linear, beginFromCurrentState: true },
    );
  };

  private handleTap = (): void => {
    this.state.config?.onTap?.();
    this.hide();
  };

  private handleAction = (): void => {
    if (!this.state.config || this.actionPending) return;
    this.actionPending = true;
    try {
      this.state.config.onAction?.();
      this.hide();
    } catch (error) {
      this.actionPending = false;
      throw error;
    }
  };

  onRender(): void {
    const config = this.state.config;
    if (!config) {
      return;
    }

    const backgroundColor = getSnackBarColor(config.type);
    const actionLabel = config.actionLabel;
    const showCountdown = Boolean(actionLabel);
    const countdownProgress = this.countdownTotalSeconds > 0
      ? Math.max(0, Math.min(1, this.state.countdownRemaining / this.countdownTotalSeconds))
      : 0;
    const bottomInset = Math.max(0, Device.getDisplayBottomInset());
    const bottomOffset = (this.viewModel.bottomOffset ?? 0) + bottomInset + spacing.lg;

    <blur
      style={styles.snackbar.extend({ bottom: bottomOffset })}
      blurStyle="dark"
      translationY={this.state.isVisible ? 0 : 100}
      opacity={this.state.isVisible ? 1 : 0}
      onTap={config.onTap ? this.handleTap : undefined}
      accessibilityCategory="button"
    >
      <view style={styles.tint.extend({ backgroundColor })}>
        <layout style={styles.content}>
          {when(config.icon, icon => {
            <image
              src={icon}
              tint={colors.textInverted}
              width={24}
              height={24}
              objectFit="contain"
            />;
          })}
          <layout style={styles.text.extend({ marginLeft: config.icon ? spacing.md : 0 })}>
            <label
              style={styles.message}
              value={transformText(config.message, config.textCase)}
              numberOfLines={0}
            />
            {when(config.subtitle, subtitle => {
              <label
                style={styles.subtitle}
                value={transformText(subtitle, config.textCase)}
                numberOfLines={0}
              />;
            })}
          </layout>
          {when(actionLabel, label => {
            <layout style={styles.actionGroup}>
              {showCountdown ? (
                <layout style={styles.countdown} accessibilityLabel={`Action disponible ${this.state.countdownRemaining} secondes`}>
                  <shape path={COUNTDOWN_RING_PATH} style={styles.countdownTrack} strokeEnd={1} />
                  <shape path={COUNTDOWN_RING_PATH} style={styles.countdownArc} strokeEnd={countdownProgress} />
                  <label value={`${this.state.countdownRemaining}`} style={styles.countdownNumber} numberOfLines={1} />
                </layout>
              ) : null}
              <view style={styles.action} onTap={this.handleAction} accessibilityCategory="button">
                <label
                  style={styles.actionLabel}
                  value={transformText(label, config.textCase)}
                  numberOfLines={1}
                />
              </view>
            </layout>;
          })}
        </layout>
      </view>
    </blur>;
  }
}

const COUNTDOWN_RING_PATH = new GeometricPathBuilder(24, 24)
  .arcTo(12, 12, 9, -Math.PI / 2, Math.PI * 2)
  .build();

function getSnackBarColor(type: SnackBarType | undefined): string {
  switch (type) {
    case 'success':
      return colors.interactiveSuccess;
    case 'error':
      return colors.interactiveDanger;
    case 'warning':
      return colors.interactiveWarning;
    default:
      return colors.backgroundTransient;
  }
}

const styles = {
  snackbar: new Style<BlurView>({
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    borderRadius: radius.lg,
    boxShadow: '0 2 10 rgba(0, 0, 0, 0.22)',
    zIndex: 100,
  }),
  tint: new Style<View>({
    borderRadius: radius.lg,
  }),
  content: new Style<Layout>({
    alignItems: 'center',
    flexDirection: 'row',
    padding: spacing.lg,
  }),
  text: new Style<Layout>({
    alignSelf: 'stretch',
    flexGrow: 1,
    justifyContent: 'center',
  }),
  message: typography.headline.extend({
    color: colors.textInverted,
    font: montserrat.black(fontSize.large),
    textAlign: 'left',
  }),
  subtitle: typography.caption.extend({
    color: 'rgba(255, 255, 255, 0.78)',
    marginTop: spacing.xs,
  }),
  action: new Style<View>({
    alignItems: 'center',
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    justifyContent: 'center',
    marginLeft: spacing.md,
    paddingBottom: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
    paddingTop: spacing.sm,
  }),
  actionGroup: new Style<Layout>({
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0,
    marginLeft: spacing.md,
  }),
  countdown: new Style<Layout>({
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    marginRight: spacing.sm,
    position: 'relative',
    width: 28,
  }),
  countdownTrack: new Style<ShapeView>({
    height: 24,
    position: 'absolute',
    width: 24,
    strokeColor: 'rgba(255, 255, 255, 0.22)',
    strokeWidth: 2,
    strokeCap: 'round',
  }),
  countdownArc: new Style<ShapeView>({
    height: 24,
    position: 'absolute',
    width: 24,
    strokeColor: colors.interactivePrimary,
    strokeWidth: 2.5,
    strokeCap: 'round',
  }),
  countdownNumber: new Style<Label>({
    color: colors.textInverted,
    font: montserrat.semiBold(fontSize.nano),
    textAlign: 'center',
  }),
  actionLabel: typography.buttonSmall.extend({ color: colors.interactivePrimary }),
};
