import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageStatefulComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { NavigationPresentOptions } from 'valdi_navigation/src/NavigationController';
import { Component } from 'valdi_core/src/Component';
import { ElementRef } from 'valdi_core/src/ElementRef';
import { AnimationCurve } from 'valdi_core/src/AnimationOptions';
import { IRenderedElementAttributeApplier } from 'valdi_core/src/IRenderedElementApplier';
import { Style } from 'valdi_core/src/Style';
import { DragEvent, ScrollEndEvent, TouchEventState } from 'valdi_tsx/src/GestureEvents';
import { IRenderedElementBase } from 'valdi_tsx/src/IRenderedElementBase';
import { IRenderedElementHolder } from 'valdi_tsx/src/IRenderedElementHolder';
import { Label, Layout, ScrollView, ScrollViewInteractive, SpinnerView, View } from 'valdi_tsx/src/NativeTemplateElements';
import { when } from 'valdi_core/src/utils/When';
import navigationIcons from '../../../res/navigation-icons';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { layout, spacing } from '../tokens/spacing';
import { noBounceScrollAttributes } from '../tokens/scrollBehavior';
import { transformText, typography, TextCase } from '../tokens/typography';
import { AsyncActionButton } from './AsyncActionButton';

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

export interface BottomSheetViewModel {
  /** Optional sheet title. Omit it for a spinner-only loading state. */
  title?: string;
  /** Optional sheet message. Omit it for a spinner-only loading state. */
  message?: string;
  /** Optional feature-owned body content rendered inside the shared sheet surface. */
  renderContent?: () => void;
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
  /** Keep the presenting page visible outside the sheet. Defaults to false. */
  transparentPageBackground?: boolean;
  /** Optional standard action at the bottom of the sheet. */
  footerLabel?: string;
  /** Called when the optional footer action is tapped. */
  onFooterTap?: () => void | Promise<unknown>;
  /** Footer surface; defaults to transparent to support floating actions. */
  footerBackground?: 'transparent' | 'surface';
  /**
   * Opts into a detent-style sheet. The sheet opens at this percentage of its
   * parent height (for example, 85), can be dragged down or dismissed, and can
   * reach 100% only through the header expand control. Omit to preserve the
   * standard sheet behavior.
   */
  snapPointPercent?: number;
}

interface BottomSheetState {
  isMaximized: boolean;
}

export interface BottomSheetFooterViewModel {
  label: string;
  onTap: () => void | Promise<unknown>;
  disabled?: boolean;
  loading?: boolean;
  background?: 'transparent' | 'surface';
}

export interface BottomSheetContentPage {
  id: string;
  render: () => void;
}

export interface BottomSheetContentPagerViewModel {
  pages: BottomSheetContentPage[];
  activeIndex: number;
  onIndexChange?: (index: number) => void;
}

/** Defaults used by the app's standard bottom-sheet presentation. */
export const BOTTOM_SHEET_DEFAULTS = {
  showOverlay: false,
  showHandle: false,
  enableGestures: false,
  roundBottomCorners: false,
  showLoading: false,
  overlayOpacity: 0.56,
  transparentPageBackground: false,
  footerBackground: 'transparent',
} as const;

/** Shared centered bottom-sheet action. `surface` adds an opaque footer backing. */
export class BottomSheetFooter extends Component<BottomSheetFooterViewModel> {
  onRender(): void {
    const { label, onTap, disabled = false, loading = false, background = BOTTOM_SHEET_DEFAULTS.footerBackground } = this.viewModel;
    <view style={background === 'surface' ? footerStyles.surface : footerStyles.transparent}>
      <AsyncActionButton
        title={transformText(label, 'none')}
        onTap={onTap}
        buttonStyle={footerStyles.button.extend({ opacity: disabled ? 0.5 : 1 })}
        labelStyle={footerStyles.label}
        contentStyle={footerStyles.content}
        spinnerColor={colors.textInverted}
        disabled={disabled}
        loading={loading}
      />
    </view>;
  }
}

/**
 * Horizontally paged content for multi-step sheets. It keeps the containing
 * sheet in place while native paging slides each inner page into view.
 */
export class BottomSheetContentPager extends Component<BottomSheetContentPagerViewModel> {
  private readonly pagesRef = new ElementRef<ScrollViewInteractive>();

  onViewModelUpdate(previous?: Readonly<BottomSheetContentPagerViewModel>): void {
    if (previous && previous.activeIndex !== this.viewModel.activeIndex) {
      this.scrollToPage(this.viewModel.activeIndex, true);
    }
  }

  private scrollToPage(index: number, animated: boolean): void {
    const pages = this.pagesRef.single();
    if (!pages) return;

    const pageWidth = pages.frame.width;
    if (pageWidth <= 0) return;

    pages.setAttribute('contentOffsetAnimated', animated);
    pages.setAttribute('contentOffsetX', Math.max(0, index) * pageWidth);
  }

  private handleScrollEnd = (event: ScrollEndEvent): void => {
    const pageWidth = this.pagesRef.single()?.frame.width ?? 0;
    if (pageWidth <= 0) return;

    const index = Math.max(0, Math.min(this.viewModel.pages.length - 1, Math.round(event.x / pageWidth)));
    if (index !== this.viewModel.activeIndex) this.viewModel.onIndexChange?.(index);
  };

  onRender(): void {
    <scroll
      {...noBounceScrollAttributes}
      ref={this.pagesRef}
      style={styles.contentPager}
      horizontal={true}
      pagingEnabled={true}
      showsHorizontalScrollIndicator={false}
      onScrollEnd={this.handleScrollEnd}
    >
      {this.viewModel.pages.map(page => (
        <view key={page.id} style={styles.contentPage}>
          {page.render()}
        </view>
      ))}
    </scroll>;
  }
}

/** Maps the sheet's page-background option to Valdi's modal presentation option. */
export function getBottomSheetNavigationOptions(
  options: Pick<BottomSheetViewModel, 'transparentPageBackground'> = {},
): Pick<NavigationPresentOptions, 'pageBackgroundColor'> {
  return (options.transparentPageBackground ?? BOTTOM_SHEET_DEFAULTS.transparentPageBackground)
    ? { pageBackgroundColor: 'transparent' }
    : {};
}

/** App-standard bottom sheet with optional title, message and loading state. */
@NavigationPage(module)
export class BottomSheet extends NavigationPageStatefulComponent<BottomSheetViewModel, BottomSheetState> {
  state: BottomSheetState = { isMaximized: false };
  private readonly sheetRef = new SingleElementHolder<View>();
  private isDismissing = false;

  private handleDrag = (event: DragEvent): void => {
    const sheet = this.sheetRef.current;
    if (!sheet || this.isDismissing) return;

    const snapPointPercent = this.getSnapPointPercent();
    if (snapPointPercent !== undefined) {
      if (event.state === TouchEventState.Ended) {
        const draggedDown = Math.max(0, event.deltaY);
        const snapLayout = layout.bottomSheet.snapPoint;
        if (event.velocityY > snapLayout.dismissVelocity || draggedDown >= snapLayout.dismissDragDistance) {
          this.dismiss();
          return;
        }

        const animation = {
          duration: snapLayout.transitionDurationSeconds,
          curve: AnimationCurve.EaseOut,
          beginFromCurrentState: true,
        };
        if (this.state.isMaximized && draggedDown >= snapLayout.collapseDragDistance) {
          this.setStateAnimated({ isMaximized: false }, animation);
        }
        this.animate(animation, () => sheet.setAttribute('translationY', 0));
        return;
      }

      // A detent sheet never follows an upward drag past its configured stop.
      sheet.setAttribute('translationY', Math.max(0, event.deltaY));
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

  private handleSnapPointToggle = (): void => {
    if (this.isDismissing || this.getSnapPointPercent() === undefined) return;
    this.setStateAnimated(
      { isMaximized: !this.state.isMaximized },
      {
        duration: layout.bottomSheet.snapPoint.transitionDurationSeconds,
        curve: AnimationCurve.EaseInOut,
        beginFromCurrentState: true,
      },
    );
  };

  private getSnapPointPercent(): number | undefined {
    const percentage = this.viewModel.snapPointPercent;
    return typeof percentage === 'number' && Number.isFinite(percentage) && percentage > 0 && percentage < 100
      ? percentage
      : undefined;
  }

  private dismiss = (): void => {
    if (this.isDismissing) return;
    this.isDismissing = true;
    this.navigationController.dismiss(true);
  };

  private renderSnapPointHeader(): void {
    <layout style={styles.snapPointHeader}>
      {this.viewModel.title ? (
        <label
          style={styles.snapPointTitle}
          value={transformText(this.viewModel.title, this.viewModel.textCase)}
          numberOfLines={1}
        />
      ) : <view style={styles.snapPointTitlePlaceholder} />}
      <layout style={styles.snapPointHeaderActions}>
        <view
          style={styles.snapPointHeaderButton}
          onTapDisabled={this.isDismissing}
          onTap={this.handleSnapPointToggle}
          accessibilityCategory="button"
          accessibilityLabel={this.state.isMaximized ? 'Réduire le panneau' : 'Agrandir le panneau'}
        >
          <image
            src={this.state.isMaximized ? navigationIcons.minimize01 : navigationIcons.maximize01}
            tint={colors.iconDefault}
            width={layout.bottomSheet.snapPoint.headerIconSize}
            height={layout.bottomSheet.snapPoint.headerIconSize}
            objectFit="contain"
          />
        </view>
        <view
          style={styles.snapPointHeaderButton}
          onTapDisabled={this.isDismissing}
          onTap={this.handleCloseTap}
          accessibilityCategory="button"
          accessibilityLabel="Fermer le panneau"
        >
          <image
            src={navigationIcons.cancel01}
            tint={colors.iconDefault}
            width={layout.bottomSheet.snapPoint.headerIconSize}
            height={layout.bottomSheet.snapPoint.headerIconSize}
            objectFit="contain"
          />
        </view>
      </layout>
    </layout>;
  }

  private renderLoadingSpinner(): void {
    if ((this.viewModel.showLoading ?? BOTTOM_SHEET_DEFAULTS.showLoading) !== true) {
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
    const snapPointPercent = this.getSnapPointPercent();
    const isSnapPointSheet = snapPointPercent !== undefined;
    const isMaximized = isSnapPointSheet && this.state.isMaximized;
    const baseSheetStyle = (this.viewModel.roundBottomCorners ?? BOTTOM_SHEET_DEFAULTS.roundBottomCorners) === true
      ? styles.sheetRounded
      : styles.sheet;
    const sheetStyle = isSnapPointSheet
      ? baseSheetStyle.extend({
          height: `${isMaximized ? 100 : snapPointPercent}%`,
          minHeight: 0,
          borderRadius: isMaximized ? 0 : (this.viewModel.roundBottomCorners ?? BOTTOM_SHEET_DEFAULTS.roundBottomCorners) === true
            ? radius.xl
            : `${radius.xl} ${radius.xl} 0 0`,
        })
      : baseSheetStyle;

    <layout style={styles.root}>
      {when((this.viewModel.showOverlay ?? BOTTOM_SHEET_DEFAULTS.showOverlay) === true, () => {
        <view
          style={styles.overlay}
          opacity={this.viewModel.overlayOpacity ?? BOTTOM_SHEET_DEFAULTS.overlayOpacity}
          onTapDisabled={(this.viewModel.enableGestures ?? BOTTOM_SHEET_DEFAULTS.enableGestures) !== true}
          onTap={this.handleOverlayTap}
        />;
      })}
      <view
        ref={this.sheetRef}
        style={sheetStyle}
        onDragDisabled={(this.viewModel.enableGestures ?? BOTTOM_SHEET_DEFAULTS.enableGestures) !== true}
        onDrag={this.handleDrag}
      >
        {when((this.viewModel.showHandle ?? BOTTOM_SHEET_DEFAULTS.showHandle) === true, () => {
          <layout style={styles.handleContainer}>
            <view style={styles.handle} />
          </layout>;
        })}
        {isSnapPointSheet ? this.renderSnapPointHeader() : null}
        {this.renderLoadingSpinner()}
        {when(!isSnapPointSheet && this.viewModel.title, title => {
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
        {this.viewModel.renderContent?.()}
        {!isSnapPointSheet ? (
          <view style={styles.closeButton} onTap={this.handleCloseTap} accessibilityCategory="button">
            <label
              style={styles.closeButtonLabel}
              value={transformText('Fermer', this.viewModel.textCase)}
            />
          </view>
        ) : null}
        {this.viewModel.footerLabel && this.viewModel.onFooterTap ? (
          <BottomSheetFooter
            label={this.viewModel.footerLabel}
            onTap={this.viewModel.onFooterTap}
            background={this.viewModel.footerBackground}
          />
        ) : null}
      </view>
    </layout>;
  }
}

/** Shared surface/positioning used by the official sheet and specialized sheets. */
export const bottomSheetSurfaceStyle = new Style<View>({
  backgroundColor: colors.backgroundPrimary,
  borderRadius: BOTTOM_SHEET_DEFAULTS.roundBottomCorners ? radius.xl : `${radius.xl} ${radius.xl} 0 0`,
  bottom: 0,
  position: 'absolute',
  left: 0,
  right: 0,
});

const sheetBaseStyle = bottomSheetSurfaceStyle.extend({
  minHeight: 320,
  padding: spacing.xxl,
});

const footerStyles = {
  transparent: new Style<View>({
    alignItems: 'center',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    paddingTop: spacing.sm,
    width: '100%',
  }),
  surface: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundPrimary,
    justifyContent: 'center',
    paddingTop: spacing.sm,
    width: '100%',
  }),
  button: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.buttonPrimary,
    borderRadius: radius.full,
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 160,
    paddingLeft: spacing.xl,
    paddingRight: spacing.xl,
  }),
  label: typography.button.extend({ color: colors.textInverted }),
  content: new Style<View>({ alignItems: 'center', flexDirection: 'row' }),
};

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
  sheet: sheetBaseStyle,
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
  snapPointHeader: new Style<Layout>({
    alignItems: 'center',
    flexDirection: 'row',
    height: layout.bottomSheet.snapPoint.headerHeight,
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    width: '100%',
  }),
  snapPointTitle: typography.title2.extend({ flexGrow: 1, flexShrink: 1, marginRight: spacing.md, numberOfLines: 1 }),
  snapPointTitlePlaceholder: new Style<View>({ flexGrow: 1, flexShrink: 1 }),
  snapPointHeaderActions: new Style<Layout>({ alignItems: 'center', flexDirection: 'row' }),
  snapPointHeaderButton: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.full,
    height: layout.bottomSheet.snapPoint.headerTouchTarget,
    justifyContent: 'center',
    marginLeft: spacing.xs,
    width: layout.bottomSheet.snapPoint.headerTouchTarget,
  }),
  contentPager: new Style<ScrollView>({
    flexGrow: 1,
    flexShrink: 1,
    width: '100%',
  }),
  contentPage: new Style<View>({
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 0,
    height: '100%',
    width: '100%',
  }),
  message: typography.body.extend({
    color: colors.textSecondary,
    marginTop: spacing.md,
    numberOfLines: 0,
  }),
  closeButton: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.buttonPrimary,
    borderRadius: radius.md,
    justifyContent: 'center',
    marginTop: spacing.xxl,
    minHeight: 48,
  }),
  closeButtonLabel: typography.button.extend({ color: colors.textBrand }),
};
