import { Style } from 'valdi_core/src/Style';
import { Layout, View } from 'valdi_tsx/src/NativeTemplateElements';
import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageStatefulComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { SkeletonView } from './SkeletonView';
import { colors } from '../tokens/colors';
import { spacing } from '../tokens/spacing';
import { transformText, typography } from '../tokens/typography';

interface SkeletonDemoState {
  isLoading: boolean;
}

/** Demo screen: keeps the skeleton visible for two seconds, then shows content. */
@NavigationPage(module)
export class SkeletonDemoScreen extends NavigationPageStatefulComponent<{}, SkeletonDemoState> {
  state: SkeletonDemoState = { isLoading: true };

  onCreate(): void {
    this.setTimeoutDisposable(() => {
      this.setState({ isLoading: false });
    }, 2000);
  }

  onRender(): void {
    <view style={styles.screen}>
      <label
        style={styles.title}
        value={transformText('Chargement du profil')}
        numberOfLines={0}
      />
      <layout paddingTop={spacing.sm}>
      <label
          style={styles.subtitle}
        value={transformText(
          this.state.isLoading ? 'Animation pulse pendant 2 secondes…' : 'Contenu chargé',
        )}
          numberOfLines={0}
        />
      </layout>
      {this.state.isLoading ? this.renderSkeleton() : this.renderContent()}
    </view>;
  }

  private renderSkeleton(): void {
    <view style={styles.card}>
      <SkeletonView width={64} height={64} borderRadius={32} />
      <layout paddingTop={spacing.xl}>
        <SkeletonView width={240} height={22} borderRadius={7} />
      </layout>
      <layout paddingTop={spacing.md}>
        <SkeletonView width={300} height={15} borderRadius={6} />
      </layout>
      <layout paddingTop={spacing.sm}>
        <SkeletonView width={260} height={15} borderRadius={6} />
      </layout>
    </view>;
  }

  private renderContent(): void {
    <view style={styles.card}>
      <view style={styles.avatar}>
        <label style={styles.avatarLabel} value="H" />
      </view>
      <layout paddingTop={spacing.xl}>
        <label
          style={styles.contentTitle}
          value={transformText('Profil chargé')}
          numberOfLines={0}
        />
      </layout>
      <layout paddingTop={spacing.md}>
        <label
          style={styles.contentMessage}
          value={transformText(
            'Le skeleton a été remplacé automatiquement par le contenu après 2 secondes.',
          )}
          numberOfLines={0}
        />
      </layout>
    </view>;
  }
}

const styles = {
  screen: new Style<View>({
    backgroundColor: colors.backgroundPrimary,
    flexGrow: 1,
    padding: spacing.xxl,
  }),
  title: typography.title2.extend({ textAlign: 'center' }),
  subtitle: typography.message.extend({ color: colors.textSecondary, textAlign: 'center' }),
  card: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 20,
    flexGrow: 1,
    justifyContent: 'center',
    marginTop: spacing.xxl,
    padding: spacing.xxxxl,
  }),
  avatar: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.interactivePrimary,
    borderRadius: 32,
    height: 64,
    justifyContent: 'center',
    width: 64,
  }),
  avatarLabel: typography.title2,
  contentTitle: typography.title2.extend({ textAlign: 'center' }),
  contentMessage: typography.message.extend({ color: colors.textSecondary, textAlign: 'center' }),
};
