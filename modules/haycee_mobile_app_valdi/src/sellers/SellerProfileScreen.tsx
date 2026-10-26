import { Device } from 'valdi_core/src/Device';
import { Style } from 'valdi_core/src/Style';
import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageStatefulComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { Label, Layout, ScrollView, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../res/navigation-icons';
import { Hairline } from '../design-system/components/Hairline';
import { TransientFeedback } from '../design-system/components/SnackBar';
import { colors } from '../design-system/tokens/colors';
import { noBounceScrollAttributes } from '../design-system/tokens/scrollBehavior';
import { radius } from '../design-system/tokens/radius';
import { spacing } from '../design-system/tokens/spacing';
import { fontSize, montserrat, typography, transformText } from '../design-system/tokens/typography';
import { MasonryProduct } from '../design-system/components/MasonryProductCard';

export interface SellerProfileViewModel {
  product: MasonryProduct;
  sellerProducts?: MasonryProduct[];
}

interface SellerProfileState {
  activeTab: number;
  isFollowing: boolean;
}

/** Seller storefront/profile page opened from a product or its seller row. */
@NavigationPage(module)
export class SellerProfileScreen extends NavigationPageStatefulComponent<
  SellerProfileViewModel,
  SellerProfileState
> {
  state: SellerProfileState = { activeTab: 0, isFollowing: false };

  onCreate(): void {
    this.state = { activeTab: 0, isFollowing: this.viewModel.product.vendorIsFollowing ?? false };
  }

  private handleBack = (): void => {
    this.navigationController.pop();
  };

  private handleShare = (): void => {
    TransientFeedback.show({ message: 'Partager la boutique', duration: 1800 });
  };

  private handleTab = (index: number): void => {
    this.setState({ activeTab: index });
  };

  private handleFollow = (): void => {
    this.setState({ isFollowing: !this.state.isFollowing });
  };

  private vendorDisplayName(): string {
    return this.viewModel.product.vendorName ?? 'Boutique Haycee';
  }

  private vendorUsername(): string {
    const username = this.viewModel.product.vendorUsername
      ?? this.vendorDisplayName().toLocaleLowerCase().replace(/\s+/g, '');
    return username.startsWith('@') ? username.slice(1) : username;
  }

  private renderHeader(topInset: number): void {
    <view style={styles.headerOverlay}>
      <view style={styles.header.extend({ paddingTop: topInset + spacing.lg })}>
        <view style={styles.headerButton} onTap={this.handleBack} accessibilityCategory="button">
          <image src={navigationIcons.arrowLeft01Round} tint={colors.textInverted} width={24} height={24} objectFit="contain" />
        </view>
        <view style={styles.headerButton} onTap={this.handleShare} accessibilityCategory="button">
          <image src={navigationIcons.share01} tint={colors.textInverted} width={24} height={24} objectFit="contain" />
        </view>
      </view>
    </view>;
  }

  private renderTabs(): void {
    const productCount = this.viewModel.sellerProducts?.length;
    const tabs: Array<{ label: string; count?: string }> = [
      { label: 'Produits', count: productCount === undefined ? undefined : `${productCount}` },
      { label: 'Shows' },
      { label: 'Posts' },
    ];

    <layout style={styles.tabsContainer}>
      <view style={styles.tabs}>
        {tabs.map((tab, index) => (
          <view key={'seller-tab-' + tab.label} style={styles.tab} onTap={() => this.handleTab(index)} accessibilityCategory="button">
            <label
              value={tab.count ? `${tab.label}  ${tab.count}` : tab.label}
              style={index === this.state.activeTab ? styles.tabLabelActive : styles.tabLabel}
              numberOfLines={1}
            />
            {index === this.state.activeTab ? <view style={styles.tabIndicator} /> : null}
          </view>
        ))}
      </view>
      <Hairline color={colors.borderDefault} />
    </layout>;
  }

  private renderTabContent(): void {
    const product = this.viewModel.product;
    if (this.state.activeTab !== 0) {
      <view style={styles.emptyTab}>
        <label value={this.state.activeTab === 1 ? 'Les prochains shows apparaîtront ici' : 'Les posts de la boutique apparaîtront ici'} style={styles.emptyTabText} numberOfLines={0} />
      </view>;
      return;
    }

    const sellerProducts = this.viewModel.sellerProducts;
    const productTiles = sellerProducts
      ? sellerProducts.slice(0, 3).map(item => ({ id: item.id, title: item.title, price: item.price, color: item.color }))
      : [product, ...(product.galleryColors ?? []).map((color, index) => ({ ...product, id: `${product.id}-gallery-${index}`, color }))]
          .slice(0, 3)
          .map(item => ({ id: item.id, title: item.title, price: item.price, color: item.color }));

    <view style={styles.productGrid}>
      {productTiles.map(item => (
        <view key={'seller-product-' + item.id} style={styles.productTile} backgroundColor={item.color}>
          <label value={transformText(item.title, 'capitalize')} style={styles.productTileTitle} numberOfLines={2} />
          <label value={item.price} style={styles.productTilePrice} numberOfLines={1} />
        </view>
      ))}
    </view>;
  }

  onRender(): void {
    const product = this.viewModel.product;
    const topInset = Math.max(0, Device.getDisplayTopInset());
    const vendorDisplayName = this.vendorDisplayName();
    const initial = vendorDisplayName.charAt(0).toUpperCase();
    const coverColor = product.galleryColors?.[0] ?? product.color;

    <view style={styles.root}>
      <scroll {...noBounceScrollAttributes} style={styles.scroll}>
        <view style={styles.cover} backgroundColor={coverColor}>
        </view>
        <view style={styles.profileSurface}>
          <view style={styles.profileHeader}>
            {product.vendorAvatarUrl ? (
              <image src={product.vendorAvatarUrl} style={styles.avatar} objectFit="cover" />
            ) : (
              <view style={styles.avatarFallback}>
                <label value={initial} style={styles.avatarInitial} />
              </view>
            )}
            <view style={styles.profileInfo}>
              <label value={vendorDisplayName} style={styles.displayName} numberOfLines={1} />
              <label value={'@' + this.vendorUsername()} style={styles.vendorHandle} numberOfLines={1} />
              <view style={styles.infoBadges}>
                {product.vendorReviewSummary || product.vendorRating ? (
                  <view style={styles.infoBadge}>
                    <image src={navigationIcons.star} tint="#8B5CF6" width={13} height={13} objectFit="contain" />
                    <label value={product.vendorReviewSummary ?? product.vendorRating ?? ''} style={styles.infoBadgeLabel} numberOfLines={1} />
                  </view>
                ) : null}
                {product.vendorDispatchTime ? (
                  <view style={styles.infoBadgeWithGap}>
                    <image src={navigationIcons.deliveryTruck02} tint={colors.textSecondary} width={15} height={15} objectFit="contain" />
                    <label value={product.vendorDispatchTime} style={styles.infoBadgeLabel} numberOfLines={1} />
                  </view>
                ) : null}
                {product.vendorDeliveryTime ? (
                  <view style={styles.infoBadgeWithGap}>
                    <image src={navigationIcons.sellerDeliveryPlane} tint={colors.textSecondary} width={15} height={15} objectFit="contain" />
                    <label value={product.vendorDeliveryTime} style={styles.infoBadgeLabel} numberOfLines={1} />
                  </view>
                ) : null}
              </view>
            </view>
          </view>
          <view style={styles.statsRow}>
            <view style={styles.statsText}>
              {product.vendorSalesCount !== undefined ? (
                <layout style={styles.statItem}>
                  <label value={formatSellerCount(product.vendorSalesCount)} style={styles.statsNumber} />
                  <label value=" ventes" style={styles.statsLabel} />
                </layout>
              ) : null}
              {product.vendorSalesCount !== undefined && product.vendorFollowersCount !== undefined ? (
                <label value="  ·  " style={styles.statsSeparator} />
              ) : null}
              {product.vendorFollowersCount !== undefined ? (
                <layout style={styles.statItem}>
                  <label value={formatSellerCount(product.vendorFollowersCount)} style={styles.statsNumber} />
                  <label value=" abonnés" style={styles.statsLabel} />
                </layout>
              ) : null}
            </view>
            <view
              style={this.state.isFollowing ? styles.followButtonActive : styles.followButton}
              onTap={this.handleFollow}
              accessibilityCategory="button"
            >
              <view style={styles.followButtonContent}>
                {!this.state.isFollowing ? (
                  <view style={styles.followIcon}>
                    <image src={navigationIcons.userAdd01} tint={colors.textInverted} width={16} height={16} objectFit="contain" />
                  </view>
                ) : (
                  <view style={styles.followIcon}>
                    <image src={navigationIcons.userCheck01} tint={colors.textPrimary} width={16} height={16} objectFit="contain" />
                  </view>
                )}
                <label
                  value={this.state.isFollowing ? 'Suivi' : 'Suivre'}
                  style={this.state.isFollowing ? styles.followLabelActive : styles.followLabel}
                />
              </view>
            </view>
          </view>
          {product.vendorBio ? <label value={product.vendorBio} style={styles.bio} numberOfLines={4} /> : null}
          {this.renderTabs()}
          {this.renderTabContent()}
        </view>
      </scroll>
      {this.renderHeader(topInset)}
    </view>;
  }
}

const styles = {
  root: new Style<View>({
    backgroundColor: colors.backgroundPrimary,
    flexGrow: 1,
    flexShrink: 1,
    height: '100%',
  }),
  scroll: new Style<ScrollView>({
    flexGrow: 1,
    flexShrink: 1,
  }),
  cover: new Style<View>({
    alignItems: 'center',
    height: 240,
    justifyContent: 'center',
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
  }),
  profileSurface: new Style<View>({
    backgroundColor: colors.backgroundPrimary,
    borderRadius: 0,
    marginTop: -spacing.xxxxxl,
    paddingBottom: spacing.xxxxl,
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    zIndex: 1,
  }),
  profileHeader: new Style<View>({
    alignItems: 'flex-start',
    flexDirection: 'row',
    height: 144,
    marginTop: -spacing.xl,
  }),
  avatar: new Style<View>({
    borderRadius: radius.full,
    height: 96,
    width: 96,
  }),
  avatarFallback: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.full,
    height: 96,
    justifyContent: 'center',
    width: 96,
  }),
  avatarInitial: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.black(fontSize.display),
  }),
  profileInfo: new Style<View>({
    flexGrow: 1,
    flexShrink: 1,
    height: 96,
    marginLeft: spacing.lg,
    position: 'relative',
    top: spacing.xl,
    zIndex: 2,
  }),
  displayName: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.extraBold(fontSize.section),
    left: 0,
    lineHeight: 1.4,
    position: 'absolute',
    right: 0,
    top: 0,
  }),
  vendorHandle: typography.body.extend({
    color: colors.textSecondary,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 30,
  }),
  infoBadges: new Style<View>({
    alignItems: 'center',
    flexDirection: 'row',
    position: 'absolute',
    top: 64,
  }),
  infoBadge: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.sm,
    flexDirection: 'row',
    flexShrink: 1,
    height: 28,
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
  }),
  infoBadgeWithGap: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.sm,
    flexDirection: 'row',
    flexShrink: 1,
    height: 28,
    marginLeft: spacing.sm,
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
  }),
  infoBadgeLabel: new Style<Label>({
    color: colors.textSecondary,
    flexShrink: 1,
    font: montserrat.semiBold(fontSize.label),
    marginLeft: spacing.xs,
  }),
  statsRow: new Style<View>({
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
  }),
  statsText: new Style<View>({
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
  }),
  statItem: new Style<Layout>({ alignItems: 'center', flexDirection: 'row' }),
  statsNumber: typography.bodyEmphasis,
  statsLabel: typography.body,
  statsSeparator: typography.body.extend({
    color: colors.textSecondary,
  }),
  followButton: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.textPrimary,
    borderRadius: radius.full,
    height: 36,
    justifyContent: 'center',
    marginLeft: spacing.md,
    minWidth: 84,
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
  }),
  followButtonActive: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.full,
    height: 36,
    justifyContent: 'center',
    marginLeft: spacing.md,
    minWidth: 84,
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
  }),
  followLabel: new Style<Label>({
    color: colors.textInverted,
    font: montserrat.extraBold(fontSize.metadata),
  }),
  followLabelActive: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.extraBold(fontSize.metadata),
  }),
  followButtonContent: new Style<View>({
    alignItems: 'center',
    flexDirection: 'row',
  }),
  followIcon: new Style<View>({
    marginRight: spacing.sm,
  }),
  bio: typography.body.extend({ color: colors.textPrimary, marginTop: spacing.xl }),
  tabsContainer: new Style<Layout>({
    marginTop: spacing.xxl,
  }),
  tabs: new Style<View>({
    flexDirection: 'row',
  }),
  tab: new Style<View>({
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: 48,
    position: 'relative',
  }),
  tabLabel: typography.caption,
  tabLabelActive: typography.bodyEmphasis,
  tabIndicator: new Style<View>({
    backgroundColor: colors.textPrimary,
    bottom: -1,
    height: 2,
    left: 0,
    position: 'absolute',
    right: 0,
  }),
  productGrid: new Style<View>({
    flexDirection: 'row',
    marginTop: spacing.lg,
  }),
  productTile: new Style<View>({
    flexGrow: 1,
    height: 180,
    justifyContent: 'flex-end',
    marginRight: spacing.sm,
    padding: spacing.sm,
  }),
  productTileTitle: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.extraBold(fontSize.label),
  }),
  productTilePrice: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.extraBold(fontSize.product),
    marginTop: spacing.xs,
  }),
  emptyTab: new Style<View>({
    alignItems: 'center',
    minHeight: 180,
    justifyContent: 'center',
    paddingLeft: spacing.xl,
    paddingRight: spacing.xl,
  }),
  emptyTabText: typography.caption.extend({ textAlign: 'center' }),
  headerOverlay: new Style<View>({
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 2,
  }),
  header: new Style<View>({
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingBottom: spacing.sm,
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    paddingTop: spacing.sm,
    position: 'relative',
  }),
  headerButton: new Style<View>({
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.48)',
    borderRadius: radius.full,
    height: 40,
    justifyContent: 'center',
    width: 40,
  }),
};

const formatSellerCount = (count: number): string => {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return Math.max(0, count).toString();
};
