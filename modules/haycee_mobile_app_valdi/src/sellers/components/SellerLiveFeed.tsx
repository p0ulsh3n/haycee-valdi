import { StatefulComponent } from 'valdi_core/src/Component';
import { Device } from 'valdi_core/src/Device';
import { Style } from 'valdi_core/src/Style';
import { createReusableCallback } from 'valdi_core/src/utils/Callback';
import { Label, Layout, View } from 'valdi_tsx/src/NativeTemplateElements';
import { LiveFeedCard } from '../../live/components/LiveFeedCard';
import type { LiveFeedItem } from '../../live/data/LiveFeedData';
import { colors } from '../../design-system/tokens/colors';
import { layout, spacing } from '../../design-system/tokens/spacing';

export interface SellerLiveFeedViewModel {
  items: LiveFeedItem[];
  onOpenLive: (item: LiveFeedItem) => void;
}

interface SellerLiveFeedState {
  remindersByItemId: Record<string, boolean>;
}

/** Seller live grid reusing the same card component and 3:4 tile geometry as Live. */
export class SellerLiveFeed extends StatefulComponent<SellerLiveFeedViewModel, SellerLiveFeedState> {
  state: SellerLiveFeedState = { remindersByItemId: {} };

  onRender(): void {
    const items = this.viewModel.items;
    const horizontalPadding = layout.live.feedHorizontalPadding;
    const columnGap = layout.live.cardColumnGap;
    const cardWidth = (Device.getWindowWidth() - horizontalPadding * 2 - columnGap) / 2;
    const rows: LiveFeedItem[][] = [];
    for (let index = 0; index < items.length; index += 2) {
      rows.push(items.slice(index, index + 2));
    }

    <view style={styles.root}>
      {items.length > 0 ? (
        <layout style={styles.grid.extend({
          paddingLeft: horizontalPadding,
          paddingRight: horizontalPadding,
        })}>
          {rows.map((row, rowIndex) => (
            <layout key={`seller-live-row-${rowIndex}`} style={styles.row}>
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
                    showHostHeader={false}
                    showReminderButton={item.status === 'upcoming'}
                    isReminderSet={this.state.remindersByItemId[item.id] ?? false}
                    reminderCount={item.reminderCount ?? 0}
                    onToggleReminder={createReusableCallback(() => {
                      this.setState({
                        remindersByItemId: {
                          ...this.state.remindersByItemId,
                          [item.id]: !(this.state.remindersByItemId[item.id] ?? false),
                        },
                      });
                    })}
                    onTap={createReusableCallback(() => this.viewModel.onOpenLive(item))}
                  />
                </view>
              ))}
            </layout>
          ))}
        </layout>
      ) : (
        <view style={styles.emptyState}>
          <label value="Aucun live programmé pour le moment" style={styles.emptyLabel} numberOfLines={2} />
        </view>
      )}
    </view>;
  }
}

const styles = {
  root: new Style<View>({
    flexGrow: 1,
    paddingTop: layout.live.feedTopPadding,
  }),
  grid: new Style<Layout>({
    flexDirection: 'column',
    paddingBottom: spacing.xxxl,
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
  emptyState: new Style<View>({
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
    paddingLeft: spacing.xl,
    paddingRight: spacing.xl,
  }),
  emptyLabel: new Style<Label>({
    color: colors.textSecondary,
    textAlign: 'center',
  }),
};
