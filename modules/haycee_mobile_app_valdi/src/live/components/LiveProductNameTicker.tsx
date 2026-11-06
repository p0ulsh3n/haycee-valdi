import { StatefulComponent } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { Label, ScrollView, View } from 'valdi_tsx/src/NativeTemplateElements';
import { Ticker } from '../../design-system/components/Ticker';
import { colors } from '../../design-system/tokens/colors';
import { layout } from '../../design-system/tokens/spacing';
import { fontSize, montserrat, typography } from '../../design-system/tokens/typography';

export interface LiveProductNameTickerViewModel {
  title: string;
  active: boolean;
}

const productTickerText = new Style<Label>({
  color: colors.textInverted,
  flexShrink: 0,
  font: montserrat.semiBold(fontSize.product),
});
const productRestingText = Style.merge(
  typography.body.extend({ flexShrink: 0 }),
  productTickerText,
  new Style<Label>({ flexShrink: 1, width: '100%' }),
) as Style<Label>;

/** Live card adapter for the shared horizontal marquee ticker. */
export class LiveProductNameTicker extends StatefulComponent<LiveProductNameTickerViewModel, { isMarqueeMoving: boolean }> {
  state = { isMarqueeMoving: false };
  private previousTitle = '';
  private tickerItems: string[] = [];

  private handleMarqueeCycleStart = (): void => {
    if (!this.state.isMarqueeMoving) this.setState({ isMarqueeMoving: true });
  };

  private handleMarqueeCycleEnd = (): void => {
    if (this.state.isMarqueeMoving) this.setState({ isMarqueeMoving: false });
  };

  onViewModelUpdate(previous?: Readonly<LiveProductNameTickerViewModel>): void {
    if (previous && (previous.title !== this.viewModel.title || previous.active !== this.viewModel.active)) {
      this.setState({ isMarqueeMoving: false });
    }
  }

  onRender(): void {
    if (this.viewModel.title !== this.previousTitle) {
      this.previousTitle = this.viewModel.title;
      this.tickerItems = [this.viewModel.title];
    }

    <view style={styles.container}>
      <Ticker
        items={this.tickerItems}
        mode="marquee"
        orientation="horizontal"
        direction="forward"
        active={this.viewModel.active}
        holdDurationMs={layout.live.viewer.productTickerHoldMilliseconds}
        marqueeDurationMs={layout.live.viewer.productTickerDurationMilliseconds}
        loopDelayMs={5000}
        onMarqueeCycleStart={this.handleMarqueeCycleStart}
        onMarqueeCycleEnd={this.handleMarqueeCycleEnd}
        style={this.state.isMarqueeMoving ? styles.viewport : styles.viewport.extend({ opacity: 0 })}
        textStyle={styles.title}
      />
      {!this.state.isMarqueeMoving ? (
        <view style={styles.restingOverlay}>
          <label
            value={this.viewModel.title}
            style={styles.restingTitle}
            numberOfLines={1}
            textOverflow="ellipsis"
          />
        </view>
      ) : null}
    </view>;
  }
}

const styles = {
  container: new Style<View>({ flexGrow: 1, flexShrink: 1, minWidth: 0, position: 'relative', width: '100%' }),
  viewport: new Style<ScrollView>({ flexGrow: 1, flexShrink: 1, minWidth: 0, width: '100%' }),
  restingOverlay: new Style<View>({ alignItems: 'center', bottom: 0, justifyContent: 'center', left: 0, position: 'absolute', right: 0, top: 0 }),
  restingTitle: productRestingText,
  title: productTickerText,
};
