/**
 * ViewportManager
 */
export class ViewportManager {
  public defaultThreshold = 0.1;

  private initialized = false;
  private counter = 0;
  private items: ViewportManagerClient[] = [];
  private checkFunction: (() => void) | undefined;

  /**
   * add
   */
  public add(
    target: HTMLElement,
    show: ViewportManagerShowHideCallback,
    hide?: ViewportManagerShowHideCallback,
    options?: ViewportManagerItemOptions
  ): number {
    return this._add(target, show, hide, undefined, options);
  }

  /**
   * once
   */
  public once(
    target: HTMLElement,
    show: ViewportManagerShowHideCallback,
    hide?: ViewportManagerShowHideCallback,
    options?: ViewportManagerItemOptions
  ) {
    options = { ...options, once: true };
    this._add(target, show, hide, undefined, options);
  }

  /**
   * add element for parallax
   */
  public listenPosition(
    target: HTMLElement,
    positionCallback: ViewportManagerPositionCallback,
    options?: ViewportManagerItemOptions
  ) {
    return this._add(target, undefined, undefined, positionCallback, options);
  }

  /**
   * remove
   */
  public remove(id: number): void {
    this.items = this.items.filter((value) => value.id !== id);
  }

  /**
   *
   * @param target
   * @param callback
   * @param invisibleCallback
   * @param once
   */
  private _add(
    target: HTMLElement,
    show?: ViewportManagerShowHideCallback,
    hide?: ViewportManagerShowHideCallback,
    position?: ViewportManagerPositionCallback,
    options?: ViewportManagerItemOptions
  ) {
    const id = this.counter++;

    options = { ...options };

    if (target.hasAttribute("data-vp-threshold")) {
      options.threshold = parseFloat(
        target.getAttribute("data-vp-threshold") || ""
      );
      if (typeof options.threshold === "number") {
        options.threshold = Math.max(0, Math.min(1, options.threshold));
      }
    }

    this.items.push({
      id,
      target,
      visible: false,
      show,
      hide,
      position,
      options,
    });

    if (!this.initialized) {
      this.initialized = true;
      const check = this.check.bind(this);
      window.addEventListener("scroll", check);
      window.addEventListener("resize", check);
      this.checkFunction = check;
    }

    return id;
  }

  /**
   *
   */
  public check(): void {
    if (this.items.length === 0) return;

    const windowHeight = window.innerHeight;

    for (const item of this.items) {
      const targetElem = item.target;

      // if (!target.parentNode) {
      // 	if (item.once) {
      // 		this.remove(item.id);
      // 	}
      // 	continue;
      // }

      const rect = targetElem.getBoundingClientRect();

      const options = item.options;
      const threshold = options.threshold || this.defaultThreshold;

      // show/hide
      if (!item.visible) {
        if (windowHeight * (1 - threshold) > rect.top && 0 < rect.bottom) {
          item.visible = true;

          if (item.show) {
            item.show(targetElem, true);
          }

          if (options.once) {
            this.remove(item.id);
          }
        }
      } else {
        if (0 > rect.bottom || windowHeight < rect.top) {
          item.visible = false;
          if (item.hide) {
            item.hide(targetElem, false);
          }
        }
      }

      // position
      if (item.position) {
        // if (rect.top > window.innerHeight || rect.bottom < 0) continue;

        const min = 0 - rect.height;
        const max = window.innerHeight;
        const ratio = Math.min(
          1,
          Math.max(-1, ((rect.top - min) / (max - min)) * 2 - 1)
        );

        item.position(targetElem, ratio);
      }
    }
  }

  /**
   * dispose
   */
  public dispose() {
    if (this.checkFunction) {
      window.removeEventListener("scroll", this.checkFunction);
      window.removeEventListener("resize", this.checkFunction);
    }
    this.items.splice(0);
  }
}

export type ViewportManagerShowHideCallback = (
  elem: HTMLElement,
  shown: boolean
) => void;
export type ViewportManagerPositionCallback = (
  elem: HTMLElement,
  ratio: number
) => void;

interface ViewportManagerItemOptions {
  once?: boolean;
  threshold?: number;
}
interface ViewportManagerClient {
  id: number;
  target: HTMLElement;
  visible: boolean;
  show?: ViewportManagerShowHideCallback;
  hide?: ViewportManagerShowHideCallback;
  position?: ViewportManagerPositionCallback;
  options: ViewportManagerItemOptions;
}
