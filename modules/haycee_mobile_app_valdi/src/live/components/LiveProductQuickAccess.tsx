import { StatefulComponent } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { AnimationCurve } from 'valdi_core/src/AnimationOptions';
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

interface LiveProductQuickAccessState {
  activeIndex: number;
}

/** Product thumbnail shortcut anchored at the bottom of the Live action rail. */
export class LiveProductQuickAccess extends StatefulComponent<LiveProductQuickAccessViewModel, LiveProductQuickAccessState> {
  state: LiveProductQuickAccessState = { activeIndex: 0 };

  private productIds = '';
  private rotationToken = 0;

  onCreate(): void {
    this.productIds = this.viewModel.products.map(product => product.id).join('|');
    this.state = { activeIndex: this.preferredProductIndex() };
    this.scheduleRotation();
  }

  onViewModelUpdate(previousViewModel?: Readonly<LiveProductQuickAccessViewModel>): void {
    if (!previousViewModel) return;
    const nextProductIds = this.viewModel.products.map(product => product.id).join('|');
    if (nextProductIds === this.productIds) return;

    this.productIds = nextProductIds;
    this.rotationToken += 1;
    this.setState({ activeIndex: this.preferredProductIndex() });
    this.scheduleRotation();
  }

  private preferredProductIndex(): number {
    const pinnedIndex = this.viewModel.products.findIndex(product => product.isPinned);
    return pinnedIndex >= 0 ? pinnedIndex : 0;
  }

  private scheduleRotation(): void {
    if (this.viewModel.products.length < 2) return;
    const token = ++this.rotationToken;
    this.setTimeoutDisposable(() => this.advanceProduct(token), layout.live.viewer.productAutoAdvanceMilliseconds);
  }

  private advanceProduct(token: number): void {
    const productCount = this.viewModel.products.length;
    if (this.isDestroyed() || token !== this.rotationToken || productCount < 2) return;

    this.setStateAnimated(
      { activeIndex: (this.state.activeIndex + 1) % productCount },
      { duration: 0.58, curve: AnimationCurve.EaseInOut, beginFromCurrentState: true },
    );
    this.scheduleRotation();
  }

  onRender(): void {
    const { products, onTap } = this.viewModel;
    const productCount = products.length;
    if (productCount === 0) return;

    const activeIndex = this.state.activeIndex % productCount;
    const featuredProduct = products[activeIndex];
    if (!featuredProduct) return;

    const visibleLayerCount = Math.min(3, productCount);
    const stackProducts = Array.from({ length: visibleLayerCount }, (_value, index) =>
      products[(activeIndex + visibleLayerCount - index - 1) % productCount],
    );
    const poses: Array<{ x: number; y: number; rotation: number }> = [
      { x: -5, y: -6, rotation: -0.2 },
      { x: 3, y: -3, rotation: 0.15 },
      { x: 0, y: 0, rotation: -0.08 },
    ];
    const defaultPose = { x: 0, y: 0, rotation: 0 };
    const poseOffset = poses.length - stackProducts.length;

    <view
      style={styles.button}
      onTap={onTap}
      accessibilityCategory="button"
      accessibilityLabel={`${featuredProduct.title}, ${productCount} produits du live. Ouvrir les produits.`}
    >
      {stackProducts.map((product, index) => {
        const pose = poses[index + poseOffset] ?? defaultPose;
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
