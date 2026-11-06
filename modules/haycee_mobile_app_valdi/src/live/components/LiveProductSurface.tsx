import { Device } from 'valdi_core/src/Device';
import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { View } from 'valdi_tsx/src/NativeTemplateElements';
import { layout } from '../../design-system/tokens/spacing';
import { LiveProductCard } from './LiveProductCard';
import type { LiveViewerProduct } from '../data/LiveViewerData';

export interface LiveProductSurfaceViewModel {
  products: LiveViewerProduct[];
  onProductAction: (product: LiveViewerProduct) => void;
}

/** Shows one featured live offer card; the full product list remains in its sheet. */
export class LiveProductSurface extends Component<LiveProductSurfaceViewModel> {
  onRender(): void {
    const product = this.viewModel.products[0];
    if (!product) return;

    const availableWidth = Math.max(1, Device.getWindowWidth() - layout.live.viewer.horizontalPadding * 2);
    const cardWidth = availableWidth;
    <view style={styles.surface} width={cardWidth}>
      <LiveProductCard
        product={product}
        width={cardWidth}
        active={true}
        onBuy={this.viewModel.onProductAction}
      />
    </view>;
  }
}

const styles = {
  surface: new Style<View>({
    marginLeft: layout.live.viewer.horizontalPadding,
    marginRight: layout.live.viewer.horizontalPadding,
  }),
};
