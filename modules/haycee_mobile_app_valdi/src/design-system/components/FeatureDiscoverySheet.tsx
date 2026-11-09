import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageStatefulComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { MediaActionSheetContent, MediaActionSheetViewModel } from './MediaActionSheetContent';

/** Rare, contextual explanation of a capability, with optional hero media and actions. */
export interface FeatureDiscoverySheetViewModel extends MediaActionSheetViewModel {}

@NavigationPage(module)
export class FeatureDiscoverySheet extends NavigationPageStatefulComponent<FeatureDiscoverySheetViewModel, {}> {
  state = {};
  private isDismissing = false;

  private notifyDismiss = (): void => {
    if (this.isDismissing) return;
    this.isDismissing = true;
    try {
      this.viewModel.onDismiss?.();
    } catch (error) {
      console.warn('Feature discovery sheet onDismiss callback failed.', error);
    }
  };

  private dismiss = (): void => {
    this.notifyDismiss();
    this.navigationController.dismiss(true);
  };

  onDestroy(): void {
    this.notifyDismiss();
  }

  onRender(): void {
    <MediaActionSheetContent {...this.viewModel} dismiss={this.dismiss} />;
  }
}
