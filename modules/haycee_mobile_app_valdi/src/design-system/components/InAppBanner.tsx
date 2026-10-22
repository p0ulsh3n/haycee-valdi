import { StatefulComponent } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { Label, Layout, View } from 'valdi_tsx/src/NativeTemplateElements';
import { when } from 'valdi_core/src/utils/When';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { spacing } from '../tokens/spacing';
import { transformText, typography, TextCase } from '../tokens/typography';
import { SnackBarType } from './SnackBar';

export interface InAppBannerConfig {
  title: string;
  message?: string;
  type?: SnackBarType;
  duration?: number;
  /** Defaults to `upper` for banner text. */
  textCase?: TextCase;
  onTap?: () => void;
  onClose?: () => void;
}

interface BannerState {
  config: InAppBannerConfig | null;
  isVisible: boolean;
}

export class InAppBannerManager {
  private static instance?: InAppBannerComponent;

  static register(component: InAppBannerComponent): void {
    InAppBannerManager.instance = component;
  }

  static unregister(component: InAppBannerComponent): void {
    if (InAppBannerManager.instance === component) {
      InAppBannerManager.instance = undefined;
    }
  }

  static show(config: InAppBannerConfig): void {
    InAppBannerManager.instance?.show(config);
  }

  static hide(): void {
    InAppBannerManager.instance?.hide();
  }
}

export class InAppBannerComponent extends StatefulComponent<{}, BannerState> {
  state: BannerState = { config: null, isVisible: false };

  private dismissTimer?: ReturnType<typeof setTimeout>;
  private transitionToken = 0;

  onCreate(): void {
    InAppBannerManager.register(this);
    this.registerDisposable(() => {
      this.clearDismissTimer();
      InAppBannerManager.unregister(this);
    });
  }

  show(config: InAppBannerConfig): void {
    this.clearDismissTimer();
    const token = ++this.transitionToken;
    this.setState({ config, isVisible: false });
    this.setTimeoutDisposable(() => {
      if (token === this.transitionToken && !this.isDestroyed()) {
        this.setStateAnimated({ isVisible: true }, { duration: 0.24 });
      }
    }, 0);
    this.dismissTimer = setTimeout(() => this.hide(), config.duration ?? 4000);
  }

  hide(): void {
    this.clearDismissTimer();
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
    InAppBannerManager.unregister(this);
  }

  private clearDismissTimer(): void {
    if (this.dismissTimer !== undefined) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = undefined;
    }
  }

  private handleTap = (): void => {
    this.state.config?.onTap?.();
    this.hide();
  };

  private handleClose = (): void => {
    this.state.config?.onClose?.();
    this.hide();
  };

  onRender(): void {
    const config = this.state.config;
    if (!config) {
      return;
    }

    <view
      style={styles.banner}
      backgroundColor={getBannerColor(config.type)}
      translationY={this.state.isVisible ? 0 : -96}
      opacity={this.state.isVisible ? 1 : 0}
      onTap={config.onTap ? this.handleTap : undefined}
      accessibilityCategory="button"
    >
      <layout style={styles.content}>
        <layout style={styles.text}>
      <label
        style={styles.title}
        value={transformText(config.title, config.textCase)}
        numberOfLines={1}
      />
          {when(config.message, message => {
            <label
              style={styles.message}
              value={transformText(message, config.textCase)}
              numberOfLines={2}
            />;
          })}
        </layout>
        <view style={styles.close} onTap={this.handleClose} accessibilityCategory="button">
          <label style={styles.closeLabel} value="×" numberOfLines={1} />
        </view>
      </layout>
    </view>;
  }
}

function getBannerColor(type: SnackBarType | undefined): string {
  switch (type) {
    case 'success':
      return colors.interactiveSuccess;
    case 'error':
      return colors.interactiveDanger;
    case 'warning':
      return colors.interactiveWarning;
    default:
      return colors.borderFocus;
  }
}

const styles = {
  banner: new Style<View>({
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    borderRadius: radius.md,
    boxShadow: '0 2 10 rgba(0, 0, 0, 0.22)',
    zIndex: 101,
  }),
  content: new Style<Layout>({
    alignItems: 'center',
    flexDirection: 'row',
    padding: spacing.lg,
  }),
  text: new Style<Layout>({
    flexGrow: 1,
  }),
  title: typography.bodyEmphasis.extend({ color: colors.textInverted }),
  message: typography.caption.extend({
    color: 'rgba(255, 255, 255, 0.86)',
    marginTop: spacing.xs,
  }),
  close: new Style<View>({
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    marginLeft: spacing.md,
    width: 32,
  }),
  closeLabel: typography.title2.extend({ color: colors.textInverted }),
};
