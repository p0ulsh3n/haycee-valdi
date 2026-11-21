import { Device } from 'valdi_core/src/Device';
import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageStatefulComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { Style } from 'valdi_core/src/Style';
import { Asset } from 'valdi_tsx/src/Asset';
import { EditTextEvent, Label, Layout, ScrollView, TextField, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../res/navigation-icons';
import { DSButton, DSSwitch, Hairline, RadioSelection, TransientFeedback } from '../design-system/index';
import { colors } from '../design-system/tokens/colors';
import { noBounceScrollAttributes } from '../design-system/tokens/scrollBehavior';
import { radius } from '../design-system/tokens/radius';
import { layout, spacing } from '../design-system/tokens/spacing';
import { fontSize, montserrat } from '../design-system/tokens/typography';
import type { ProfileSettingsValues, SettingsDestinationKind, SettingsLanguage } from './data/ProfileSettingsData';
import { DEFAULT_PROFILE_SETTINGS } from './data/ProfileSettingsData';

export interface ProfileSettingsDestinationScreenViewModel {
  kind: SettingsDestinationKind;
  values: ProfileSettingsValues;
  onSave: (values: ProfileSettingsValues) => void;
}

interface ProfileSettingsDestinationState {
  values: ProfileSettingsValues;
}

const DESTINATION_TITLES: Record<SettingsDestinationKind, string> = {
  'personal-info': 'Mes informations personnelles',
  security: 'Sécurité et connexion',
  notifications: 'Préférences de notification',
  language: 'Langue',
  appearance: 'Apparence',
  privacy: 'Confidentialité et informations légales',
};

const LANGUAGE_OPTIONS: Array<{ code: SettingsLanguage; label: string }> = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
];

/** The six navigable Settings pages. Logout is confirmed from the Settings home. */
@NavigationPage(module)
export class ProfileSettingsDestinationScreen extends NavigationPageStatefulComponent<ProfileSettingsDestinationScreenViewModel, ProfileSettingsDestinationState> {
  state: ProfileSettingsDestinationState = { values: { ...DEFAULT_PROFILE_SETTINGS } };
  private isClosing = false;

  onCreate(): void {
    this.state = { values: { ...this.viewModel.values } };
  }

  private close = (): void => {
    if (this.isClosing) return;
    this.isClosing = true;
    this.navigationController.pop();
  };

  private updateValue<K extends keyof ProfileSettingsValues>(key: K, value: ProfileSettingsValues[K]): void {
    this.setState({ values: { ...this.state.values, [key]: value } });
  }

  private handleTextChange = (key: 'displayName' | 'email' | 'phone', event: EditTextEvent): void => {
    this.updateValue(key, event.text);
  };

  private save = (): void => {
    if (this.isClosing) return;
    this.viewModel.onSave({ ...this.state.values });
    this.isClosing = true;
    TransientFeedback.show({ message: 'Préférences enregistrées pour cette session.' });
    this.navigationController.pop();
  };

  private renderField(title: string, value: string, placeholder: string, onChange: (event: EditTextEvent) => void, capitalization: 'none' | 'sentences' = 'none'): void {
    <layout style={styles.fieldGroup}>
      <label value={title} style={styles.fieldLabel} numberOfLines={1} />
      <view style={styles.textFieldSurface}>
        <textfield
          style={styles.textField}
          value={value}
          placeholder={placeholder}
          placeholderColor={colors.textTertiary}
          autocorrection="none"
          autocapitalization={capitalization}
          onChange={onChange}
        />
      </view>
    </layout>;
  }

  private renderPersonalInfo(): void {
    <view style={styles.pageContent}>
      {this.renderField('Nom affiché', this.state.values.displayName, 'Votre nom', event => this.handleTextChange('displayName', event), 'sentences')}
      {this.renderField('Adresse e-mail', this.state.values.email, 'nom@exemple.com', event => this.handleTextChange('email', event))}
      {this.renderField('Téléphone', this.state.values.phone, 'Votre numéro de téléphone', event => this.handleTextChange('phone', event))}
      <view style={styles.infoPanel}>
        <image src={navigationIcons.informationCircle} tint={colors.textSecondary} width={18} height={18} objectFit="contain" />
        <label value="Ces informations seront enregistrées dans cette session. La synchronisation avec votre compte sera ajoutée avec le service de profil." style={styles.infoText} numberOfLines={0} />
      </view>
    </view>;
  }

  private renderSecurity(): void {
    const values = this.state.values;
    <view style={styles.pageContent}>
      <label value="Connexion au compte" style={styles.sectionTitle} numberOfLines={1} />
      <view style={styles.preferenceGroup}>
        {this.renderSwitchRow('Connexion biométrique', 'Utiliser l’empreinte ou la reconnaissance faciale', values.biometricEnabled, () => this.updateValue('biometricEnabled', !values.biometricEnabled), navigationIcons.fingerprintScan)}
        <Hairline color={colors.borderDefault} />
        {this.renderSwitchRow('Vérification en deux étapes', 'Ajouter une étape de sécurité à la connexion', values.twoFactorEnabled, () => this.updateValue('twoFactorEnabled', !values.twoFactorEnabled), navigationIcons.security)}
      </view>

      <label value="Sécurité du Wallet" style={styles.sectionTitle} numberOfLines={1} />
      <view style={styles.walletPinCard}>
        <view style={styles.rowIcon}>
          <image src={navigationIcons.lockPassword} tint={colors.iconDefault} width={20} height={20} objectFit="contain" />
        </view>
        <layout style={styles.rowCopy}>
          <label value="Code Wallet" style={styles.rowTitle} numberOfLines={1} />
          <label value="Protégez les actions sensibles de votre portefeuille." style={styles.rowDescription} numberOfLines={2} />
        </layout>
      </view>
      <DSButton
        title="Modifier le code Wallet"
        variant="outline"
        size="fullWidth"
        textCase="none"
        icon={navigationIcons.resetPassword}
        iconSize={18}
        onTap={() => TransientFeedback.show({ message: 'La gestion du code Wallet sera activée avec le service de sécurité.' })}
      />
      <view style={styles.infoPanel}>
        <image src={navigationIcons.informationCircle} tint={colors.textSecondary} width={18} height={18} objectFit="contain" />
        <label value="Les commandes biométriques et la vérification en deux étapes sont enregistrées dans cette session de démonstration." style={styles.infoText} numberOfLines={0} />
      </view>
    </view>;
  }

  private renderNotifications(): void {
    const values = this.state.values;
    const pushEnabled = values.notificationPush;
    <view style={styles.pageContent}>
      <label value="Notifications push" style={styles.sectionTitle} numberOfLines={1} />
      <view style={styles.preferenceGroup}>
        {this.renderSwitchRow('Activer les notifications push', 'Autoriser les alertes sur cet appareil', pushEnabled, () => this.updateValue('notificationPush', !pushEnabled), navigationIcons.notification01)}
        <Hairline color={colors.borderDefault} />
        {this.renderSwitchRow('Commandes', 'Préparation, expédition et livraison', values.notificationOrders, () => this.updateValue('notificationOrders', !values.notificationOrders), navigationIcons.package, !pushEnabled)}
        <Hairline color={colors.borderDefault} />
        {this.renderSwitchRow('Lives', 'Rappels et nouveautés des vendeurs suivis', values.notificationLives, () => this.updateValue('notificationLives', !values.notificationLives), navigationIcons.live, !pushEnabled)}
        <Hairline color={colors.borderDefault} />
        {this.renderSwitchRow('Messages', 'Nouveaux messages et réponses', values.notificationMessages, () => this.updateValue('notificationMessages', !values.notificationMessages), navigationIcons.message02, !pushEnabled)}
        <Hairline color={colors.borderDefault} />
        {this.renderSwitchRow('Promotions', 'Offres et sélections personnalisées', values.notificationPromotions, () => this.updateValue('notificationPromotions', !values.notificationPromotions), navigationIcons.discount, !pushEnabled)}
      </view>

      <label value="Autres canaux" style={styles.sectionTitle} numberOfLines={1} />
      <view style={styles.preferenceGroup}>
        {this.renderSwitchRow('E-mail', 'Recevoir les informations importantes par e-mail', values.notificationEmail, () => this.updateValue('notificationEmail', !values.notificationEmail), navigationIcons.sent)}
        <Hairline color={colors.borderDefault} />
        {this.renderSwitchRow('SMS', 'Recevoir les alertes essentielles par SMS', values.notificationSms, () => this.updateValue('notificationSms', !values.notificationSms), navigationIcons.smsCode)}
      </view>
    </view>;
  }

  private renderLanguage(): void {
    <view style={styles.pageContent}>
      <label value="Choisir la langue de l’application" style={styles.pageLead} numberOfLines={0} />
      <view style={styles.preferenceGroup}>
        {LANGUAGE_OPTIONS.map((option, index) => (
          <view key={option.code}>
            <RadioSelection
              label={option.label}
              selected={this.state.values.language === option.code}
              onTap={() => this.updateValue('language', option.code)}
              accessibilityLabel={`Langue ${option.label}`}
            />
            {index < LANGUAGE_OPTIONS.length - 1 ? <Hairline color={colors.borderDefault} /> : null}
          </view>
        ))}
      </view>
      <view style={styles.infoPanel}>
        <image src={navigationIcons.informationCircle} tint={colors.textSecondary} width={18} height={18} objectFit="contain" />
        <label value="Le choix est conservé pour cette session. La traduction complète de l’application sera raccordée ensuite." style={styles.infoText} numberOfLines={0} />
      </view>
    </view>;
  }

  private renderAppearance(): void {
    const isDarkSelected = this.state.values.appearance === 'dark';
    <view style={styles.pageContent}>
      <label value="Thème de l’application" style={styles.pageLead} numberOfLines={0} />
      <view style={styles.preferenceGroup}>
        <RadioSelection label="Clair" selected={!isDarkSelected} onTap={() => this.updateValue('appearance', 'light')} accessibilityLabel="Thème clair" />
        <Hairline color={colors.borderDefault} />
        <RadioSelection label="Sombre" selected={isDarkSelected} onTap={() => this.updateValue('appearance', 'dark')} accessibilityLabel="Thème sombre" />
      </view>
      <view style={styles.previewCard}>
        <view style={styles.previewLight}>
          <label value="Aperçu clair" style={styles.previewLabelDark} numberOfLines={1} />
        </view>
        <view style={styles.previewDark}>
          <label value="Aperçu sombre" style={styles.previewLabelLight} numberOfLines={1} />
        </view>
      </view>
      <view style={styles.infoPanel}>
        <image src={navigationIcons.informationCircle} tint={colors.textSecondary} width={18} height={18} objectFit="contain" />
        <label value="Le choix du thème est mémorisé dans cette session. L’application utilise encore sa palette claire sur les autres écrans." style={styles.infoText} numberOfLines={0} />
      </view>
    </view>;
  }

  private renderPrivacy(): void {
    <view style={styles.pageContent}>
      <view style={styles.legalIntro}>
        <view style={styles.legalIcon}>
          <image src={navigationIcons.agreement01} tint={colors.iconDefault} width={24} height={24} objectFit="contain" />
        </view>
        <label value="Vos informations et vos droits" style={styles.legalTitle} numberOfLines={2} />
        <label value="Retrouvez ici les documents qui encadrent l’utilisation de Haycee et la protection de vos données." style={styles.legalDescription} numberOfLines={0} />
      </view>
      <view style={styles.preferenceGroup}>
        {this.renderLegalRow('Conditions d’utilisation', 'Règles d’utilisation des services Haycee', navigationIcons.file02)}
        <Hairline color={colors.borderDefault} />
        {this.renderLegalRow('Politique de confidentialité', 'Collecte, utilisation et gestion de vos données', navigationIcons.security)}
      </view>
      <view style={styles.infoPanel}>
        <image src={navigationIcons.informationCircle} tint={colors.textSecondary} width={18} height={18} objectFit="contain" />
        <label value="Les textes officiels et les liens vers les documents seront ajoutés ici avant leur publication." style={styles.infoText} numberOfLines={0} />
      </view>
    </view>;
  }

  private renderSwitchRow(title: string, description: string, selected: boolean, onTap: () => void, icon: Asset, disabled = false): void {
    <view style={styles.preferenceRow}>
      <view style={styles.rowIcon}>
        <image src={icon} tint={colors.iconDefault} width={19} height={19} objectFit="contain" />
      </view>
      <layout style={styles.rowCopy}>
        <label value={title} style={styles.rowTitle} numberOfLines={1} />
        <label value={description} style={styles.rowDescription} numberOfLines={2} />
      </layout>
      <DSSwitch label={title} selected={selected} disabled={disabled} onTap={onTap} />
    </view>;
  }

  private renderLegalRow(title: string, description: string, icon: Asset): void {
    <view
      style={styles.legalRow}
      onTap={() => TransientFeedback.show({ message: 'Le document officiel sera ajouté ici avant publication.' })}
      accessibilityCategory="button"
      accessibilityLabel={`Consulter ${title}`}
    >
      <view style={styles.rowIcon}>
        <image src={icon} tint={colors.iconDefault} width={19} height={19} objectFit="contain" />
      </view>
      <layout style={styles.rowCopy}>
        <label value={title} style={styles.rowTitle} numberOfLines={1} />
        <label value={description} style={styles.rowDescription} numberOfLines={2} />
      </layout>
      <image src={navigationIcons.arrowRight01Round} tint={colors.textTertiary} width={18} height={18} objectFit="contain" />
    </view>;
  }

  private renderContent(): void {
    switch (this.viewModel.kind) {
      case 'personal-info': return this.renderPersonalInfo();
      case 'security': return this.renderSecurity();
      case 'notifications': return this.renderNotifications();
      case 'language': return this.renderLanguage();
      case 'appearance': return this.renderAppearance();
      case 'privacy': return this.renderPrivacy();
    }
  }

  onRender(): void {
    const topInset = Math.max(0, Device.getDisplayTopInset());
    const bottomInset = Math.max(0, Device.getDisplayBottomInset());
    const hasFooter = this.viewModel.kind === 'personal-info' || this.viewModel.kind === 'security' || this.viewModel.kind === 'notifications' || this.viewModel.kind === 'language' || this.viewModel.kind === 'appearance';

    <view style={styles.root}>
      <layout style={styles.header.extend({ paddingTop: topInset + spacing.sm })}>
        <view style={styles.headerAction} onTap={this.close} accessibilityCategory="button" accessibilityLabel="Retour aux paramètres">
          <image src={navigationIcons.arrowLeft01Round} tint={colors.iconDefault} width={22} height={22} objectFit="contain" />
        </view>
        <label value={DESTINATION_TITLES[this.viewModel.kind]} style={styles.headerTitle} numberOfLines={1} accessibilityCategory="header" />
        <view style={styles.headerSpacer} />
      </layout>
      <scroll {...noBounceScrollAttributes} style={styles.scroll} showsVerticalScrollIndicator={false}>
        <view style={styles.body.extend({ paddingBottom: hasFooter ? spacing.xl : bottomInset + spacing.xxxl })}>
          {this.renderContent()}
        </view>
      </scroll>
      {hasFooter ? (
        <view style={styles.footer.extend({ paddingBottom: bottomInset + spacing.sm })}>
          <Hairline color={colors.borderDefault} />
          <DSButton
            title={this.viewModel.kind === 'personal-info' ? 'Enregistrer les informations' : 'Enregistrer les préférences'}
            variant="cta"
            size="fullWidth"
            height={layout.settings.footerButtonHeight}
            textCase="none"
            onTap={this.save}
          />
        </view>
      ) : null}
    </view>;
  }
}

const styles = {
  root: new Style<View>({ backgroundColor: colors.backgroundPrimary, flexDirection: 'column', flexGrow: 1, flexShrink: 1 }),
  header: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', height: layout.settings.headerHeight, justifyContent: 'space-between', paddingLeft: spacing.lg, paddingRight: spacing.lg, width: '100%' }),
  headerAction: new Style<View>({ alignItems: 'center', borderRadius: radius.full, height: 40, justifyContent: 'center', width: 40 }),
  headerSpacer: new Style<View>({ height: 40, width: 40 }),
  headerTitle: new Style<Label>({ color: colors.textPrimary, flexGrow: 1, font: montserrat.extraBold(fontSize.page), textAlign: 'center' }),
  scroll: new Style<ScrollView>({ backgroundColor: colors.backgroundPrimary, flexGrow: 1, flexShrink: 1 }),
  body: new Style<View>({ flexDirection: 'column', paddingTop: spacing.lg, width: '100%' }),
  pageContent: new Style<View>({ flexDirection: 'column', paddingLeft: spacing.lg, paddingRight: spacing.lg, width: '100%' }),
  fieldGroup: new Style<Layout>({ flexDirection: 'column', marginBottom: spacing.lg, width: '100%' }),
  fieldLabel: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.metadata), marginBottom: spacing.xs }),
  textFieldSurface: new Style<View>({ backgroundColor: colors.backgroundSecondary, borderRadius: radius.sm, height: layout.settings.inputHeight, justifyContent: 'center', paddingLeft: spacing.md, paddingRight: spacing.md, width: '100%' }),
  textField: new Style<TextField>({ color: colors.textPrimary, font: montserrat.regular(fontSize.body), height: layout.settings.inputHeight, width: '100%' }),
  sectionTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.large), marginBottom: spacing.sm, marginTop: spacing.lg }),
  pageLead: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.product), marginBottom: spacing.md }),
  preferenceGroup: new Style<View>({ backgroundColor: colors.backgroundSecondary, borderRadius: radius.md, flexDirection: 'column', paddingLeft: spacing.md, paddingRight: spacing.md, width: '100%' }),
  preferenceRow: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', minHeight: layout.settings.rowHeight, paddingBottom: spacing.sm, paddingTop: spacing.sm, width: '100%' }),
  rowIcon: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundPrimary, borderRadius: radius.sm, flexShrink: 0, height: 40, justifyContent: 'center', width: 40 }),
  rowCopy: new Style<Layout>({ flexDirection: 'column', flexGrow: 1, flexShrink: 1, marginLeft: spacing.sm, marginRight: spacing.sm, minWidth: 0 }),
  rowTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.metadata) }),
  rowDescription: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.tiny), marginTop: spacing.xs }),
  infoPanel: new Style<View>({ alignItems: 'flex-start', backgroundColor: colors.backgroundSecondary, borderRadius: radius.sm, flexDirection: 'row', marginTop: spacing.lg, padding: spacing.md, width: '100%' }),
  infoText: new Style<Label>({ color: colors.textSecondary, flexGrow: 1, flexShrink: 1, font: montserrat.regular(fontSize.tiny), marginLeft: spacing.sm }),
  walletPinCard: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: radius.md, flexDirection: 'row', marginBottom: spacing.md, padding: spacing.md, width: '100%' }),
  legalIntro: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: radius.lg, flexDirection: 'column', marginBottom: spacing.lg, padding: spacing.xl, width: '100%' }),
  legalIcon: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundPrimary, borderRadius: radius.full, height: 56, justifyContent: 'center', marginBottom: spacing.md, width: 56 }),
  legalTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.section), textAlign: 'center' }),
  legalDescription: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.product), marginTop: spacing.sm, textAlign: 'center' }),
  legalRow: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', minHeight: layout.settings.rowHeight, paddingBottom: spacing.sm, paddingTop: spacing.sm, width: '100%' }),
  previewCard: new Style<Layout>({ flexDirection: 'row', marginTop: spacing.lg, width: '100%' }),
  previewLight: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundPrimary, borderColor: colors.borderDefault, borderRadius: radius.md, borderWidth: 1, flexGrow: 1, height: 72, justifyContent: 'center', marginRight: spacing.xs }),
  previewDark: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundDarkElevated, borderRadius: radius.md, flexGrow: 1, height: 72, justifyContent: 'center', marginLeft: spacing.xs }),
  previewLabelDark: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.metadata) }),
  previewLabelLight: new Style<Label>({ color: colors.textInverted, font: montserrat.semiBold(fontSize.metadata) }),
  footer: new Style<View>({ backgroundColor: colors.backgroundPrimary, flexShrink: 0, paddingLeft: spacing.lg, paddingRight: spacing.lg, paddingTop: spacing.sm, width: '100%' }),
};
