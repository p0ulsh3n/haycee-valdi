import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { Asset } from 'valdi_tsx/src/Asset';
import { ElementFrame } from 'valdi_tsx/src/Geometry';
import { Label, Layout, View } from 'valdi_tsx/src/NativeTemplateElements';
import { colors } from '../../design-system/tokens/colors';
import { radius } from '../../design-system/tokens/radius';
import { spacing } from '../../design-system/tokens/spacing';
import { fontSize, montserrat, typography } from '../../design-system/tokens/typography';

export interface ProfileSummaryStat {
  value: string;
  label: string;
  icon?: Asset;
  iconTint?: string;
}

export interface ProfileIdentitySectionViewModel {
  displayName: string;
  username: string;
  locationLabel?: string;
  locationFlag?: string;
  stats?: ProfileSummaryStat[];
  bio?: string;
  onDisplayNameLayout?: (frame: ElementFrame) => void;
}

/** Shared profile identity details placed above the profile's swipe tabs. */
export class ProfileIdentitySection extends Component<ProfileIdentitySectionViewModel> {
  onRender(): void {
    const { displayName, username, locationLabel, locationFlag, stats = [], bio } = this.viewModel;

    <view style={styles.root}>
      <label
        value={displayName}
        style={styles.displayName}
        numberOfLines={1}
        onLayout={this.viewModel.onDisplayNameLayout}
      />
      <label value={username} style={styles.username} numberOfLines={1} />
      {locationLabel ? (
        <layout style={styles.locationRow}>
          <label value={locationLabel} style={styles.locationLabel} numberOfLines={1} />
          {locationFlag ? <label value={locationFlag} style={styles.locationFlag} /> : null}
        </layout>
      ) : null}
      {stats.length > 0 ? (
        <layout style={styles.statsRow}>
          {stats.map((stat, index) => (
            <layout key={`profile-stat-${index}-${stat.label}`} style={styles.statGroup}>
              {index > 0 ? <view style={styles.statsSeparatorDot} /> : null}
              <layout style={styles.statItem}>
                {stat.icon ? (
                  <view style={styles.statsIcon}>
                    <image
                      src={stat.icon}
                      tint={stat.iconTint ?? colors.iconDefault}
                      width={14}
                      height={14}
                      objectFit="contain"
                    />
                  </view>
                ) : null}
                <label value={stat.value} style={styles.statsNumber} numberOfLines={1} />
                <label value={stat.label} style={styles.statsLabel} numberOfLines={1} />
              </layout>
            </layout>
          ))}
        </layout>
      ) : null}
      {bio ? <label value={bio} style={styles.bio} numberOfLines={4} /> : null}
    </view>;
  }
}

const profileBodyFont = montserrat.semiBold(fontSize.body);

const styles = {
  root: new Style<View>({ flexDirection: 'column', width: '100%' }),
  displayName: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.extraBold(fontSize.display),
    marginTop: spacing.md,
  }),
  username: typography.body.extend({
    color: colors.textSecondary,
    font: profileBodyFont,
  }),
  locationRow: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', marginTop: spacing.xs }),
  locationLabel: typography.body.extend({ color: colors.textSecondary, font: profileBodyFont }),
  locationFlag: typography.body.extend({ font: profileBodyFont, marginLeft: spacing.xs }),
  statsRow: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', marginTop: spacing.xxl }),
  statGroup: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', flexShrink: 1 }),
  statItem: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', flexShrink: 1 }),
  statsIcon: new Style<View>({ marginRight: spacing.xs }),
  statsSeparatorDot: new Style<View>({
    backgroundColor: colors.textSecondary,
    borderRadius: radius.full,
    height: 3,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
    width: 3,
  }),
  statsNumber: new Style<Label>({ color: colors.textPrimary, flexShrink: 1, font: montserrat.extraBold(fontSize.body) }),
  statsLabel: new Style<Label>({ color: colors.textSecondary, flexShrink: 1, font: profileBodyFont, marginLeft: spacing.xs }),
  bio: typography.body.extend({ color: colors.textPrimary, font: profileBodyFont, marginTop: spacing.xxl }),
};
