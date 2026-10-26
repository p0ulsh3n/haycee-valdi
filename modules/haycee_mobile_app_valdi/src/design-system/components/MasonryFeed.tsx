import { Device } from 'valdi_core/src/Device';
import { StatefulComponent } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { ElementFrame } from 'valdi_tsx/src/Geometry';
import { Label, Layout, View } from 'valdi_tsx/src/NativeTemplateElements';
import { colors } from '../tokens/colors';
import { spacing } from '../tokens/spacing';
import { montserrat } from '../tokens/typography';

const SCREEN_PADDING = 12;
const COLUMN_GAP = 8;
const NUM_COLUMNS = 2;

/** Minimal contract required by the global Masonry layout engine. */
export interface MasonryItem {
  id: string;
  masonryAspectRatio?: number;
}

export interface MasonryFeedViewModel {
  items: MasonryItem[];
  isLoadingMore?: boolean;
  hasMore?: boolean;
  error?: string;
  onLoadMore?: () => void;
  onRetry?: () => void;
  /** Feature-owned renderer. The callback renders the item in the current column. */
  renderItem: (item: MasonryItem, columnWidth: number) => void;
  /** Optional feature-owned height estimator used to balance the two columns. */
  estimateItemHeight?: (item: MasonryItem, columnWidth: number) => number;
  retryLabel?: string;
  endLabel?: string;
}

interface MasonryFeedState {
  columnWidth: number;
  leftColumn: MasonryItem[];
  rightColumn: MasonryItem[];
}

export const getMasonryColumnWidth = (availableWidth: number): number => {
  const width = availableWidth > 0 ? availableWidth : Device.getWindowWidth();
  return Math.max(1, Math.floor((width - SCREEN_PADDING * 2 - COLUMN_GAP) / NUM_COLUMNS));
};

/** Stable fallback ratio for API items that do not provide image dimensions. */
export const getMasonryImageAspectRatio = (item: MasonryItem): number => {
  if (item.masonryAspectRatio) {
    return item.masonryAspectRatio;
  }

  const hash = Array.from(item.id).reduce((value, character) => value + character.charCodeAt(0), 0);
  return [1.08, 1.25, 1.42][hash % 3];
};

const defaultEstimateItemHeight = (item: MasonryItem, columnWidth: number): number => (
  Math.round(columnWidth * getMasonryImageAspectRatio(item)) + 80
);

export const splitMasonryColumns = (
  items: MasonryItem[],
  columnWidth: number,
  estimateItemHeight: (item: MasonryItem, columnWidth: number) => number = defaultEstimateItemHeight,
): [MasonryItem[], MasonryItem[]] => {
  const left: MasonryItem[] = [];
  const right: MasonryItem[] = [];
  let leftHeight = 0;
  let rightHeight = 0;

  items.forEach(item => {
    const itemHeight = estimateItemHeight(item, columnWidth);
    if (leftHeight <= rightHeight) {
      left.push(item);
      leftHeight += itemHeight;
    } else {
      right.push(item);
      rightHeight += itemHeight;
    }
  });

  return [left, right];
};

/**
 * Global two-column Masonry feed.
 *
 * The parent owns the vertical ScrollView. This component owns only column
 * balancing, the end sentinel, pagination feedback, and the native footer.
 * Feature modules provide the item renderer and optional height estimator.
 */
export class MasonryFeed extends StatefulComponent<MasonryFeedViewModel, MasonryFeedState> {
  state: MasonryFeedState = {
    columnWidth: getMasonryColumnWidth(0),
    leftColumn: [],
    rightColumn: [],
  };

  onViewModelUpdate(previous?: MasonryFeedViewModel): void {
    if (!previous || previous.items !== this.viewModel.items) {
      this.rebuildColumns(this.state.columnWidth, this.viewModel.items);
    }
  }

  private rebuildColumns = (columnWidth: number, items: MasonryItem[]): void => {
    const [leftColumn, rightColumn] = splitMasonryColumns(
      items,
      columnWidth,
      this.viewModel.estimateItemHeight,
    );
    this.setState({ columnWidth, leftColumn, rightColumn });
  };

  private handleLayout = (frame: ElementFrame): void => {
    const columnWidth = getMasonryColumnWidth(frame.width);
    if (columnWidth !== this.state.columnWidth) {
      this.rebuildColumns(columnWidth, this.viewModel.items);
    }
  };

  private handleLoadMoreVisibility = (isVisible: boolean): void => {
    if (isVisible && this.viewModel.hasMore !== false && !this.viewModel.isLoadingMore) {
      this.viewModel.onLoadMore?.();
    }
  };

  private renderItem = (item: MasonryItem): void => {
    this.viewModel.renderItem(item, this.state.columnWidth);
  };

  onRender(): void {
    const items = this.viewModel.items;
    const retryLabel = this.viewModel.retryLabel ?? 'Réessayer';
    const endLabel = this.viewModel.endLabel ?? 'Tu es à jour';

    <layout style={styles.root} onLayout={this.handleLayout}>
      <layout style={styles.columns}>
        <layout width={this.state.columnWidth}>
          {this.state.leftColumn.map(this.renderItem)}
        </layout>
        <layout width={this.state.columnWidth} style={styles.rightColumn}>
          {this.state.rightColumn.map(this.renderItem)}
        </layout>
      </layout>

      {this.viewModel.hasMore !== false ? (
        <view
          key={`masonry-load-more-${items.length}`}
          style={styles.loadMoreSentinel}
          onVisibilityChanged={this.handleLoadMoreVisibility}
        />
      ) : null}

      {this.viewModel.error ? (
        <layout style={styles.errorFooter}>
          <label value={this.viewModel.error} style={styles.errorLabel} />
          <view style={styles.retryButton} onTap={this.viewModel.onRetry} accessibilityCategory="button">
            <label value={retryLabel} style={styles.retryLabel} />
          </view>
        </layout>
      ) : null}

      {!this.viewModel.error && this.viewModel.isLoadingMore ? (
        <layout style={styles.loadingFooter}>
          <spinner color={colors.textPrimary} width={24} height={24} />
        </layout>
      ) : null}

      {!this.viewModel.error && this.viewModel.hasMore === false && items.length > 0 ? (
        <layout style={styles.endFooter}>
          <label value={endLabel} style={styles.endLabel} />
        </layout>
      ) : null}
    </layout>;
  }
}

const styles = {
  root: new Style<Layout>({
    paddingBottom: spacing.xl,
    paddingLeft: SCREEN_PADDING,
    paddingRight: SCREEN_PADDING,
  }),
  columns: new Style<Layout>({
    alignItems: 'flex-start',
    flexDirection: 'row',
  }),
  loadMoreSentinel: new Style<View>({
    height: 1,
    width: '100%',
  }),
  rightColumn: new Style<Layout>({
    marginLeft: COLUMN_GAP,
  }),
  loadingFooter: new Style<Layout>({
    alignItems: 'center',
    paddingBottom: spacing.lg,
    paddingTop: spacing.lg,
  }),
  endFooter: new Style<Layout>({
    alignItems: 'center',
    paddingBottom: spacing.lg,
    paddingTop: spacing.lg,
  }),
  endLabel: new Style<Label>({
    color: colors.textTertiary,
    font: montserrat.regular(11),
  }),
  errorFooter: new Style<Layout>({
    alignItems: 'center',
    paddingBottom: spacing.lg,
    paddingTop: spacing.lg,
  }),
  errorLabel: new Style<Label>({
    color: colors.textSecondary,
    font: montserrat.regular(12),
    marginBottom: spacing.sm,
  }),
  retryButton: new Style<View>({
    backgroundColor: colors.textPrimary,
    borderRadius: 16,
    paddingBottom: 8,
    paddingLeft: 14,
    paddingRight: 14,
    paddingTop: 8,
  }),
  retryLabel: new Style<Label>({
    color: colors.textInverted,
    font: montserrat.extraBold(12),
  }),
};
