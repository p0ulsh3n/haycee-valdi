import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { ImageView, Label, View } from 'valdi_tsx/src/NativeTemplateElements';
import { colors } from '../../design-system/tokens/colors';
import { radius } from '../../design-system/tokens/radius';
import { layout, spacing } from '../../design-system/tokens/spacing';
import { fontSize, montserrat } from '../../design-system/tokens/typography';
import type { LiveViewerProduct } from '../data/LiveViewerData';

export interface LiveProductQuickAccessViewModel {
  products: LiveViewerProduct[];
  onTap: () => void;
}

/** Product thumbnail shortcut anchored at the bottom of the Live action rail. */
export class LiveProductQuickAccess extends Component<LiveProductQuickAccessViewModel> {
  onRender(): void {
    const { products, onTap } = this.viewModel;
    const featuredProduct = products.find(product => product.isPinned) ?? products[0];
    if (!featuredProduct) return;

    const stackProducts = [
      ...products.filter(product => product.id !== featuredProduct.id).slice(0, 2).reverse(),
      featuredProduct,
    ];
    const poses: Array<{ x: number; y: number; rotation: number }> = [
      { x: -5, y: -6, rotation: -0.2 },
      { x: 3, y: -3, rotation: 0.15 },
      { x: 0, y: 0, rotation: -0.08 },
    ];
    const defaultPose = { x: 0, y: 0, rotation: 0 };
    const productCount = products.length;

    <view
      style={styles.button}
      onTap={onTap}
      accessibilityCategory="button"
      accessibilityLabel={`${featuredProduct.title}, ${productCount} produits du live. Ouvrir les produits.`}
    >
      {stackProducts.map((product, index) => {
        const pose = poses[index] ?? defaultPose;
        return <view
          key={product.id}
          style={styles.productLayer.extend({
            backgroundColor: product.color,
            rotation: pose.rotation,
            translationX: pose.x,
            translationY: pose.y,
          })}
        >
          {product.imageUrl ? <image src={product.imageUrl} style={styles.productImage} objectFit="cover" /> : null}
        </view>;
      })}
      <view style={styles.countBadge}>
        <label value={String(productCount)} style={styles.countLabel} numberOfLines={1} />
      </view>
    </view>;
  }
}

const styles = {
  button: new Style<View>({
    height: layout.live.viewer.productQuickAccessSize,
    marginTop: spacing.xs,
    width: layout.live.viewer.productQuickAccessSize,
  }),
  productLayer: new Style<View>({
    borderColor: 'rgba(255, 255, 255, 0.62)',
    borderRadius: radius.md,
    borderWidth: layout.live.viewer.glassBorderWidth,
    height: layout.live.viewer.productQuickAccessSize,
    left: 0,
    position: 'absolute',
    top: 0,
    width: layout.live.viewer.productQuickAccessSize,
  }),
  productImage: new Style<ImageView>({
    borderColor: 'rgba(255, 255, 255, 0.62)',
    borderRadius: radius.md,
    borderWidth: layout.live.viewer.glassBorderWidth,
    height: layout.live.viewer.productQuickAccessSize,
    width: layout.live.viewer.productQuickAccessSize,
  }),
  countBadge: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundBrand,
    borderRadius: radius.full,
    height: layout.live.viewer.productCountBadgeSize,
    justifyContent: 'center',
    position: 'absolute',
    right: -spacing.xs,
    top: -spacing.xs,
    width: layout.live.viewer.productCountBadgeSize,
  }),
  countLabel: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.extraBold(fontSize.tiny),
  }),
};
