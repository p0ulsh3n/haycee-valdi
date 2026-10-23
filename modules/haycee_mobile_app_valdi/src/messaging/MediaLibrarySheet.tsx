import { Device } from 'valdi_core/src/Device';
import { Style } from 'valdi_core/src/Style';
import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageStatefulComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { ElementFrame } from 'valdi_tsx/src/Geometry';
import { ScrollEndEvent } from 'valdi_tsx/src/GestureEvents';
import { ImageView, Label, Layout, ScrollView, View } from 'valdi_tsx/src/NativeTemplateElements';
import { noBounceScrollAttributes } from '../design-system/tokens/scrollBehavior';
import { colors } from '../design-system/tokens/colors';
import { radius } from '../design-system/tokens/radius';
import { spacing } from '../design-system/tokens/spacing';
import { fontSize, metropolis } from '../design-system/tokens/typography';
import { BottomSheetFooter, bottomSheetSurfaceStyle, BottomSheetViewModel } from '../design-system/components/BottomSheet';
import { copyMediaToCache, loadGallery, loadGalleryPage, loadMediaThumbnail } from './MediaBridgeNative';

interface Album { id: string; name: string; count: number }
interface MediaItem { id: string; contentUri: string; thumbnailUri: string; albumId: string; dateAdded: number; kind: 'image' | 'video' }
interface GalleryPayload { albums: Album[]; photos: MediaItem[]; hasMore: boolean }

interface MediaLibrarySheetViewModel extends Pick<BottomSheetViewModel, 'transparentPageBackground' | 'footerBackground'> {
  onSelect: (items: Array<{ mediaUri: string; thumbnailUri: string; kind: 'image' | 'video' }>) => void;
}

interface MediaLibrarySheetState {
  albums: Album[];
  photos: MediaItem[];
  selectedAlbumId: string;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: boolean;
  selectedMedia: MediaItem[];
  isSending: boolean;
}

/** Valdi-rendered, album-based photo picker backed by Android MediaStore. */
@NavigationPage(module)
export class MediaLibrarySheet extends NavigationPageStatefulComponent<MediaLibrarySheetViewModel, MediaLibrarySheetState> {
  state: MediaLibrarySheetState = { albums: [], photos: [], selectedAlbumId: 'all', loading: true, loadingMore: false, hasMore: false, error: false, selectedMedia: [], isSending: false };
  private photoContentHeight = 0;
  private photoViewportHeight = 0;
  private galleryGeneration = 0;

  onCreate(): void {
    void this.loadInitialGallery();
  }

  private loadInitialGallery = async (): Promise<void> => {
    try {
      const payload = JSON.parse(await loadGallery()) as GalleryPayload;
      if (!this.isDestroyed()) {
        this.setState({ albums: payload.albums, photos: payload.photos, selectedAlbumId: 'all', loading: false, loadingMore: false, hasMore: payload.hasMore, error: false });
        void this.resolveThumbnails(payload.photos, ++this.galleryGeneration);
      }
    } catch (error) {
      if (this.isDestroyed()) return;
      this.setState({ loading: false, loadingMore: false, error: true });
      console.warn('Unable to load Android photo library.', error);
    }
  };

  private selectAlbum = async (album: Album): Promise<void> => {
    if (album.id === this.state.selectedAlbumId) return;
    const generation = ++this.galleryGeneration;
    this.setState({ selectedAlbumId: album.id, loading: true, loadingMore: false, hasMore: false, error: false });
    try {
      const payload = JSON.parse(await loadGalleryPage(album.id, 0, 60)) as GalleryPayload;
      if (!this.isDestroyed() && generation === this.galleryGeneration) {
        this.photoContentHeight = 0;
        this.setState({ photos: payload.photos, loading: false, loadingMore: false, hasMore: payload.hasMore, error: false });
        void this.resolveThumbnails(payload.photos, generation);
      }
    } catch (error) {
      if (!this.isDestroyed() && generation === this.galleryGeneration) this.setState({ loading: false, loadingMore: false, error: true });
      console.warn('Unable to load selected photo album.', error);
    }
  };

  private handlePhotoLayout = (frame: ElementFrame): void => {
    this.photoViewportHeight = frame.height;
  };

  private handlePhotoContentSize = (size: { width: number; height: number }): void => {
    this.photoContentHeight = size.height;
  };

  private handlePhotoScrollEnd = (event: ScrollEndEvent): void => {
    if (this.photoContentHeight > 0 && event.y + this.photoViewportHeight >= this.photoContentHeight - 240) {
      void this.loadNextPhotoPage();
    }
  };

  private loadNextPhotoPage = async (): Promise<void> => {
    if (!this.state.hasMore || this.state.loading || this.state.loadingMore) return;
    const generation = this.galleryGeneration;
    const albumId = this.state.selectedAlbumId;
    const offset = this.state.photos.length;
    this.setState({ loadingMore: true });
    try {
      const payload = JSON.parse(await loadGalleryPage(albumId, offset, 60)) as GalleryPayload;
      if (!this.isDestroyed() && generation === this.galleryGeneration && albumId === this.state.selectedAlbumId) {
        this.setState({ photos: [...this.state.photos, ...payload.photos], hasMore: payload.hasMore, loadingMore: false });
        void this.resolveThumbnails(payload.photos, generation);
      }
    } catch (error) {
      if (!this.isDestroyed() && generation === this.galleryGeneration) this.setState({ loadingMore: false });
      console.warn('Unable to load more photos.', error);
    }
  };

  private resolveThumbnails = async (items: MediaItem[], generation: number): Promise<void> => {
    const pending = items.filter(item => !item.thumbnailUri);
    for (let offset = 0; offset < pending.length; offset += THUMBNAIL_BATCH_SIZE) {
      if (this.isDestroyed() || generation !== this.galleryGeneration) return;
      const batch = pending.slice(offset, offset + THUMBNAIL_BATCH_SIZE);
      const resolved = await Promise.all(batch.map(async item => {
        try {
          return { id: item.id, contentUri: item.contentUri, thumbnailUri: await loadMediaThumbnail(item.contentUri, item.kind) };
        } catch (error) {
          console.warn('Unable to create media preview.', error);
          return { id: item.id, contentUri: item.contentUri, thumbnailUri: '' };
        }
      }));
      if (this.isDestroyed() || generation !== this.galleryGeneration) return;
      const thumbnails = new Map(resolved.map(item => [item.id, item]));
      this.setState({ photos: this.state.photos.map(item => {
        const preview = thumbnails.get(item.id);
        return preview && preview.contentUri === item.contentUri ? { ...item, thumbnailUri: preview.thumbnailUri } : item;
      }) });
    }
  };

  private toggleMedia = (media: MediaItem): void => {
    const selectedMedia = this.state.selectedMedia.some(item => item.id === media.id)
      ? this.state.selectedMedia.filter(item => item.id !== media.id)
      : [...this.state.selectedMedia, media];
    this.setState({ selectedMedia });
  };

  private sendSelectedMedia = async (): Promise<void> => {
    if (this.state.selectedMedia.length === 0 || this.state.isSending) return;
    this.setState({ isSending: true });
    try {
      const items: Array<{ mediaUri: string; thumbnailUri: string; kind: 'image' | 'video' }> = [];
      for (const media of this.state.selectedMedia) {
        const thumbnailUri = media.thumbnailUri || await loadMediaThumbnail(media.contentUri, media.kind);
        items.push({ mediaUri: await copyMediaToCache(media.contentUri), thumbnailUri, kind: media.kind });
      }
      if (this.isDestroyed()) return;
      this.viewModel.onSelect(items);
      this.navigationController.dismiss(true);
    } catch (error) {
      if (!this.isDestroyed()) this.setState({ isSending: false });
      console.warn('Unable to prepare selected media for the message.', error);
    }
  };

  private selectionNumber = (mediaId: string): number => this.state.selectedMedia.findIndex(item => item.id === mediaId) + 1;

  private close = (): void => this.navigationController.dismiss(true);

  onRender(): void {
    const bottomInset = Math.max(0, Device.getDisplayBottomInset());
    <layout style={styles.root}>
      <view style={styles.sheet.extend({ paddingBottom: bottomInset + spacing.md })}>
        <view style={styles.header}>
          <label value="Photos et vidéos" style={styles.title} numberOfLines={1} />
          <view style={styles.closeButton} onTap={this.close} accessibilityCategory="button">
            <label value="Fermer" style={styles.closeLabel} numberOfLines={1} />
          </view>
        </view>
        <scroll style={styles.albumRail} horizontal={true} {...noBounceScrollAttributes} showsHorizontalScrollIndicator={false}>
          {this.state.albums.map(album => (
            <view
              key={album.id}
              style={album.id === this.state.selectedAlbumId ? styles.albumSelected : styles.album}
              onTap={() => this.selectAlbum(album)}
              accessibilityCategory="button"
            >
              <label value={`${album.name}  ${album.count}`} style={album.id === this.state.selectedAlbumId ? styles.albumTextSelected : styles.albumText} numberOfLines={1} />
            </view>
          ))}
        </scroll>
        {this.state.error ? (
          <view style={styles.messageState}>
            <label value="Autorise l’accès aux photos et vidéos pour les afficher." style={styles.helperText} numberOfLines={2} />
            <view style={styles.retryButton} onTap={this.loadInitialGallery} accessibilityCategory="button">
              <label value="Réessayer" style={styles.retryText} numberOfLines={1} />
            </view>
          </view>
        ) : this.state.photos.length === 0 && !this.state.loading ? (
          <view style={styles.messageState}><label value="Aucune photo ni vidéo dans cet album." style={styles.helperText} numberOfLines={1} /></view>
        ) : this.state.photos.length > 0 ? (
          <scroll
            style={styles.photoScroll}
            {...noBounceScrollAttributes}
            showsVerticalScrollIndicator={false}
            onLayout={this.handlePhotoLayout}
            onContentSizeChange={this.handlePhotoContentSize}
            onScrollEnd={this.handlePhotoScrollEnd}
          >
            <layout style={styles.photoGrid}>
              {this.state.photos.map(media => (
                <view key={media.id} style={styles.photoCell} onTap={() => this.toggleMedia(media)} accessibilityCategory="button">
                  {media.thumbnailUri ? <image src={media.thumbnailUri} style={styles.photo} objectFit="cover" /> : <view style={styles.photoPlaceholder} />}
                  {media.kind === 'video' ? (
                    <view style={styles.videoBadge}><label value="VIDÉO" style={styles.videoBadgeText} numberOfLines={1} /></view>
                  ) : null}
                  {this.selectionNumber(media.id) > 0 ? (
                    <view style={styles.selectionSelected}>
                      <label value={`${this.selectionNumber(media.id)}`} style={styles.selectionNumber} numberOfLines={1} />
                    </view>
                  ) : <view style={styles.selectionEmpty} />}
                </view>
              ))}
            </layout>
          </scroll>
        ) : <view style={styles.messageState} />}
        <BottomSheetFooter
          label={`Envoyer(${this.state.selectedMedia.length})`}
          onTap={this.sendSelectedMedia}
          disabled={this.state.selectedMedia.length === 0 || this.state.isSending}
          background={this.viewModel.footerBackground ?? 'transparent'}
        />
      </view>
    </layout>;
  }
}

const THUMBNAIL_BATCH_SIZE = 12;

const styles = {
  root: new Style<Layout>({ height: '100%', width: '100%' }),
  sheet: bottomSheetSurfaceStyle.extend({
    flexDirection: 'column',
    height: '78%',
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
    paddingTop: spacing.md,
  }),
  header: new Style<View>({ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingBottom: spacing.md }),
  title: new Style<Label>({ color: colors.textPrimary, font: metropolis.semiBold(fontSize.section) }),
  closeButton: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: radius.full, justifyContent: 'center', paddingBottom: spacing.sm, paddingLeft: spacing.md, paddingRight: spacing.md, paddingTop: spacing.sm }),
  closeLabel: new Style<Label>({ color: colors.textPrimary, font: metropolis.medium(fontSize.metadata) }),
  albumRail: new Style<ScrollView>({ flexGrow: 0, flexShrink: 0, marginBottom: spacing.md }),
  album: new Style<View>({ backgroundColor: colors.backgroundSecondary, borderRadius: radius.full, marginRight: spacing.sm, paddingBottom: spacing.sm, paddingLeft: spacing.md, paddingRight: spacing.md, paddingTop: spacing.sm }),
  albumSelected: new Style<View>({ backgroundColor: colors.textPrimary, borderRadius: radius.full, marginRight: spacing.sm, paddingBottom: spacing.sm, paddingLeft: spacing.md, paddingRight: spacing.md, paddingTop: spacing.sm }),
  albumText: new Style<Label>({ color: colors.textPrimary, font: metropolis.medium(fontSize.metadata) }),
  albumTextSelected: new Style<Label>({ color: colors.textInverted, font: metropolis.semiBold(fontSize.metadata) }),
  photoScroll: new Style<ScrollView>({ flexGrow: 1, flexShrink: 1, marginBottom: spacing.sm }),
  photoGrid: new Style<Layout>({ flexDirection: 'row', flexWrap: 'wrap' }),
  photoCell: new Style<View>({ height: 122, padding: 1, position: 'relative', width: '33.333%' }),
  photo: new Style<ImageView>({ backgroundColor: colors.backgroundSecondary, height: 120, width: '100%' }),
  photoPlaceholder: new Style<View>({ backgroundColor: colors.backgroundSecondary, height: 120, width: '100%' }),
  selectionEmpty: new Style<View>({ borderColor: colors.textInverted, borderRadius: radius.full, borderWidth: 2, height: 24, opacity: 0.9, position: 'absolute', right: spacing.sm, top: spacing.sm, width: 24 }),
  selectionSelected: new Style<View>({ alignItems: 'center', backgroundColor: colors.interactivePrimary, borderColor: colors.textInverted, borderRadius: radius.full, borderWidth: 1, height: 24, justifyContent: 'center', position: 'absolute', right: spacing.sm, top: spacing.sm, width: 24 }),
  selectionNumber: new Style<Label>({ color: colors.textInverted, font: metropolis.semiBold(fontSize.tiny) }),
  videoBadge: new Style<View>({ backgroundColor: colors.backgroundDark, borderRadius: radius.xs, bottom: spacing.sm, left: spacing.sm, paddingBottom: spacing.xs, paddingLeft: spacing.xs, paddingRight: spacing.xs, paddingTop: spacing.xs, position: 'absolute' }),
  videoBadgeText: new Style<Label>({ color: colors.textInverted, font: metropolis.semiBold(fontSize.tiny) }),
  messageState: new Style<View>({ alignItems: 'center', flexGrow: 1, justifyContent: 'center' }),
  helperText: new Style<Label>({ color: colors.textSecondary, font: metropolis.regular(fontSize.metadata), textAlign: 'center' }),
  retryButton: new Style<View>({ backgroundColor: colors.backgroundSecondary, borderRadius: radius.md, marginTop: spacing.md, paddingBottom: spacing.sm, paddingLeft: spacing.lg, paddingRight: spacing.lg, paddingTop: spacing.sm }),
  retryText: new Style<Label>({ color: colors.textPrimary, font: metropolis.medium(fontSize.metadata) }),
};
