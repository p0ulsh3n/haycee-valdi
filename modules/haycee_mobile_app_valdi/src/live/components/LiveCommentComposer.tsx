import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { EditTextEvent, TextField, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../../res/navigation-icons';
import { colors } from '../../design-system/tokens/colors';
import { radius } from '../../design-system/tokens/radius';
import { layout, spacing } from '../../design-system/tokens/spacing';
import { fontSize, montserrat } from '../../design-system/tokens/typography';

export interface LiveCommentComposerViewModel {
  value: string;
  onChange: (event: EditTextEvent) => void;
  onSend: () => void;
}

/** Standalone live comment composer; action icons remain siblings to its right. */
export class LiveCommentComposer extends Component<LiveCommentComposerViewModel> {
  onRender(): void {
    <view style={styles.container}>
      <textfield
        style={styles.input}
        placeholder="Écrire un commentaire…"
        placeholderColor={colors.textOnDarkSecondary}
        value={this.viewModel.value}
        onChange={this.viewModel.onChange}
        onReturn={this.viewModel.onSend}
        returnKeyText="send"
        characterLimit={200}
        autocorrection="none"
      />
      {this.viewModel.value.trim().length > 0 ? (
        <view style={styles.sendButton} onTap={this.viewModel.onSend} accessibilityCategory="button">
          <image src={navigationIcons.sent} tint={colors.textInverted} width={18} height={18} objectFit="contain" />
        </view>
      ) : null}
    </view>;
  }
}

const styles = {
  container: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.liveGlassSurface,
    borderColor: colors.liveGlassBorder,
    borderRadius: radius.full,
    borderWidth: layout.live.viewer.glassBorderWidth,
    flexDirection: 'row',
    flexGrow: 1,
    flexShrink: 1,
    height: layout.live.viewer.composerHeight,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
  }),
  input: new Style<TextField>({
    color: colors.textInverted,
    flexGrow: 1,
    flexShrink: 1,
    font: montserrat.semiBold(fontSize.metadata),
    height: layout.live.viewer.composerHeight,
  }),
  sendButton: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.textPrimary,
    borderRadius: radius.full,
    height: 32,
    justifyContent: 'center',
    width: 32,
  }),
};
