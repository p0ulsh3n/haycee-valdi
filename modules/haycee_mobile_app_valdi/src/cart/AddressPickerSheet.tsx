import { Device } from 'valdi_core/src/Device';
import { createReusableCallback } from 'valdi_core/src/utils/Callback';
import { Style } from 'valdi_core/src/Style';
import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageStatefulComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { Label, Layout, ScrollView, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../res/navigation-icons';
import { noBounceScrollAttributes } from '../design-system/tokens/scrollBehavior';
import { colors, palette } from '../design-system/tokens/colors';
import { radius } from '../design-system/tokens/radius';
import { spacing } from '../design-system/tokens/spacing';
import { fontSize, montserrat } from '../design-system/tokens/typography';

export interface AddressPickerSheetViewModel {
  selectedAddress?: string;
  onSave: (address: string) => void;
}

interface AddressPickerSheetState {
  selectedAddress?: string;
  choosingAddress: boolean;
}

const DEMO_PICKUP_LOCATIONS = [
  'Cocody, Rue des Jardins',
  'Plateau, Avenue Noguès',
  'Marcory, Boulevard Valéry Giscard d’Estaing',
];

/** Full-screen pickup-location selector; location rows intentionally show no ratings or reviews. */
@NavigationPage(module)
export class AddressPickerSheet extends NavigationPageStatefulComponent<AddressPickerSheetViewModel, AddressPickerSheetState> {
  state: AddressPickerSheetState = { selectedAddress: undefined, choosingAddress: false };

  onCreate(): void {
    this.state = {
      selectedAddress: this.viewModel.selectedAddress,
      choosingAddress: false,
    };
  }

  private close = (): void => this.navigationController.dismiss(true);

  private openLocationChoices = (): void => this.setState({ choosingAddress: true });

  private returnToAddress = (): void => this.setState({ choosingAddress: false });

  private selectLocation = (address: string): void => {
    this.setState({ selectedAddress: address, choosingAddress: false });
  };

  private save = (): void => {
    const address = this.state.selectedAddress;
    if (!address) return;
    this.viewModel.onSave(address);
    this.close();
  };

  private renderLocation(address: string): void {
    const selected = this.state.selectedAddress === address;
    <view
      key={address}
      style={selected ? styles.locationRowSelected : styles.locationRow}
      onTap={createReusableCallback(() => this.selectLocation(address))}
      accessibilityCategory="button"
      accessibilityStateSelected={selected}
    >
      <view style={selected ? styles.radioSelected : styles.radio}>
        {selected ? <view style={styles.radioDot} /> : null}
      </view>
      <label value={address} style={styles.locationLabel} numberOfLines={2} />
    </view>;
  }

  private renderMainContent(): void {
    <view style={styles.bodyContent}>
      <label value="Point relais" style={styles.sectionTitle} numberOfLines={1} />
      {this.state.selectedAddress ? (
        <view style={styles.addressGroup}>
          {this.renderLocation(this.state.selectedAddress)}
          <view style={styles.groupDivider} />
          {this.renderAddLocation()}
        </view>
      ) : (
        <view style={styles.addressGroup}>{this.renderAddLocation()}</view>
      )}
    </view>;
  }

  private renderAddLocation(): void {
    <view
      style={styles.addLocationRow}
      onTap={this.openLocationChoices}
      accessibilityCategory="button"
      accessibilityLabel="Ajouter un point relais"
    >
      <image src={navigationIcons.add01} tint={colors.textOnDarkSecondary} width={26} height={26} objectFit="contain" />
      <label value="Ajouter un point relais" style={styles.addLocationLabel} numberOfLines={1} />
    </view>;
  }

  private renderLocationChoices(): void {
    <view style={styles.bodyContent}>
      <view style={styles.choicesHeading}>
        <view style={styles.backButton} onTap={this.returnToAddress} accessibilityCategory="button" accessibilityLabel="Retour">
          <image src={navigationIcons.arrowLeft01Round} tint={colors.textInverted} width={20} height={20} objectFit="contain" />
        </view>
        <label value="Choisir un point relais" style={styles.sectionTitle} numberOfLines={1} />
      </view>
      <view style={styles.addressGroup}>
        {DEMO_PICKUP_LOCATIONS.map(address => this.renderLocation(address))}
      </view>
    </view>;
  }

  onRender(): void {
    const topInset = Math.max(0, Device.getDisplayTopInset());
    const bottomInset = Math.max(0, Device.getDisplayBottomInset());
    const hasAddress = Boolean(this.state.selectedAddress);

    <view style={styles.root}>
      <view style={styles.header.extend({ height: 58 + topInset, paddingTop: topInset + spacing.sm })}>
        <view style={styles.headerSide} />
        <label value="Livraison" style={styles.headerTitle} numberOfLines={1} />
        <view style={styles.closeButton} onTap={this.close} accessibilityCategory="button" accessibilityLabel="Fermer">
          <label value="Fermer" style={styles.closeLabel} numberOfLines={1} />
        </view>
      </view>
      <scroll {...noBounceScrollAttributes} style={styles.content} showsVerticalScrollIndicator={false}>
        {this.state.choosingAddress ? this.renderLocationChoices() : this.renderMainContent()}
      </scroll>
      <view style={styles.footer.extend({ paddingBottom: bottomInset + spacing.xl })}>
        <label
          value="La disponibilité des articles dépend de l’adresse sélectionnée"
          style={styles.footerNote}
          numberOfLines={2}
        />
        <view
          style={hasAddress ? styles.saveButton : styles.saveButtonDisabled}
          onTap={hasAddress ? this.save : undefined}
          accessibilityCategory="button"
          accessibilityLabel="Enregistrer l’adresse"
          accessibilityStateDisabled={!hasAddress}
        >
          <label value="Enregistrer" style={hasAddress ? styles.saveLabel : styles.saveLabelDisabled} numberOfLines={1} />
        </view>
      </view>
    </view>;
  }
}

const styles = {
  root: new Style<View>({ backgroundColor: colors.backgroundDark, flexDirection: 'column', flexGrow: 1, height: '100%', width: '100%' }),
  header: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundBrand, flexDirection: 'row', height: 58, justifyContent: 'space-between', paddingLeft: spacing.lg, paddingRight: spacing.lg, width: '100%' }),
  headerSide: new Style<View>({ width: 64 }),
  headerTitle: new Style<Label>({ color: colors.textInverted, flexGrow: 1, font: montserrat.extraBold(fontSize.section), textAlign: 'center' }),
  closeButton: new Style<View>({ alignItems: 'flex-end', justifyContent: 'center', width: 64 }),
  closeLabel: new Style<Label>({ color: colors.textInverted, font: montserrat.extraBold(fontSize.product) }),
  content: new Style<ScrollView>({ backgroundColor: colors.backgroundDark, flexGrow: 1, flexShrink: 1 }),
  bodyContent: new Style<View>({ flexDirection: 'column', paddingBottom: spacing.xl, paddingLeft: spacing.lg, paddingRight: spacing.lg, paddingTop: spacing.xl }),
  sectionTitle: new Style<Label>({ color: colors.textInverted, flexGrow: 1, flexShrink: 1, font: montserrat.extraBold(fontSize.product) }),
  addressGroup: new Style<View>({ backgroundColor: palette.gray900, borderRadius: radius.lg, flexDirection: 'column', marginTop: spacing.lg, width: '100%' }),
  locationRow: new Style<View>({ alignItems: 'center', flexDirection: 'row', minHeight: 64, paddingBottom: spacing.md, paddingLeft: spacing.lg, paddingRight: spacing.lg, paddingTop: spacing.md, width: '100%' }),
  locationRowSelected: new Style<View>({ alignItems: 'center', flexDirection: 'row', minHeight: 72, paddingBottom: spacing.md, paddingLeft: spacing.lg, paddingRight: spacing.lg, paddingTop: spacing.md, width: '100%' }),
  radio: new Style<View>({ alignItems: 'center', borderColor: palette.gray500, borderRadius: radius.full, borderWidth: 2, flexShrink: 0, height: 24, justifyContent: 'center', marginRight: spacing.md, width: 24 }),
  radioSelected: new Style<View>({ alignItems: 'center', borderColor: colors.backgroundBrand, borderRadius: radius.full, borderWidth: 2, flexShrink: 0, height: 24, justifyContent: 'center', marginRight: spacing.md, width: 24 }),
  radioDot: new Style<View>({ backgroundColor: colors.backgroundBrand, borderRadius: radius.full, height: 12, width: 12 }),
  locationLabel: new Style<Label>({ color: colors.textInverted, flexGrow: 1, flexShrink: 1, font: montserrat.semiBold(fontSize.product) }),
  groupDivider: new Style<View>({ backgroundColor: palette.gray800, height: 1, width: '100%' }),
  addLocationRow: new Style<View>({ alignItems: 'center', flexDirection: 'row', minHeight: 72, paddingBottom: spacing.md, paddingLeft: spacing.lg, paddingRight: spacing.lg, paddingTop: spacing.md, width: '100%' }),
  addLocationLabel: new Style<Label>({ color: colors.textInverted, flexGrow: 1, flexShrink: 1, font: montserrat.regular(fontSize.product), marginLeft: spacing.lg }),
  choicesHeading: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', marginBottom: spacing.sm }),
  backButton: new Style<View>({ alignItems: 'center', height: 36, justifyContent: 'center', marginRight: spacing.sm, width: 36 }),
  footer: new Style<View>({ backgroundColor: colors.backgroundDark, flexDirection: 'column', paddingLeft: spacing.lg, paddingRight: spacing.lg, paddingTop: spacing.md, width: '100%' }),
  footerNote: new Style<Label>({ alignSelf: 'center', color: colors.textOnDarkSecondary, font: montserrat.regular(fontSize.metadata), marginBottom: spacing.md, textAlign: 'center' }),
  saveButton: new Style<View>({ alignItems: 'center', backgroundColor: colors.buttonPrimary, borderRadius: radius.full, height: 56, justifyContent: 'center', width: '100%' }),
  saveButtonDisabled: new Style<View>({ alignItems: 'center', backgroundColor: palette.gray800, borderRadius: radius.full, height: 56, justifyContent: 'center', width: '100%' }),
  saveLabel: new Style<Label>({ color: colors.textInverted, font: montserrat.extraBold(fontSize.product) }),
  saveLabelDisabled: new Style<Label>({ color: palette.gray500, font: montserrat.extraBold(fontSize.product) }),
};
