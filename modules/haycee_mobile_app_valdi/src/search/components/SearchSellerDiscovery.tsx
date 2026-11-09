import { StatefulComponent } from 'valdi_core/src/Component';
import { createReusableCallback } from 'valdi_core/src/utils/Callback';
import { Style } from 'valdi_core/src/Style';
import { ImageView, Label, Layout, ScrollView, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../../res/navigation-icons';
import { DSButton } from '../../design-system/components/DSButton';
import { noBounceScrollAttributes } from '../../design-system/tokens/scrollBehavior';
import { colors } from '../../design-system/tokens/colors';
import { radius } from '../../design-system/tokens/radius';
import { spacing } from '../../design-system/tokens/spacing';
import { fontSize, montserrat } from '../../design-system/tokens/typography';
import { filterSearchSellers } from '../SearchData';
import type { SearchSeller } from '../SearchData';

interface SearchSellerDiscoveryViewModel {
  query: string;
  sellers: SearchSeller[];
  recentSellerIds: string[];
  onSelect: (seller: SearchSeller) => void;
  onRemoveRecent: (sellerId: string) => void;
  onClearRecent: () => void;
}

interface SearchSellerDiscoveryState {
  followingSellerIds: string[];
}

let followingSellerIdsCache: string[] = [];

/** Seller account search and seller-only recent history. */
export class SearchSellerDiscovery extends StatefulComponent<SearchSellerDiscoveryViewModel, SearchSellerDiscoveryState> {
  state: SearchSellerDiscoveryState = { followingSellerIds: followingSellerIdsCache.slice() };

  private isFollowing(sellerId: string): boolean {
    return this.state.followingSellerIds.includes(sellerId);
  }

  private handleToggleFollow = (sellerId: string): void => {
    const followingSellerIds = this.isFollowing(sellerId)
      ? this.state.followingSellerIds.filter(id => id !== sellerId)
      : [...this.state.followingSellerIds, sellerId];
    followingSellerIdsCache = followingSellerIds;
    this.setState({ followingSellerIds: followingSellerIds.slice() });
  };

  private handleSelectSeller = (seller: SearchSeller): void => {
    this.viewModel.onSelect({
      ...seller,
      profileProduct: {
        ...seller.profileProduct,
        vendorIsFollowing: this.isFollowing(seller.id),
      },
    });
  };

  private renderSellerRow(seller: SearchSeller, isRecent: boolean): void {
    const isFollowing = this.isFollowing(seller.id);
    <layout key={`seller-search-${seller.id}`} style={styles.row}>
      <view
        style={styles.sellerTapTarget}
        onTap={createReusableCallback(() => this.handleSelectSeller(seller))}
        accessibilityCategory="button"
        accessibilityLabel={`Ouvrir le profil de ${seller.displayName}`}
      >
        <view style={styles.avatar}>
          {seller.avatarUrl ? (
            <image src={seller.avatarUrl} style={styles.avatarImage} objectFit="cover" />
          ) : (
            <label value={seller.displayName.slice(0, 1).toUpperCase()} style={styles.avatarInitial} numberOfLines={1} />
          )}
        </view>
        <view style={styles.identity}>
          <label value={seller.displayName} style={styles.displayName} numberOfLines={1} textOverflow="ellipsis" />
          <label value={`@${seller.username}`} style={styles.username} numberOfLines={1} textOverflow="ellipsis" />
        </view>
      </view>
      {isRecent ? (
        <view
          style={styles.removeButton}
          onTap={createReusableCallback(() => this.viewModel.onRemoveRecent(seller.id))}
          accessibilityCategory="button"
          accessibilityLabel={`Retirer ${seller.displayName} des recherches récentes`}
        >
          <image src={navigationIcons.cancel01} tint={colors.textInverted} width={12} height={12} objectFit="contain" />
        </view>
      ) : null}
      <DSButton
        title={isFollowing ? 'Suivi' : 'Suivre'}
        variant={isFollowing ? 'neutral' : 'cta'}
        size="compact"
        textCase="none"
        marginLeft={spacing.sm}
        icon={isFollowing ? navigationIcons.userCheck01 : navigationIcons.userAdd01}
        iconSize={16}
        accessibilityLabel={isFollowing ? `Ne plus suivre ${seller.displayName}` : `Suivre ${seller.displayName}`}
        onTap={createReusableCallback(() => this.handleToggleFollow(seller.id))}
      />
    </layout>;
  }

  private renderEmptyState(title: string, message: string): void {
    <view style={styles.emptyState}>
      <image src={navigationIcons.search02} tint={colors.textTertiary} width={28} height={28} objectFit="contain" />
      <label value={title} style={styles.emptyTitle} numberOfLines={1} />
      <label value={message} style={styles.emptyMessage} numberOfLines={2} />
    </view>;
  }

  onRender(): void {
    const query = this.viewModel.query.trim();
    const isRecentMode = query.length === 0;
    const sellers = isRecentMode
      ? this.viewModel.recentSellerIds
          .map(id => this.viewModel.sellers.find(seller => seller.id === id))
          .filter((seller): seller is SearchSeller => seller !== undefined)
      : filterSearchSellers(this.viewModel.sellers, query);

    <scroll {...noBounceScrollAttributes} style={styles.scroll} showsVerticalScrollIndicator={false}>
      {isRecentMode && sellers.length > 0 ? (
        <view style={styles.section}>
          <layout style={styles.sectionHeader}>
            <label value="RECHERCHES RÉCENTES" style={styles.sectionTitle} numberOfLines={1} />
            <view
              style={styles.clearButton}
              onTap={this.viewModel.onClearRecent}
              accessibilityCategory="button"
              accessibilityLabel="Effacer les recherches récentes de vendeurs"
            >
              <image src={navigationIcons.delete02} tint={colors.textSecondary} width={16} height={16} objectFit="contain" />
              <label value="Effacer" style={styles.clearLabel} numberOfLines={1} />
            </view>
          </layout>
          {sellers.map(seller => this.renderSellerRow(seller, true))}
        </view>
      ) : null}
      {!isRecentMode && sellers.length > 0 ? (
        <view style={styles.section}>
          {sellers.map(seller => this.renderSellerRow(seller, false))}
        </view>
      ) : null}
      {sellers.length === 0
        ? this.renderEmptyState(
            isRecentMode ? 'Aucun vendeur recherché' : 'Aucun vendeur trouvé',
            isRecentMode
              ? 'Les vendeurs que tu recherches apparaîtront ici.'
              : 'Essaie un autre nom ou un autre identifiant.',
          )
        : null}
      <view style={styles.bottomSpace} />
    </scroll>;
  }
}

const styles = {
  scroll: new Style<ScrollView>({ flexGrow: 1, flexShrink: 1 }),
  section: new Style<View>({ paddingLeft: spacing.lg, paddingRight: spacing.lg, paddingTop: spacing.xl }),
  sectionHeader: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }),
  sectionTitle: new Style<Label>({ color: colors.textSecondary, font: montserrat.extraBold(fontSize.label) }),
  clearButton: new Style<View>({ alignItems: 'center', flexDirection: 'row' }),
  clearLabel: new Style<Label>({ color: colors.textSecondary, font: montserrat.semiBold(fontSize.nano), marginLeft: spacing.xs }),
  row: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', height: 68 }),
  sellerTapTarget: new Style<View>({ alignItems: 'center', flexDirection: 'row', flexGrow: 1, flexShrink: 1, height: '100%', minWidth: 0 }),
  avatar: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: radius.full, flexShrink: 0, height: 48, justifyContent: 'center', width: 48 }),
  avatarImage: new Style<ImageView>({ borderRadius: radius.full, height: '100%', width: '100%' }),
  avatarInitial: new Style<Label>({ color: colors.textSecondary, font: montserrat.semiBold(fontSize.body) }),
  identity: new Style<View>({ flexDirection: 'column', flexGrow: 1, flexShrink: 1, marginLeft: spacing.md, minWidth: 0 }),
  displayName: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.body) }),
  username: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.metadata), marginTop: spacing.xs }),
  removeButton: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundTertiary, borderRadius: radius.full, flexShrink: 0, height: 20, justifyContent: 'center', marginLeft: spacing.sm, width: 20 }),
  emptyState: new Style<View>({ alignItems: 'center', flexGrow: 1, justifyContent: 'center', minHeight: 260, paddingLeft: spacing.xl, paddingRight: spacing.xl }),
  emptyTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.section), marginTop: spacing.md }),
  emptyMessage: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.body), marginTop: spacing.sm, textAlign: 'center' }),
  bottomSpace: new Style<View>({ height: spacing.xxxxxl }),
};
