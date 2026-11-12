import { Device } from 'valdi_core/src/Device';
import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { createReusableCallback } from 'valdi_core/src/utils/Callback';
import { Label, Layout, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../../res/navigation-icons';
import { colors } from '../../design-system/tokens/colors';
import { layout, spacing } from '../../design-system/tokens/spacing';
import { fontSize, montserrat } from '../../design-system/tokens/typography';
import type { SellerVideoPreview } from '../data/SellerStorefrontData';

export interface SellerVideoGridViewModel {
  videos: SellerVideoPreview[];
  onVideoTap?: (index: number) => void;
}

/** Three-column seller short-video gallery, sized to the current device viewport. */
export class SellerVideoGrid extends Component<SellerVideoGridViewModel> {
  private videoRows: SellerVideoPreview[][] = [];

  onCreate(): void {
    this.videoRows = this.makeRows(this.viewModel.videos);
  }

  onViewModelUpdate(previous?: SellerVideoGridViewModel): void {
    if (previous?.videos !== this.viewModel.videos) {
      this.videoRows = this.makeRows(this.viewModel.videos);
    }
  }

  private makeRows(videos: SellerVideoPreview[]): SellerVideoPreview[][] {
    const columns = layout.seller.videos.columns;
    const rows: SellerVideoPreview[][] = [];
    for (let index = 0; index < videos.length; index += columns) {
      rows.push(videos.slice(index, index + columns));
    }
    return rows;
  }

  private renderTile(video: SellerVideoPreview, index: number, tileWidth: number, tileHeight: number, rightGap: number): void {
    <view
      key={video.id}
      style={styles.poster.extend({
        backgroundColor: video.color,
        height: tileHeight,
        marginRight: rightGap,
        width: tileWidth,
      })}
      onTap={createReusableCallback(() => this.viewModel.onVideoTap?.(index))}
      accessibilityCategory="button"
      accessibilityLabel={video.title}
    >
      {video.thumbnailUrl ? (
        <image
          src={video.thumbnailUrl}
          style={styles.posterImage}
          objectFit={video.thumbnailFit ?? 'cover'}
        />
      ) : null}
      <view style={styles.viewCount}>
        <image src={navigationIcons.playBold} tint={colors.textInverted} width={12} height={12} objectFit="contain" />
        <label value={video.viewCountLabel} style={styles.viewCountLabel} numberOfLines={1} />
      </view>
    </view>;
  }

  onRender(): void {
    const config = layout.seller.videos;
    const columns = config.columns;
    const viewportWidth = Device.getWindowWidth();
    const gridWidth = viewportWidth - config.horizontalPadding * 2;
    const tileWidth = (gridWidth - config.columnGap * (columns - 1)) / columns;
    const tileHeight = tileWidth / config.posterAspectRatio;

    <layout style={styles.grid.extend({
      paddingLeft: config.horizontalPadding,
      paddingRight: config.horizontalPadding,
    })}>
      {this.videoRows.map((row, rowIndex) => (
        <layout key={`seller-video-row-${row[0]?.id ?? rowIndex}`} style={styles.row.extend({
          marginBottom: rowIndex < this.videoRows.length - 1 ? config.rowGap : 0,
        })}>
          {row.map((video, columnIndex) => (
            this.renderTile(
              video,
              rowIndex * columns + columnIndex,
              tileWidth,
              tileHeight,
              columnIndex < row.length - 1 ? config.columnGap : 0,
            )
          ))}
        </layout>
      ))}
    </layout>;
  }
}

const styles = {
  grid: new Style<Layout>({
    flexDirection: 'column',
    paddingBottom: spacing.xxxxl,
    width: '100%',
  }),
  row: new Style<Layout>({
    alignItems: 'flex-start',
    flexDirection: 'row',
    width: '100%',
  }),
  poster: new Style<View>({
    position: 'relative',
  }),
  posterImage: new Style<View>({
    height: '100%',
    left: 0,
    position: 'absolute',
    top: 0,
    width: '100%',
  }),
  viewCount: new Style<View>({
    alignItems: 'center',
    bottom: spacing.xs,
    flexDirection: 'row',
    left: spacing.xs,
    position: 'absolute',
  }),
  viewCountLabel: new Style<Label>({
    color: colors.textInverted,
    font: montserrat.semiBold(fontSize.nano),
    marginLeft: 3,
    textShadow: 'rgba(0, 0, 0, 0.9) 2 1 0 1',
  }),
};
