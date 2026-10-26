import { ElementRef } from 'valdi_core/src/ElementRef';
import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { View } from 'valdi_tsx/src/NativeTemplateElements';

export interface OpacityMaskViewModel {
  style?: Style<View>;
  maskRef?: ElementRef<View>;
  maskImage: string;
  renderContent: () => void;
}

/** Applies a Valdi alpha-gradient mask to rendered content. */
export class OpacityMask extends Component<OpacityMaskViewModel> {
  onRender(): void {
    const { style, maskRef, maskImage, renderContent } = this.viewModel;
    <view ref={maskRef} style={style} maskImage={maskImage}>
      {renderContent()}
    </view>;
  }
}
