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

export type ScrollViewHorizontalAlign = "left" | "center" | "right";
export type ScrollViewVerticalAlign = "top" | "center" | "bottom";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const global: { ___scrollingInstance: any } =
  typeof window !== "undefined"
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any)
    : {};

/**
 * ScrollView
 */
export class ScrollView extends EventEmitter<ScrollerEventMap> {
  private container: HTMLElement;
  private scroller: HTMLElement;
  private touchManager: TouchManager;

  private scrolling = false;
  private updateSizeBind: () => void;

  private horizontalIndicatorVisible = false;
  private verticalIndicatorVisible = false;
  private setDirectionIndicatorTimer?: number;
  private indicatorTimer?: number;

  protected width = 200;
  protected height = 200;

  protected _contentWidth = 0;
  protected _contentHeight = 0;

  protected _scrollPositionX = 0;
  protected _scrollPositionY = 0;

  protected horizontalIndicator: HTMLElement;
  protected verticalIndicator: HTMLElement;

  public damping = 0.975;
  public easeDuration = 350;
  public overScrollDamping = 0.5;

  public indicatorMargin = 2;
  public indicatorLineWidth = 2;

  public scrollThreshold = 5;

  public horizontalAlign: ScrollViewHorizontalAlign = "center";
  public verticalAlign: ScrollViewVerticalAlign = "center";

  public explicitWidth?: number;
  public explicitHeight?: number;
  public explicitContentWidth?: number;
  public explicitContentHeight?: number;

  public enabledHorizontalScroll: boolean | "auto" = "auto";
  public enabledVerticalScroll: boolean | "auto" = "auto";
  public enabledMultiScroll = false;
  public enabledMouseWheel = true;
  public enabledScrollIndicator = true;

  private onResize: () => void;
  private scrollTween?: Tween<{ x: number; y: number }> | null | undefined;
  private update: (delta: number) => void;
  private resizeObserver?: ResizeObserver;

  /**
   * constructor
   */
  constructor(container: HTMLElement, options: ScrollerOptions = {}) {
    super();

    this.container = container;

    this.scroller = container.children.item(0) as HTMLElement;
    // this.scroller.style.transition = 'transform 0.05s ease-out 0s';
    this.scroller.style.willChange = "transform";

    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(() => {
        this.updateSize();
      });
      resizeObserver.observe(this.scroller);
      this.resizeObserver = resizeObserver;
    }

    // horizontal indicators
    this.horizontalIndicator = document.createElement("div");
    this.horizontalIndicator.className =
      "scroller-indicator scroller-indicator-horizontal";
    if (options.indicatorClassName) {
      this.horizontalIndicator.classList.add(options.indicatorClassName);
    }
    if (options.horizontalIndicatorClassName) {
      this.horizontalIndicator.classList.add(
        options.horizontalIndicatorClassName
      );
    }
    this.horizontalIndicator.style.position = "absolute";
    this.horizontalIndicator.style.zIndex = "2000";
    this.horizontalIndicator.style.pointerEvents = "none";
    container.appendChild(this.horizontalIndicator);

    // vertical indicator
    this.verticalIndicator = document.createElement("div");
    this.verticalIndicator.className =
      "scroller-indicator scroller-indicator-vertical";
    if (options.indicatorClassName) {
      this.verticalIndicator.classList.add(options.indicatorClassName);
    }
    if (options.verticalIndicatorClassName) {
      this.verticalIndicator.classList.add(options.verticalIndicatorClassName);
    }
    this.verticalIndicator.style.position = "absolute";
    this.verticalIndicator.style.zIndex = "2000";
    this.verticalIndicator.style.pointerEvents = "none";
    container.appendChild(this.verticalIndicator);

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
      this.setScrollIndicatorVisible(false);

      if (direction !== Direction.None) {
        this.emit("scrollend");
      }

      this.scrolling = false;
      direction = this.enabledMultiScroll ? Direction.Both : Direction.None;
      touchItem = event.items[0];
      throwItem = null;

      this.updateSize();

      enabledHorizontal =
        this.enabledHorizontalScroll === true ||
        (this.width < this._contentWidth &&
          this.enabledHorizontalScroll === "auto");
      enabledVertical =
        this.enabledVerticalScroll === true ||
        (this.height < this._contentHeight &&
          this.enabledVerticalScroll === "auto");
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
          this.scrolling = true;
          this.scroller.style.pointerEvents = "none";
          this.emit("scrollstart", { direction });
        } else if (
          enabledVertical &&
          scrollThreshold < Math.abs(touchItem.offsetY)
        ) {
          global.___scrollingInstance = this;
          direction = Direction.Vertical;
          this.scrolling = true;
          this.scroller.style.pointerEvents = "none";
          this.emit("scrollstart", { direction });
        }
      }

      if (direction !== Direction.None) {
        if (enabledHorizontal) {
          if (
            direction === Direction.Both ||
            direction === Direction.Horizontal
          ) {
            let moveX = touchItem.moveX;
            if (
              (this._scrollPositionX < 0 && moveX > 0) ||
              (this._scrollPositionX > this._contentWidth - this.width &&
                moveX < 0)
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
            let moveY = touchItem.moveY;
            if (
              (this._scrollPositionY < 0 && moveY > 0) ||
              (this._scrollPositionY > this._contentHeight - this.height &&
                moveY < 0)
            ) {
              moveY *= this.overScrollDamping;
            }
            this._scrollPositionY = this._scrollPositionY - moveY;
          }
        }

        this.setScrollIndicatorVisible(
          true,
          direction === Direction.Both ? undefined : direction
        );
      }

      this.updatePosition();
    });
    touchManager.on("remove", () => {
      if (direction !== Direction.None) {
        throwItem = touchItem;

        if (this.scrolling) {
          this.scrolling = false;
          requestAnimationFrame(() => {
            this.scroller.style.pointerEvents = "";
          });
        }

        if (direction === Direction.Horizontal) throwItem.vy = 0;
        if (direction === Direction.Vertical) throwItem.vx = 0;

        Ticker.add(update);
      }
      if (global.___scrollingInstance === this) {
        global.___scrollingInstance = undefined;
      }
    });

    const onCompleteBackTween = () => {
      this.setScrollIndicatorVisible(false, direction);
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

      const basePosition = this.getBasePosition();
      if (enabledHorizontal && !scrollTweenX) {
        if (this._scrollPositionX < 0) {
          scrollTweenX = new Tween(tweenObj)
            .to(
              {
                scrollPositionX:
                  typeof basePosition.x !== "undefined" ? basePosition.x : 0,
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
        } else if (this._scrollPositionX > this._contentWidth - this.width) {
          scrollTweenX = new Tween(tweenObj)
            .to(
              {
                scrollPositionX:
                  typeof basePosition.x !== "undefined"
                    ? basePosition.x
                    : Math.max(0, this._contentWidth - this.width),
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
        if (this._scrollPositionY < 0) {
          scrollTweenY = new Tween(tweenObj)
            .to(
              {
                scrollPositionY:
                  typeof basePosition.y !== "undefined" ? basePosition.y : 0,
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
        } else if (this._scrollPositionY > this._contentHeight - this.height) {
          scrollTweenY = new Tween(tweenObj)
            .to(
              {
                scrollPositionY:
                  typeof basePosition.y !== "undefined"
                    ? basePosition.y
                    : Math.max(0, this._contentHeight - this.height),
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
        this.setScrollIndicatorVisible(false);
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
        if (typeof deltaX === "undefined" || typeof deltaY === "undefined") {
          deltaX = 0;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          deltaY = (event as any).wheelDelta * -1;
        }

        const maxScrollPositionX = this._contentWidth - this.width;
        const maxScrollPositionY = this._contentHeight - this.height;

        const beforeScrollPositionX = this._scrollPositionX;
        const beforeScrollPositionY = this._scrollPositionY;

        if (
          beforeScrollPositionX === maxScrollPositionX &&
          deltaX > 0 &&
          (beforeScrollPositionY === maxScrollPositionY ||
            beforeScrollPositionY === 0)
        )
          return;
        if (
          beforeScrollPositionX === 0 &&
          deltaX < 0 &&
          (beforeScrollPositionY === maxScrollPositionY ||
            beforeScrollPositionY === 0)
        )
          return;
        if (
          beforeScrollPositionY === maxScrollPositionY &&
          deltaY > 0 &&
          (beforeScrollPositionX === maxScrollPositionX ||
            beforeScrollPositionX === 0)
        )
          return;
        if (
          beforeScrollPositionY === 0 &&
          deltaY < 0 &&
          (beforeScrollPositionX === maxScrollPositionX ||
            beforeScrollPositionX === 0)
        )
          return;

        let nextScrollPositionX = this._scrollPositionX;
        let nextScrollPositionY = this._scrollPositionY;

        if (this.enabledHorizontalScroll) {
          nextScrollPositionX = Math.max(
            0,
            Math.min(maxScrollPositionX, beforeScrollPositionX + deltaX)
          );
        }
        if (this.enabledVerticalScroll) {
          nextScrollPositionY = Math.max(
            0,
            Math.min(maxScrollPositionY, beforeScrollPositionY + deltaY)
          );
        }

        if (
          beforeScrollPositionX !== nextScrollPositionX ||
          beforeScrollPositionY !== nextScrollPositionY
        ) {
          this._scrollPositionX = nextScrollPositionX;
          this._scrollPositionY = nextScrollPositionY;
          this.updatePosition();
          this.updateSize();

          if (this.indicatorTimer) window.clearTimeout(this.indicatorTimer);
          this.setScrollIndicatorVisible(true);
          this.indicatorTimer = window.setTimeout(() => {
            this.setScrollIndicatorVisible(false);
          }, 100);
        }
      },
      { passive: false }
    );

    // init
    this.updateSize();
    this.updateScrollIndicators();
    this.flashScrollIndicators();

    this.onResize = () => this.updateSize();
    window.addEventListener("resize", this.onResize);
  }

  /**
   *
   */
  private getBasePosition() {
    const horizontalAlign =
      this.horizontalAlign === "left"
        ? 2
        : this.horizontalAlign === "center"
          ? 1
          : 0;
    const verticalAlign =
      this.verticalAlign === "top"
        ? 2
        : this.verticalAlign === "center"
          ? 1
          : 0;

    const x =
      this._contentWidth < this.width
        ? ((this.width - this._contentWidth) / 2) * horizontalAlign * -1
        : undefined;
    const y =
      this._contentHeight < this.height
        ? ((this._contentHeight - this.height) / 2) * verticalAlign * -1
        : undefined;

    return { x, y };
  }

  /**
   * update position
   */
  protected updatePosition() {
    const x = this._scrollPositionX * -1;
    const y = this._scrollPositionY * -1;

    this.scroller.style.transform = `translate(${x}px, ${y}px)`;

    this.updateScrollIndicators();

    const maxScrollPosition = this.getMaxScrollPosition();
    this.emit("scroll", {
      scrollPositionX: this._scrollPositionX,
      scrollPositionY: this._scrollPositionY,
      maxScrollPositionX: maxScrollPosition.x,
      maxScrollPositionY: maxScrollPosition.y,
    });
  }

  /**
   * update size
   */
  public updateSize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this._contentWidth = this.scroller.offsetWidth;
    this._contentHeight = this.scroller.offsetHeight;
    if (this.explicitWidth !== undefined && this.explicitWidth !== null)
      this.width = this.explicitWidth;
    if (this.explicitHeight !== undefined && this.explicitHeight !== null)
      this.height = this.explicitHeight;
    if (
      this.explicitContentWidth !== undefined &&
      this.explicitContentWidth !== null
    ) {
      this._contentWidth = this.explicitContentWidth;
    }
    if (
      this.explicitContentHeight !== undefined &&
      this.explicitContentHeight !== null
    ) {
      this._contentHeight = this.explicitContentHeight;
    }

    this.setScrollPosition(this._scrollPositionX, this._scrollPositionY);
  }

  /**
   * スクロールインジケータを更新
   */
  protected updateScrollIndicators() {
    if (!this.enabledScrollIndicator) {
      this.setScrollIndicatorVisible(false);
      return;
    }

    const indicatorMargin = this.indicatorMargin;
    const indicatorLineWidth = this.indicatorLineWidth;

    const width = this.width;
    const height = this.height;
    const contentWidth = this._contentWidth;
    const contentHeight = this._contentHeight;

    const shownHorizontalIndicator =
      this.enabledHorizontalScroll &&
      this.horizontalIndicatorVisible &&
      width < contentWidth;
    const shownVerticalIndicator =
      this.enabledVerticalScroll &&
      this.verticalIndicatorVisible &&
      height < contentHeight;

    // horizontalIndicator
    if (this.enabledHorizontalScroll && this.horizontalIndicatorVisible) {
      const indicator = this.horizontalIndicator;
      const scrollPositionX = this._scrollPositionX;
      if (width >= contentWidth) {
        indicator.style.visibility = "hidden";
      } else {
        indicator.style.visibility = "visible";
        indicator.style.minWidth = indicatorLineWidth + "px";
        indicator.style.minHeight = indicatorLineWidth + "px";
        indicator.style.bottom = indicatorMargin + "px";

        const offset = shownVerticalIndicator
          ? indicatorLineWidth + indicatorMargin / 2
          : 0;
        let indicatorWidth =
          (width - offset - indicatorMargin * 2) / (contentWidth / width);
        const maxScrollPosition = Math.max(0, contentWidth - width);
        const positionRatio = scrollPositionX / maxScrollPosition;
        let indicatorPositionX =
          (width - offset - indicatorMargin * 2 - indicatorWidth) *
            positionRatio +
          indicatorMargin;
        if (indicatorPositionX < indicatorMargin) {
          indicatorWidth -= indicatorMargin - indicatorPositionX;
          indicatorPositionX = indicatorMargin;
        }
        if (
          indicatorPositionX + indicatorWidth >
          width - offset - indicatorMargin
        ) {
          indicatorWidth =
            width - offset - indicatorMargin - indicatorPositionX;
        }
        indicator.style.left = indicatorPositionX + "px";
        indicator.style.width = indicatorWidth + "px";
      }
    }

    // verticalIndicator
    if (this.enabledVerticalScroll && this.verticalIndicatorVisible) {
      const indicator = this.verticalIndicator;
      const scrollPositionY = this._scrollPositionY;
      if (height >= contentHeight) {
        indicator.style.visibility = "hidden";
      } else {
        indicator.style.visibility = "visible";
        indicator.style.minWidth = indicatorLineWidth + "px";
        indicator.style.minHeight = indicatorLineWidth + "px";
        indicator.style.right = indicatorMargin + "px";

        const offset = shownHorizontalIndicator
          ? indicatorLineWidth + indicatorMargin / 2
          : 0;
        let indicatorHeight =
          (height - offset - indicatorMargin * 2) / (contentHeight / height);
        const maxScrollPosition = Math.max(0, contentHeight - height);
        const positionRatio = scrollPositionY / maxScrollPosition;
        let indicatorPositionY =
          (height - offset - indicatorMargin * 2 - indicatorHeight) *
            positionRatio +
          indicatorMargin;
        if (indicatorPositionY < indicatorMargin) {
          indicatorHeight -= indicatorMargin - indicatorPositionY;
          indicatorPositionY = indicatorMargin;
        }
        if (
          indicatorPositionY + indicatorHeight >
          height - offset - indicatorMargin
        ) {
          indicatorHeight =
            height - offset - indicatorMargin - indicatorPositionY;
        }
        indicator.style.top = indicatorPositionY + "px";
        indicator.style.height = indicatorHeight + "px";
      }
    }
  }

  /**
   * flash scroll indicators
   */
  public flashScrollIndicators(duration = 500) {
    this.updateSize();
    this.updateScrollIndicators();
    this.setScrollIndicatorVisible(true);
    if (this.setDirectionIndicatorTimer) {
      window.clearTimeout(this.setDirectionIndicatorTimer);
    }
    this.setDirectionIndicatorTimer = window.setTimeout(() => {
      this.setScrollIndicatorVisible(false);
    }, duration);
  }

  /**
   * show/hide scroll indicator
   */
  protected setScrollIndicatorVisible(visible: boolean, direction?: Direction) {
    if (!direction || direction === Direction.Horizontal)
      this.horizontalIndicatorVisible = visible;
    if (!direction || direction === Direction.Vertical)
      this.verticalIndicatorVisible = visible;

    if (!this.enabledHorizontalScroll) this.horizontalIndicatorVisible = false;
    if (!this.enabledVerticalScroll) this.verticalIndicatorVisible = false;

    if (this.setDirectionIndicatorTimer) {
      window.clearTimeout(this.setDirectionIndicatorTimer);
    }

    if (visible) {
      if (this.enabledHorizontalScroll) {
        if (!direction || direction === Direction.Horizontal) {
          this.horizontalIndicator.classList.add("show");
        }
      } else {
        this.horizontalIndicator.classList.remove("show");
      }
      if (this.enabledVerticalScroll) {
        if (!direction || direction === Direction.Vertical) {
          this.verticalIndicator.classList.add("show");
        }
      } else {
        this.verticalIndicator.classList.remove("show");
      }
    } else {
      if (
        !direction ||
        direction === Direction.Horizontal ||
        direction === Direction.Both
      ) {
        this.horizontalIndicator.classList.remove("show");
      }
      if (
        !direction ||
        direction === Direction.Vertical ||
        direction === Direction.Both
      ) {
        this.verticalIndicator.classList.remove("show");
      }
    }
  }

  /**
   *
   */
  public get elem() {
    return this.container;
  }

  /**
   * max scroll position
   */
  public getMaxScrollPosition(): { x: number; y: number } {
    const x = this._contentWidth - this.width;
    const y = this._contentHeight - this.height;
    return { x, y };
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

    const maxScrollPosition = this.getMaxScrollPosition();
    const maxScrollPositionX = maxScrollPosition.x;
    const maxScrollPositionY = maxScrollPosition.y;

    const horizontalAlign =
      this.horizontalAlign === "left"
        ? 0
        : this.horizontalAlign === "center"
          ? 1
          : 2;
    const verticalAlign =
      this.verticalAlign === "top"
        ? 0
        : this.verticalAlign === "center"
          ? 1
          : 2;

    x =
      this._contentWidth < this.width
        ? ((this.width - this._contentWidth) / 2) * horizontalAlign * -1
        : Math.max(0, Math.min(maxScrollPositionX, x));
    y =
      this._contentHeight < this.height
        ? ((this._contentHeight - this.height) / 2) * verticalAlign * -1
        : Math.max(0, Math.min(maxScrollPositionY, y));

    if (animate) {
      const data = { x: this._scrollPositionX, y: this._scrollPositionY };
      this.scrollTween = new Tween(data)
        .to(
          {
            x: this.enabledHorizontalScroll ? x : this._scrollPositionX,
            y: this.enabledVerticalScroll ? y : this._scrollPositionY,
          },
          typeof animate === "boolean" ? 500 : animate,
          Ease.cubicOut
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

  /**
   * contentWidth
   */
  public get contentWidth() {
    return this._contentWidth;
  }

  /**
   * contentHeight
   */
  public get contentHeight() {
    return this._contentHeight;
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
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    if (this.horizontalIndicator.parentNode) {
      this.horizontalIndicator.parentNode.removeChild(this.horizontalIndicator);
    }
    if (this.verticalIndicator.parentNode) {
      this.verticalIndicator.parentNode.removeChild(this.verticalIndicator);
    }

    window.removeEventListener("resize", this.onResize);
  }
}

export interface ScrollerOptions {
  indicatorClassName?: string;
  verticalIndicatorClassName?: string;
  horizontalIndicatorClassName?: string;
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
  scrollPositionX: number;
  scrollPositionY: number;
  maxScrollPositionX: number;
  maxScrollPositionY: number;
}
