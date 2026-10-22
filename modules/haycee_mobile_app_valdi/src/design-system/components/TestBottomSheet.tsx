import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { IRenderedElementAttributeApplier } from 'valdi_core/src/IRenderedElementApplier';
import { Style } from 'valdi_core/src/Style';
import { DragEvent } from 'valdi_tsx/src/GestureEvents';
import { IRenderedElementBase } from 'valdi_tsx/src/IRenderedElementBase';
import { IRenderedElementHolder } from 'valdi_tsx/src/IRenderedElementHolder';
import { Label, Layout, SpinnerView, View } from 'valdi_tsx/src/NativeTemplateElements';
import { when } from 'valdi_core/src/utils/When';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { spacing } from '../tokens/spacing';
import { transformText, typography, TextCase } from '../tokens/typography';

/**
 * Valdi exposes element refs as a holder interface. This adapter keeps one
 * native view available for direct translation updates during a drag.
 */
class SingleElementHolder<T> implements IRenderedElementHolder<T> {
  private element?: IRenderedElementAttributeApplier<T>;

  onElementCreated(element: IRenderedElementBase<T>): void {
    this.element = element as unknown as IRenderedElementAttributeApplier<T>;
  }

  onElementDestroyed(element: IRenderedElementBase<T>): void {
    if ((this.element as unknown) === (element as unknown)) {
      this.element = undefined;
    }
  }

  setElements(elements: IRenderedElementBase<T>[]): void {
    this.element = elements[0] as unknown as IRenderedElementAttributeApplier<T> | undefined;
  }

  get current(): IRenderedElementAttributeApplier<T> | undefined {
    return this.element;
  }
}

export interface TestBottomSheetViewModel {
  /** Optional sheet title. Omit it for a spinner-only loading state. */
  title?: string;
  /** Optional sheet message. Omit it for a spinner-only loading state. */
  message?: string;
  /** Defaults to `upper` for sheet text. */
  textCase?: TextCase;
  /** Defaults to false. Set true to add the dimming overlay. */
  showOverlay?: boolean;
  /** Defaults to false. Set true to show the horizontal drag handle. */
  showHandle?: boolean;
  /** Defaults to false. Set true to enable sheet drag and overlay-tap gestures. */
  enableGestures?: boolean;
  /** Defaults to false. Set true to round the bottom corners too. */
  roundBottomCorners?: boolean;
  /** Defaults to false. Set true to display the native loading spinner. */
  showLoading?: boolean;
  /** Spinner color. Defaults to the design-system focus color. */
  loadingColor?: string;
  /** Native opacity for the overlay, between 0 and 1. Defaults to 0.56. */
  overlayOpacity?: number;
}

/** A small Snap-style sheet used to validate presentation and swipe dismissal. */
@NavigationPage(module)
export class TestBottomSheet extends NavigationPageComponent<TestBottomSheetViewModel> {
  private readonly sheetRef = new SingleElementHolder<View>();

  private handleDrag = (event: DragEvent): void => {
    const sheet = this.sheetRef.current;
    if (!sheet) {
      return;
    }

    const translationY = Math.max(0, event.deltaY);
    sheet.setAttribute('translationY', translationY);

    if (event.velocityY > 600) {
      this.dismiss();
    }
  };

  private handleOverlayTap = (): void => {
    this.dismiss();
  };

  private handleCloseTap = (): void => {
    this.dismiss();
  };

  private dismiss = (): void => {
    this.navigationController.dismiss(true);
  };

  private renderLoadingSpinner(): void {
    if (this.viewModel.showLoading !== true) {
      return;
    }

    <view style={styles.spinnerContainer}>
      {this.renderPlatformSpinner()}
    </view>;
  }

  private renderPlatformSpinner(): void {
    <spinner
      style={styles.spinner}
      color={this.viewModel.loadingColor ?? colors.borderFocus}
      width={40}
      height={40}
    />;
  }

  onRender(): void {
    const sheetStyle = this.viewModel.roundBottomCorners === true ? styles.sheetRounded : styles.sheet;

    <layout style={styles.root}>
      {when(this.viewModel.showOverlay === true, () => {
        <view
          style={styles.overlay}
          opacity={this.viewModel.overlayOpacity ?? 0.56}
          onTapDisabled={this.viewModel.enableGestures !== true}
          onTap={this.handleOverlayTap}
        />;
      })}
      <view
        ref={this.sheetRef}
        style={sheetStyle}
        onDragDisabled={this.viewModel.enableGestures !== true}
        onDrag={this.handleDrag}
      >
        {when(this.viewModel.showHandle === true, () => {
          <layout style={styles.handleContainer}>
            <view style={styles.handle} />
          </layout>;
        })}
        {this.renderLoadingSpinner()}
        {when(this.viewModel.title, title => {
          <label
            style={typography.title2}
            value={transformText(title, this.viewModel.textCase)}
          />;
        })}
        {when(this.viewModel.message, message => {
          <label
            style={styles.message}
            value={transformText(message, this.viewModel.textCase)}
            numberOfLines={0}
          />;
        })}
        <view style={styles.closeButton} onTap={this.handleCloseTap} accessibilityCategory="button">
          <label
            style={styles.closeButtonLabel}
            value={transformText('Fermer', this.viewModel.textCase)}
          />
        </view>
      </view>
    </layout>;
  }
}

const sheetBaseStyle = new Style<View>({
  backgroundColor: colors.backgroundPrimary,
  bottom: 0,
  left: 0,
  minHeight: 320,
  padding: spacing.xxl,
  position: 'absolute',
  right: 0,
});

const styles = {
  root: new Style<Layout>({
    height: '100%',
    width: '100%',
  }),
  overlay: new Style<View>({
    // Keep the presented page transparent so the app remains visible behind
    // the modal. Opacity is provided by the view model so each sheet can tune it.
    backgroundColor: colors.backgroundDark,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  }),
  // Four-value borderRadius follows the CSS corner order: top-left, top-right,
  // bottom-right, bottom-left.
  sheet: sheetBaseStyle.extend({ borderRadius: `${radius.xl} ${radius.xl} 0 0` }),
  sheetRounded: sheetBaseStyle.extend({ borderRadius: radius.xl }),
  spinnerContainer: new Style<View>({
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'transparent',
    borderRadius: radius.full,
    height: 56,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    width: 56,
  }),
  spinner: new Style<SpinnerView>({
    color: colors.borderFocus,
    height: 40,
    width: 40,
  }),
  handleContainer: new Style<Layout>({
    alignItems: 'center',
    paddingBottom: spacing.lg,
    width: '100%',
  }),
  handle: new Style<View>({
    backgroundColor: colors.borderDefault,
    borderRadius: radius.full,
    height: 5,
    width: 48,
  }),
  message: typography.body.extend({
    color: colors.textSecondary,
    marginTop: spacing.md,
    numberOfLines: 0,
  }),
  closeButton: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.interactivePrimary,
    borderRadius: radius.md,
    justifyContent: 'center',
    marginTop: spacing.xxl,
    minHeight: 48,
  }),
  closeButtonLabel: typography.button,
};
