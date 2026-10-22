import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { ContentSizeChangeEvent, ScrollEndEvent, ScrollEvent } from 'valdi_tsx/src/GestureEvents';
import { ElementFrame } from 'valdi_tsx/src/Geometry';
import { ScrollView } from 'valdi_tsx/src/NativeTemplateElements';
import { noBounceScrollAttributes } from '../tokens/scrollBehavior';

export interface SkeletonLoadingContainerViewModel {
  /** Keeps the page scroll locked while its skeleton is visible. */
  isLoading: boolean;
  /** Page content rendered inside the native scroll container. */
  children?: () => void;
  scrollStyle?: Style<ScrollView>;
  onScroll?: (event: ScrollEvent) => void;
  onScrollEnd?: (event: ScrollEndEvent) => void;
  onContentSizeChange?: (event: ContentSizeChangeEvent) => void;
  onLayout?: (frame: ElementFrame) => void;
  viewportExtensionBottom?: number;
}

/**
 * Shared page container for loading states.
 * The scroll lock is centralized here so every screen using the design-system
 * skeleton gets the same no-scroll loading behavior.
 */
export class SkeletonLoadingContainer extends Component<SkeletonLoadingContainerViewModel> {
  onRender(): void {
    <scroll
      {...noBounceScrollAttributes}
      style={this.viewModel.scrollStyle ?? styles.scroll}
      showsVerticalScrollIndicator={false}
      scrollEnabled={!this.viewModel.isLoading}
      onScroll={this.viewModel.onScroll}
      onScrollEnd={this.viewModel.onScrollEnd}
      onContentSizeChange={this.viewModel.onContentSizeChange}
      onLayout={this.viewModel.onLayout}
      viewportExtensionBottom={this.viewModel.viewportExtensionBottom}
    >
      {this.viewModel.children?.()}
    </scroll>;
  }
}

const styles = {
  scroll: new Style<ScrollView>({
    flexGrow: 1,
    flexShrink: 1,
  }),
};
