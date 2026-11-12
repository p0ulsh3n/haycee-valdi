import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { Asset } from 'valdi_tsx/src/Asset';
import { Label, View } from 'valdi_tsx/src/NativeTemplateElements';
import { colors } from '../tokens/colors';
import { layout, spacing } from '../tokens/spacing';
import { fontSize, montserrat } from '../tokens/typography';

export interface VerticalFeedActionItem {
  id: string;
  icon: Asset;
  activeIcon?: Asset;
  accessibilityLabel: string;
  label: string;
  isActive?: boolean;
  activeTintColor?: string;
  onTap: () => void;
}

export interface VerticalFeedActionRailViewModel {
  actions: VerticalFeedActionItem[];
  bottomInset?: number;
  rightInset?: number;
}

/** Reusable engagement controls layered along the right edge of a vertical feed page. */
export class VerticalFeedActionRail extends Component<VerticalFeedActionRailViewModel> {
  private renderAction(action: VerticalFeedActionItem): void {
    const active = action.isActive === true;
    <view
      key={action.id}
      style={styles.action}
      onTap={action.onTap}
      accessibilityCategory="button"
      accessibilityLabel={action.accessibilityLabel}
      accessibilityStateSelected={active}
    >
      <image
        src={active && action.activeIcon ? action.activeIcon : action.icon}
        tint={active ? action.activeTintColor ?? colors.interactivePrimary : colors.textInverted}
        width={layout.feed.verticalActionRail.iconSize}
        height={layout.feed.verticalActionRail.iconSize}
        objectFit="contain"
      />
      <label
        value={action.label}
        style={active ? styles.activeLabel : styles.label}
        numberOfLines={1}
      />
    </view>;
  }

  onRender(): void {
    const { actions, bottomInset = 0, rightInset = layout.feed.verticalActionRail.rightInset } = this.viewModel;
    <view
      style={styles.rail.extend({
        bottom: bottomInset + layout.feed.verticalActionRail.bottomOffset,
        right: rightInset,
      })}
    >
      {actions.map(action => this.renderAction(action))}
    </view>;
  }
}

const styles = {
  rail: new Style<View>({
    alignItems: 'center',
    flexDirection: 'column',
    position: 'absolute',
    width: layout.feed.verticalActionRail.width,
  }),
  action: new Style<View>({
    alignItems: 'center',
    flexDirection: 'column',
    height: layout.feed.verticalActionRail.actionHeight,
    justifyContent: 'center',
    marginBottom: layout.feed.verticalActionRail.itemGap,
    width: layout.feed.verticalActionRail.width,
  }),
  label: new Style<Label>({
    color: colors.textInverted,
    font: montserrat.semiBold(fontSize.metadata),
    marginTop: spacing.xs,
    textAlign: 'center',
    textShadow: 'rgba(0, 0, 0, 0.72) 1 1 0 1',
  }),
  activeLabel: new Style<Label>({
    color: colors.textInverted,
    font: montserrat.extraBold(fontSize.metadata),
    marginTop: spacing.xs,
    textAlign: 'center',
    textShadow: 'rgba(0, 0, 0, 0.72) 1 1 0 1',
  }),
};
