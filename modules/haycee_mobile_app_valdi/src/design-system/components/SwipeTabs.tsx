import { Device } from 'valdi_core/src/Device';
import { Style } from 'valdi_core/src/Style';
import { createReusableCallback } from 'valdi_core/src/utils/Callback';
import { when } from 'valdi_core/src/utils/When';
import { IRenderedElementAttributeApplier } from 'valdi_core/src/IRenderedElementApplier';
import { IRenderedElementBase } from 'valdi_tsx/src/IRenderedElementBase';
import { IRenderedElementHolder } from 'valdi_tsx/src/IRenderedElementHolder';
import { ScrollEndEvent, ScrollEvent } from 'valdi_tsx/src/GestureEvents';
import {
  Label,
  Layout,
  ScrollView,
  ScrollViewInteractive,
  SpinnerView,
  View,
} from 'valdi_tsx/src/NativeTemplateElements';
import { StatefulComponent } from 'valdi_core/src/Component';
import { DSButton } from './DSButton';
import { SkeletonView } from './SkeletonView';
import { colors } from '../tokens/colors';
import { noBounceScrollAttributes } from '../tokens/scrollBehavior';
import { radius } from '../tokens/radius';
import { spacing } from '../tokens/spacing';
import { metropolis, transformText, typography, TextCase } from '../tokens/typography';

export interface SwipeTabItem {
  id: string;
  label: string;
  /** Optional text glyph or emoji used as the tab icon. */
  icon?: string;
  pageTitle: string;
  pageMessage: string;
  pageColor?: string;
  status?: SwipeTabStatus;
  loadingPresentation?: 'spinner' | 'skeleton';
  loadingTitle?: string;
  loadingMessage?: string;
  loadingColor?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  errorTitle?: string;
  errorMessage?: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export type SwipeTabStatus = 'ready' | 'loading' | 'empty' | 'error';

export interface SwipeTabsViewModel {
  tabs: SwipeTabItem[];
  /** Hides tab labels and centers the icons while keeping the swipe behavior. */
  iconOnly?: boolean;
  /** Renders only the horizontal tab rail, without the associated content pages. */
  showPages?: boolean;
  /** Width of each item when the component is used as a horizontal tab rail. */
  tabItemWidth?: number;
  /** Minimum height of each tab item. */
  tabHeight?: number;
  /** Uses the stronger Home typography for category labels. */
  strongLabels?: boolean;
  /** Active indicator color. */
  indicatorColor?: string;
  /** Width of the active indicator as a ratio of its tab width. */
  activeIndicatorWidthRatio?: number;
  /** Custom page renderer used when the tab content is supplied by the caller. */
  renderPage?: (tab: SwipeTabItem, isActive: boolean, isPrepared: boolean) => void;
  /** Defaults to `upper` for all tab and page text. */
  textCase?: TextCase;
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
}

interface SwipeTabsState {
  activeIndex: number;
}

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

/**
 * Snap-style tabs with a native horizontally paged Valdi scroll view.
 * The active indicator follows both tab taps and horizontal swipes.
 */
export class SwipeTabs extends StatefulComponent<SwipeTabsViewModel, SwipeTabsState> {
  state: SwipeTabsState = { activeIndex: 0 };
  private readonly pagesRef = new SingleElementHolder<ScrollViewInteractive>();
  private readonly tabBarRef = new SingleElementHolder<ScrollViewInteractive>();
  private readonly indicatorRef = new SingleElementHolder<View>();
  private indicatorPosition = 0;

  onCreate(): void {
    this.setActiveIndex(this.clampIndex(this.viewModel.initialIndex ?? 0), false);
  }

  private clampIndex(index: number): number {
    return Math.max(0, Math.min(index, Math.max(0, this.viewModel.tabs.length - 1)));
  }

  private setActiveIndex(index: number, notify = true): void {
    const activeIndex = this.clampIndex(index);
    this.setIndicatorPosition(activeIndex);
    this.centerActiveTab(activeIndex);
    if (this.state.activeIndex !== activeIndex) {
      this.setState({ activeIndex });
    }
    if (notify) {
      this.viewModel.onIndexChange?.(activeIndex);
    }
  }

  private handleTabTap = (index: number): void => {
    this.setActiveIndex(index);

    const pages = this.pagesRef.current;
    if (!pages) {
      return;
    }

    pages.setAttribute('contentOffsetX', index * Device.getWindowWidth());
  };

  private setIndicatorPosition(position: number): void {
    this.indicatorPosition = position;
    const tabWidth = this.getTabWidth();
    const indicatorWidth = this.getIndicatorWidth(tabWidth);
    this.indicatorRef.current?.setAttribute(
      'translationX',
      position * tabWidth + (tabWidth - indicatorWidth) / 2,
    );
  }

  private getTabWidth(): number {
    if (this.viewModel.tabItemWidth !== undefined) {
      return this.viewModel.tabItemWidth;
    }

    if (this.viewModel.showPages === false) {
      return 96;
    }

    return Device.getWindowWidth() / Math.max(1, this.viewModel.tabs.length);
  }

  private getIndicatorWidth(tabWidth: number): number {
    const ratio = Math.max(0.1, Math.min(1, this.viewModel.activeIndicatorWidthRatio ?? 1));
    return tabWidth * ratio;
  }

  private centerActiveTab(index: number, animated = true): void {
    if (this.viewModel.tabItemWidth === undefined) {
      return;
    }

    const tabBar = this.tabBarRef.current;
    if (!tabBar) {
      return;
    }

    const tabWidth = this.getTabWidth();
    const viewportWidth = Device.getWindowWidth();
    const contentWidth = tabWidth * this.viewModel.tabs.length;
    const maxOffset = Math.max(0, contentWidth - viewportWidth);
    const centeredOffset = index * tabWidth + tabWidth / 2 - viewportWidth / 2;
    const boundedOffset = Math.max(0, Math.min(maxOffset, centeredOffset));

    // During a page swipe the tab rail must track the gesture itself. A
    // native animated scroll for every scroll event would repeatedly restart
    // the animation and make the rail feel delayed or non-smooth. We therefore
    // follow the fractional page position directly while dragging, then use
    // the native animation for discrete changes such as a tab tap or swipe end.
    tabBar.setAttribute('contentOffsetAnimated', animated);
    tabBar.setAttribute('contentOffsetX', boundedOffset);
  }

  private handleScroll = (event: ScrollEvent): void => {
    const pageWidth = Device.getWindowWidth();
    const maxPage = Math.max(0, this.viewModel.tabs.length - 1);
    if (pageWidth <= 0 || maxPage === 0) {
      return;
    }

    const indicatorPosition = Math.max(0, Math.min(maxPage, event.x / pageWidth));
    this.setIndicatorPosition(indicatorPosition);
    this.centerActiveTab(indicatorPosition, false);
  };

  private handleScrollEnd = (event: ScrollEndEvent): void => {
    const pageWidth = Device.getWindowWidth();
    if (pageWidth <= 0) {
      return;
    }

    this.setActiveIndex(Math.round(event.x / pageWidth));
  };

  private renderTabPage(tab: SwipeTabItem, isActive: boolean, isPrepared: boolean): void {
    if (this.viewModel.renderPage) {
      this.viewModel.renderPage(tab, isActive, isPrepared);
      return;
    }

    const status = tab.status ?? 'ready';

    if (status === 'loading') {
      if (tab.loadingPresentation === 'skeleton') {
        <layout style={styles.skeletonContainer}>
          <SkeletonView width="88%" height={18} borderRadius={6} />
          <SkeletonView width="72%" height={14} borderRadius={6} />
          <SkeletonView width="52%" height={14} borderRadius={6} />
        </layout>;
        return;
      }

      <layout style={styles.stateContainer}>
        <spinner
          style={styles.spinner}
          color={tab.loadingColor ?? colors.borderFocus}
          width={40}
          height={40}
        />
        <label
          style={styles.stateTitle}
          value={transformText(tab.loadingTitle ?? 'Chargement des données', this.viewModel.textCase)}
          numberOfLines={0}
        />
        {when(tab.loadingMessage, message => {
          <label
            style={styles.stateMessage}
            value={transformText(message, this.viewModel.textCase)}
            numberOfLines={0}
          />;
        })}
      </layout>;
      return;
    }

    if (status === 'empty') {
      <layout style={styles.stateContainer}>
        <label style={styles.stateIcon} value="⌁" />
        <label
          style={styles.stateTitle}
          value={transformText(tab.emptyTitle ?? 'Aucune donnée', this.viewModel.textCase)}
          numberOfLines={0}
        />
        {when(tab.emptyMessage, message => {
          <label
            style={styles.stateMessage}
            value={transformText(message, this.viewModel.textCase)}
            numberOfLines={0}
          />;
        })}
      </layout>;
      return;
    }

    if (status === 'error') {
      <layout style={styles.stateContainer}>
        <label style={styles.stateIcon} value="⚠" />
        <label
          style={styles.stateTitle}
          value={transformText(
            tab.errorTitle ?? 'Impossible de charger les données',
            this.viewModel.textCase,
          )}
          numberOfLines={0}
        />
        <label
          style={styles.stateMessage}
          value={transformText(tab.errorMessage ?? 'Une erreur est survenue.', this.viewModel.textCase)}
          numberOfLines={0}
        />
        {when(tab.onRetry, onRetry => {
          <DSButton
            title={tab.retryLabel ?? 'Réessayer'}
            variant="secondary"
            onTap={onRetry}
          />;
        })}
      </layout>;
      return;
    }

    <layout style={styles.contentContainer}>
      <label
        style={styles.pageTitle}
        value={transformText(tab.pageTitle, this.viewModel.textCase)}
        numberOfLines={0}
      />
      <label
        style={styles.pageMessage}
        value={transformText(tab.pageMessage, this.viewModel.textCase)}
        numberOfLines={0}
      />
    </layout>;
  }

  private renderTabItems(
    tabs: SwipeTabItem[],
    tabWidth: number,
    tabHeight: number,
    iconOnly: boolean,
    labelTypography: Style<Label>,
  ): void {
    {tabs.map((tab, index) => {
      const isActive = index === this.state.activeIndex;
      return (
        <view
          key={`tab-${tab.id}`}
          style={styles.tab.extend({ minHeight: tabHeight, width: tabWidth })}
          onTap={createReusableCallback(() => this.handleTabTap(index))}
          accessibilityCategory="button"
        >
          <layout style={styles.tabContent}>
            {when(iconOnly, () => {
              {when(tab.icon, icon => {
                <label
                  style={isActive ? styles.activeIconOnly : styles.iconOnly}
                  value={icon}
                />;
              })}
            })}
            {when(!iconOnly, () => {
              <label
                style={isActive ? labelTypography : labelTypography.extend({ color: colors.textSecondary })}
                value={transformText(tab.label, this.viewModel.textCase)}
                numberOfLines={1}
              />;
            })}
          </layout>
        </view>
      );
    })}
  }

  onRender(): void {
    const tabs = this.viewModel.tabs;
    const iconOnly = this.viewModel.iconOnly ?? false;
    const showPages = this.viewModel.showPages ?? true;
    const tabWidth = this.getTabWidth();
    const scrollableTabBar = this.viewModel.tabItemWidth !== undefined || !showPages;
    const tabHeight = this.viewModel.tabHeight ?? 64;
    const labelTypography = this.viewModel.strongLabels ? typography.homeTabLabel : typography.tabLabel;

    <view style={styles.root.extend({ flexGrow: showPages ? 1 : 0 })}>
      {scrollableTabBar ? (
        <scroll
          {...noBounceScrollAttributes}
          ref={this.tabBarRef}
          style={styles.tabBarScroll.extend({ height: tabHeight + 2 })}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
        >
          <layout style={styles.tabBarOnlyContent}>
            <layout style={styles.tabBar.extend({ width: tabWidth * tabs.length })}>
              {this.renderTabItems(tabs, tabWidth, tabHeight, iconOnly, labelTypography)}
            </layout>
            <view style={styles.indicatorTrack.extend({ width: tabWidth * tabs.length })}>
              <view
                ref={this.indicatorRef}
                style={styles.activeIndicator.extend({
                  backgroundColor: this.viewModel.indicatorColor ?? colors.borderFocus,
                  translationX:
                    this.indicatorPosition * tabWidth +
                    (tabWidth - this.getIndicatorWidth(tabWidth)) / 2,
                  width: this.getIndicatorWidth(tabWidth),
                })}
              />
            </view>
          </layout>
        </scroll>
      ) : (
        <layout style={styles.tabBar}>
          {this.renderTabItems(tabs, tabWidth, tabHeight, iconOnly, labelTypography)}
        </layout>
      )}

      {showPages && !scrollableTabBar ? <view style={styles.indicatorTrack}>
        <view
          ref={this.indicatorRef}
          style={styles.activeIndicator.extend({
            backgroundColor: this.viewModel.indicatorColor ?? colors.borderFocus,
            translationX:
              this.indicatorPosition * tabWidth +
              (tabWidth - this.getIndicatorWidth(tabWidth)) / 2,
            width: this.getIndicatorWidth(tabWidth),
          })}
        />
      </view> : null}

      {showPages ? <scroll
        {...noBounceScrollAttributes}
        ref={this.pagesRef}
        style={styles.pages}
        horizontal={true}
        pagingEnabled={true}
        showsHorizontalScrollIndicator={false}
        onScroll={this.handleScroll}
        onScrollEnd={this.handleScrollEnd}
      >
      {tabs.map((tab, index) => (
          <view
            key={`page-${tab.id}`}
            style={styles.page.extend({
              alignItems: this.viewModel.renderPage ? 'stretch' : 'center',
              backgroundColor: tab.pageColor ?? colors.backgroundPrimary,
              flexGrow: this.viewModel.renderPage ? 1 : 0,
              justifyContent: this.viewModel.renderPage ? 'flex-start' : 'center',
              padding: this.viewModel.renderPage ? 0 : spacing.xxxl,
            })}
          >
            {this.renderTabPage(
              tab,
              index === this.state.activeIndex,
              Math.abs(index - this.state.activeIndex) <= 1,
            )}
          </view>
        ))}
      </scroll> : null}
    </view>;
  }
}

const styles = {
  root: new Style<View>({
    backgroundColor: colors.backgroundPrimary,
    flexGrow: 1,
  }),
  tabBar: new Style<Layout>({
    flexDirection: 'row',
    width: '100%',
  }),
  tabBarScroll: new Style<ScrollView>({
    width: '100%',
  }),
  tabBarOnlyContent: new Style<Layout>({
    flexDirection: 'column',
  }),
  tab: new Style<View>({
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 64,
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
    paddingTop: spacing.sm,
  }),
  tabContent: new Style<Layout>({
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 36,
  }),
  label: typography.tabLabel.extend({ color: colors.textSecondary }),
  activeLabel: typography.tabLabel.extend({ color: colors.textPrimary }),
  iconOnly: new Style<Label>({
    color: colors.textSecondary,
    font: metropolis.regular(18),
  }),
  activeIconOnly: new Style<Label>({
    color: colors.borderFocus,
    font: metropolis.bold(18),
  }),
  indicatorTrack: new Style<View>({
    width: '100%',
  }),
  activeIndicator: new Style<View>({
    backgroundColor: colors.borderFocus,
    borderRadius: radius.full,
    height: 2,
  }),
  pages: new Style<ScrollView>({
    flexGrow: 1,
    width: '100%',
  }),
  page: new Style<View>({
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 260,
    padding: spacing.xxxl,
    width: '100%',
  }),
  contentContainer: new Style<Layout>({
    alignItems: 'center',
  }),
  stateContainer: new Style<Layout>({
    alignItems: 'center',
    justifyContent: 'center',
  }),
  skeletonContainer: new Style<Layout>({
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  }),
  spinner: new Style<SpinnerView>({
    height: 40,
    width: 40,
  }),
  stateIcon: new Style<Label>({
    color: colors.textSecondary,
    font: metropolis.regular(28),
    marginBottom: spacing.md,
  }),
  stateTitle: typography.headline.extend({ textAlign: 'center' }),
  stateMessage: typography.body.extend({
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  }),
  pageTitle: typography.headline.extend({ textAlign: 'center' }),
  pageMessage: typography.body.extend({
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  }),
};
