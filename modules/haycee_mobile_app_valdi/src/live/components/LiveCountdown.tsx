import { StatefulComponent } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { Label, Layout, View } from 'valdi_tsx/src/NativeTemplateElements';
import { colors } from '../../design-system/tokens/colors';
import { radius } from '../../design-system/tokens/radius';
import { layout, spacing } from '../../design-system/tokens/spacing';
import { fontSize, montserrat } from '../../design-system/tokens/typography';

interface LiveCountdownViewModel {
  targetTimestampMs: number;
  compact?: boolean;
}

interface LiveCountdownState {
  secondsRemaining: number;
}

/** Isolated countdown so its one-second updates do not re-render the full page. */
export class LiveCountdown extends StatefulComponent<LiveCountdownViewModel, LiveCountdownState> {
  state: LiveCountdownState = { secondsRemaining: 0 };
  private timer?: number;

  onCreate(): void {
    this.updateRemaining();
    this.timer = setInterval(this.updateRemaining, 1000);
  }

  onDestroy(): void {
    if (this.timer !== undefined) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private updateRemaining = (): void => {
    const remaining = Math.max(0, Math.floor((this.viewModel.targetTimestampMs - Date.now()) / 1000));
    if (remaining !== this.state.secondsRemaining) {
      this.setState({ secondsRemaining: remaining });
    }
    if (remaining === 0 && this.timer !== undefined) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  };

  private pad(value: number): string {
    return value < 10 ? `0${value}` : String(value);
  }

  onRender(): void {
    const total = this.state.secondsRemaining;
    const values = [
      { label: 'JOURS', shortLabel: 'J', value: Math.floor(total / 86400) },
      { label: 'HEURES', shortLabel: 'H', value: Math.floor((total % 86400) / 3600) },
      { label: 'MINS', shortLabel: 'M', value: Math.floor((total % 3600) / 60) },
      { label: 'SECS', shortLabel: 'S', value: total % 60 },
    ];
    if (this.viewModel.compact) {
      <view style={styles.compactPill}>
        <layout style={styles.compactRow}>
          {values.map((part, index) => (
            <layout key={part.label} style={styles.compactUnit}>
              <label value={this.pad(part.value)} style={styles.compactValue} numberOfLines={1} />
              <label value={part.shortLabel} style={styles.compactUnitLabel} numberOfLines={1} />
              {index < values.length - 1 ? <label value="·" style={styles.compactSeparator} numberOfLines={1} /> : null}
            </layout>
          ))}
        </layout>
      </view>;
      return;
    }

    <layout style={styles.row}>
      {values.map((part, index) => (
        <view key={part.label} style={styles.unit.extend({ marginRight: index === values.length - 1 ? 0 : spacing.sm })}>
          <view style={styles.valueBox}>
            <label value={this.pad(part.value)} style={styles.value} numberOfLines={1} />
          </view>
          <label value={part.label} style={styles.label} numberOfLines={1} />
        </view>
      ))}
    </layout>;
  }
}

const styles = {
  row: new Style<Layout>({ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xl }),
  unit: new Style<View>({ alignItems: 'center', flexGrow: 1, flexShrink: 1 }),
  valueBox: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderColor: colors.borderDefault, borderRadius: radius.md, borderWidth: 1, height: layout.live.upcoming.countdownCellHeight, justifyContent: 'center', width: '100%' }),
  value: new Style<Label>({ color: colors.textPrimary, font: montserrat.black(fontSize.displayLarge), textAlign: 'center' }),
  label: new Style<Label>({ color: colors.textSecondary, font: montserrat.semiBold(fontSize.tiny), marginTop: spacing.sm }),
  compactPill: new Style<View>({ alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.92)', borderColor: 'rgba(255, 255, 255, 0.72)', borderRadius: radius.sm, borderWidth: 1, height: 36, justifyContent: 'center', paddingLeft: spacing.md, paddingRight: spacing.md, width: 216 }),
  compactRow: new Style<Layout>({ alignItems: 'center', flexDirection: 'row' }),
  compactUnit: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', flexShrink: 0 }),
  compactValue: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.label), textAlign: 'center', width: 26 }),
  compactUnitLabel: new Style<Label>({ color: colors.textSecondary, font: montserrat.semiBold(fontSize.nano), marginLeft: 2, width: 9 }),
  compactSeparator: new Style<Label>({ color: colors.textTertiary, font: montserrat.semiBold(fontSize.tiny), textAlign: 'center', width: 12 }),
};
