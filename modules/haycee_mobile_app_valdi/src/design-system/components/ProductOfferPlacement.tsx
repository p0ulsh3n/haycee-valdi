import { StatefulComponent } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { Asset } from 'valdi_tsx/src/Asset';
import { ImageView, Label, Layout, ScrollView, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../../res/navigation-icons';
import { colors } from '../tokens/colors';
import { spacing } from '../tokens/spacing';
import { fontSize, lineHeight, montserrat } from '../tokens/typography';
import type { ProductOffer } from './ProductCardTypes';
import { Ticker } from './Ticker';

export interface ProductOfferPlacementViewModel {
  offer: ProductOffer;
}

interface ProductOfferPlacementState {
  now: number;
}

interface OfferPresentation {
  label: string;
  color: string;
  icon?: Asset;
  liveDot?: boolean;
}

const formatCount = (count: number): string => {
  const value = Math.max(0, Math.floor(count));
  if (value >= 1_000_000) return `${Math.round((value / 1_000_000) * 10) / 10}M`;
  if (value >= 1_000) return `${Math.round((value / 1_000) * 10) / 10}K`;
  return String(value);
};

const formatCountdown = (endsAt: string | undefined, now: number): string => {
  if (!endsAt) return '';
  const end = Date.parse(endsAt);
  if (!Number.isFinite(end)) return '';
  const seconds = Math.max(0, Math.floor((end - now) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
    : `${minutes}:${String(remainder).padStart(2, '0')}`;
};

const getOfferPresentation = (offer: ProductOffer, now: number): OfferPresentation => {
  const params = offer.params ?? {};
  const count = formatCount(params.count ?? 0);
  const shipmentIcon = navigationIcons.deliveryTruck02;
  const discountIcon = navigationIcons.discountTag01;
  const socialIcon = navigationIcons.userGroup;
  const stockIcon = navigationIcons.alertCircle;

  switch (offer.type) {
    case 'OFFER_NEW_CUSTOMER':
      return { label: params.amount ? `Offre nouveau client · ${params.amount}` : 'Offre nouveau client', color: colors.offerAccent };
    case 'OFFER_EXTRA_FIXED_OFF':
      return { label: `${params.amount ?? 'Réduction'} de réduction supplémentaire`, color: colors.offerPositive };
    case 'OFFER_EXTRA_PERCENT_OFF':
      return { label: `${params.pct ?? ''} de réduction supplémentaire`, color: colors.offerPositive };
    case 'OFFER_MEMBER_PRICE':
      return { label: params.price ? `Prix membre exclusif · ${params.price}` : 'Prix membre exclusif', color: colors.offerGold };
    case 'OFFER_FLASH_SALE':
      return { label: params.pct ? `Vente flash · ${params.pct} de remise` : 'Vente flash', color: colors.offerDanger, icon: discountIcon };
    case 'OFFER_FLASH_SALE_COUNTDOWN': {
      if (!offer.endsAt) {
        return { label: params.pct ? `Vente flash · ${params.pct} de remise` : 'Vente flash', color: colors.offerDanger, icon: discountIcon };
      }
      const countdown = formatCountdown(offer.endsAt, now);
      return {
        label: countdown && countdown !== '0:00' ? `Vente flash · se termine dans ${countdown}` : 'Offre flash terminée',
        color: countdown && countdown !== '0:00' ? colors.offerDanger : colors.textTertiary,
        icon: discountIcon,
      };
    }
    case 'OFFER_HOT_DEAL':
      return { label: params.pct ? `Super affaire · ${params.pct} de remise` : 'Super affaire', color: colors.offerWarning, icon: discountIcon };
    case 'OFFER_LIVE_EXCLUSIVE':
      return { label: 'Exclusivité live', color: colors.offerDanger, liveDot: true };
    case 'OFFER_ENDS_SOON':
      return { label: 'Se termine bientôt', color: colors.offerWarning };
    case 'OFFER_LIMITED_TIME':
      return { label: 'Offre à durée limitée', color: colors.offerWarning };
    case 'OFFER_BUY_X_SAVE_PERCENT':
      return { label: `Achetez ${params.x ?? 'X'} · économisez ${params.pct ?? 'Y%'}`, color: colors.offerTeal };
    case 'OFFER_SPEND_X_GET_PERCENT':
      return { label: `Dépensez ${params.amount ?? 'X'} · obtenez ${params.pct ?? 'Y%'} de remise`, color: colors.offerAccent };
    case 'OFFER_BUY_X_GET_Y':
      return {
        label: params.discountPct
          ? `Achetez ${params.x ?? 'X'} · ${params.y ?? 'Y'} à ${params.discountPct}`
          : `Achetez ${params.x ?? 'X'} · obtenez ${params.y ?? 'Y'} offert(s)`,
        color: colors.offerTeal,
      };
    case 'OFFER_FREE_SHIPPING':
      return { label: params.amount ? `Livraison gratuite dès ${params.amount}` : 'Livraison gratuite', color: colors.offerPositive, icon: shipmentIcon };
    case 'OFFER_FAST_SHIPPING':
      return { label: params.days ? `Livraison en ${params.days} j` : 'Livraison rapide', color: colors.offerAccent, icon: shipmentIcon };
    case 'SOCIAL_IN_CART':
      return { label: `Dans le panier de ${count} acheteur${params.count === 1 ? '' : 's'}`, color: colors.offerWarning, icon: navigationIcons.shoppingCart02 };
    case 'SOCIAL_HIGH_REPEAT':
      return { label: 'Boutique très réachetée', color: colors.offerMuted };
    case 'SOCIAL_UNITS_SOLD':
      return { label: `${count} vendu${params.count === 1 ? '' : 's'}`, color: colors.offerMuted };
    case 'SOCIAL_REPURCHASED':
      return { label: `${count} rachats`, color: colors.offerMuted };
    case 'SOCIAL_VIEWING_NOW':
      return { label: `${count} personnes consultent en ce moment`, color: colors.offerWarning, icon: socialIcon };
    case 'STOCK_LOW':
      return { label: `${params.count === 1 ? "Plus qu'" : 'Plus que '}${count} en stock`, color: colors.offerDanger, icon: stockIcon };
    case 'STOCK_ALMOST_GONE':
      return { label: 'Presque épuisé', color: colors.offerDanger, icon: stockIcon };
    default:
      return { label: '', color: colors.textSecondary };
  }
};

/** One-line, data-driven offer text between the product title and price. */
export class ProductOfferPlacement extends StatefulComponent<ProductOfferPlacementViewModel, ProductOfferPlacementState> {
  state: ProductOfferPlacementState = { now: Date.now() };
  private countdownScheduled = false;

  onCreate(): void {
    this.scheduleCountdownIfNeeded();
  }

  onViewModelUpdate(): void {
    this.setState({ now: Date.now() });
    this.scheduleCountdownIfNeeded();
  }

  private hasCountdown(): boolean {
    return this.viewModel.offer.type === 'OFFER_FLASH_SALE_COUNTDOWN' && Boolean(this.viewModel.offer.endsAt);
  }

  private scheduleCountdownIfNeeded(): void {
    if (!this.hasCountdown() || this.countdownScheduled) return;
    this.countdownScheduled = true;
    this.setTimeoutDisposable(() => {
      this.countdownScheduled = false;
      if (this.isDestroyed() || !this.hasCountdown()) return;
      this.setState({ now: Date.now() });
      const end = this.viewModel.offer.endsAt ? Date.parse(this.viewModel.offer.endsAt) : 0;
      if (Number.isFinite(end) && end > Date.now()) this.scheduleCountdownIfNeeded();
    }, 1000);
  }

  onRender(): void {
    const presentation = getOfferPresentation(this.viewModel.offer, this.state.now);
    <layout style={styles.row}>
      {presentation.liveDot ? <view style={styles.liveDot} /> : null}
      {presentation.icon ? (
        <image
          src={presentation.icon}
          tint={presentation.color}
          style={styles.leadingIcon}
          width={12}
          height={12}
          objectFit="contain"
        />
      ) : null}
      <Ticker
        items={[presentation.label]}
        mode="marquee"
        direction="forward"
        marqueeVerticalAlignment="center"
        active
        preserveMarqueePositionOnItemsChange={true}
        holdDurationMs={1200}
        marqueeSpeed={24}
        style={styles.textTicker}
        textStyle={styles.label.extend({ color: presentation.color })}
        accessibilityLabel={presentation.label}
      />
    </layout>;
  }
}

const styles = {
  row: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', flexShrink: 1, minWidth: 0, width: '100%' }),
  leadingIcon: new Style<ImageView>({ flexShrink: 0, marginRight: spacing.xs }),
  label: new Style<Label>({ font: montserrat.semiBold(fontSize.tiny), lineHeight: lineHeight.tiny / fontSize.tiny, translationY: -1.5 }),
  liveDot: new Style<View>({ backgroundColor: colors.offerDanger, borderRadius: 4, flexShrink: 0, height: 7, marginRight: spacing.xs, width: 7 }),
  textTicker: new Style<ScrollView>({ flexGrow: 1, flexShrink: 1, height: lineHeight.label, minWidth: 0 }),
};
