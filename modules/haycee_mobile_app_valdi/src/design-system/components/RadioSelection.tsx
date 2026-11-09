import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { Label, View } from 'valdi_tsx/src/NativeTemplateElements';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { spacing } from '../tokens/spacing';
import { fontSize, montserrat } from '../tokens/typography';

export interface RadioSelectionViewModel {
  label: string;
  selected: boolean;
  onTap: () => void;
  accessibilityLabel?: string;
}

/** Single-choice row with a left label and a right-aligned radio indicator. */
export class RadioSelection extends Component<RadioSelectionViewModel> {
  onRender(): void {
    const { label, selected, onTap, accessibilityLabel } = this.viewModel;
    <view
      style={styles.row}
      onTap={onTap}
      accessibilityCategory="radio"
      accessibilityLabel={accessibilityLabel ?? `${label}${selected ? ', sélectionné' : ''}`}
    >
      <label value={label} style={styles.label} numberOfLines={1} textOverflow="ellipsis" />
      <view style={selected ? styles.radioSelected : styles.radio}>
        {selected ? <view style={styles.radioDot} /> : null}
      </view>
    </view>;
  }
}

const styles = {
  row: new Style<View>({ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 50, paddingBottom: spacing.sm, paddingRight: spacing.xs, paddingTop: spacing.sm }),
  label: new Style<Label>({ color: colors.textPrimary, flexGrow: 1, flexShrink: 1, font: montserrat.semiBold(fontSize.body), marginRight: spacing.lg, minWidth: 0 }),
  radio: new Style<View>({ alignItems: 'center', borderColor: colors.borderDefault, borderRadius: radius.full, borderWidth: 2, flexShrink: 0, height: 22, justifyContent: 'center', width: 22 }),
  radioSelected: new Style<View>({ alignItems: 'center', borderColor: colors.interactivePrimary, borderRadius: radius.full, borderWidth: 2, flexShrink: 0, height: 22, justifyContent: 'center', width: 22 }),
  radioDot: new Style<View>({ backgroundColor: colors.interactivePrimary, borderRadius: radius.full, height: 10, width: 10 }),
};
