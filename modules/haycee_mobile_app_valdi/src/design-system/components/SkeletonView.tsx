import { Component } from 'valdi_core/src/Component';
import { IRenderedElementAttributeApplier } from 'valdi_core/src/IRenderedElementApplier';
import { Style } from 'valdi_core/src/Style';
import { IRenderedElementBase } from 'valdi_tsx/src/IRenderedElementBase';
import { IRenderedElementHolder } from 'valdi_tsx/src/IRenderedElementHolder';
import { View } from 'valdi_tsx/src/NativeTemplateElements';

export interface SkeletonViewModel {
  width: number | string;
  height: number;
  borderRadius?: number;
  baseColor?: string;
  animate?: boolean;
}

class SingleElementHolder<T> implements IRenderedElementHolder<T> {
  private element?: IRenderedElementAttributeApplier<T>;

  onElementCreated(element: IRenderedElementBase<T>): void {
    this.element = element as unknown as IRenderedElementAttributeApplier<T>;
  }

  onElementDestroyed(element: IRenderedElementBase<T>): void {
    if ((this.element as unknown) === (element as unknown)) {
      this.element = undefined;
    }
  }

  setElements(elements: IRenderedElementBase<T>[]): void {
    this.element = elements[0] as unknown as IRenderedElementAttributeApplier<T> | undefined;
  }

  get current(): IRenderedElementAttributeApplier<T> | undefined {
    return this.element;
  }
}

type SkeletonTarget = SingleElementHolder<View>;

const skeletonTargets = new Set<SkeletonTarget>();
let skeletonAnimationTimer: ReturnType<typeof setInterval> | undefined;
let skeletonAnimationPhase = 0;

function stopSkeletonAnimationIfUnused(): void {
  if (skeletonTargets.size !== 0 || skeletonAnimationTimer === undefined) {
    return;
  }

  clearInterval(skeletonAnimationTimer);
  skeletonAnimationTimer = undefined;
  skeletonAnimationPhase = 0;
}

function startSkeletonAnimationIfNeeded(): void {
  if (skeletonAnimationTimer !== undefined) {
    return;
  }

  skeletonAnimationTimer = setInterval(() => {
    if (skeletonTargets.size === 0) {
      stopSkeletonAnimationIfUnused();
      return;
    }

    skeletonAnimationPhase += 0.28;
    const opacity = 0.72 + (Math.sin(skeletonAnimationPhase) + 1) * 0.14;
    skeletonTargets.forEach(target => {
      target.current?.setAttribute('opacity', opacity);
    });
  }, 100);
}

function registerSkeletonTarget(target: SkeletonTarget): () => void {
  skeletonTargets.add(target);
  startSkeletonAnimationIfNeeded();

  return () => {
    skeletonTargets.delete(target);
    stopSkeletonAnimationIfUnused();
  };
}

/**
 * Reusable Snap-style skeleton placeholder.
 * The shimmer is animated on the native view without setState per frame.
 */
export class SkeletonView extends Component<SkeletonViewModel> {
  private readonly containerRef = new SingleElementHolder<View>();

  onCreate(): void {
    if (this.viewModel.animate === false) {
      return;
    }

    this.registerDisposable(registerSkeletonTarget(this.containerRef));
  }

  onRender(): void {
    const borderRadius = this.viewModel.borderRadius ?? 6;

    <view
      ref={this.containerRef}
      style={styles.container.extend({
        backgroundColor: this.viewModel.baseColor ?? '#E5E5EA',
        borderRadius,
      })}
      width={this.viewModel.width}
      height={this.viewModel.height}
      borderRadius={borderRadius}
    />;
  }
}

const styles = {
  container: new Style<View>({
    position: 'relative',
    slowClipping: true,
  }),
};
