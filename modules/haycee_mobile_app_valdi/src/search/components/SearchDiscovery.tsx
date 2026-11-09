import { StatefulComponent } from 'valdi_core/src/Component';
import { AnimationCurve } from 'valdi_core/src/AnimationOptions';
import { Style } from 'valdi_core/src/Style';
import { createReusableCallback } from 'valdi_core/src/utils/Callback';
import { Label, Layout, ScrollView, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../../res/navigation-icons';
import { noBounceScrollAttributes } from '../../design-system/tokens/scrollBehavior';
import { colors } from '../../design-system/tokens/colors';
import { radius } from '../../design-system/tokens/radius';
import { spacing } from '../../design-system/tokens/spacing';
import { fontSize, montserrat, transformText, typography } from '../../design-system/tokens/typography';
import {
  discoverySearchFixtures,
  trendingSearchFixtures,
} from '../SearchData';

export interface SearchDiscoveryViewModel {
  recentSearches: string[];
  onSelect: (query: string) => void;
  onRemoveRecent: (query: string) => void;
  onClearRecent: () => void;
}

interface SearchDiscoveryState {
  isHistoryExpanded: boolean;
}

/** Search landing content: recent queries, trending terms and discovery tags. */
export class SearchDiscovery extends StatefulComponent<SearchDiscoveryViewModel, SearchDiscoveryState> {
  state: SearchDiscoveryState = { isHistoryExpanded: false };

  private handleToggleHistory = (): void => {
    this.setStateAnimated(
      { isHistoryExpanded: !this.state.isHistoryExpanded },
      { duration: 0.35, curve: AnimationCurve.EaseInOut, beginFromCurrentState: true },
    );
  };

  private renderRecentSearches(): void {
    const history = this.viewModel.recentSearches;
    if (history.length === 0) return;

    const showToggle = history.length > 4;
    const visibleHistory = showToggle && !this.state.isHistoryExpanded ? history.slice(0, 4) : history;

    <view style={styles.section}>
      <layout style={styles.sectionHeader}>
        <label value="RECHERCHES RÉCENTES" style={styles.sectionTitle} numberOfLines={1} />
        <view
          style={styles.clearButton}
          onTap={this.viewModel.onClearRecent}
          accessibilityCategory="button"
          accessibilityLabel="Effacer les recherches récentes"
        >
          <image src={navigationIcons.delete02} tint={colors.textSecondary} width={16} height={16} objectFit="contain" />
          <label value="Effacer" style={styles.clearLabel} numberOfLines={1} />
        </view>
      </layout>
      {visibleHistory.map((query, index) => (
        <layout key={`recent-search-${index}-${query}`} style={styles.historyRow}>
          <view
            style={styles.historyTapTarget}
            onTap={createReusableCallback(() => this.viewModel.onSelect(query))}
            accessibilityCategory="button"
            accessibilityLabel={`Rechercher ${query}`}
          >
            <image src={navigationIcons.search02} tint={colors.textTertiary} width={17} height={17} objectFit="contain" />
            <label value={transformText(query, 'capitalize')} style={styles.historyText} numberOfLines={1} textOverflow="ellipsis" />
          </view>
          <view
            style={styles.removeButton}
            onTap={createReusableCallback(() => this.viewModel.onRemoveRecent(query))}
            accessibilityCategory="button"
            accessibilityLabel={`Supprimer ${query} de l’historique`}
          >
            <image src={navigationIcons.cancel01} tint={colors.textInverted} width={12} height={12} objectFit="contain" />
          </view>
        </layout>
      ))}
      {showToggle ? (
        <view style={styles.expandButton} onTap={this.handleToggleHistory} accessibilityCategory="button">
          <label
            value={this.state.isHistoryExpanded ? 'Voir moins' : 'Voir plus'}
            style={styles.expandLabel}
            numberOfLines={1}
          />
          <image
            src={this.state.isHistoryExpanded ? navigationIcons.arrowUp01Round : navigationIcons.arrowDown01Round}
            tint={colors.textSecondary}
            width={14}
            height={14}
            objectFit="contain"
          />
        </view>
      ) : null}
    </view>;
  }

  private renderTrendingSearches(): void {
    <view style={styles.section}>
      <layout style={styles.sectionHeader}>
        <label value="RECHERCHES TENDANCE" style={styles.sectionTitle} numberOfLines={1} />
        <image src={navigationIcons.search02} tint={colors.interactivePrimary} width={16} height={16} objectFit="contain" />
      </layout>
      {trendingSearchFixtures.map((query, index) => (
        <view
          key={`trending-search-${index}`}
          style={styles.trendingRow}
          onTap={createReusableCallback(() => this.viewModel.onSelect(query))}
          accessibilityCategory="button"
          accessibilityLabel={`Rechercher ${query}`}
        >
          <label value={`${index + 1}`.padStart(2, '0')} style={styles.rank} numberOfLines={1} />
          <label value={transformText(query, 'capitalize')} style={styles.trendingText} numberOfLines={1} textOverflow="ellipsis" />
        </view>
      ))}
    </view>;
  }

  private renderDiscoveryTags(): void {
    <view style={styles.section}>
      <label value="DÉCOUVRIR" style={styles.sectionTitle.extend({ marginBottom: spacing.md })} numberOfLines={1} />
      <layout style={styles.tags}>
        {discoverySearchFixtures.map((query, index) => (
          <view
            key={`discovery-search-${index}`}
            style={styles.tag}
            onTap={createReusableCallback(() => this.viewModel.onSelect(query))}
            accessibilityCategory="button"
            accessibilityLabel={`Rechercher ${query}`}
          >
            <label value={transformText(query, 'capitalize')} style={styles.tagLabel} numberOfLines={1} />
          </view>
        ))}
      </layout>
    </view>;
  }

  onRender(): void {
    <scroll {...noBounceScrollAttributes} style={styles.scroll} showsVerticalScrollIndicator={false}>
      <layout style={styles.content}>
        {this.renderRecentSearches()}
        {this.renderTrendingSearches()}
        {this.renderDiscoveryTags()}
        <view style={styles.bottomSpace} />
      </layout>
    </scroll>;
  }
}

const styles = {
  scroll: new Style<ScrollView>({ flexGrow: 1, flexShrink: 1 }),
  content: new Style<Layout>({ flexDirection: 'column', paddingTop: spacing.xl }),
  section: new Style<View>({ paddingBottom: spacing.xxl, paddingLeft: spacing.lg, paddingRight: spacing.lg }),
  sectionHeader: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }),
  sectionTitle: new Style<Label>({ color: colors.textSecondary, font: montserrat.extraBold(fontSize.label) }),
  clearButton: new Style<View>({ alignItems: 'center', flexDirection: 'row' }),
  clearLabel: new Style<Label>({ color: colors.textSecondary, font: montserrat.semiBold(fontSize.nano), marginLeft: spacing.xs }),
  historyRow: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', height: 44 }),
  historyTapTarget: new Style<View>({ alignItems: 'center', flexDirection: 'row', flexGrow: 1, flexShrink: 1, height: '100%', minWidth: 0 }),
  historyText: new Style<Label>({ color: colors.textPrimary, flexGrow: 1, flexShrink: 1, font: montserrat.semiBold(fontSize.body), marginLeft: spacing.md }),
  removeButton: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundTertiary, borderRadius: radius.full, flexShrink: 0, height: 18, justifyContent: 'center', marginLeft: spacing.xs, width: 18 }),
  expandButton: new Style<View>({ alignItems: 'center', flexDirection: 'row', height: 40, justifyContent: 'center' }),
  expandLabel: new Style<Label>({ color: colors.textSecondary, font: montserrat.semiBold(fontSize.tiny), marginRight: spacing.xs }),
  trendingRow: new Style<View>({ alignItems: 'center', flexDirection: 'row', height: 42 }),
  rank: new Style<Label>({ color: colors.textTertiary, font: montserrat.semiBold(fontSize.body), width: 38 }),
  trendingText: new Style<Label>({ color: colors.textPrimary, flexGrow: 1, flexShrink: 1, font: montserrat.semiBold(fontSize.body) }),
  tags: new Style<Layout>({ flexDirection: 'row', flexWrap: 'wrap' }),
  tag: new Style<View>({ backgroundColor: colors.backgroundSecondary, borderRadius: radius.xs, marginBottom: spacing.sm, marginRight: spacing.sm, paddingBottom: spacing.sm, paddingLeft: spacing.md, paddingRight: spacing.md, paddingTop: spacing.sm }),
  tagLabel: typography.body.extend({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.body) }),
  bottomSpace: new Style<View>({ height: spacing.xxxxxl }),
};
