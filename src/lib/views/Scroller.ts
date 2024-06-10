import { EventEmitter } from "../events/EventEmitter";
import { TouchItem, TouchManager } from "../managers/TouchManager";
import { Ticker } from "../tween/Ticker";
import { Ease, Tween } from "../tween/Tween";

export enum Direction {
  None = "none",
  Vertical = "vertical",
  Horizontal = "horizontal",
  Both = "both",
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const global: { ___scrollingInstance: any } =
  typeof window !== "undefined"
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any)
    : {};

/**
 * Scroller
 */
export class Scroller extends EventEmitter<ScrollerEventMap> {
  private container: HTMLElement;
  private touchManager: TouchManager;

  private updateSizeBind: () => void;

  protected width = 200;
  protected height = 200;

  protected _scale = 1;
  protected _scrollPositionX = 0;
  protected _scrollPositionY = 0;

  public minScrollPositionX = -Infinity;
  public maxScrollPositionX = Infinity;
  public minScrollPositionY = -Infinity;
  public maxScrollPositionY = Infinity;

  public damping = 0.975;
  public easeDuration = 350;
  public overScrollDamping = 0.5;

  public scrollThreshold = 5;

  public enabledHorizontalScroll = true;
  public enabledVerticalScroll = true;
  public enabledMultiScroll = false;
  public enabledMouseWheel = true;

  private onResize: () => void;
  private scrollTween?: Tween<{ x: number; y: number }> | null | undefined;
  private update: (delta: number) => void;

  /**
   * constructor
   */
  constructor(container: HTMLElement) {
    super();

    this.container = container;

    // init
    this.updateSize();

    this.updateSizeBind = this.updateSize.bind(this);
    window.addEventListener("resize", this.updateSizeBind);

    let enabledHorizontal = false;
    let enabledVertical = false;
    let direction = Direction.None;
    let touchItem: TouchItem;
    let throwItem: TouchItem | null;
    let scrollTweenX: Tween<{
      scrollPositionX: number;
      scrollPositionY: number;
    }> | null;
    let scrollTweenY: Tween<{
      scrollPositionX: number;
      scrollPositionY: number;
    }> | null;

    const cancelTweens = () => {
      if (this.scrollTween) {
        this.scrollTween.stop();
        this.scrollTween = undefined;
      }
      if (scrollTweenX) {
        scrollTweenX.stop();
        scrollTweenX = null;
      }
      if (scrollTweenY) {
        scrollTweenY.stop();
        scrollTweenY = null;
      }
    };

    // TouchManager
    const touchManager = new TouchManager(container);
    this.touchManager = touchManager;
    touchManager.autoPreventDefault = true;
    touchManager.on("add", (event) => {
      cancelTweens();

      if (direction !== Direction.None) {
        this.emit("scrollend");
      }

      direction = this.enabledMultiScroll ? Direction.Both : Direction.None;
      touchItem = event.items[0];
      throwItem = null;

      this.updateSize();

      enabledHorizontal = this.enabledHorizontalScroll;
      enabledVertical = this.enabledVerticalScroll;
    });
    touchManager.on("move", () => {
      cancelTweens();

      if (!enabledHorizontal && !enabledVertical) return;
      if (global.___scrollingInstance && global.___scrollingInstance !== this) {
        return;
      }

      if (direction === Direction.None) {
        const scrollThreshold =
          this.scrollThreshold * (window.devicePixelRatio || 1);
        if (
          enabledHorizontal &&
          scrollThreshold < Math.abs(touchItem.offsetX)
        ) {
          global.___scrollingInstance = this;
          direction = Direction.Horizontal;
          this.emit("scrollstart", { direction });
        } else if (
          enabledVertical &&
          scrollThreshold < Math.abs(touchItem.offsetY)
        ) {
          global.___scrollingInstance = this;
          direction = Direction.Vertical;
          this.emit("scrollstart", { direction });
        }
      }

      if (direction !== Direction.None) {
        if (enabledHorizontal) {
          if (
            direction === Direction.Both ||
            direction === Direction.Horizontal
          ) {
            let moveX = touchItem.moveX / this.scale;
            if (
              (this._scrollPositionX < this.minScrollPositionX && moveX > 0) ||
              (this._scrollPositionX > this.maxScrollPositionX && moveX < 0)
            ) {
              moveX *= this.overScrollDamping;
            }
            this._scrollPositionX = this._scrollPositionX - moveX;
          }
        }
        if (enabledVertical) {
          if (
            direction === Direction.Both ||
            direction === Direction.Vertical
          ) {
            let moveY = touchItem.moveY / this.scale;
            if (
              (this._scrollPositionY < this.minScrollPositionY && moveY > 0) ||
              (this._scrollPositionY > this.maxScrollPositionY && moveY < 0)
            ) {
              moveY *= this.overScrollDamping;
            }
            this._scrollPositionY = this._scrollPositionY - moveY;
          }
        }
      }

      this.updatePosition();
    });
    touchManager.on("remove", () => {
      if (direction !== Direction.None) {
        throwItem = touchItem;

        if (direction === Direction.Horizontal) throwItem.vy = 0;
        if (direction === Direction.Vertical) throwItem.vx = 0;

        Ticker.add(update);
      }
      if (global.___scrollingInstance === this) {
        global.___scrollingInstance = undefined;
      }
    });

    const onCompleteBackTween = () => {
      if (direction === Direction.Horizontal) scrollTweenX = null;
      if (direction === Direction.Vertical) scrollTweenY = null;
      direction = this.enabledMultiScroll ? Direction.Both : Direction.None;
      Ticker.remove(update);
      this.emit("scrollend");
    };

    const update = (delta: number) => {
      if (!throwItem) {
        direction = this.enabledMultiScroll ? Direction.Both : Direction.None;
        Ticker.remove(update);
        this.emit("scrollend");
        return;
      }

      const damping = this.damping * Math.min(1, delta / 16); // deceleration coefficient
      const easeDuration = this.easeDuration;

      let vx = 100;
      let vy = 100;

      if (!enabledHorizontal) throwItem.vx = 0;
      if (!enabledVertical) throwItem.vy = 0;

      if (!scrollTweenX) {
        throwItem.vx *= damping;
        vx = throwItem.vx * delta;
        this._scrollPositionX -= vx;
      }

      if (!scrollTweenY) {
        throwItem.vy *= damping;
        vy = throwItem.vy * delta;
        this._scrollPositionY -= vy;
      }

      if (!scrollTweenX && !scrollTweenY) {
        this.updatePosition();
      }

      const tweenObj = {
        scrollPositionX: this._scrollPositionX,
        scrollPositionY: this._scrollPositionY,
      };
      if (enabledHorizontal && !scrollTweenX) {
        if (this._scrollPositionX < this.minScrollPositionX) {
          scrollTweenX = new Tween(tweenObj)
            .to(
              {
                scrollPositionX: this.minScrollPositionX,
              },
              easeDuration,
              Ease.quadOut
            )
            .onUpdate(() => {
              this._scrollPositionX = tweenObj.scrollPositionX;
              this.updatePosition();
            })
            .call(() => onCompleteBackTween());
          throwItem.vx = 0;
        } else if (this._scrollPositionX > this.maxScrollPositionX) {
          scrollTweenX = new Tween(tweenObj)
            .to(
              {
                scrollPositionX: this.maxScrollPositionX,
              },
              easeDuration,
              Ease.quadOut
            )
            .onUpdate(() => {
              this._scrollPositionX = tweenObj.scrollPositionX;
              this.updatePosition();
            })
            .call(() => onCompleteBackTween());
          throwItem.vx = 0;
        }
      }
      if (enabledVertical && !scrollTweenY) {
        if (this._scrollPositionY < this.minScrollPositionY) {
          scrollTweenY = new Tween(tweenObj)
            .to(
              {
                scrollPositionY: this.minScrollPositionY,
              },
              easeDuration,
              Ease.quadOut
            )
            .onUpdate(() => {
              this._scrollPositionY = tweenObj.scrollPositionY;
              this.updatePosition();
            })
            .call(() => onCompleteBackTween());
          throwItem.vy = 0;
        } else if (this._scrollPositionY > this.maxScrollPositionY) {
          scrollTweenY = new Tween(tweenObj)
            .to(
              {
                scrollPositionY: this.maxScrollPositionY,
              },
              easeDuration,
              Ease.quadOut
            )
            .onUpdate(() => {
              this._scrollPositionY = tweenObj.scrollPositionY;
              this.updatePosition();
            })
            .call(() => onCompleteBackTween());
          throwItem.vy = 0;
        }
      }

      if (Math.abs(vx) < 0.1 && Math.abs(vy) < 0.1) {
        throwItem = null;
      }
    };

    this.update = update;

    // mousewheel
    let beforeUpdateTime = 0;
    container.addEventListener(
      "wheel",
      (event) => {
        if (!this.enabledMouseWheel) return;

        event.preventDefault();
        // event.stopPropagation();

        if (beforeUpdateTime + 1000 < Date.now()) {
          beforeUpdateTime = Date.now();
          this.updateSize();
        }

        let { deltaX, deltaY } = event;

        if (event.ctrlKey) {
          this.scale = Math.max(
            0.2,
            Math.min(2, this.scale - event.deltaY * 0.01)
          );
          this.updatePosition();
        } else {
          if (typeof deltaX === "undefined" || typeof deltaY === "undefined") {
            deltaX = 0;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            deltaY = (event as any).wheelDelta * -1;
          }

          const beforeScrollPositionX = this._scrollPositionX;
          const beforeScrollPositionY = this._scrollPositionY;

          if (
            beforeScrollPositionX === this.maxScrollPositionX &&
            deltaX > 0 &&
            (beforeScrollPositionY === this.maxScrollPositionY ||
              beforeScrollPositionY === this.minScrollPositionY)
          )
            return;
          if (
            beforeScrollPositionX === 0 &&
            deltaX < 0 &&
            (beforeScrollPositionY === this.maxScrollPositionY ||
              beforeScrollPositionY === this.minScrollPositionY)
          )
            return;
          if (
            beforeScrollPositionY === this.maxScrollPositionY &&
            deltaY > 0 &&
            (beforeScrollPositionX === this.maxScrollPositionX ||
              beforeScrollPositionX === this.minScrollPositionX)
          )
            return;
          if (
            beforeScrollPositionY === 0 &&
            deltaY < 0 &&
            (beforeScrollPositionX === this.maxScrollPositionX ||
              beforeScrollPositionX === this.minScrollPositionX)
          )
            return;

          let nextScrollPositionX = this._scrollPositionX;
          let nextScrollPositionY = this._scrollPositionY;

          if (this.enabledHorizontalScroll) {
            nextScrollPositionX = Math.max(
              this.minScrollPositionX,
              Math.min(this.maxScrollPositionX, beforeScrollPositionX + deltaX)
            );
          }
          if (this.enabledVerticalScroll) {
            nextScrollPositionY = Math.max(
              this.minScrollPositionY,
              Math.min(this.maxScrollPositionY, beforeScrollPositionY + deltaY)
            );
          }

          if (
            beforeScrollPositionX !== nextScrollPositionX ||
            beforeScrollPositionY !== nextScrollPositionY
          ) {
            this._scrollPositionX = nextScrollPositionX;
            this._scrollPositionY = nextScrollPositionY;
            this.updatePosition();
          }
        }
      },
      { passive: false }
    );

    this.onResize = () => this.refresh();
    window.addEventListener("resize", this.onResize);
  }

  /**
   * update position
   */
  protected updatePosition() {
    this.emit("scroll", {
      x: this._scrollPositionX,
      y: this._scrollPositionY,
      scale: this._scale,
    });
  }

  /**
   * update size
   */
  public updateSize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.setScrollPosition(this._scrollPositionX, this._scrollPositionY);
  }

  /**
   * refresh
   */
  public refresh() {
    this.updateSize();
    this.updatePosition();
  }

  /**
   * set scroll position
   * @param position
   */
  public setScrollPosition(
    x: number,
    y: number,
    animate: boolean | number = false,
    callback?: () => void
  ) {
    if (this.scrollTween) {
      this.scrollTween.stop();
      this.scrollTween = undefined;
    }

    x = Math.max(this.minScrollPositionX, Math.min(this.maxScrollPositionX, x));
    y = Math.max(this.minScrollPositionY, Math.min(this.maxScrollPositionY, y));

    if (animate) {
      const data = { x: this._scrollPositionX, y: this._scrollPositionY };
      this.scrollTween = new Tween(data)
        .to(
          {
            x: this.enabledHorizontalScroll ? x : this._scrollPositionX,
            y: this.enabledVerticalScroll ? y : this._scrollPositionY,
          },
          typeof animate === "boolean" ? 500 : animate,
          Ease.cubicInOut
        )
        .onUpdate(() => {
          this._scrollPositionX = data.x;
          this._scrollPositionY = data.y;
          this.updatePosition();
        })
        .call(() => {
          if (callback) callback();
        });
    } else {
      if (this.enabledHorizontalScroll) this._scrollPositionX = x;
      if (this.enabledVerticalScroll) this._scrollPositionY = y;
      this.updatePosition();
      if (callback) callback();
    }
  }

  public set scrollPositionX(value: number) {
    this.setScrollPosition(value, this._scrollPositionY);
  }
  public get scrollPositionX(): number {
    return this._scrollPositionX;
  }
  public set scrollPositionY(value: number) {
    this.setScrollPosition(this._scrollPositionX, value);
  }
  public get scrollPositionY(): number {
    return this._scrollPositionY;
  }
  public set scale(value: number) {
    this._scale = value;
    this.updatePosition();
  }
  public get scale(): number {
    return this._scale;
  }

  /**
   * dispose
   */
  public dispose() {
    window.removeEventListener("resize", this.updateSizeBind);
    Ticker.remove(this.update);
    if (global.___scrollingInstance === this) {
      global.___scrollingInstance = undefined;
    }
    if (this.touchManager) {
      this.touchManager.dispose();
    }

    window.removeEventListener("resize", this.onResize);
  }
}

interface ScrollerEventMap {
  scrollstart: ScrollStartEvent;
  scroll: ScrollEvent;
  scrollend: undefined;
}

interface ScrollStartEvent {
  type: "scrollstart";
  direction: Direction;
}
interface ScrollEvent {
  type: "scroll";
  x: number;
  y: number;
  scale: number;
}
