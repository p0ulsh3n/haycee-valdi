import { Device } from 'valdi_core/src/Device';
import { createReusableCallback } from 'valdi_core/src/utils/Callback';
import { Style } from 'valdi_core/src/Style';
import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageStatefulComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { Label, Layout, ScrollView, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../../res/navigation-icons';
import { BottomSheetFooter, bottomSheetSurfaceStyle } from '../../design-system/components/BottomSheet';
import { RadioSelection } from '../../design-system/components/RadioSelection';
import { noBounceScrollAttributes } from '../../design-system/tokens/scrollBehavior';
import { colors } from '../../design-system/tokens/colors';
import { radius } from '../../design-system/tokens/radius';
import { spacing } from '../../design-system/tokens/spacing';
import { fontSize, montserrat } from '../../design-system/tokens/typography';

export interface SearchSheetOption {
  id: string;
  label: string;
}

export interface SearchOptionsSheetViewModel {
  title: string;
  options: SearchSheetOption[];
  selectedId: string;
  onApply: (id: string) => void;
}

interface SearchOptionsSheetState {
  selectedId: string;
}

/** Native Valdi bottom sheet for one-choice product search options. */
@NavigationPage(module)
export class SearchOptionsSheet extends NavigationPageStatefulComponent<SearchOptionsSheetViewModel, SearchOptionsSheetState> {
  state: SearchOptionsSheetState = { selectedId: '' };

  onCreate(): void {
    this.state = { selectedId: this.viewModel.selectedId };
  }

  private close = (): void => {
    this.navigationController.dismiss(true);
  };

  private selectOption = (id: string): void => {
    this.setState({ selectedId: id });
  };

  private applySelection = (): void => {
    this.viewModel.onApply(this.state.selectedId);
    this.close();
  };

  private renderOptions(): void {
    this.viewModel.options.map(option => (
      <RadioSelection
        key={option.id}
        label={option.label}
        selected={this.state.selectedId === option.id}
        onTap={createReusableCallback(() => this.selectOption(option.id))}
      />
    ));
  }

  onRender(): void {
    const bottomInset = Math.max(0, Device.getDisplayBottomInset());
    const requiredHeight = spacing.lg + 38 + spacing.md + this.viewModel.options.length * 50 + 56 + bottomInset + spacing.xl;
    const maxSheetHeight = Math.round(Device.getWindowHeight() * 0.78);
    const isOptionsScrollable = requiredHeight > maxSheetHeight;
    const sheetStyle = bottomSheetSurfaceStyle.extend({
      flexDirection: 'column',
      height: Math.min(requiredHeight, maxSheetHeight),
      paddingBottom: bottomInset + spacing.xl,
      paddingLeft: spacing.xl,
      paddingRight: spacing.xl,
      paddingTop: spacing.lg,
    });

    <layout style={styles.root}>
      <view style={sheetStyle}>
        <layout style={styles.header}>
          <label value={this.viewModel.title} style={styles.title} numberOfLines={1} />
          <view style={styles.closeButton} onTap={this.close} accessibilityCategory="button" accessibilityLabel="Fermer">
            <image src={navigationIcons.cancel01} tint={colors.textPrimary} width={18} height={18} objectFit="contain" />
          </view>
        </layout>
        {isOptionsScrollable ? (
          <scroll {...noBounceScrollAttributes} style={styles.optionsScroll} showsVerticalScrollIndicator={false}>
            {this.renderOptions()}
          </scroll>
        ) : (
          <view style={styles.optionsStatic}>{this.renderOptions()}</view>
        )}
        <BottomSheetFooter label="Appliquer" onTap={this.applySelection} background="transparent" />
      </view>
    </layout>;
  }
}

const styles = {
  root: new Style<Layout>({ height: '100%', width: '100%' }),
  header: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md }),
  title: new Style<Label>({ color: colors.textPrimary, flexGrow: 1, flexShrink: 1, font: montserrat.extraBold(fontSize.section), marginRight: spacing.md }),
  closeButton: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: radius.full, flexShrink: 0, height: 38, justifyContent: 'center', width: 38 }),
  optionsScroll: new Style<ScrollView>({ flexGrow: 1, flexShrink: 1 }),
  optionsStatic: new Style<View>({ flexDirection: 'column' }),
};
