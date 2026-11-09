import { AnimationCurve } from 'valdi_core/src/AnimationOptions';
import { StatefulComponent } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { Asset } from 'valdi_tsx/src/Asset';
import { View } from 'valdi_tsx/src/NativeTemplateElements';
import { DSButton } from './DSButton';
import { colors } from '../tokens/colors';
import { layout, spacing } from '../tokens/spacing';

export interface NewMessagesPillViewModel {
  count: number;
  visible: boolean;
  onTap: () => void;
  icon?: string | Asset;
}

interface NewMessagesPillState {
  opacity: number;
  translationY: number;
  displayCount: number;
}

/** Compact, animated action for returning to unread messages at the end of a feed. */
export class NewMessagesPill extends StatefulComponent<NewMessagesPillViewModel, NewMessagesPillState> {
  state: NewMessagesPillState = {
    opacity: 0,
    translationY: layout.live.viewer.newMessagesPillTransitionDistance,
    displayCount: 0,
  };

  onCreate(): void {
    if (this.viewModel.visible) {
      this.state = {
        opacity: 1,
        translationY: 0,
        displayCount: this.viewModel.count,
      };
    }
  }

  onViewModelUpdate(previous?: Readonly<NewMessagesPillViewModel>): void {
    if (!previous) return;
    if (previous.visible === this.viewModel.visible) {
      if (this.viewModel.visible && previous.count !== this.viewModel.count) {
        this.setState({ displayCount: this.viewModel.count });
      }
      return;
    }

    if (this.viewModel.visible) {
      void this.setStateAnimatedPromise(
        { opacity: 1, translationY: 0, displayCount: this.viewModel.count },
        {
          duration: layout.live.viewer.newMessagesPillEnterMilliseconds / 1000,
          curve: AnimationCurve.EaseOut,
          beginFromCurrentState: true,
        },
      );
      return;
    }

    void this.setStateAnimatedPromise(
      {
        opacity: 0,
        translationY: layout.live.viewer.newMessagesPillTransitionDistance,
      },
      {
        duration: layout.live.viewer.newMessagesPillExitMilliseconds / 1000,
        curve: AnimationCurve.EaseInOut,
        beginFromCurrentState: true,
      },
    );
  }

  private handleTap = (): void => {
    if (!this.viewModel.visible || this.viewModel.count <= 0) return;
    this.viewModel.onTap();
  };

  onRender(): void {
    const count = this.state.displayCount;
    const countLabel = count > 99 ? '99+' : `${count}`;
    const messageLabel = count === 1 ? '1 nouveau message' : `${countLabel} nouveaux messages`;
    <view style={styles.position} opacity={this.state.opacity} translationY={this.state.translationY}>
      <DSButton
        title={messageLabel}
        accessibilityLabel={`${count} nouveau${count === 1 ? '' : 'x'} message${count === 1 ? '' : 's'}. Revenir aux messages les plus récents.`}
        onTap={this.handleTap}
        variant="black"
        size="compact"
        width={layout.live.viewer.newMessagesPillWidth}
        height={layout.live.viewer.newMessagesPillHeight}
        surfaceColor={colors.liveUnreadCountSurface}
        labelColor={colors.textInverted}
        icon={this.viewModel.icon}
        iconSize={layout.live.viewer.newMessagesPillIconSize}
        iconTint={colors.textInverted}
        iconAlignment="fixedLeading"
        labelTranslationY={-2}
        textCase="none"
        interactionDisabled={!this.viewModel.visible}
      />
    </view>;
  }
}

const styles = {
  position: new Style<View>({
    bottom: spacing.sm,
    position: 'absolute',
    right: spacing.md,
  }),
};
