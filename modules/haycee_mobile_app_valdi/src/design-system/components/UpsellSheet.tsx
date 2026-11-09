import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageStatefulComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { MediaActionSheetContent, MediaActionSheetViewModel } from './MediaActionSheetContent';

/** Offer or plan-upgrade sheet; benefits, media, copy, and actions come from the caller. */
export interface UpsellSheetViewModel extends MediaActionSheetViewModel {}

@NavigationPage(module)
export class UpsellSheet extends NavigationPageStatefulComponent<UpsellSheetViewModel, {}> {
  state = {};
  private isDismissing = false;

  private notifyDismiss = (): void => {
    if (this.isDismissing) return;
    this.isDismissing = true;
    try {
      this.viewModel.onDismiss?.();
    } catch (error) {
      console.warn('Upsell sheet onDismiss callback failed.', error);
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
