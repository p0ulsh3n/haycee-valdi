import { StatefulComponent } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { Label, Layout, View } from 'valdi_tsx/src/NativeTemplateElements';
import { colors } from '../../design-system/tokens/colors';
import { spacing } from '../../design-system/tokens/spacing';
import { fontSize, montserrat } from '../../design-system/tokens/typography';

interface CollectionCountdownViewModel {
  durationSeconds?: number;
}

interface CollectionCountdownState {
  remainingSeconds: number;
}

/** Native, fixed-width countdown cells for the Flash Sale collection header. */
export class CollectionCountdown extends StatefulComponent<CollectionCountdownViewModel, CollectionCountdownState> {
  state: CollectionCountdownState = {
    remainingSeconds: Math.max(0, this.viewModel.durationSeconds ?? 2 * 60 * 60),
  };
  private targetTime = 0;

  onCreate(): void {
    this.targetTime = Date.now() + this.state.remainingSeconds * 1000;
    this.scheduleTick();
  }

  private scheduleTick(): void {
    if (this.state.remainingSeconds <= 0) return;
    this.setTimeoutDisposable(() => {
      if (this.isDestroyed()) return;
      const remainingSeconds = Math.max(0, Math.ceil((this.targetTime - Date.now()) / 1000));
      this.setState({ remainingSeconds });
      this.scheduleTick();
    }, 1000);
  }

  private format(value: number): string {
    return String(value).padStart(2, '0');
  }

  onRender(): void {
    const hours = Math.floor(this.state.remainingSeconds / 3600);
    const minutes = Math.floor((this.state.remainingSeconds % 3600) / 60);
    const seconds = this.state.remainingSeconds % 60;

    <view style={styles.root}>
      <label value="L’OFFRE SE TERMINE DANS" style={styles.caption} />
      <layout style={styles.timerRow}>
        {this.renderCell(this.format(hours))}
        <label value=":" style={styles.separator} />
        {this.renderCell(this.format(minutes))}
        <label value=":" style={styles.separator} />
        {this.renderCell(this.format(seconds))}
      </layout>
    </view>;
  }

  private renderCell(value: string): void {
    <view style={styles.cell}>
      <label value={value} style={styles.cellLabel} numberOfLines={1} />
    </view>;
  }
}

const styles = {
  root: new Style<View>({
    alignItems: 'center',
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
  }),
  caption: new Style<Label>({
    color: colors.textSecondary,
    font: montserrat.semiBold(fontSize.nano),
    marginBottom: spacing.sm,
  }),
  timerRow: new Style<Layout>({
    alignItems: 'center',
    flexDirection: 'row',
  }),
  cell: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundDark,
    borderRadius: 2,
    height: 32,
    justifyContent: 'center',
    width: 40,
  }),
  cellLabel: new Style<Label>({
    color: colors.textInverted,
    font: montserrat.extraBold(fontSize.body),
    textAlign: 'center',
  }),
  separator: new Style<Label>({
    color: colors.textSecondary,
    font: montserrat.regular(fontSize.body),
    marginLeft: spacing.xs,
    marginRight: spacing.xs,
  }),
};
