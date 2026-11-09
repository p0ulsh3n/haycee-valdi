import { AnimationCurve } from 'valdi_core/src/AnimationOptions';
import { Component } from 'valdi_core/src/Component';
import { ElementRef } from 'valdi_core/src/ElementRef';
import { RenderedElementUtils } from 'valdi_core/src/utils/RenderedElementUtils';
import { Style } from 'valdi_core/src/Style';
import { TouchEvent, TouchEventState } from 'valdi_tsx/src/GestureEvents';
import { ElementFrame } from 'valdi_tsx/src/Geometry';
import { View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../../res/navigation-icons';
import { colors } from '../../design-system/tokens/colors';

const PARTICLE_COUNT = 12;
const HEART_SIZE = 34;
const TRAIL_STEP = 30;
const FLOAT_DURATION_SECONDS = 2.4;
const FLOAT_DISTANCE_RATIO = 0.58;

export interface LiveReactionTrailViewModel {
  onHeartEmitted: () => void;
}

/** Renders a bounded trail of native-animated hearts over the live stage. */
export class LiveReactionTrail extends Component<LiveReactionTrailViewModel> {
  private readonly rootRef = new ElementRef<View>();
  private readonly particleRefs: ElementRef<View>[] = Array.from(
    { length: PARTICLE_COUNT },
    () => new ElementRef<View>(),
  );
  private readonly particleTokens = new Array<number>(PARTICLE_COUNT).fill(0);
  private rootAbsolutePosition = { x: 0, y: 0 };
  private rootHeight = 0;
  private rootHasLayout = false;
  private nextParticleIndex = 0;
  private touchActive = false;
  private lastParticleX = 0;
  private lastParticleY = 0;

  private handleRootLayout = (frame: ElementFrame): void => {
    const root = this.rootRef.single();
    if (!root) return;
    this.rootAbsolutePosition = RenderedElementUtils.absolutePosition(root);
    this.rootHeight = frame.height;
    this.rootHasLayout = true;
  };

  private handleTouch = (event: TouchEvent): void => {
    if (event.state === TouchEventState.Started) {
      if (event.pointerCount !== 1 || !this.rootHasLayout) return;

      this.touchActive = true;
      this.lastParticleX = event.absoluteX - this.rootAbsolutePosition.x;
      this.lastParticleY = event.absoluteY - this.rootAbsolutePosition.y;
      this.emitHeart(this.lastParticleX, this.lastParticleY);
      return;
    }

    if (!this.touchActive) return;

    if (event.state === TouchEventState.Changed) {
      if (event.pointerCount !== 1) return;

      const x = event.absoluteX - this.rootAbsolutePosition.x;
      const y = event.absoluteY - this.rootAbsolutePosition.y;
      const deltaX = x - this.lastParticleX;
      const deltaY = y - this.lastParticleY;
      if (deltaX * deltaX + deltaY * deltaY < TRAIL_STEP * TRAIL_STEP) return;

      this.lastParticleX = x;
      this.lastParticleY = y;
      this.emitHeart(x, y);
      return;
    }

    if (event.state === TouchEventState.Ended) {
      this.touchActive = false;
    }
  };

  private emitHeart = (x: number, y: number): void => {
    const particleIndex = this.nextParticleIndex;
    const particle = this.particleRefs[particleIndex];
    this.nextParticleIndex = (particleIndex + 1) % this.particleRefs.length;
    const token = ++this.particleTokens[particleIndex];
    const targetY = y - this.rootHeight * FLOAT_DISTANCE_RATIO;
    const horizontalDrift = particleIndex % 2 === 0 ? -16 : 16;

    particle.setAttribute('translationX', x - HEART_SIZE / 2);
    particle.setAttribute('translationY', y - HEART_SIZE / 2);
    particle.setAttribute('scaleX', 1);
    particle.setAttribute('scaleY', 1);
    particle.setAttribute('opacity', 1);
    this.viewModel.onHeartEmitted();
    this.animate(
      {
        duration: FLOAT_DURATION_SECONDS,
        curve: AnimationCurve.EaseOut,
        beginFromCurrentState: true,
        completion: wasCancelled => {
          if (!wasCancelled && token === this.particleTokens[particleIndex] && !this.isDestroyed()) {
            particle.setAttribute('opacity', 0);
          }
        },
      },
      () => {
        particle.setAttribute('translationX', x + horizontalDrift - HEART_SIZE / 2);
        particle.setAttribute('translationY', targetY - HEART_SIZE / 2);
        particle.setAttribute('scaleX', 0.8);
        particle.setAttribute('scaleY', 0.8);
        particle.setAttribute('opacity', 0);
      },
    );
  };

  onRender(): void {
    <view ref={this.rootRef} style={styles.root} onLayout={this.handleRootLayout} onTouch={this.handleTouch}>
      {this.particleRefs.forEach((particleRef, index) => {
        <view
          key={`live-reaction-${index}`}
          ref={particleRef}
          style={styles.particle}
          touchEnabled={false}
        >
          <image
            src={navigationIcons.favouriteBold}
            tint={colors.textDanger}
            width={HEART_SIZE}
            height={HEART_SIZE}
            objectFit="contain"
          />
        </view>;
      })}
    </view>;
  }
}

const styles = {
  root: new Style<View>({ flexGrow: 1, flexShrink: 1, position: 'relative', width: '100%' }),
  particle: new Style<View>({
    alignItems: 'center',
    height: HEART_SIZE,
    justifyContent: 'center',
    left: 0,
    opacity: 0,
    position: 'absolute',
    top: 0,
    width: HEART_SIZE,
  }),
};
