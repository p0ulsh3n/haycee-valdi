import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { ImageFilters } from 'valdi_core/src/utils/ImageFilter';
import { View } from 'valdi_tsx/src/NativeTemplateElements';
import { colors } from '../../design-system/tokens/colors';
import { layout } from '../../design-system/tokens/spacing';

export interface ProfileCoverViewModel {
  backgroundColor?: string;
  imageUrl?: string;
  blurImage?: boolean;
  renderOverlay?: () => void;
}

/** Shared banner surface for personal profiles and seller storefronts. */
export class ProfileCover extends Component<ProfileCoverViewModel> {
  onRender(): void {
    const { backgroundColor = colors.backgroundSecondary, imageUrl, blurImage = false } = this.viewModel;

    <view style={styles.cover} backgroundColor={backgroundColor}>
      {imageUrl && blurImage ? (
        <image
          src={imageUrl}
          style={styles.coverImage}
          objectFit="cover"
          filter={ImageFilters.blur(14)}
        />
      ) : null}
      {imageUrl && !blurImage ? (
        <image src={imageUrl} style={styles.coverImage} objectFit="cover" />
      ) : null}
      <view style={styles.coverTint} />
      <view style={styles.coverBottomShade} />
      {this.viewModel.renderOverlay ? this.viewModel.renderOverlay() : null}
    </view>;
  }
}

const styles = {
  cover: new Style<View>({
    height: layout.profile.coverHeight,
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  }),
  coverImage: new Style<View>({
    height: '100%',
    left: 0,
    position: 'absolute',
    top: 0,
    width: '100%',
  }),
  coverTint: new Style<View>({
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    height: '100%',
    left: 0,
    position: 'absolute',
    top: 0,
    width: '100%',
  }),
  coverBottomShade: new Style<View>({
    background: 'linear-gradient(rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.42) 100%)',
    bottom: 0,
    height: layout.profile.coverShadeHeight,
    left: 0,
    position: 'absolute',
    width: '100%',
  }),
};
