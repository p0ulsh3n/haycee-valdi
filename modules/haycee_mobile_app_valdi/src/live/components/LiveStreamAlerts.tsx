import { AnimationCurve } from 'valdi_core/src/AnimationOptions';
import { StatefulComponent } from 'valdi_core/src/Component';
import { ElementRef } from 'valdi_core/src/ElementRef';
import { Style } from 'valdi_core/src/Style';
import { ElementFrame } from 'valdi_tsx/src/Geometry';
import { ImageView, Label, View } from 'valdi_tsx/src/NativeTemplateElements';
import { colors } from '../../design-system/tokens/colors';
import { radius } from '../../design-system/tokens/radius';
import { layout, spacing } from '../../design-system/tokens/spacing';
import { fontSize, montserrat } from '../../design-system/tokens/typography';

const MAX_VISIBLE_AVATARS = 3;
const MAX_SEEN_ENTRIES = 64;
const ALERT_DURATION_MS = 4000;
export type LiveStreamAlertType = 'join' | 'share';
export type LiveStreamAlertDensity = 'regular' | 'compact';

export interface LiveStreamAlertEntry {
  id: string;
  username: string;
  avatarUrl?: string;
  type: LiveStreamAlertType;
  actionTextSingular?: string;
  actionTextPlural?: string;
}

interface LiveStreamAlertGroup {
  key: string;
  type: LiveStreamAlertType;
  entries: LiveStreamAlertEntry[];
}

export interface LiveStreamAlertsViewModel {
  /** Incremental stream events; each ID is consumed once. */
  entries: LiveStreamAlertEntry[];
  /** Compact layout is intended for alerts in the chat column. */
  density?: LiveStreamAlertDensity;
}

interface LiveStreamAlertsState {
  groups: LiveStreamAlertGroup[];
}

interface LiveStreamAlertPillViewModel {
  group: LiveStreamAlertGroup;
  density: LiveStreamAlertDensity;
  onDone: (groupKey: string) => void;
}

interface LiveStreamAlertPillState {
  group: LiveStreamAlertGroup;
}

interface LiveStreamAlertAvatarViewModel {
  entry: LiveStreamAlertEntry;
  index: number;
  size: number;
  overlap: number;
}

class LiveStreamAlertAvatar extends StatefulComponent<LiveStreamAlertAvatarViewModel, { entered: boolean }> {
  state = { entered: false };
  private readonly avatarRef = new ElementRef<View>();

  private handleLayout = (_frame: ElementFrame): void => {
    if (this.state.entered) return;
    this.state = { entered: true };
    const avatar = this.avatarRef.single();
    if (!avatar) return;
    this.animate(
      { duration: 0.32, curve: AnimationCurve.EaseOut, beginFromCurrentState: true },
      () => {
        avatar.setAttribute('opacity', 1);
        avatar.setAttribute('scaleX', 1);
        avatar.setAttribute('scaleY', 1);
      },
    );
  };

  onRender(): void {
    const { entry, index, size, overlap } = this.viewModel;
    const initial = entry.username.trim().charAt(0).toUpperCase();
    <view
      ref={this.avatarRef}
      style={styles.avatarSlot.extend({
        borderRadius: radius.full,
        height: size,
        marginLeft: index > 0 ? -overlap : 0,
        zIndex: MAX_VISIBLE_AVATARS - index,
        width: size,
      })}
      onLayout={this.handleLayout}
    >
      <view style={styles.avatarFallback.extend({ height: size, width: size })}>
        <label value={initial} style={styles.avatarInitial} numberOfLines={1} />
      </view>
      {entry.avatarUrl ? (
        <image src={entry.avatarUrl} style={styles.avatarImage.extend({ height: size, width: size })} objectFit="cover" />
      ) : null}
    </view>;
  }
}

/** One grouped join/share pill; its native position and alpha animate on entry and exit. */
class LiveStreamAlertPill extends StatefulComponent<LiveStreamAlertPillViewModel, LiveStreamAlertPillState> {
  state: LiveStreamAlertPillState = { group: { key: '', type: 'join', entries: [] } };
  private readonly pillRef = new ElementRef<View>();
  private entered = false;
  private dismissing = false;
  private dismissTimer?: number;

  onCreate(): void {
    this.state = { group: this.viewModel.group };
    this.scheduleDismiss();
  }

  onViewModelUpdate(previous?: Readonly<LiveStreamAlertPillViewModel>): void {
    if (!previous || previous.group === this.viewModel.group || this.dismissing) return;
    this.setStateAnimated(
      { group: this.viewModel.group },
      { duration: 0.38, curve: AnimationCurve.EaseInOut, beginFromCurrentState: true },
    );
    this.scheduleDismiss();
  }

  onDestroy(): void {
    if (this.dismissTimer !== undefined) clearTimeout(this.dismissTimer);
  }

  private scheduleDismiss(): void {
    if (this.dismissTimer !== undefined) clearTimeout(this.dismissTimer);
    this.dismissTimer = this.setTimeoutDisposable(this.dismiss, ALERT_DURATION_MS);
  }

  private handleLayout = (_frame: ElementFrame): void => {
    if (this.entered) return;
    this.entered = true;
    const pill = this.pillRef.single();
    if (!pill) return;
    this.animate(
      { duration: 0.3, curve: AnimationCurve.EaseOut, beginFromCurrentState: true },
      () => {
        pill.setAttribute('translationX', 0);
        pill.setAttribute('opacity', 1);
      },
    );
  };

  private dismiss = (): void => {
    if (this.dismissing || this.isDestroyed()) return;
    this.dismissing = true;
    const pill = this.pillRef.single();
    if (!pill) {
      this.viewModel.onDone(this.state.group.key);
      return;
    }
    this.animate(
      {
        duration: 0.26,
        curve: AnimationCurve.EaseIn,
        beginFromCurrentState: true,
        completion: wasCancelled => {
          if (!wasCancelled && !this.isDestroyed()) this.viewModel.onDone(this.state.group.key);
        },
      },
      () => {
        pill.setAttribute('translationX', -300);
        pill.setAttribute('opacity', 0);
      },
    );
  };

  onRender(): void {
    const { group } = this.state;
    const compact = this.viewModel.density === 'compact';
    const avatarSize = compact
      ? layout.live.viewer.streamAlerts.compactAvatarSize
      : layout.live.viewer.streamAlerts.regularAvatarSize;
    const avatarOverlap = compact
      ? layout.live.viewer.streamAlerts.compactAvatarOverlap
      : layout.live.viewer.streamAlerts.regularAvatarOverlap;
    const pillHeight = compact
      ? layout.live.viewer.streamAlerts.compactPillHeight
      : layout.live.viewer.streamAlerts.regularPillHeight;
    const entries = group.entries.slice(0, MAX_VISIBLE_AVATARS);
    const firstEntry = group.entries[0];
    const singularAction = firstEntry.actionTextSingular ?? (group.type === 'share' ? 'a partagé le live' : 'a rejoint');
    const pluralAction = firstEntry.actionTextPlural ?? (group.type === 'share' ? 'ont partagé le live' : 'ont rejoint');
    const label = group.entries.length === 1
      ? `${firstEntry.username} ${singularAction}`
      : group.entries.length === 2
        ? `${firstEntry.username} + 1 autre ${singularAction}`
        : `${firstEntry.username} + ${group.entries.length - 1} autres ${pluralAction}`;

    <view
      ref={this.pillRef}
      style={styles.pill.extend({
        borderRadius: pillHeight / 2,
        height: pillHeight,
        marginLeft: compact ? 0 : spacing.md,
        paddingLeft: compact ? spacing.xs : 4,
        paddingRight: compact ? spacing.sm : spacing.md,
      })}
      onLayout={this.handleLayout}
      touchEnabled={false}
    >
      <view style={styles.avatarsRow}>
        {entries.forEach((entry, index) => {
          <LiveStreamAlertAvatar
            key={entry.id}
            entry={entry}
            index={index}
            size={avatarSize}
            overlap={avatarOverlap}
          />;
        })}
      </view>
      <label value={label} style={compact ? styles.compactLabel : styles.label} numberOfLines={1} textOverflow="ellipsis" />
    </view>;
  }
}

/** Groups recent viewer joins and shares into two independent, animated pills. */
export class LiveStreamAlerts extends StatefulComponent<LiveStreamAlertsViewModel, LiveStreamAlertsState> {
  state: LiveStreamAlertsState = { groups: [] };
  private readonly seenIds = new Set<string>();
  private seenOrder: string[] = [];
  private groupSequence = 0;

  onViewModelUpdate(): void {
    const unseenEntries = this.viewModel.entries.filter(entry => !this.seenIds.has(entry.id));
    if (!unseenEntries.length) return;

    let groups = this.state.groups;
    for (const entry of unseenEntries) {
      this.rememberEntry(entry.id);
      const groupIndex = groups.findIndex(group => group.type === entry.type);
      if (groupIndex >= 0) {
        groups = groups.map((group, index) => index === groupIndex
          ? { ...group, entries: [...group.entries, entry] }
          : group);
      } else {
        groups = [...groups, {
          key: `${entry.type}-${++this.groupSequence}`,
          type: entry.type,
          entries: [entry],
        }].slice(-2);
      }
    }

    this.setStateAnimated(
      { groups },
      { duration: 0.38, curve: AnimationCurve.EaseInOut, beginFromCurrentState: true },
    );
  }

  private rememberEntry(id: string): void {
    this.seenIds.add(id);
    this.seenOrder.push(id);
    if (this.seenOrder.length > MAX_SEEN_ENTRIES) {
      const oldestId = this.seenOrder.shift();
      if (oldestId) this.seenIds.delete(oldestId);
    }
  }

  private handleGroupDone = (groupKey: string): void => {
    this.setStateAnimated(
      { groups: this.state.groups.filter(group => group.key !== groupKey) },
      { duration: 0.26, curve: AnimationCurve.EaseInOut, beginFromCurrentState: true },
    );
  };

  onRender(): void {
    <view style={styles.layer} touchEnabled={false}>
      {this.state.groups.slice().reverse().forEach(group => {
        <LiveStreamAlertPill
          key={group.key}
          group={group}
          density={this.viewModel.density ?? 'regular'}
          onDone={this.handleGroupDone}
        />;
      })}
    </view>;
  }
}

const styles = {
  layer: new Style<View>({ flexDirection: 'column', width: '100%', zIndex: 10 }),
  pill: new Style<View>({
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.liveOverlaySurface,
    borderRadius: layout.live.viewer.streamAlerts.regularPillHeight / 2,
    flexDirection: 'row',
    height: layout.live.viewer.streamAlerts.regularPillHeight,
    marginBottom: spacing.xs,
    marginLeft: spacing.md,
    maxWidth: '90%',
    opacity: 0,
    paddingLeft: 4,
    paddingRight: spacing.md,
    translationX: -300,
  }),
  avatarsRow: new Style<View>({ alignItems: 'center', flexDirection: 'row', flexShrink: 0 }),
  avatarSlot: new Style<View>({
    borderColor: colors.liveActionSurface,
    borderRadius: radius.full,
    borderWidth: 1.5,
    opacity: 0,
    position: 'relative',
    scaleX: 0.3,
    scaleY: 0.3,
  }),
  avatarFallback: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.liveOverlaySurface,
    borderRadius: radius.full,
    justifyContent: 'center',
  }),
  avatarInitial: new Style<Label>({ color: colors.textInverted, font: montserrat.black(fontSize.tiny) }),
  avatarImage: new Style<ImageView>({ borderRadius: radius.full, left: 0, position: 'absolute', top: 0 }),
  label: new Style<Label>({ color: colors.textInverted, flexShrink: 1, font: montserrat.semiBold(fontSize.metadata), marginLeft: spacing.sm, minWidth: 0 }),
  compactLabel: new Style<Label>({ color: colors.textInverted, flexShrink: 1, font: montserrat.semiBold(fontSize.tiny), marginLeft: spacing.xs, minWidth: 0 }),
};
