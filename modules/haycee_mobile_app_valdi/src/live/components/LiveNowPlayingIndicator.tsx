import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { Layout, View } from 'valdi_tsx/src/NativeTemplateElements';
import { colors } from '../../design-system/tokens/colors';
import { spacing } from '../../design-system/tokens/spacing';

const BAR_HEIGHTS: readonly [number, number, number] = [8, 13, 10];

/** Static equalizer badge used during Live crash isolation; no per-card timer or state churn. */
export class LiveNowPlayingIndicator extends Component<{}> {
  onRender(): void {
    <view style={styles.backing}>
      <layout style={styles.bars}>
        <view style={styles.bar.extend({ height: BAR_HEIGHTS[0] })} />
        <view style={styles.bar.extend({ height: BAR_HEIGHTS[1] })} />
        <view style={styles.lastBar.extend({ height: BAR_HEIGHTS[2] })} />
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
