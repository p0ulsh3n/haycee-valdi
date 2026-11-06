import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { Device } from 'valdi_core/src/Device';
import { createReusableCallback } from 'valdi_core/src/utils/Callback';
import { Layout, ScrollView, View } from 'valdi_tsx/src/NativeTemplateElements';
import { noBounceScrollAttributes } from '../../design-system/tokens/scrollBehavior';
import { colors } from '../../design-system/tokens/colors';
import { layout } from '../../design-system/tokens/spacing';
import { LiveFeedCard } from './LiveFeedCard';
import { getLiveFeedItems } from '../data/LiveFeedData';

export interface LiveCategoryFeedViewModel {
  categoryId: string;
  isPrepared: boolean;
  onOpenLive: (item: ReturnType<typeof getLiveFeedItems>[number]) => void;
}

/** One independently scrollable category page, prepared only near the active tab. */
export class LiveCategoryFeed extends Component<LiveCategoryFeedViewModel> {
  onRender(): void {
    if (!this.viewModel.isPrepared) {
      <view style={styles.root} />;
      return;
    }

    const items = getLiveFeedItems(this.viewModel.categoryId);
    const horizontalPadding = layout.live.feedHorizontalPadding;
    const columnGap = layout.live.cardColumnGap;
    const cardWidth = (Device.getWindowWidth() - horizontalPadding * 2 - columnGap) / 2;
    const rows: Array<typeof items> = [];
    for (let index = 0; index < items.length; index += 2) {
      rows.push(items.slice(index, index + 2));
    }

    <scroll {...noBounceScrollAttributes} style={styles.scroll} showsVerticalScrollIndicator={false}>
      <layout style={styles.grid.extend({
        paddingLeft: horizontalPadding,
        paddingRight: horizontalPadding,
        paddingTop: layout.live.feedTopPadding,
        paddingBottom: layout.live.feedBottomPadding,
      })}>
        {rows.map((row, rowIndex) => (
          <layout key={`live-row-${rowIndex}`} style={styles.row}>
            {row.map((item, columnIndex) => (
              <view
                key={item.id}
                style={styles.cell.extend({
                  marginRight: columnIndex === 0 && row.length === 2 ? columnGap : 0,
                  width: cardWidth,
                })}
              >
                <LiveFeedCard
                  item={item}
                  onTap={createReusableCallback(() => this.viewModel.onOpenLive(item))}
                />
              </view>
            ))}
          </layout>
        ))}
      </layout>
    </scroll>;
  }
}

const styles = {
  root: new Style<View>({
    backgroundColor: colors.backgroundPrimary,
    flexGrow: 1,
  }),
  scroll: new Style<ScrollView>({
    flexGrow: 1,
    flexShrink: 1,
  }),
  grid: new Style<Layout>({
    flexDirection: 'column',
    width: '100%',
  }),
  row: new Style<Layout>({
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginBottom: layout.live.cardRowGap,
    width: '100%',
  }),
  cell: new Style<View>({
    flexGrow: 0,
    flexShrink: 0,
  }),
};
