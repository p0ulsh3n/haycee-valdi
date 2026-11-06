import { Component } from 'valdi_core/src/Component';
import { AnimationCurve } from 'valdi_core/src/AnimationOptions';
import { Style } from 'valdi_core/src/Style';
import { ImageView, Label, ScrollView, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../../res/navigation-icons';
import { Ticker } from '../../design-system/components/Ticker';
import { colors } from '../../design-system/tokens/colors';
import { layout } from '../../design-system/tokens/spacing';
import { fontSize, lineHeight, montserrat } from '../../design-system/tokens/typography';

const DEFAULT_SEARCH_SUGGESTIONS = ['Rechercher des articles'];

export interface HomeTickerSearchViewModel {
  suggestions?: string[];
  placeholder?: string;
  onTap?: () => void;
}

/** Search field with its rotating suggestions powered by the shared design-system ticker. */
export class HomeTickerSearch extends Component<HomeTickerSearchViewModel> {
  private fallbackPlaceholder = '';
  private fallbackSuggestions: string[] = DEFAULT_SEARCH_SUGGESTIONS;

  onRender(): void {
    const suggestions = this.getSuggestions();

    <view style={styles.search} onTap={this.viewModel.onTap} accessibilityCategory="button">
      <image
        src={navigationIcons.search02}
        tint={colors.textSecondary}
        style={styles.searchIcon}
        objectFit="contain"
      />
      <Ticker
        items={suggestions}
        mode="rotate"
        orientation="vertical"
        direction="forward"
        active={suggestions.length > 1}
        rotateTransition="fade-slide"
        transitionCurve={AnimationCurve.EaseOut}
        holdDurationMs={layout.home.ticker.holdMilliseconds}
        exitDurationMs={Math.round(layout.home.ticker.exitDurationSeconds * 1000)}
        enterDurationMs={Math.round(layout.home.ticker.enterDurationSeconds * 1000)}
        transitionDistance={layout.home.ticker.slideDistance}
        style={styles.searchTicker}
        textStyle={styles.searchLabel}
      />
    </view>;
  }

  private getSuggestions(): string[] {
    if (this.viewModel.suggestions && this.viewModel.suggestions.length > 0) return this.viewModel.suggestions;
    const placeholder = this.viewModel.placeholder ?? '';
    if (!placeholder) return DEFAULT_SEARCH_SUGGESTIONS;
    if (placeholder !== this.fallbackPlaceholder) {
      this.fallbackPlaceholder = placeholder;
      this.fallbackSuggestions = [placeholder];
    }
    return this.fallbackSuggestions;
  }
}

const styles = {
  search: new Style<View>({
    alignItems: 'center',
    borderColor: colors.textPrimary,
    borderRadius: layout.home.search.borderRadius,
    borderWidth: layout.home.search.borderWidth,
    flexDirection: 'row',
    height: layout.home.search.height,
    minWidth: 0,
    paddingLeft: layout.home.search.horizontalPadding,
    paddingRight: layout.home.search.horizontalPadding,
  }),
  searchIcon: new Style<ImageView>({
    height: layout.home.search.iconSize,
    marginRight: layout.home.search.iconGap,
    width: layout.home.search.iconSize,
  }),
  searchTicker: new Style<ScrollView>({
    flexGrow: 1,
    flexShrink: 1,
    height: layout.home.search.height,
    minWidth: 0,
  }),
  searchLabel: new Style<Label>({
    color: colors.textSecondary,
    font: montserrat.regular(fontSize.body),
    lineHeight: lineHeight.body / fontSize.body,
    textAlign: 'left',
    translationY: -2.5,
  }),
};
