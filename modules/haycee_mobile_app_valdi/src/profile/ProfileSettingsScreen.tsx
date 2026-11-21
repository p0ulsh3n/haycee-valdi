import { Device } from 'valdi_core/src/Device';
import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageStatefulComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { Style } from 'valdi_core/src/Style';
import { Label, Layout, ScrollView, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../res/navigation-icons';
import { ProfileAccountMenu } from './components/ProfileAccountMenu';
import type { ProfileAccountMenuItem } from './components/ProfileAccountMenu';
import type { SettingsDestinationKind } from './data/ProfileSettingsData';
import type { ProfileSettingsValues } from './data/ProfileSettingsData';
import { DEFAULT_PROFILE_SETTINGS } from './data/ProfileSettingsData';
import { colors } from '../design-system/tokens/colors';
import { noBounceScrollAttributes } from '../design-system/tokens/scrollBehavior';
import { radius } from '../design-system/tokens/radius';
import { layout, spacing } from '../design-system/tokens/spacing';
import { fontSize, montserrat } from '../design-system/tokens/typography';

export interface ProfileSettingsScreenViewModel {
  values: ProfileSettingsValues;
  onNavigate: (destination: SettingsDestinationKind, onValuesUpdated: (values: ProfileSettingsValues) => void) => void;
  onLogout: () => void;
}

interface ProfileSettingsScreenState {
  values: ProfileSettingsValues;
}

/** Settings home opened from the profile toolbar; rows are grouped by purpose. */
@NavigationPage(module)
export class ProfileSettingsScreen extends NavigationPageStatefulComponent<ProfileSettingsScreenViewModel, ProfileSettingsScreenState> {
  state: ProfileSettingsScreenState = { values: { ...DEFAULT_PROFILE_SETTINGS } };
  private isClosing = false;

  onCreate(): void {
    this.state = { values: { ...this.viewModel.values } };
  }

  private close = (): void => {
    if (this.isClosing) return;
    this.isClosing = true;
    this.navigationController.pop();
  };

  private openDestination = (destination: SettingsDestinationKind): void => {
    this.viewModel.onNavigate(destination, values => this.setState({ values: { ...values } }));
  };

  private itemsForGroup(ids: string[]): ProfileAccountMenuItem[] {
    const items: Record<string, ProfileAccountMenuItem> = {
      'personal-info': { id: 'personal-info', title: 'Mes informations personnelles', icon: navigationIcons.profileUser, detail: 'Nom, e-mail, téléphone', onTap: () => this.openDestination('personal-info') },
      security: { id: 'security', title: 'Sécurité et connexion', icon: navigationIcons.security, detail: 'Biométrie, vérification, Wallet', onTap: () => this.openDestination('security') },
      notifications: { id: 'notifications', title: 'Préférences de notification', icon: navigationIcons.notification01, detail: 'Push, e-mail et SMS', onTap: () => this.openDestination('notifications') },
      language: { id: 'language', title: 'Langue', icon: navigationIcons.maps, detail: this.languageLabel(), onTap: () => this.openDestination('language') },
      appearance: { id: 'appearance', title: 'Apparence', icon: navigationIcons.preferenceHorizontal, detail: this.state.values.appearance === 'dark' ? 'Thème sombre' : 'Thème clair', onTap: () => this.openDestination('appearance') },
      privacy: { id: 'privacy', title: 'Confidentialité et informations légales', icon: navigationIcons.agreement01, detail: 'Conditions et confidentialité', onTap: () => this.openDestination('privacy') },
      logout: { id: 'logout', title: 'Se déconnecter', icon: navigationIcons.userSwitch, tone: 'danger', onTap: this.viewModel.onLogout },
    };
    return ids.map(id => items[id]);
  }

  private languageLabel(): string {
    switch (this.state.values.language) {
      case 'en': return 'English';
      case 'es': return 'Español';
      case 'pt': return 'Português';
      default: return 'Français';
    }
  }

  private renderGroup(title: string, ids: string[]): void {
    <view style={styles.groupSection}>
      <label value={title} style={styles.sectionTitle} numberOfLines={1} />
      <view style={styles.groupSurface}>
        <ProfileAccountMenu items={this.itemsForGroup(ids)} />
      </view>
    </view>;
  }

  onRender(): void {
    const topInset = Math.max(0, Device.getDisplayTopInset());
    const bottomInset = Math.max(0, Device.getDisplayBottomInset());

    <view style={styles.root}>
      <layout style={styles.header.extend({ paddingTop: topInset + spacing.sm })}>
        <view style={styles.headerAction} onTap={this.close} accessibilityCategory="button" accessibilityLabel="Retour au profil">
          <image src={navigationIcons.arrowLeft01Round} tint={colors.iconDefault} width={22} height={22} objectFit="contain" />
        </view>
        <label value="Paramètres" style={styles.headerTitle} numberOfLines={1} accessibilityCategory="header" />
        <view style={styles.headerSpacer} />
      </layout>
      <scroll {...noBounceScrollAttributes} style={styles.scroll} showsVerticalScrollIndicator={false}>
        <layout style={styles.content.extend({ paddingBottom: bottomInset + spacing.xl })}>
          {this.renderGroup('Compte', ['personal-info', 'security'])}
          {this.renderGroup('Préférences', ['notifications', 'language', 'appearance'])}
          {this.renderGroup('Confidentialité', ['privacy'])}
          {this.renderGroup('Session', ['logout'])}
        </layout>
      </scroll>
    </view>;
  }
}

const styles = {
  root: new Style<View>({ backgroundColor: colors.backgroundPrimary, flexDirection: 'column', flexGrow: 1, flexShrink: 1 }),
  header: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', height: layout.settings.headerHeight, justifyContent: 'space-between', paddingLeft: spacing.lg, paddingRight: spacing.lg, width: '100%' }),
  headerAction: new Style<View>({ alignItems: 'center', borderRadius: radius.full, height: 40, justifyContent: 'center', width: 40 }),
  headerSpacer: new Style<View>({ height: 40, width: 40 }),
  headerTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.page), textAlign: 'center' }),
  scroll: new Style<ScrollView>({ backgroundColor: colors.backgroundPrimary, flexGrow: 1, flexShrink: 1 }),
  content: new Style<Layout>({ flexDirection: 'column', paddingLeft: spacing.lg, paddingRight: spacing.lg, paddingTop: spacing.md, width: '100%' }),
  groupSection: new Style<View>({ flexDirection: 'column', marginBottom: layout.settings.sectionGap, width: '100%' }),
  sectionTitle: new Style<Label>({ color: colors.textSecondary, font: montserrat.semiBold(fontSize.metadata), marginBottom: spacing.sm, marginLeft: spacing.xs }),
  groupSurface: new Style<View>({ backgroundColor: colors.backgroundSecondary, borderRadius: radius.md, flexDirection: 'column', paddingBottom: spacing.xs, paddingTop: spacing.xs, width: '100%' }),
};
