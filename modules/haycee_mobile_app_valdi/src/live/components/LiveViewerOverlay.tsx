import { AnimationCurve } from 'valdi_core/src/AnimationOptions';
import { Component } from 'valdi_core/src/Component';
import { ElementRef } from 'valdi_core/src/ElementRef';
import { Style } from 'valdi_core/src/Style';
import { Asset } from 'valdi_tsx/src/Asset';
import { EditTextEvent, Label, Layout, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../../res/navigation-icons';
import { LiveChatFeed } from './LiveChatFeed';
import { LiveCommentComposer } from './LiveCommentComposer';
import { LiveProductQuickAccess } from './LiveProductQuickAccess';
import { LiveProductSurface } from './LiveProductSurface';
import type { LiveViewerMessage, LiveViewerProduct } from '../data/LiveViewerData';
import { colors } from '../../design-system/tokens/colors';
import { layout, spacing } from '../../design-system/tokens/spacing';
import { fontSize, montserrat } from '../../design-system/tokens/typography';

export interface LiveViewerOverlayViewModel {
  messages: LiveViewerMessage[];
  commentDraft: string;
  likeCount: number;
  isLiked: boolean;
  products: LiveViewerProduct[];
  onDraftChange: (event: EditTextEvent) => void;
  onSendComment: () => void;
  onLike: () => void;
  onWallet: () => void;
  onOpenCart: () => void;
  onOpenRequest: () => void;
  onOpenProducts: () => void;
  onProductAction: (product: LiveViewerProduct) => void;
}

/**
 * The lower live overlay keeps chat input stable while its decorative/action
 * layer (right rail and product surface) fades with the keyboard.
 */
export class LiveViewerOverlay extends Component<LiveViewerOverlayViewModel> {
  private readonly actionRailRef = new ElementRef<View>();
  private readonly productSurfaceRef = new ElementRef<View>();
  private keyboardVisible = false;
  private overlayHidden = false;
  private overlayInteractive = true;
  private productSurfaceCollapsed = false;
  private overlayTransitionId = 0;

  private setVisualOverlayHidden(hidden: boolean): void {
    if (hidden === this.keyboardVisible) return;
    this.keyboardVisible = hidden;
    const transitionId = ++this.overlayTransitionId;

    // First fade the visuals completely. Collapse/restore the product slot only
    // after that fade, so the right rail never appears to get pushed away.
    this.overlayInteractive = false;
    this.actionRailRef.setAttribute('touchEnabled', false);
    this.productSurfaceRef.setAttribute('touchEnabled', false);

    if (hidden) {
      // Persist the hidden target across subsequent text-change renders while
      // the fade is running. The direct attribute animation still starts now.
      this.overlayHidden = true;
      void this.animatePromise(
        { duration: 0.22, curve: AnimationCurve.EaseInOut, beginFromCurrentState: true },
        () => {
          this.actionRailRef.setAttribute('opacity', 0);
          this.productSurfaceRef.setAttribute('opacity', 0);
        },
      ).then(() => {
        if (transitionId !== this.overlayTransitionId || !this.keyboardVisible) return;
        this.overlayHidden = true;
        this.productSurfaceCollapsed = true;
        this.productSurfaceRef.setAttribute('height', 0);
      });
      return;
    }

    this.productSurfaceCollapsed = false;
    this.productSurfaceRef.setAttribute('height', layout.live.viewer.productCardHeight);
    void this.animatePromise(
      { duration: 0.22, curve: AnimationCurve.EaseInOut, beginFromCurrentState: true },
      () => {
        this.actionRailRef.setAttribute('opacity', 1);
        this.productSurfaceRef.setAttribute('opacity', 1);
        this.actionRailRef.setAttribute('touchEnabled', true);
        this.productSurfaceRef.setAttribute('touchEnabled', true);
      },
    ).then(() => {
      if (transitionId !== this.overlayTransitionId || this.keyboardVisible) return;
      this.overlayHidden = false;
      this.overlayInteractive = true;
    });
  }

  private handleInputBegin = (): void => this.setVisualOverlayHidden(true);

  private handleInputEnd = (): void => this.setVisualOverlayHidden(false);

  private renderActionButton(
    icon: Asset,
    label: string,
    shortLabel: string,
    onTap: () => void,
    isActive = false,
  ): void {
    <view
      style={isActive ? styles.actionButtonActive : styles.actionButton}
      onTap={onTap}
      accessibilityCategory="button"
      accessibilityLabel={label}
    >
      <image
        src={icon}
        tint={isActive ? colors.interactivePrimary : colors.textInverted}
        width={19}
        height={19}
        objectFit="contain"
      />
      <label value={shortLabel} style={styles.actionLabel} numberOfLines={1} />
    </view>;
  }

  onRender(): void {
    const model = this.viewModel;
    <view style={styles.root}>
      <layout style={styles.liveInteractionArea}>
        <view style={styles.chatColumn}>
          <LiveChatFeed messages={model.messages} />
          <view style={styles.composerSlot}>
            <LiveCommentComposer
              value={model.commentDraft}
              onChange={model.onDraftChange}
              onSend={model.onSendComment}
              onInputBegin={this.handleInputBegin}
              onInputEnd={this.handleInputEnd}
            />
          </view>
        </view>
        <view
          ref={this.actionRailRef}
          style={styles.actionRail}
          opacity={this.overlayHidden ? 0 : 1}
          touchEnabled={this.overlayInteractive}
        >
          {this.renderActionButton(
            navigationIcons.favourite,
            `J’aime, ${model.likeCount}`,
            'J’aime',
            model.onLike,
            model.isLiked,
          )}
          {this.renderActionButton(navigationIcons.money03, 'Portefeuille', 'Solde', model.onWallet)}
          {this.renderActionButton(navigationIcons.cart, 'Panier du live', 'Panier', model.onOpenCart)}
          {model.products.length > 0
            ? this.renderActionButton(
                navigationIcons.userHandUp01,
                'Demander un produit',
                'Demander',
                model.onOpenRequest,
              )
            : null}
          {model.products.length > 0 ? (
            <LiveProductQuickAccess products={model.products} onTap={model.onOpenProducts} />
          ) : null}
        </view>
      </layout>
      <view
        ref={this.productSurfaceRef}
        style={styles.productSurface}
        opacity={this.overlayHidden ? 0 : 1}
        height={this.productSurfaceCollapsed ? 0 : layout.live.viewer.productCardHeight}
        touchEnabled={this.overlayInteractive}
      >
        <LiveProductSurface products={model.products} onProductAction={model.onProductAction} />
      </view>
    </view>;
  }
}

const actionRailHeight = layout.live.viewer.chatHeight + layout.live.viewer.composerHeight + spacing.sm;

const styles = {
  root: new Style<View>({ flexGrow: 0, flexShrink: 1, width: '100%' }),
  liveInteractionArea: new Style<Layout>({
    alignItems: 'center',
    flexDirection: 'row',
    flexGrow: 0,
    flexShrink: 1,
    marginBottom: spacing.sm,
    paddingLeft: layout.live.viewer.horizontalPadding,
    paddingRight: layout.live.viewer.horizontalPadding,
    paddingTop: spacing.xs,
  }),
  chatColumn: new Style<View>({ flexGrow: 1, flexShrink: 1, minWidth: 0 }),
  composerSlot: new Style<View>({ marginTop: spacing.sm, paddingRight: spacing.xxl, width: '100%' }),
  actionRail: new Style<View>({
    alignItems: 'center',
    flexDirection: 'column',
    flexShrink: 0,
    height: actionRailHeight,
    justifyContent: 'flex-end',
    marginLeft: spacing.md,
    width: layout.live.viewer.productQuickAccessSize,
  }),
  productSurface: new Style<View>({ flexShrink: 0, width: '100%' }),
  actionButton: new Style<View>({
    alignItems: 'center',
    flexDirection: 'column',
    height: 40,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: 44,
  }),
  actionButtonActive: new Style<View>({
    alignItems: 'center',
    flexDirection: 'column',
    height: 40,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: 44,
  }),
  actionLabel: new Style<Label>({
    color: colors.textInverted,
    font: montserrat.semiBold(fontSize.tiny),
    marginTop: 2,
  }),
};
