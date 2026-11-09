import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { Label, Layout, ScrollView, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../../res/navigation-icons';
import { Ticker } from './Ticker';
import { colors } from '../tokens/colors';
import { layout, spacing } from '../tokens/spacing';
import { fontSize, lineHeight, montserrat, transformText } from '../tokens/typography';
import type { Asset } from 'valdi_tsx/src/Asset';

export interface ProductVariantStockItem {
  id: string;
  /** Human-readable combination of the variant axes, such as "Vert · XL". */
  label: string;
  remaining: number;
  total: number;
}

export interface ProductVariantStockPreviewViewModel {
  items: ProductVariantStockItem[];
  active?: boolean;
  textColor?: string;
  mutedColor?: string;
}

interface VariantStockPresentation {
  label: string;
  status: string;
  iconColor: string;
  icon: Asset;
}

/** Cycles through all variant combinations two at a time without increasing card height. */
export class ProductVariantStockPreview extends Component<ProductVariantStockPreviewViewModel> {
  onRender(): void {
    const items = this.getPrioritizedItems();
    if (items.length === 0) return;

    const pairs = this.createPages(items);
    const tickerItems = pairs.map(pair => pair.map(item => {
      const presentation = this.formatVariant(item);
      return `${presentation.label} : ${presentation.status}`;
    }).join('\n'));

    <view style={styles.container}>
      <layout style={styles.headingRow}>
        <label
          value={transformText('Variantes', 'capitalize')}
          style={styles.heading.extend({ color: this.viewModel.mutedColor ?? colors.textOnDarkSecondary })}
          numberOfLines={1}
        />
      </layout>
      <Ticker
        items={tickerItems}
        mode="rotate"
        orientation="vertical"
        direction="forward"
        repeat={true}
        active={this.viewModel.active !== false}
        holdDurationMs={layout.product.variantStockPreview.holdDurationMilliseconds}
        transitionDurationMs={layout.product.variantStockPreview.transitionDurationMilliseconds}
        rotateTransition="slide"
        style={styles.ticker}
        numberOfLines={layout.product.variantStockPreview.itemsPerPage}
        accessibilityLabel="Variantes et stocks du produit"
        renderRotateItem={(_item, index) => this.renderVariantPair(pairs[index % pairs.length])}
      />
    </view>;
  }

  private getPrioritizedItems(): ProductVariantStockItem[] {
    const items = this.viewModel.items ?? [];
    const threshold = layout.product.variantStockPreview.lowStockThreshold;
    const lowStock = items.filter(item => item.remaining > 0 && item.remaining <= threshold);
    const soldOut = items.filter(item => item.remaining <= 0);
    const available = items.filter(item => item.remaining > threshold);
    return [...lowStock, ...soldOut, ...available];
  }

  private createPages(items: ProductVariantStockItem[]): ProductVariantStockItem[][] {
    const pageSize = layout.product.variantStockPreview.itemsPerPage;
    const pages: ProductVariantStockItem[][] = [];

    for (let index = 0; index < items.length; index += pageSize) {
      const pair = items.slice(index, index + pageSize);
      if (pair.length === 1 && items.length > 1) pair.push(items[0]);
      pages.push(pair);
    }

    return pages;
  }

  private formatVariant(item: ProductVariantStockItem): VariantStockPresentation {
    const remaining = Math.max(0, Math.floor(item.remaining));
    const threshold = layout.product.variantStockPreview.lowStockThreshold;
    if (remaining === 0) {
      return {
        label: transformText(item.label, 'none'),
        status: 'Épuisé',
        iconColor: colors.offerDanger,
        icon: navigationIcons.packageOutOfStock,
      };
    }
    if (remaining === 1) {
      return {
        label: transformText(item.label, 'none'),
        status: 'Dernière pièce',
        iconColor: colors.offerWarning,
        icon: navigationIcons.alertCircle,
      };
    }
    if (remaining <= threshold) {
      return {
        label: transformText(item.label, 'none'),
        status: `Plus que ${remaining} en stock`,
        iconColor: colors.offerWarning,
        icon: navigationIcons.alertCircle,
      };
    }
    return {
      label: transformText(item.label, 'none'),
      status: `${remaining} en stock`,
      iconColor: this.viewModel.mutedColor ?? colors.textOnDarkSecondary,
      icon: navigationIcons.package,
    };
  }

  private renderVariantPair(pair: ProductVariantStockItem[]): void {
    <layout style={styles.variantPair}>
      {pair.map(item => {
        const presentation = this.formatVariant(item);
        return (
          <layout key={item.id} style={styles.variantRow}>
            <image
              src={presentation.icon}
              tint={presentation.iconColor}
              width={layout.product.variantStockPreview.iconSize}
              height={layout.product.variantStockPreview.iconSize}
              objectFit="contain"
            />
            <label
              value={presentation.label}
              style={styles.variantLabel.extend({ color: this.viewModel.textColor ?? colors.textInverted })}
              numberOfLines={1}
              textOverflow="ellipsis"
            />
            <label
              value=":"
              style={styles.separator.extend({ color: this.viewModel.mutedColor ?? colors.textOnDarkSecondary })}
              numberOfLines={1}
            />
            <label
              value={presentation.status}
              style={styles.statusLabel.extend({ color: this.viewModel.textColor ?? colors.textInverted })}
              numberOfLines={1}
              textOverflow="ellipsis"
            />
          </layout>
        );
      })}
    </layout>;
  }
}

const styles = {
  container: new Style<View>({ flexDirection: 'column', flexShrink: 1, minWidth: 0 }),
  headingRow: new Style<Layout>({
    alignItems: 'center',
    flexDirection: 'row',
    height: layout.product.variantStockPreview.headingHeight,
    justifyContent: 'space-between',
    minWidth: 0,
    width: '100%',
  }),
  heading: new Style<Label>({
    flexGrow: 1,
    flexShrink: 1,
    font: montserrat.semiBold(fontSize.nano),
    minWidth: 0,
  }),
  ticker: new Style<ScrollView>({
    flexGrow: 0,
    flexShrink: 0,
    height: layout.product.variantStockPreview.tickerHeight,
    width: '100%',
  }),
  variantPair: new Style<Layout>({ flexDirection: 'column', width: '100%' }),
  variantRow: new Style<Layout>({
    alignItems: 'center',
    flexDirection: 'row',
    height: layout.product.variantStockPreview.rowHeight,
    minWidth: 0,
    width: '100%',
  }),
  variantLabel: new Style<Label>({
    flexShrink: 1,
    font: montserrat.semiBold(fontSize.tiny),
    lineHeight: lineHeight.tiny / fontSize.tiny,
    marginLeft: spacing.xs,
    minWidth: 0,
    translationY: -1,
  }),
  separator: new Style<Label>({
    flexShrink: 0,
    font: montserrat.regular(fontSize.tiny),
    lineHeight: lineHeight.tiny / fontSize.tiny,
    marginLeft: spacing.xs,
    marginRight: spacing.xs,
    translationY: -1,
  }),
  statusLabel: new Style<Label>({
    flexGrow: 1,
    flexShrink: 1,
    font: montserrat.extraBold(fontSize.tiny),
    lineHeight: lineHeight.tiny / fontSize.tiny,
    minWidth: 0,
    translationY: -1,
  }),
};
