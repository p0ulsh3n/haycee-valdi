import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { createReusableCallback } from 'valdi_core/src/utils/Callback';
import { Label, Layout, ScrollView, View } from 'valdi_tsx/src/NativeTemplateElements';
import { colors } from '../tokens/colors';
import { noBounceScrollAttributes } from '../tokens/scrollBehavior';
import { radius } from '../tokens/radius';
import { spacing } from '../tokens/spacing';
import { fontSize, montserrat, TextCase, transformText } from '../tokens/typography';

export interface TabChipItem {
  id: string;
  label: string;
  disabled?: boolean;
}

export interface TabChipsViewModel {
  tabs: TabChipItem[];
  selectedId: string;
  onSelectionChange: (id: string) => void;
  /** Enables horizontal scrolling when the chips exceed the available width. Defaults to true. */
  scrollable?: boolean;
  /** Optional horizontal inset for the chip row. Defaults to the design-system large spacing. */
  horizontalPadding?: number;
  /** Optional distance between chips. Defaults to the design-system small spacing. */
  chipSpacing?: number;
  chipHeight?: number;
  selectedBackgroundColor?: string;
  unselectedBackgroundColor?: string;
  selectedTextColor?: string;
  unselectedTextColor?: string;
  textCase?: TextCase;
}

/** Reusable selectable pill tabs, independent from page-swiping tabs. */
export class TabChips extends Component<TabChipsViewModel> {
  private renderTabs(): void {
    {this.viewModel.tabs.map(tab => {
      const selected = tab.id === this.viewModel.selectedId;
      const disabled = tab.disabled ?? false;
      const chipStyle = selected ? styles.selectedChip : styles.chip;
      const labelStyle = selected ? styles.selectedLabel : styles.label;

      return (
        <view
          key={`tab-chip-${tab.id}`}
          style={chipStyle.extend({
            backgroundColor: selected
              ? this.viewModel.selectedBackgroundColor ?? colors.interactivePrimary
              : this.viewModel.unselectedBackgroundColor ?? colors.backgroundSecondary,
            height: this.viewModel.chipHeight ?? 36,
            marginRight: this.viewModel.chipSpacing ?? spacing.sm,
            opacity: disabled ? 0.48 : 1,
          })}
          onTap={createReusableCallback(() => {
            if (!disabled && !selected) {
              this.viewModel.onSelectionChange(tab.id);
            }
          })}
          onTapDisabled={disabled}
          accessibilityCategory="button"
          accessibilityLabel={tab.label}
          accessibilityStateDisabled={disabled}
          accessibilityStateSelected={selected}
        >
          <label
            value={transformText(tab.label, this.viewModel.textCase)}
            style={labelStyle.extend({
              color: selected
                ? this.viewModel.selectedTextColor ?? colors.textInverted
                : this.viewModel.unselectedTextColor ?? colors.textSecondary,
            })}
            numberOfLines={1}
          />
        </view>
      );
    })}
  }

  onRender(): void {
    const horizontalPadding = this.viewModel.horizontalPadding ?? spacing.lg;
    const contentStyle = styles.content.extend({
      paddingLeft: horizontalPadding,
      paddingRight: horizontalPadding,
    });

    <view style={styles.root}>
      {this.viewModel.scrollable === false ? (
        <layout style={contentStyle}>{this.renderTabs()}</layout>
      ) : (
        <scroll
          {...noBounceScrollAttributes}
          style={styles.scroll}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
        >
          <layout style={contentStyle}>{this.renderTabs()}</layout>
        </scroll>
      )}
    </view>;
  }
}

const styles = {
  root: new Style<View>({
    flexShrink: 0,
    width: '100%',
  }),
  scroll: new Style<ScrollView>({
    width: '100%',
  }),
  content: new Style<Layout>({
    alignItems: 'center',
    flexDirection: 'row',
    paddingBottom: spacing.xs,
    paddingTop: spacing.xs,
  }),
  chip: new Style<View>({
    alignItems: 'center',
    borderRadius: radius.sm,
    flexShrink: 0,
    justifyContent: 'center',
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
  }),
  selectedChip: new Style<View>({
    alignItems: 'center',
    borderRadius: radius.sm,
    flexShrink: 0,
    justifyContent: 'center',
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
  }),
  label: new Style<Label>({
    color: colors.textSecondary,
    font: montserrat.semiBold(fontSize.metadata),
  }),
  selectedLabel: new Style<Label>({
    color: colors.textInverted,
    font: montserrat.semiBold(fontSize.metadata),
  }),
};
