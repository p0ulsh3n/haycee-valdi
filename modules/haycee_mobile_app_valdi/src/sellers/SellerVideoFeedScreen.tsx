import { Device } from 'valdi_core/src/Device';
import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageStatefulComponent } from 'valdi_navigation/src/NavigationPageComponent';
import navigationIcons from '../../res/navigation-icons';
import { TransientFeedback } from '../design-system/components/SnackBar';
import { VerticalFeedActionRail } from '../design-system/components/VerticalFeedActionRail';
import type { VerticalFeedActionItem } from '../design-system/components/VerticalFeedActionRail';
import { VerticalSnapFeed } from '../design-system/components/VerticalSnapFeed';
import { formatCompactCount } from '../design-system/utils/counts';
import { colors } from '../design-system/tokens/colors';
import { SellerVideoFeedPage } from './components/SellerVideoFeedPage';
import type { SellerVideoPreview } from './data/SellerStorefrontData';

export interface SellerVideoFeedViewModel {
  vendorDisplayName: string;
  videos: SellerVideoPreview[];
  initialIndex: number;
  hasMore?: boolean;
  onLoadMore?: () => void | Promise<unknown>;
  onLikeVideo?: (videoId: string, isLiked: boolean) => void;
  onSaveVideo?: (videoId: string, isSaved: boolean) => void;
  onOpenVideoComments?: (videoId: string) => void;
  onShareVideo?: (videoId: string) => void;
}

interface SellerVideoFeedState {
  likedVideoIds: string[];
  savedVideoIds: string[];
  actionRevision: number;
}

/** Immersive seller video feed; playback is native when a video URL is present. */
@NavigationPage(module)
export class SellerVideoFeedScreen extends NavigationPageStatefulComponent<SellerVideoFeedViewModel, SellerVideoFeedState> {
  private pageIds: string[] = [];
  private likedVideoIds: string[] = [];
  private savedVideoIds: string[] = [];
  private actionRevision = 0;
  state: SellerVideoFeedState = { likedVideoIds: [], savedVideoIds: [], actionRevision: 0 };

  onCreate(): void {
    this.pageIds = this.viewModel.videos.map(video => video.id);
    this.likedVideoIds = this.viewModel.videos.filter(video => video.isLiked).map(video => video.id);
    this.savedVideoIds = this.viewModel.videos.filter(video => video.isFavorited).map(video => video.id);
    this.actionRevision = 0;
    this.state = { likedVideoIds: this.likedVideoIds, savedVideoIds: this.savedVideoIds, actionRevision: 0 };
  }

  onViewModelUpdate(previous?: SellerVideoFeedViewModel): void {
    if (previous?.videos !== this.viewModel.videos) {
      this.pageIds = this.viewModel.videos.map(video => video.id);
      const currentIds = new Set(this.pageIds);
      this.likedVideoIds = this.likedVideoIds.filter(id => currentIds.has(id));
      this.savedVideoIds = this.savedVideoIds.filter(id => currentIds.has(id));
      for (const video of this.viewModel.videos) {
        if (video.isLiked && !this.likedVideoIds.includes(video.id)) this.likedVideoIds.push(video.id);
        if (video.isFavorited && !this.savedVideoIds.includes(video.id)) this.savedVideoIds.push(video.id);
      }
      this.actionRevision++;
      this.setState({ likedVideoIds: this.likedVideoIds, savedVideoIds: this.savedVideoIds, actionRevision: this.actionRevision });
    }
  }

  private handleBack = (): void => {
    this.navigationController.pop();
  };

  private handleLike = (video: SellerVideoPreview): void => {
    const isLiked = this.likedVideoIds.includes(video.id);
    this.likedVideoIds = isLiked
      ? this.likedVideoIds.filter(id => id !== video.id)
      : [...this.likedVideoIds, video.id];
    this.setState({
      likedVideoIds: this.likedVideoIds,
      actionRevision: ++this.actionRevision,
    });
    this.viewModel.onLikeVideo?.(video.id, !isLiked);
  };

  private handleSave = (video: SellerVideoPreview): void => {
    const isSaved = this.savedVideoIds.includes(video.id);
    this.savedVideoIds = isSaved
      ? this.savedVideoIds.filter(id => id !== video.id)
      : [...this.savedVideoIds, video.id];
    this.setState({
      savedVideoIds: this.savedVideoIds,
      actionRevision: ++this.actionRevision,
    });
    this.viewModel.onSaveVideo?.(video.id, !isSaved);
  };

  private renderVideoActions = (index: number): void => {
    const video = this.viewModel.videos[index];
    if (!video) return;

    const isLiked = this.likedVideoIds.includes(video.id);
    const isSaved = this.savedVideoIds.includes(video.id);
    const actions: VerticalFeedActionItem[] = [
      {
        id: 'like',
        icon: navigationIcons.favourite,
        activeIcon: navigationIcons.favouriteBold,
        accessibilityLabel: `${isLiked ? 'Retirer le j’aime' : 'Aimer'} ${video.title}`,
        label: formatCompactCount((video.likeCount ?? 0) + (isLiked ? 1 : 0)),
        isActive: isLiked,
        activeTintColor: colors.textDanger,
        onTap: () => this.handleLike(video),
      },
      {
        id: 'comments',
        icon: navigationIcons.comment03,
        accessibilityLabel: `Commentaires de ${video.title}`,
        label: formatCompactCount(video.commentCount ?? 0),
        onTap: () => {
          if (this.viewModel.onOpenVideoComments) {
            this.viewModel.onOpenVideoComments(video.id);
          } else {
            TransientFeedback.show({ message: 'Les commentaires seront bientôt disponibles.' });
          }
        },
      },
      {
        id: 'favorite',
        icon: navigationIcons.allBookmark,
        accessibilityLabel: `${isSaved ? 'Retirer des favoris' : 'Enregistrer en favori'} ${video.title}`,
        label: formatCompactCount((video.favoriteCount ?? 0) + (isSaved ? 1 : 0)),
        isActive: isSaved,
        onTap: () => this.handleSave(video),
      },
      {
        id: 'share',
        icon: navigationIcons.share01,
        accessibilityLabel: `Partager ${video.title}`,
        label: formatCompactCount(video.shareCount ?? 0),
        onTap: () => {
          if (this.viewModel.onShareVideo) {
            this.viewModel.onShareVideo(video.id);
          } else {
            TransientFeedback.show({ message: 'Le partage sera bientôt disponible.' });
          }
        },
      },
    ];

    <VerticalFeedActionRail
      actions={actions}
      bottomInset={Math.max(0, Device.getDisplayBottomInset())}
    />;
  };

  private renderVideoPage = (index: number, isActive: boolean, _width: number, _height: number): void => {
    const video = this.viewModel.videos[index];
    if (!video) return;
    <SellerVideoFeedPage
      key={video.id}
      video={video}
      vendorDisplayName={this.viewModel.vendorDisplayName}
      isActive={isActive}
      bottomInset={Math.max(0, Device.getDisplayBottomInset())}
      onBack={this.handleBack}
    />;
  };

  onRender(): void {
    <VerticalSnapFeed
      pageIds={this.pageIds}
      initialIndex={this.viewModel.initialIndex}
      renderPage={this.renderVideoPage}
      renderActions={this.renderVideoActions}
      actionOverlayRevision={this.state.actionRevision}
      hasMore={this.viewModel.hasMore}
      onLoadMore={this.viewModel.onLoadMore}
    />;
  }
}
