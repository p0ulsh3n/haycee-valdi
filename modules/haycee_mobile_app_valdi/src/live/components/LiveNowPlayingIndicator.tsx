import { StatefulComponent } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { Layout, View } from 'valdi_tsx/src/NativeTemplateElements';
import { colors } from '../../design-system/tokens/colors';
import { spacing } from '../../design-system/tokens/spacing';

interface LiveNowPlayingIndicatorState {
  frame: number;
}

const BAR_HEIGHTS: ReadonlyArray<readonly [number, number, number]> = [
  [8, 13, 10],
  [13, 9, 14],
  [9, 14, 7],
  [12, 8, 12],
];

/** Native equalizer motion matching now-playing.svg; Valdi rasterizes SVG resources. */
export class LiveNowPlayingIndicator extends StatefulComponent<{}, LiveNowPlayingIndicatorState> {
  state: LiveNowPlayingIndicatorState = { frame: 0 };

  onCreate(): void {
    const timerId = setInterval(() => {
      if (this.isDestroyed()) return;

      const nextFrame = (this.state.frame + 1) % BAR_HEIGHTS.length;
      this.setStateAnimated({ frame: nextFrame }, { duration: 0.42 });
    }, 500);
    this.registerDisposable(() => clearInterval(timerId));
  }

  onRender(): void {
    const heights = BAR_HEIGHTS[this.state.frame];

    <view style={styles.backing}>
      <layout style={styles.bars}>
        <view style={styles.bar.extend({ height: heights[0] })} />
        <view style={styles.bar.extend({ height: heights[1] })} />
        <view style={styles.lastBar.extend({ height: heights[2] })} />
      </layout>
    </view>;
  }
}

const styles = {
  backing: new Style<View>({
    alignItems: 'center',
    background: colors.liveIndicatorGradient,
    borderRadius: 4,
    height: 18,
    justifyContent: 'center',
    marginRight: spacing.xs,
    width: 18,
  }),
  bars: new Style<Layout>({
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  }),
  bar: new Style<View>({
    backgroundColor: colors.textInverted,
    borderRadius: 1,
    height: 8,
    marginRight: 1,
    width: 3,
  }),
  lastBar: new Style<View>({
    backgroundColor: colors.textInverted,
    borderRadius: 1,
    height: 8,
    width: 3,
  }),
};
