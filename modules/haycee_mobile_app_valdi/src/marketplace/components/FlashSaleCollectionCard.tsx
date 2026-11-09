import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { createReusableCallback } from 'valdi_core/src/utils/Callback';
import { Layout } from 'valdi_tsx/src/NativeTemplateElements';
import { MasonryProductCard } from '../../design-system/components/MasonryProductCard';
import { ProductStockIndicator } from '../../design-system/components/ProductStockIndicator';
import type { HomeProduct } from '../../home/components/HomeProductRail';
import { spacing } from '../../design-system/tokens/spacing';

export interface FlashSaleCollectionCardViewModel {
  product: HomeProduct;
  columnWidth: number;
  onProductTap?: (product: HomeProduct) => void;
  onQuickAdd?: (product: HomeProduct) => void;
}

/** Reuses the global product card and adds the flash-sale stock line below it. */
export class FlashSaleCollectionCard extends Component<FlashSaleCollectionCardViewModel> {
  onRender(): void {
    const product = this.viewModel.product;
    <layout style={styles.root} width={this.viewModel.columnWidth}>
      <MasonryProductCard
        product={product}
        columnWidth={this.viewModel.columnWidth}
        onTap={createReusableCallback(() => this.viewModel.onProductTap?.(product))}
        onQuickAdd={createReusableCallback(() => this.viewModel.onQuickAdd?.(product))}
      />
      <layout style={styles.stockLine}>
        <ProductStockIndicator
          remaining={product.stockCount ?? 0}
          total={product.stockTotal}
        />
      </layout>
    </layout>;
  }
}

const styles = {
  root: new Style<Layout>({
    flexDirection: 'column',
    flexShrink: 0,
  }),
  stockLine: new Style<Layout>({
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
    marginTop: -spacing.xs,
  }),
};
