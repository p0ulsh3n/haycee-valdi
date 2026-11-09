import { Device } from 'valdi_core/src/Device';
import { AnimationCurve } from 'valdi_core/src/AnimationOptions';
import { ElementRef } from 'valdi_core/src/ElementRef';
import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageStatefulComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { Style } from 'valdi_core/src/Style';
import { DragEvent, TouchEventState } from 'valdi_tsx/src/GestureEvents';
import { Label, Layout, ScrollView, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../../res/navigation-icons';
import { DSButton } from './DSButton';
import {
  bottomSheetSurfaceStyle,
  BOTTOM_SHEET_DEFAULTS,
  getBottomSheetNavigationOptions,
} from './BottomSheet';
import { noBounceScrollAttributes } from '../tokens/scrollBehavior';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { spacing } from '../tokens/spacing';
import { fontSize, montserrat, transformText, TextCase, typography } from '../tokens/typography';

export type LegalDocumentKind = 'terms' | 'privacy' | 'other';

/** A policy version that the host app can open and record as accepted. */
export interface LegalUpdateDocument {
  id: string;
  kind: LegalDocumentKind;
  title: string;
  version: string;
  url: string;
  effectiveDate?: string;
  requiresAcceptance?: boolean;
}

export interface LegalUpdateChange {
  id?: string;
  title: string;
  description?: string;
}

export interface LegalUpdateSection {
  id: string;
  title: string;
  body: string;
}

export interface LegalUpdateSheetViewModel {
  title: string;
  introduction: string;
  documents: LegalUpdateDocument[];
  /** Short, scannable list of material changes. */
  changes?: LegalUpdateChange[];
  /** Optional longer explanations, rendered in the scrollable body. */
  sections?: LegalUpdateSection[];
  effectiveDate?: string;
  footnote?: string;

  /** When true, the caller must provide onAccept and gate access until success. */
  requiresAcceptance?: boolean;
  /** Optional explicit checkbox for consent flows that need a separate affirmation. */
  confirmationLabel?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  showCloseButton?: boolean;
  showOverlay?: boolean;
  showHandle?: boolean;
  enableGestures?: boolean;
  dismissOnOverlayTap?: boolean;
  allowDismissWhenAcceptanceRequired?: boolean;
  roundBottomCorners?: boolean;
  overlayOpacity?: number;
  sheetHeight?: number | string;
  contentScrollable?: boolean;
  textCase?: TextCase;
  actionErrorMessage?: string;

  /** Open the selected document in the host app's verified navigation/link flow. */
  onOpenDocument: (document: LegalUpdateDocument) => void | Promise<unknown>;
  /** Persist accepted document IDs and versions in the host; required for mandatory updates. */
  onAccept?: (documents: LegalUpdateDocument[]) => void | Promise<unknown>;
  /** Optional acknowledgement callback for informational-only updates. */
  onAcknowledge?: () => void | Promise<unknown>;
  /** Called when the user chooses to leave/defer the update. */
  onDecline?: () => void | Promise<unknown>;
  onDismiss?: () => void;
}

/** Present this page with a transparent native modal background, like other app sheets. */
export const getLegalUpdateSheetNavigationOptions = () =>
  getBottomSheetNavigationOptions({ transparentPageBackground: true });

interface LegalUpdateSheetState {
  pendingAction: string;
  confirmationChecked: boolean;
  actionFailed: boolean;
}

/**
 * Reusable policy/terms update sheet. Required acceptance is single-flight and
 * cannot be bypassed through overlay taps, drag gestures, the close control,
 * or Android's system back button unless the caller explicitly permits it.
 */
@NavigationPage(module)
export class LegalUpdateSheet extends NavigationPageStatefulComponent<LegalUpdateSheetViewModel, LegalUpdateSheetState> {
  state: LegalUpdateSheetState = {
    pendingAction: '',
    confirmationChecked: false,
    actionFailed: false,
  };

  private readonly sheetRef = new ElementRef<View>();
  private actionPending = false;
  private isDismissing = false;
  private unregisterBackObserver?: () => void;

  onCreate(): void {
    if (this.requiresAcceptance() && !this.canDismiss()) {
      this.unregisterBackObserver = this.navigationController.registerBackButtonObserver(this.handleSystemBack);
    }
  }

  onDestroy(): void {
    this.unregisterBackObserver?.();
    this.notifyDismiss();
  }

  private requiresAcceptance = (): boolean => this.viewModel.requiresAcceptance === true
    || this.viewModel.documents.some(document => document.requiresAcceptance === true);

  private canDismiss = (): boolean => !this.requiresAcceptance()
    || this.viewModel.allowDismissWhenAcceptanceRequired === true;

  private acceptedDocuments = (): LegalUpdateDocument[] => this.viewModel.documents.filter(document =>
    document.requiresAcceptance ?? this.viewModel.requiresAcceptance === true,
  );

  private notifyDismiss = (): void => {
    if (this.isDismissing) return;
    this.isDismissing = true;
    try {
      this.viewModel.onDismiss?.();
    } catch (error) {
      console.warn('Legal update sheet onDismiss callback failed.', error);
    }
  };

  private dismiss = (): void => {
    if (this.actionPending || this.isDismissing || !this.canDismiss()) return;
    this.notifyDismiss();
    this.navigationController.dismiss(true);
  };

  private handleSystemBack = (): void => {
    if (this.canDismiss()) this.handleDecline();
  };

  private handleClose = (): void => {
    if (this.requiresAcceptance()) this.handleDecline();
    else this.dismiss();
  };

  private handleOverlayTap = (): void => {
    if (this.viewModel.dismissOnOverlayTap === true && this.canDismiss()) this.dismiss();
  };

  private handleDrag = (event: DragEvent): void => {
    if (!this.canDismiss() || this.actionPending) return;
    const sheet = this.sheetRef.single();
    if (!sheet) return;

    if (event.state === TouchEventState.Ended) {
      if (event.velocityY > 600) {
        this.handleDecline();
        return;
      }
      this.animate(
        { duration: 0.22, curve: AnimationCurve.EaseOut, beginFromCurrentState: true },
        () => sheet.setAttribute('translationY', 0),
      );
      return;
    }
    sheet.setAttribute('translationY', Math.max(0, event.deltaY));
  };

  private runAction = (key: string, action?: () => void | Promise<unknown>, dismissOnSuccess = true): void => {
    if (this.actionPending || this.isDismissing || !action) return;
    this.actionPending = true;
    this.setState({ pendingAction: key, confirmationChecked: this.state.confirmationChecked, actionFailed: false });

    let result: void | Promise<unknown>;
    try {
      result = action();
    } catch (error) {
      this.finishActionFailure(error);
      return;
    }

    if (!result || typeof result.then !== 'function') {
      this.actionPending = false;
      if (dismissOnSuccess) this.dismissAfterAction();
      else this.setState({ pendingAction: '', confirmationChecked: this.state.confirmationChecked, actionFailed: false });
      return;
    }

    void result.then(
      () => {
        this.actionPending = false;
        if (dismissOnSuccess) this.dismissAfterAction();
        else if (!this.isDestroyed()) this.setState({ pendingAction: '', confirmationChecked: this.state.confirmationChecked, actionFailed: false });
      },
      error => this.finishActionFailure(error),
    );
  };

  private dismissAfterAction = (): void => {
    this.actionPending = false;
    if (this.isDestroyed()) return;
    this.notifyDismiss();
    this.navigationController.dismiss(true);
  };

  private finishActionFailure = (error: unknown): void => {
    this.actionPending = false;
    console.warn('Legal update sheet action failed; the sheet stays open for retry.', error);
    if (!this.isDestroyed()) {
      this.setState({ pendingAction: '', confirmationChecked: this.state.confirmationChecked, actionFailed: true });
    }
  };

  private handlePrimary = (): void => {
    if (this.requiresAcceptance()) {
      const requiredDocuments = this.acceptedDocuments();
      if (!this.viewModel.onAccept || requiredDocuments.length === 0) return;
      if (this.viewModel.confirmationLabel && !this.state.confirmationChecked) return;
      this.runAction('accept', () => this.viewModel.onAccept?.(requiredDocuments));
      return;
    }
    this.runAction('acknowledge', this.viewModel.onAcknowledge ?? (() => undefined));
  };

  private handleDecline = (): void => {
    if (this.viewModel.onDecline) {
      this.runAction('decline', this.viewModel.onDecline);
    } else {
      this.dismiss();
    }
  };

  private handleConfirmationTap = (): void => {
    if (this.actionPending) return;
    this.setState({
      pendingAction: this.state.pendingAction,
      confirmationChecked: !this.state.confirmationChecked,
      actionFailed: this.state.actionFailed,
    });
  };

  private openDocument = (document: LegalUpdateDocument): void => {
    this.runAction(`document:${document.id}`, () => this.viewModel.onOpenDocument(document), false);
  };

  private renderDocuments(): void {
    if (this.viewModel.documents.length === 0) return;
    <view style={styles.documentsSection}>
      <label value="Documents" style={styles.sectionTitle} numberOfLines={1} />
      {this.viewModel.documents.map(document => (
        <view
          key={document.id}
          style={styles.documentRow}
          onTap={() => this.openDocument(document)}
          onTapDisabled={this.actionPending || !document.url}
          accessibilityCategory="button"
          accessibilityLabel={`${document.title}, version ${document.version}`}
          accessibilityStateDisabled={this.actionPending || !document.url}
        >
          <view style={styles.documentCopy}>
            <label value={transformText(document.title, this.viewModel.textCase ?? 'none')} style={styles.documentTitle} numberOfLines={2} />
            <label
              value={document.effectiveDate ? `Version ${document.version} · En vigueur le ${document.effectiveDate}` : `Version ${document.version}`}
              style={styles.documentMeta}
              numberOfLines={2}
            />
          </view>
          <label value="Lire" style={styles.documentLink} numberOfLines={1} />
          <view style={styles.documentDivider} />
        </view>
      ))}
    </view>;
  }

  private renderChanges(): void {
    const changes = this.viewModel.changes ?? [];
    if (changes.length === 0) return;
    <view style={styles.section}>
      <label value="Principales modifications" style={styles.sectionTitle} numberOfLines={2} />
      {changes.map((change, index) => (
        <view key={change.id ?? `${index}:${change.title}`} style={styles.changeRow}>
          <view style={styles.changeMarker} />
          <view style={styles.changeCopy}>
            <label value={transformText(change.title, this.viewModel.textCase ?? 'none')} style={styles.changeTitle} numberOfLines={0} />
            {change.description ? (
              <label value={transformText(change.description, this.viewModel.textCase ?? 'none')} style={styles.changeDescription} numberOfLines={0} />
            ) : null}
          </view>
        </view>
      ))}
    </view>;
  }

  private renderSections(): void {
    const sections = this.viewModel.sections ?? [];
    if (sections.length === 0) return;
    <view style={styles.section}>
      {sections.map(section => (
        <view key={section.id} style={styles.longSection}>
          <label value={transformText(section.title, this.viewModel.textCase ?? 'none')} style={styles.sectionTitle} numberOfLines={0} />
          <label value={transformText(section.body, this.viewModel.textCase ?? 'none')} style={styles.bodyCopy} numberOfLines={0} />
        </view>
      ))}
    </view>;
  }

  private renderBody(): void {
    <view style={styles.bodyContent}>
      <label value={transformText(this.viewModel.title, this.viewModel.textCase ?? 'none')} style={styles.title} numberOfLines={0} />
      {this.viewModel.effectiveDate ? (
        <label value={`Entrée en vigueur : ${this.viewModel.effectiveDate}`} style={styles.effectiveDate} numberOfLines={2} />
      ) : null}
      <label value={transformText(this.viewModel.introduction, this.viewModel.textCase ?? 'none')} style={styles.introduction} numberOfLines={0} />
      {this.renderDocuments()}
      {this.renderChanges()}
      {this.renderSections()}
      {this.viewModel.footnote ? (
        <label value={transformText(this.viewModel.footnote, this.viewModel.textCase ?? 'none')} style={styles.footnote} numberOfLines={0} />
      ) : null}
      {this.state.actionFailed ? (
        <label
          value={this.viewModel.actionErrorMessage ?? 'Une erreur est survenue. Réessaie.'}
          style={styles.errorMessage}
          numberOfLines={0}
        />
      ) : null}
    </view>;
  }

  onRender(): void {
    const requiresAcceptance = this.requiresAcceptance();
    const canDismiss = this.canDismiss();
    const showOverlay = this.viewModel.showOverlay ?? true;
    const showHandle = this.viewModel.showHandle ?? true;
    const gesturesEnabled = (this.viewModel.enableGestures ?? BOTTOM_SHEET_DEFAULTS.enableGestures) && canDismiss;
    const overlayCanDismiss = (this.viewModel.dismissOnOverlayTap ?? !requiresAcceptance) && canDismiss;
    const showClose = (this.viewModel.showCloseButton ?? canDismiss)
      && (canDismiss || Boolean(this.viewModel.onDecline));
    const scrollable = this.viewModel.contentScrollable ?? true;
    const primaryLabel = this.viewModel.primaryLabel ?? (requiresAcceptance ? 'Accepter et continuer' : 'J’ai compris');
    const secondaryLabel = this.viewModel.secondaryLabel ?? (requiresAcceptance ? 'Quitter' : undefined);
    const requiredDocumentsReady = !requiresAcceptance || (Boolean(this.viewModel.onAccept) && this.acceptedDocuments().length > 0);
    const confirmationReady = !this.viewModel.confirmationLabel || this.state.confirmationChecked;
    const primaryDisabled = Boolean(
      this.state.pendingAction || !requiredDocumentsReady || (requiresAcceptance && !confirmationReady),
    );
    const bottomInset = Math.max(0, Device.getDisplayBottomInset());
    const surfaceStyle = bottomSheetSurfaceStyle.extend({
      borderRadius: (this.viewModel.roundBottomCorners ?? BOTTOM_SHEET_DEFAULTS.roundBottomCorners)
        ? radius.xl
        : `${radius.xl} ${radius.xl} 0 0`,
      flexDirection: 'column',
      height: this.viewModel.sheetHeight ?? '92%',
      maxHeight: '96%',
      paddingBottom: bottomInset + spacing.lg,
      paddingLeft: spacing.xl,
      paddingRight: spacing.xl,
      paddingTop: spacing.md,
    });

    <view style={styles.root}>
      {showOverlay ? (
        <view
          style={styles.overlay}
          opacity={this.viewModel.overlayOpacity ?? 0.56}
          onTapDisabled={!overlayCanDismiss || Boolean(this.state.pendingAction)}
          onTap={this.handleOverlayTap}
        />
      ) : null}
      <view
        ref={this.sheetRef}
        style={surfaceStyle}
        onDragDisabled={!gesturesEnabled || Boolean(this.state.pendingAction)}
        onDrag={this.handleDrag}
      >
        {showHandle ? (
          <layout style={styles.handleContainer}>
            <view style={styles.handle} />
          </layout>
        ) : null}
        {showClose ? (
          <view style={styles.closeRow}>
            <view
              style={styles.closeButton}
              onTap={this.handleClose}
              onTapDisabled={Boolean(this.state.pendingAction)}
              accessibilityCategory="button"
              accessibilityLabel="Fermer la mise à jour des documents"
              accessibilityStateDisabled={Boolean(this.state.pendingAction)}
            >
              <image src={navigationIcons.cancel01} tint={colors.textPrimary} width={18} height={18} objectFit="contain" />
            </view>
          </view>
        ) : null}
        {scrollable ? (
          <scroll {...noBounceScrollAttributes} style={styles.bodyScroll} showsVerticalScrollIndicator={false}>
            {this.renderBody()}
          </scroll>
        ) : (
          <view style={styles.bodyStatic}>{this.renderBody()}</view>
        )}
        {this.viewModel.confirmationLabel && requiresAcceptance ? (
          <view
            style={styles.confirmationRow}
            onTap={this.handleConfirmationTap}
            onTapDisabled={Boolean(this.state.pendingAction)}
            accessibilityCategory="button"
            accessibilityLabel={`${this.viewModel.confirmationLabel} ${this.state.confirmationChecked ? 'coché' : 'non coché'}`}
            accessibilityStateDisabled={Boolean(this.state.pendingAction)}
          >
            <view style={this.state.confirmationChecked ? styles.checkboxSelected : styles.checkbox}>
              {this.state.confirmationChecked ? (
                <image src={navigationIcons.tick03Bold} tint={colors.textInverted} width={14} height={14} objectFit="contain" />
              ) : null}
            </view>
            <label value={transformText(this.viewModel.confirmationLabel, this.viewModel.textCase ?? 'none')} style={styles.confirmationLabel} numberOfLines={0} />
          </view>
        ) : null}
        <view style={styles.actions}>
          <DSButton
            title={primaryLabel}
            variant="cta"
            size="fullWidth"
            textCase="none"
            onTap={this.handlePrimary}
            disabled={primaryDisabled || this.isDismissing}
            loading={this.state.pendingAction === (requiresAcceptance ? 'accept' : 'acknowledge')}
            accessibilityLabel={primaryLabel}
          />
          {secondaryLabel ? (
            <DSButton
              title={secondaryLabel}
              variant="outline"
              size="fullWidth"
              textCase="none"
              onTap={this.handleDecline}
              disabled={Boolean(this.state.pendingAction) || (!canDismiss && !this.viewModel.onDecline) || this.isDismissing}
              loading={this.state.pendingAction === 'decline'}
              accessibilityLabel={secondaryLabel}
            />
          ) : null}
        </view>
      </view>
    </view>;
  }
}

const styles = {
  root: new Style<Layout>({ height: '100%', width: '100%' }),
  overlay: new Style<View>({ backgroundColor: colors.backgroundOverlay, bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }),
  handleContainer: new Style<Layout>({ alignItems: 'center', flexShrink: 0, height: 16, justifyContent: 'center', marginBottom: spacing.xs, width: '100%' }),
  handle: new Style<View>({ backgroundColor: colors.borderDefault, borderRadius: radius.full, height: 5, width: 48 }),
  closeRow: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', flexShrink: 0, justifyContent: 'flex-end', marginBottom: spacing.xs, width: '100%' }),
  closeButton: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: radius.full, height: 36, justifyContent: 'center', width: 36 }),
  bodyScroll: new Style<ScrollView>({ flexGrow: 1, flexShrink: 1, width: '100%' }),
  bodyStatic: new Style<View>({ flexGrow: 1, flexShrink: 1, width: '100%' }),
  bodyContent: new Style<View>({ flexDirection: 'column', flexGrow: 1, flexShrink: 0, paddingBottom: spacing.md, width: '100%' }),
  title: typography.title1.extend({ marginBottom: spacing.md, textAlign: 'center' }),
  effectiveDate: new Style<Label>({ color: colors.textSecondary, font: montserrat.semiBold(fontSize.metadata), marginBottom: spacing.md, textAlign: 'center' }),
  introduction: new Style<Label>({ color: colors.textPrimary, font: montserrat.regular(fontSize.body), lineHeight: 1.45, marginBottom: spacing.lg }),
  documentsSection: new Style<View>({ flexDirection: 'column', marginBottom: spacing.lg }),
  section: new Style<View>({ flexDirection: 'column', marginBottom: spacing.lg }),
  sectionTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.large), marginBottom: spacing.sm }),
  documentRow: new Style<View>({ alignItems: 'center', flexDirection: 'row', minHeight: 56, paddingBottom: spacing.sm, paddingTop: spacing.sm, width: '100%' }),
  documentDivider: new Style<View>({ backgroundColor: colors.borderDefault, bottom: 0, height: 1, left: 0, position: 'absolute', right: 0 }),
  documentCopy: new Style<View>({ flexDirection: 'column', flexGrow: 1, flexShrink: 1, marginRight: spacing.md }),
  documentTitle: new Style<Label>({ color: colors.interactivePrimary, font: montserrat.semiBold(fontSize.body), textDecoration: 'underline' }),
  documentMeta: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.tiny), marginTop: spacing.xs }),
  documentLink: new Style<Label>({ color: colors.interactivePrimary, flexShrink: 0, font: montserrat.semiBold(fontSize.metadata) }),
  changeRow: new Style<Layout>({ alignItems: 'flex-start', flexDirection: 'row', marginBottom: spacing.md, width: '100%' }),
  changeMarker: new Style<View>({ backgroundColor: colors.interactivePrimary, borderRadius: radius.full, flexShrink: 0, height: 7, marginRight: spacing.md, marginTop: 6, width: 7 }),
  changeCopy: new Style<View>({ flexDirection: 'column', flexGrow: 1, flexShrink: 1 }),
  changeTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.body), lineHeight: 1.35 }),
  changeDescription: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.metadata), lineHeight: 1.4, marginTop: spacing.xs }),
  longSection: new Style<View>({ flexDirection: 'column', marginBottom: spacing.lg }),
  bodyCopy: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.body), lineHeight: 1.45 }),
  footnote: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.tiny), marginTop: spacing.xs }),
  errorMessage: new Style<Label>({ color: colors.textDanger, font: montserrat.semiBold(fontSize.metadata), marginTop: spacing.md }),
  confirmationRow: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', flexShrink: 0, marginBottom: spacing.md, marginTop: spacing.sm, width: '100%' }),
  checkbox: new Style<View>({ alignItems: 'center', borderColor: colors.borderDefault, borderRadius: radius.xs, borderWidth: 1, flexShrink: 0, height: 22, justifyContent: 'center', marginRight: spacing.md, width: 22 }),
  checkboxSelected: new Style<View>({ alignItems: 'center', backgroundColor: colors.interactivePrimary, borderColor: colors.interactivePrimary, borderRadius: radius.xs, borderWidth: 1, flexShrink: 0, height: 22, justifyContent: 'center', marginRight: spacing.md, width: 22 }),
  confirmationLabel: new Style<Label>({ color: colors.textPrimary, flexGrow: 1, flexShrink: 1, font: montserrat.regular(fontSize.metadata), lineHeight: 1.35 }),
  actions: new Style<View>({ flexDirection: 'column', flexShrink: 0, width: '100%' }),
};
