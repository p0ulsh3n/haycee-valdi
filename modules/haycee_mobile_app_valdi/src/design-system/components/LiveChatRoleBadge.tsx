import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { View } from 'valdi_tsx/src/NativeTemplateElements';
import { ProductCardBadge } from './ProductCardBadge';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { spacing } from '../tokens/spacing';

export type LiveChatRole = 'organizer' | 'moderator';

export interface LiveChatRoleBadgeViewModel {
  role: LiveChatRole;
}

const ROLE_PRESENTATION: Record<LiveChatRole, { label: string; backgroundColor: string; textColor: string }> = {
  organizer: { label: 'Organisateur', backgroundColor: colors.liveChatRoleOrganizer, textColor: colors.textPrimary },
  moderator: { label: 'Modérateur', backgroundColor: colors.liveChatRoleModerator, textColor: colors.textInverted },
};

/** Compact, centered role marker rendered beside a username in Live chat. */
export class LiveChatRoleBadge extends Component<LiveChatRoleBadgeViewModel> {
  onRender(): void {
    const presentation = ROLE_PRESENTATION[this.viewModel.role];
    <view style={styles.badgeSlot}>
      <ProductCardBadge
        label={presentation.label}
        backgroundColor={presentation.backgroundColor}
        textColor={presentation.textColor}
        borderRadius={radius.xxs}
      />
    </view>;
  }
}

const styles = {
  badgeSlot: new Style<View>({
    alignItems: 'center',
    flexShrink: 0,
    justifyContent: 'center',
    marginLeft: spacing.sm,
    paddingTop: spacing.xs,
  }),
};
