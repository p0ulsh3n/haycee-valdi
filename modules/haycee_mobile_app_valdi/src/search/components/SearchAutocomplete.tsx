import { Component } from 'valdi_core/src/Component';
import { AttributedTextBuilder } from 'valdi_core/src/utils/AttributedTextBuilder';
import { createReusableCallback } from 'valdi_core/src/utils/Callback';
import { Style } from 'valdi_core/src/Style';
import { Label, ScrollView, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../../res/navigation-icons';
import { noBounceScrollAttributes } from '../../design-system/tokens/scrollBehavior';
import { colors } from '../../design-system/tokens/colors';
import { spacing } from '../../design-system/tokens/spacing';
import { fontSize, montserrat } from '../../design-system/tokens/typography';

interface SearchAutocompleteViewModel {
  query: string;
  suggestions: string[];
  onSelect: (title: string) => void;
}

const normalizeForHighlight = (value: string): { text: string; starts: number[]; ends: number[] } => {
  let text = '';
  const starts: number[] = [];
  const ends: number[] = [];
  for (let sourceIndex = 0; sourceIndex < value.length;) {
    const codePoint = value.codePointAt(sourceIndex);
    if (codePoint === undefined) break;
    const sourceCharacter = String.fromCodePoint(codePoint);
    const normalizedCharacter = sourceCharacter.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    for (let index = 0; index < normalizedCharacter.length; index++) {
      text += normalizedCharacter[index];
      starts.push(sourceIndex);
      ends.push(sourceIndex + sourceCharacter.length);
    }
    sourceIndex += sourceCharacter.length;
  }
  return { text, starts, ends };
};

/** Native, live-updating product-title suggestions shown as the query is typed. */
export class SearchAutocomplete extends Component<SearchAutocompleteViewModel> {
  private highlightedTitle(title: string) {
    const terms = this.viewModel.query.trim().split(/\s+/).filter(Boolean);
    const normalizedTitle = normalizeForHighlight(title);
    const matches = terms
      .map(term => {
        const normalizedTerm = normalizeForHighlight(term).text;
        const normalizedStart = normalizedTitle.text.indexOf(normalizedTerm);
        if (normalizedStart < 0 || normalizedTerm.length === 0) return undefined;
        const normalizedEnd = normalizedStart + normalizedTerm.length - 1;
        return {
          start: normalizedTitle.starts[normalizedStart],
          end: normalizedTitle.ends[normalizedEnd],
        };
      })
      .filter((range): range is { start: number; end: number } => range !== undefined)
      .sort((left, right) => left.start - right.start);

    if (matches.length === 0) return title;

    const builder = new AttributedTextBuilder();
    let cursor = 0;
    for (const match of matches) {
      if (match.start < cursor) continue;
      builder.appendText(title.slice(cursor, match.start));
      builder.append(title.slice(match.start, match.end), { color: colors.interactivePrimary });
      cursor = match.end;
    }
    builder.appendText(title.slice(cursor));
    return builder.build();
  }

  private renderSuggestion(title: string, index: number): void {
    <view
      key={`search-suggestion-${index}-${title}`}
      style={styles.row}
      onTap={createReusableCallback(() => this.viewModel.onSelect(title))}
      accessibilityCategory="button"
      accessibilityLabel={`Rechercher ${title}`}
    >
      <image src={navigationIcons.search02} tint={colors.textPrimary} width={18} height={18} objectFit="contain" />
      <label
        value={this.highlightedTitle(title)}
        style={styles.title}
        numberOfLines={1}
        textOverflow="ellipsis"
      />
      <image src={navigationIcons.arrowRight01Round} tint={colors.textPrimary} width={18} height={18} objectFit="contain" />
    </view>;
  }

  onRender(): void {
    const suggestions = this.viewModel.suggestions;

    <scroll {...noBounceScrollAttributes} style={styles.scroll} showsVerticalScrollIndicator={false}>
      {suggestions.length > 0 ? (
        <view style={styles.list}>
          {suggestions.map((title, index) => this.renderSuggestion(title, index))}
        </view>
      ) : (
        <view style={styles.emptyState}>
          <label value="Aucune suggestion" style={styles.emptyTitle} numberOfLines={1} />
          <label value="Essaie un autre mot-clé." style={styles.emptyMessage} numberOfLines={1} />
        </view>
      )}
    </scroll>;
  }
}

const styles = {
  scroll: new Style<ScrollView>({ flexGrow: 1, flexShrink: 1 }),
  list: new Style<View>({ flexDirection: 'column', paddingLeft: spacing.lg, paddingRight: spacing.lg, paddingTop: spacing.sm }),
  row: new Style<View>({ alignItems: 'center', flexDirection: 'row', height: 52, minWidth: 0 }),
  title: new Style<Label>({ color: colors.textPrimary, flexGrow: 1, flexShrink: 1, font: montserrat.semiBold(fontSize.body), marginLeft: spacing.md, marginRight: spacing.md, minWidth: 0 }),
  emptyState: new Style<View>({ alignItems: 'center', paddingTop: spacing.xxl }),
  emptyTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.body) }),
  emptyMessage: new Style<Label>({ color: colors.textSecondary, font: montserrat.semiBold(fontSize.metadata), marginTop: spacing.xs }),
};
