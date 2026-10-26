import { StatefulComponent } from 'valdi_core/src/Component';
import { ElementRef } from 'valdi_core/src/ElementRef';
import { Style } from 'valdi_core/src/Style';
import { ElementFrame } from 'valdi_tsx/src/Geometry';
import { Label, ScrollView, ScrollViewInteractive } from 'valdi_tsx/src/NativeTemplateElements';
import { colors } from '../../design-system/tokens/colors';
import { layout } from '../../design-system/tokens/spacing';
import { fontSize, montserrat } from '../../design-system/tokens/typography';

export interface LiveProductNameTickerViewModel {
  title: string;
  active: boolean;
}

interface LiveProductNameTickerState {
  viewportWidth: number;
  textWidth: number;
}

/** Shows a long product name on one line and scrolls it while its card is active. */
export class LiveProductNameTicker extends StatefulComponent<
  LiveProductNameTickerViewModel,
  LiveProductNameTickerState
> {
  state: LiveProductNameTickerState = { viewportWidth: 0, textWidth: 0 };

  private readonly scrollRef = new ElementRef<ScrollViewInteractive>();
  private previousTitle = '';
  private previousActive = false;
  private tickerToken = 0;

  private handleViewportLayout = (frame: ElementFrame): void => {
    const viewportWidth = Math.max(0, frame.width);
    if (Math.abs(viewportWidth - this.state.viewportWidth) < 1) return;
    this.setState({ viewportWidth, textWidth: this.state.textWidth });
    this.scheduleTickerIfNeeded();
  };

  private handleTitleLayout = (frame: ElementFrame): void => {
    const textWidth = Math.max(0, frame.width);
    if (Math.abs(textWidth - this.state.textWidth) < 1) return;
    this.setState({ viewportWidth: this.state.viewportWidth, textWidth });
    const scroll = this.scrollRef.single();
    if (scroll) {
      scroll.setAttribute('staticContentWidth', textWidth);
      scroll.setAttribute('contentOffsetAnimated', false);
      scroll.setAttribute('contentOffsetX', 0);
    }
    this.scheduleTickerIfNeeded();
  };

  onRender(): void {
    const { title, active } = this.viewModel;
    if (title !== this.previousTitle) {
      this.previousTitle = title;
      this.state = { viewportWidth: this.state.viewportWidth, textWidth: 0 };
      const scroll = this.scrollRef.single();
      scroll?.setAttribute('contentOffsetAnimated', false);
      scroll?.setAttribute('contentOffsetX', 0);
    }
    if (active !== this.previousActive) {
      this.previousActive = active;
      if (active) this.scheduleTickerIfNeeded();
      else this.stopTicker();
    }

    <scroll
      ref={this.scrollRef}
      style={styles.viewport}
      horizontal={true}
      scrollEnabled={false}
      showsHorizontalScrollIndicator={false}
      onLayout={this.handleViewportLayout}
    >
      <label
        value={title}
        style={styles.title}
        numberOfLines={1}
        textOverflow="clip"
        onLayout={this.handleTitleLayout}
      />
    </scroll>;
  }

  private scheduleTickerIfNeeded(): void {
    const token = ++this.tickerToken;
    if (!this.viewModel.active || this.state.textWidth <= this.state.viewportWidth + 1) return;
    this.setTimeoutDisposable(() => this.animateTitle(token), layout.live.viewer.productTickerHoldMilliseconds);
  }

  private animateTitle(token: number): void {
    if (this.isDestroyed() || token !== this.tickerToken || !this.viewModel.active) return;
    const scroll = this.scrollRef.single();
    const distance = Math.max(0, this.state.textWidth - this.state.viewportWidth);
    if (!scroll || distance <= 1) return;

    scroll.setAttribute('contentOffsetAnimated', true);
    scroll.setAttribute('contentOffsetX', distance);
    const travelDuration = Math.max(1400, (distance / layout.live.viewer.productTickerSpeed) * 1000);
    this.setTimeoutDisposable(() => {
      if (this.isDestroyed() || token !== this.tickerToken || !this.viewModel.active) return;
      scroll.setAttribute('contentOffsetAnimated', false);
      scroll.setAttribute('contentOffsetX', 0);
      this.setTimeoutDisposable(() => {
        if (token === this.tickerToken) this.animateTitle(token);
      }, layout.live.viewer.productTickerResetMilliseconds);
    }, travelDuration + 500);
  }

  private stopTicker(): void {
    this.tickerToken += 1;
    const scroll = this.scrollRef.single();
    scroll?.setAttribute('contentOffsetAnimated', false);
    scroll?.setAttribute('contentOffsetX', 0);
  }
}

const styles = {
  viewport: new Style<ScrollView>({
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    width: '100%',
  }),
  title: new Style<Label>({
    color: colors.textInverted,
    flexShrink: 0,
    font: montserrat.semiBold(fontSize.product),
  }),
};
