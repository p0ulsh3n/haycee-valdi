import { StatefulComponent } from 'valdi_core/src/Component';
import { AnimationCurve } from 'valdi_core/src/AnimationOptions';
import { ElementRef } from 'valdi_core/src/ElementRef';
import { Style } from 'valdi_core/src/Style';
import { ImageView, Label, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../../res/navigation-icons';
import { colors } from '../../design-system/tokens/colors';
import { layout } from '../../design-system/tokens/spacing';
import { fontSize, lineHeight, montserrat } from '../../design-system/tokens/typography';

export interface HomeTickerSearchViewModel {
  suggestions?: string[];
  placeholder?: string;
  onTap?: () => void;
}

interface HomeTickerSearchState {
  index: number;
}

/** Shellby-style search field with a rotating trending-query label. */
export class HomeTickerSearch extends StatefulComponent<
  HomeTickerSearchViewModel,
  HomeTickerSearchState
> {
  state: HomeTickerSearchState = { index: 0 };
  private readonly labelRef = new ElementRef();
  private tickerEnabled = false;

  onCreate(): void {
    this.tickerEnabled = this.getSuggestions().length > 1;
    this.scheduleTicker();
  }

  onDestroy(): void {
    this.tickerEnabled = false;
  }

  onRender(): void {
    const suggestions = this.getSuggestions();
    const suggestion = suggestions[this.state.index] ?? this.viewModel.placeholder ?? 'Rechercher';

    <view style={styles.search} onTap={this.viewModel.onTap} accessibilityCategory="button">
      <image
        src={navigationIcons.search02}
        tint={colors.textSecondary}
        style={styles.searchIcon}
        objectFit="contain"
      />
      <label
        ref={this.labelRef}
        style={styles.searchLabel}
        value={suggestion}
        numberOfLines={1}
      />
    </view>;
  }

  private scheduleTicker(): void {
    if (!this.tickerEnabled) {
      return;
    }

    this.setTimeoutDisposable(() => {
      void this.rotateSuggestion();
    }, layout.home.ticker.holdMilliseconds);
  }

  private async rotateSuggestion(): Promise<void> {
    if (!this.tickerEnabled) {
      return;
    }

    await this.animatePromise(
      {
        duration: layout.home.ticker.exitDurationSeconds,
        curve: AnimationCurve.EaseOut,
      },
      () => {
        this.labelRef.setAttribute('opacity', 0);
        this.labelRef.setAttribute('translateY', -layout.home.ticker.slideDistance);
      },
    );

    if (!this.tickerEnabled) {
      return;
    }

    const nextIndex = (this.state.index + 1) % this.getSuggestions().length;
    this.setState({ index: nextIndex });

    await this.animatePromise(
      {
        duration: layout.home.ticker.enterDurationSeconds,
        curve: AnimationCurve.EaseOut,
      },
      () => {
        this.labelRef.setAttribute('opacity', 1);
        this.labelRef.setAttribute('translateY', 0);
      },
    );

    this.scheduleTicker();
  }

  private getSuggestions(): string[] {
    const suggestions = this.viewModel.suggestions;
    return suggestions && suggestions.length > 0 ? suggestions : ['Rechercher des articles'];
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
  searchLabel: new Style<Label>({
    color: colors.textSecondary,
    flexGrow: 1,
    font: montserrat.regular(fontSize.body),
    lineHeight: lineHeight.body / fontSize.body,
  }),
};
