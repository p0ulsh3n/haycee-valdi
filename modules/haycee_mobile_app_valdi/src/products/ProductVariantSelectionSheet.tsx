import { Device } from 'valdi_core/src/Device';
import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageStatefulComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { Style } from 'valdi_core/src/Style';
import { createReusableCallback } from 'valdi_core/src/utils/Callback';
import { Label, Layout, ScrollView, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../res/navigation-icons';
import type { MasonryProduct } from '../design-system/components/MasonryProductCard';
import { DSButton, Hairline, ImageCarousel, TabChips, bottomSheetSurfaceStyle } from '../design-system/index';
import type { TabChipItem } from '../design-system/index';
import { colors } from '../design-system/tokens/colors';
import { noBounceScrollAttributes } from '../design-system/tokens/scrollBehavior';
import { radius } from '../design-system/tokens/radius';
import { layout, spacing } from '../design-system/tokens/spacing';
import { fontSize, montserrat } from '../design-system/tokens/typography';
import { formatPriceLabel } from '../design-system/utils/money';
import { runNavigationAction } from '../design-system/utils/NavigationActionGate';
import type { ProductVariantCombination, ProductVariantGroup } from '../design-system/components/ProductCardTypes';

export type ProductVariantSelectionIntent = 'add-to-cart' | 'buy-now';

export interface SelectedProductVariant {
  groupId: string;
  groupLabel: string;
  optionId: string;
  optionLabel: string;
}

export interface ProductVariantSelectionSheetViewModel {
  product: MasonryProduct;
  intent: ProductVariantSelectionIntent;
  onAddToCart: (product: MasonryProduct, quantity: number, selections: SelectedProductVariant[], combinationId?: string) => void | Promise<unknown>;
  onBuyNow: (product: MasonryProduct, quantity: number, selections: SelectedProductVariant[], combinationId?: string) => void | Promise<unknown>;
}

interface ProductVariantSelectionSheetState {
  selectedOptionIds: string[];
  quantity: number;
  submitting: boolean;
  galleryAspectRatio: number;
}

export const getProductVariantGroups = (product: MasonryProduct): ProductVariantGroup[] => {
  if (product.variantGroups?.length) {
    return product.variantGroups.filter(group => group.options.length > 0);
  }

  const groups: ProductVariantGroup[] = [];
  if (product.sizes?.length) {
    groups.push({
      id: 'size',
      label: 'Taille',
      options: product.sizes.map(size => ({ id: size, label: size })),
    });
  }
  if (product.colors?.length) {
    groups.push({
      id: 'color',
      label: 'Couleur',
      options: product.colors.map(color => ({ id: color.id, label: color.name, swatchColor: color.hex })),
    });
  }
  return groups;
};

/** Marketplace purchase configuration. Variant labels and availability are entirely data-driven. */
@NavigationPage(module)
export class ProductVariantSelectionSheet extends NavigationPageStatefulComponent<
  ProductVariantSelectionSheetViewModel,
  ProductVariantSelectionSheetState
> {
  state: ProductVariantSelectionSheetState = { selectedOptionIds: [], quantity: 1, submitting: false, galleryAspectRatio: 1 };
  private submitting = false;
  private dismissing = false;

  onCreate(): void {
    this.state = {
      selectedOptionIds: getProductVariantGroups(this.viewModel.product).map(() => ''),
      quantity: 1,
      submitting: false,
      galleryAspectRatio: 1,
    };
    this.submitting = false;
    this.dismissing = false;
  }

  private groups(): ProductVariantGroup[] {
    return getProductVariantGroups(this.viewModel.product);
  }

  private combinations(): ProductVariantCombination[] {
    return this.viewModel.product.variantCombinations ?? [];
  }

  private isCombinationCompatible(
    combination: ProductVariantCombination,
    candidateGroupIndex?: number,
    candidateOptionId?: string,
  ): boolean {
    return this.groups().every((group, index) => {
      const selectedOptionId = index === candidateGroupIndex
        ? candidateOptionId
        : this.state.selectedOptionIds[index];
      if (!selectedOptionId) return true;
      return combination.selections.some(selection => selection.groupId === group.id && selection.optionId === selectedOptionId);
    });
  }

  private isOptionAvailable(groupIndex: number, optionId: string): boolean {
    const group = this.groups()[groupIndex];
    const option = group?.options.find(item => item.id === optionId);
    if (!group || !option || (option.remaining !== undefined && option.remaining <= 0) || this.viewModel.product.stockCount === 0) return false;
    const combinations = this.combinations();
    if (combinations.length === 0) return true;
    return combinations.some(combination => combination.remaining > 0
      && this.isCombinationCompatible(combination, groupIndex, optionId));
  }

  private selectedCombination(): ProductVariantCombination | undefined {
    const groups = this.groups();
    if (groups.length === 0 || groups.some((_group, index) => !this.state.selectedOptionIds[index])) return undefined;
    return this.combinations().find(combination => this.isCombinationCompatible(combination));
  }

  private availableStock(): number {
    const combination = this.selectedCombination();
    if (this.combinations().length > 0) return combination?.remaining ?? 0;

    const groups = this.groups();
    const selectedOptions = groups.flatMap((group, index) => {
      const optionId = this.state.selectedOptionIds[index];
      const option = group.options.find(item => item.id === optionId);
      return option?.remaining === undefined ? [] : [option.remaining];
    });
    const optionStock = selectedOptions.length > 0 ? Math.min(...selectedOptions) : undefined;
    return Math.max(0, optionStock ?? this.viewModel.product.stockCount ?? this.viewModel.product.stockTotal ?? Number.POSITIVE_INFINITY);
  }

  private selectOption = (groupIndex: number, optionId: string): void => {
    if (!this.isOptionAvailable(groupIndex, optionId) || this.state.selectedOptionIds[groupIndex] === optionId) return;
    const selectedOptionIds = [...this.state.selectedOptionIds];
    selectedOptionIds[groupIndex] = optionId;
    const groups = this.groups();
    const combinations = this.combinations();
    if (combinations.length > 0) {
      groups.forEach((_group, index) => {
        if (index !== groupIndex && selectedOptionIds[index]
          && !combinations.some(combination => combination.remaining > 0
            && this.isCombinationCompatibleWith(combination, selectedOptionIds))) {
          selectedOptionIds[index] = '';
        }
      });
    }
    this.setState({ selectedOptionIds, quantity: 1 });
  };

  private isCombinationCompatibleWith(combination: ProductVariantCombination, selectedOptionIds: string[]): boolean {
    return this.groups().every((group, index) => {
      if (!selectedOptionIds[index]) return true;
      return combination.selections.some(selection => selection.groupId === group.id && selection.optionId === selectedOptionIds[index]);
    });
  }

  private changeQuantity = (delta: number): void => {
    const available = this.availableStock();
    const next = Math.max(1, Math.min(available, this.state.quantity + delta));
    if (next !== this.state.quantity) this.setState({ quantity: next });
  };

  private images(): string[] {
    const images = (this.viewModel.product.imageUrls ?? []).filter(Boolean);
    if (images.length > 0) return images;
    return this.viewModel.product.imageUrl ? [this.viewModel.product.imageUrl] : [];
  }

  private normalizedGalleryRatio(width: number, height: number): number {
    if (width <= 0 || height <= 0) return 1;
    const ratio = width / height;
    return ratio >= layout.product.variantSelectionSheet.squareRatioThreshold ? 1 : 0.75;
  }

  private handleImageDecoded = (index: number, width: number, height: number): void => {
    // The first source image defines one stable viewport ratio for the full horizontal gallery.
    if (index !== 0) return;
    const decodedRatio = this.normalizedGalleryRatio(width, height);
    if (this.state.galleryAspectRatio === decodedRatio) return;
    this.setState({ galleryAspectRatio: decodedRatio });
  };

  private close = (): void => {
    if (this.dismissing || this.submitting) return;
    this.dismissing = true;
    this.navigationController.dismiss(true);
  };

  private confirm = async (): Promise<void> => {
    if (this.submitting || this.dismissing) return;
    const groups = this.groups();
    const combination = this.selectedCombination();
    const hasCombinations = this.combinations().length > 0;
    const selections: SelectedProductVariant[] = groups.flatMap((group, index) => {
      const option = group.options.find(item => item.id === this.state.selectedOptionIds[index]);
      return option ? [{ groupId: group.id, groupLabel: group.label, optionId: option.id, optionLabel: option.label }] : [];
    });
    if (selections.length !== groups.length || (hasCombinations && !combination)) return;
    if (this.availableStock() < this.state.quantity) return;

    this.submitting = true;
    this.setState({ submitting: true });
    try {
      const action = this.viewModel.intent === 'buy-now' ? this.viewModel.onBuyNow : this.viewModel.onAddToCart;
      await Promise.resolve(action(this.viewModel.product, this.state.quantity, selections, combination?.id));
      if (this.isDestroyed()) return;
      this.dismissing = true;
      this.navigationController.dismiss(true);
    } catch (error) {
      this.submitting = false;
      if (!this.isDestroyed()) this.setState({ submitting: false });
      console.warn('Product variant selection action failed.', error);
    }
  };

  private renderVariantGroup(group: ProductVariantGroup, groupIndex: number): void {
    const tabs: TabChipItem[] = group.options.map(option => ({
      id: option.id,
      label: option.label,
      disabled: !this.isOptionAvailable(groupIndex, option.id),
      swatchColor: option.swatchColor,
    }));

    <layout style={styles.variantGroup}>
      <label value={group.label} style={styles.sectionTitle} numberOfLines={1} />
      <TabChips
        tabs={tabs}
        selectedId={this.state.selectedOptionIds[groupIndex] ?? ''}
        onSelectionChange={createReusableCallback(optionId => this.selectOption(groupIndex, optionId))}
        horizontalPadding={0}
        chipSpacing={spacing.sm}
        chipHeight={38}
        selectedBackgroundColor={colors.backgroundBrand}
        unselectedBackgroundColor={colors.backgroundSecondary}
        selectedTextColor={colors.textInverted}
        unselectedTextColor={colors.textPrimary}
        textCase="none"
      />
    </layout>;
  }

  onRender(): void {
    const { product, intent } = this.viewModel;
    const groups = this.groups();
    const images = this.images();
    const bottomInset = Math.max(0, Device.getDisplayBottomInset());
    const galleryViewportWidth = Math.max(1, Device.getWindowWidth() - spacing.lg * 2);
    const galleryItemWidth = Math.min(layout.product.variantSelectionSheet.galleryItemWidth, galleryViewportWidth);
    const galleryHeight = Math.round(galleryItemWidth / this.state.galleryAspectRatio);
    const available = this.availableStock();
    const selectedCombination = this.selectedCombination();
    const selectionsComplete = this.state.selectedOptionIds.length === groups.length
      && this.state.selectedOptionIds.every(Boolean);
    const canConfirm = groups.length > 0
      && selectionsComplete
      && (!this.combinations().length || !!selectedCombination)
      && available >= this.state.quantity
      && !this.state.submitting;
    const surface = bottomSheetSurfaceStyle.extend({
      backgroundColor: colors.backgroundPrimary,
      borderRadius: `${radius.xl} ${radius.xl} 0 0`,
      flexDirection: 'column',
      height: layout.product.variantSelectionSheet.height,
      paddingBottom: bottomInset + spacing.md,
      paddingLeft: spacing.lg,
      paddingRight: spacing.lg,
      paddingTop: spacing.md,
    });

    <layout style={styles.root}>
      <view style={surface}>
        <layout style={styles.header}>
          <layout style={styles.headerCopy}>
            <label value={intent === 'buy-now' ? 'ACHETER' : 'AJOUTER AU PANIER'} style={styles.headerTitle} numberOfLines={1} />
            <label value="Choisis les options de ton article" style={styles.headerSubtitle} numberOfLines={1} />
          </layout>
          <view style={styles.closeButton} onTap={this.close} onTapDisabled={this.submitting} accessibilityCategory="button" accessibilityLabel="Fermer le choix des variantes">
            <image src={navigationIcons.cancel01} tint={colors.textPrimary} width={18} height={18} objectFit="contain" />
          </view>
        </layout>
        <Hairline color={colors.borderDefault} />

        <scroll style={styles.contentScroll} {...noBounceScrollAttributes} showsVerticalScrollIndicator={false}>
          <layout style={styles.content}>
            <layout style={styles.productSummary}>
              <ImageCarousel
                imageUrls={images}
                fallbackColors={product.galleryColors?.length ? product.galleryColors : [product.color]}
                width={galleryViewportWidth}
                height={galleryHeight}
                presentation="strip"
                itemWidth={galleryItemWidth}
                itemSpacing={spacing.sm}
                showCounter={false}
                backgroundColor="transparent"
                cornerRadius={radius.sm}
                imageFit="contain"
                onImageDecoded={this.handleImageDecoded}
              />
              <layout style={styles.productCopy}>
                <label value={product.title} style={styles.productTitle} numberOfLines={2} textOverflow="ellipsis" />
                <label value={formatPriceLabel(product.price)} style={styles.price} numberOfLines={1} />
              </layout>
            </layout>

            {groups.map((group, index) => this.renderVariantGroup(group, index))}

            <layout style={styles.quantitySection}>
              <layout style={styles.quantityCopy}>
                <label value="Quantité" style={styles.sectionTitle} numberOfLines={1} />
                <label
                  value={!selectionsComplete ? 'Choisis toutes les options' : available < 1 ? 'Indisponible' : Number.isFinite(available) ? `${available} disponible${available > 1 ? 's' : ''}` : 'Disponible'}
                  style={styles.stockLabel}
                  numberOfLines={1}
                />
              </layout>
              <layout style={styles.quantityControls}>
                <view style={styles.quantityButton} opacity={this.state.quantity <= 1 ? 0.45 : 1} onTapDisabled={this.state.quantity <= 1 || !selectionsComplete} onTap={() => this.changeQuantity(-1)} accessibilityCategory="button" accessibilityLabel="Diminuer la quantité">
                  <image src={navigationIcons.remove02} tint={colors.textPrimary} width={17} height={17} objectFit="contain" />
                </view>
                <label value={`${this.state.quantity}`} style={styles.quantityValue} numberOfLines={1} />
                <view style={styles.quantityButton} opacity={!selectionsComplete || this.state.quantity >= available ? 0.45 : 1} onTapDisabled={!selectionsComplete || this.state.quantity >= available} onTap={() => this.changeQuantity(1)} accessibilityCategory="button" accessibilityLabel="Augmenter la quantité">
                  <image src={navigationIcons.add02} tint={colors.textPrimary} width={17} height={17} objectFit="contain" />
                </view>
              </layout>
            </layout>
          </layout>
        </scroll>

        <DSButton
          title={intent === 'buy-now' ? 'Acheter' : 'Ajouter au panier'}
          textCase="none"
          variant="cta"
          size="fullWidth"
          height={layout.product.variantSelectionSheet.footerButtonHeight}
          onTap={this.confirm}
          disabled={!canConfirm}
          loading={this.state.submitting}
          accessibilityLabel={intent === 'buy-now' ? `Acheter ${product.title}` : `Ajouter ${product.title} au panier`}
        />
      </view>
    </layout>;
  }
}

const styles = {
  root: new Style<Layout>({ height: '100%', width: '100%' }),
  header: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingBottom: spacing.md }),
  headerCopy: new Style<Layout>({ flexDirection: 'column', flexGrow: 1, flexShrink: 1, minWidth: 0 }),
  headerTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.section) }),
  headerSubtitle: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.metadata), marginTop: spacing.xs }),
  closeButton: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: radius.full, flexShrink: 0, height: 38, justifyContent: 'center', marginLeft: spacing.md, width: 38 }),
  contentScroll: new Style<ScrollView>({ flexGrow: 1, flexShrink: 1 }),
  content: new Style<Layout>({ flexDirection: 'column', paddingBottom: spacing.sm, paddingTop: spacing.md }),
  productSummary: new Style<Layout>({ flexDirection: 'column', marginBottom: spacing.lg }),
  productCopy: new Style<Layout>({ flexDirection: 'column', flexGrow: 1, flexShrink: 1, marginTop: spacing.md, minWidth: 0 }),
  productTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.body), marginBottom: spacing.xs }),
  price: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.product) }),
  variantGroup: new Style<Layout>({ flexDirection: 'column', marginBottom: spacing.md }),
  sectionTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.label), marginBottom: spacing.xs }),
  quantitySection: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md, marginTop: spacing.sm }),
  quantityCopy: new Style<Layout>({ flexDirection: 'column', flexGrow: 1, flexShrink: 1 }),
  stockLabel: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.nano), marginTop: spacing.xs }),
  quantityControls: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', marginLeft: spacing.md }),
  quantityButton: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: radius.full, height: 34, justifyContent: 'center', width: 34 }),
  quantityValue: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.body), marginLeft: spacing.md, marginRight: spacing.md, minWidth: 18, textAlign: 'center' }),
};
