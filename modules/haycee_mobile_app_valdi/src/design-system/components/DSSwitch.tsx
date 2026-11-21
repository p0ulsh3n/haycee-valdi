import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { View } from 'valdi_tsx/src/NativeTemplateElements';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { layout } from '../tokens/spacing';

export interface DSSwitchViewModel {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onTap: () => void;
}

/** Shared accessible binary preference control. */
export class DSSwitch extends Component<DSSwitchViewModel> {
  onRender(): void {
    const { label, selected, disabled = false, onTap } = this.viewModel;
    const thumbLeft = selected
      ? layout.settings.switchWidth - layout.settings.switchThumbSize - layout.settings.switchInset
      : layout.settings.switchInset;
    const trackStyle = styles.track.extend({ backgroundColor: selected ? colors.buttonPrimary : colors.backgroundTertiary });

    <view
      style={disabled ? trackStyle.extend({ opacity: 0.45 }) : trackStyle}
      onTapDisabled={disabled}
      onTap={onTap}
      accessibilityCategory="button"
      accessibilityLabel={`${label}, ${selected ? 'activé' : 'désactivé'}`}
      accessibilityStateDisabled={disabled}
      accessibilityStateSelected={selected}
    >
      <view style={styles.thumb.extend({ backgroundColor: selected ? colors.interactivePrimary : colors.backgroundPrimary, left: thumbLeft })} />
    </view>;
  }
}

const styles = {
  track: new Style<View>({
    backgroundColor: colors.backgroundTertiary,
    borderRadius: radius.full,
    height: layout.settings.switchHeight,
    position: 'relative',
    width: layout.settings.switchWidth,
  }),
  thumb: new Style<View>({
    backgroundColor: colors.backgroundPrimary,
    borderRadius: radius.full,
    height: layout.settings.switchThumbSize,
    position: 'absolute',
    top: (layout.settings.switchHeight - layout.settings.switchThumbSize) / 2,
    width: layout.settings.switchThumbSize,
  }),
};
