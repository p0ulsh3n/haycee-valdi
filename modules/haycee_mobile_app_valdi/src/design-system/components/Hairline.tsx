import { Component } from 'valdi_core/src/Component';
import { Device } from 'valdi_core/src/Device';
import { Style } from 'valdi_core/src/Style';
import { View } from 'valdi_tsx/src/NativeTemplateElements';
import { colors } from '../tokens/colors';

export type HairlineOrientation = 'horizontal' | 'vertical';

export interface HairlineViewModel {
  color?: string;
  thickness?: number;
  orientation?: HairlineOrientation;
}

/** Reusable native Valdi separator for tabs, sheets, dialogs and list sections. */
export class Hairline extends Component<HairlineViewModel> {
  onRender(): void {
    const orientation = this.viewModel.orientation ?? 'horizontal';
    // Valdi dimensions are density-independent. One physical pixel is therefore
    // 1 / displayScale logical pixels on the native device.
    const thickness = this.viewModel.thickness ?? 1 / Math.max(Device.getDisplayScale(), 1);

    <view
      style={styles.line.extend({
        backgroundColor: this.viewModel.color ?? colors.borderDefault,
        height: orientation === 'horizontal' ? thickness : '100%',
        width: orientation === 'horizontal' ? '100%' : thickness,
      })}
    />;
  }
}

const styles = {
  line: new Style<View>({
    flexShrink: 0,
  }),
};
