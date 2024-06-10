import { EventEmitter } from "../events/EventEmitter";
import { TouchItem, TouchManager } from "../managers/TouchManager";
import { Ease, Tween } from "../tween/Tween";

function arrayDiff<T>(a: T[], b: T[]): T[] {
  const result: T[] = [];
  for (const num of b) {
    if (a.indexOf(num) === -1) {
      result.push(num);
    }
  }
  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const global: { ___scrollingInstance: any } = window as any;

/**
 * Carousel
 */
export class Carousel extends EventEmitter<CarouselEventMap> {
  readonly VERSION = "1.0.0";

  public enabled = true;
  public enabledScrollIndicator = false;
  public enabledMouseWheel = false;

  public mouseWheelScrollDelay = 1000;

  private options: CarouselOption;
  private _itemMargin = 0;

  public indicatorMargin = 2;
  public indicatorWidth = 2;

  public speedRatio = 1;

  public scrollThreshold = 5;

  public touchManager?: TouchManager<unknown>;

  protected _width = 200;
  protected _height = 200;
  protected _scrollPosition = 0;

  protected scrollerWidth = 0;
  protected scrollerHeight = 0;

  protected container: HTMLElement;
  protected scroller: HTMLElement;
  protected indicator: HTMLElement;

  private _index = 0;
  private _direction: Direction | "vertical" | "horizontal" = "horizontal";
  private _reversed = false;

  private enabledFireEvent = true;
  private updateHandler: () => void;
  private wheelHandler: (event: WheelEvent) => void;
  private currEventTarget?: HTMLElement;
  private resizeObserver?: ResizeObserver;

  private scrollTween?: Tween<{ x: number }> | Tween<{ y: number }>;

  private visibleIndexes: number[];

  private indicatorVisible = false;
  private setDirectionIndicatorTimer?: number;

  private transitioning = false;
  private keyDownHandler = (event: KeyboardEvent) => {
    if (document.activeElement !== event.currentTarget) return;
    if (this.transitioning) return;

    switch (event.key) {
      case "ArrowRight":
        this.setIndex(this.index + 1, true, 1.5);
        break;
      case "ArrowLeft":
        this.setIndex(this.index - 1, true, 1.5);
        break;
      case "Enter":
        break;
    }
  };
  private mouseDownHandler = (event: MouseEvent) => {
    event.preventDefault();
  };

  /**
   * constructor
   */
  constructor(container: HTMLElement, options: CarouselOption = {}) {
    super();

    this.options = options;
    const eventTarget = options.eventTarget || container;

    this.visibleIndexes = [];

    // container
    this.container = container;
    // this.container.style.overflow = 'hidden';

    // scroller
    this.scroller = container.children.item(0) as HTMLElement;
    this.scroller.classList.add("carousel-scroller");
    if (options.scrollerClassName) {
      this.scroller.classList.add(options.scrollerClassName);
    }
    this.scroller.style.zIndex = "1";
    this.scroller.style.position = "absolute";
    this.scroller.style.overflow = "visible";

    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(() => {
        this.updateSize();
      });
      resizeObserver.observe(this.scroller);
      this.resizeObserver = resizeObserver;
    }

    // indicator
    this.indicator = document.createElement("div");
    this.indicator.classList.add("carousel-indicator");
    if (options.indicatorClassName) {
      this.indicator.classList.add(options.indicatorClassName);
    }
    this.indicator.style.position = "absolute";
    this.indicator.style.zIndex = "2";
    this.indicator.style.pointerEvents = "none";

    this.container.appendChild(this.indicator);

    this.updateSize();

    this.updateHandler = () => {
      this.updateSize();
    };
    window.addEventListener("resize", this.updateHandler);

    this.wheelHandler = (event: WheelEvent) => {
      if (!this.enabledMouseWheel) return;
      event.preventDefault();
      event.stopPropagation();
      if (!this.enabled) return;
      if (this.scrollTween) return;

      let delta = this._direction === "vertical" ? event.deltaY : event.deltaX;
      if (this._reversed) delta *= -1;

      if (Math.abs(delta) > 3) {
        // move to next frame
        let nextFrameIndex = delta > 0 ? this._index + 1 : undefined;

        // move to prev frame
        if (typeof nextFrameIndex === "undefined") {
          nextFrameIndex = this._index - 1;
        }

        this.setIndicatorVisible(true);
        this.setIndex(nextFrameIndex, true);
      }
    };

    this.setEventTarget(eventTarget);
  }

  public setEventTarget(eventTarget: HTMLElement) {
    if (this.touchManager) {
      this.touchManager.dispose();
    }
    if (this.currEventTarget) {
      this.currEventTarget.removeEventListener("wheel", this.wheelHandler);
    }

    // touch scroll
    const touchManager = (this.touchManager = new TouchManager(eventTarget));
    touchManager.autoPreventDefault = false;
    let touchItem: TouchItem;
    let scrolling = false;
    let disabledScroll = false;
    eventTarget.addEventListener("click", (event) => {
      if (scrolling) {
        event.preventDefault();
        event.stopPropagation();
      }
    });
    touchManager.on("add", (event) => {
      if (!this.enabled) return;

      scrolling = false;
      disabledScroll = false;
      touchItem = event.items[0];
    });
    touchManager.on("move", (event) => {
      if (!this.enabled) return;
      if (disabledScroll) return;

      if (global.___scrollingInstance && global.___scrollingInstance !== this) {
        return;
      }

      if (!scrolling && !disabledScroll) {
        const scrollThreshold =
          this.scrollThreshold * (window.devicePixelRatio || 1);
        if (
          Math.abs(
            this._direction === "horizontal"
              ? touchItem.offsetX
              : touchItem.offsetY
          ) > scrollThreshold
        ) {
          scrolling = true;
          global.___scrollingInstance = this;
        }
        if (
          Math.abs(
            this._direction === "horizontal"
              ? touchItem.offsetY
              : touchItem.offsetX
          ) > scrollThreshold
        ) {
          disabledScroll = true;
          this.setIndex(this.index, true);
          return;
        }
      }

      if (scrolling) {
        if (event.originalEvent.cancelable) {
          event.originalEvent.preventDefault();
        }
      }

      this.cancelTween();

      if (scrolling) {
        if (this._direction === "horizontal") {
          let moveX = touchItem.moveX;
          if (
            !this.options.loop &&
            ((this._scrollPosition < 0 && moveX > 0) ||
              (this._scrollPosition > this.scrollerWidth - this._width &&
                moveX < 0))
          ) {
            moveX *= 0.6;
          }
          this.setScrollPosition(this._scrollPosition - moveX);
          this.setIndicatorVisible(true);
        } else {
          let moveY = touchItem.moveY;
          if (
            !this.options.loop &&
            ((this._scrollPosition < 0 && moveY > 0) ||
              (this._scrollPosition > this.scrollerHeight - this._height &&
                moveY < 0))
          ) {
            moveY *= 0.6;
          }
          this.setScrollPosition(this._scrollPosition - moveY);
          this.setIndicatorVisible(true);
        }
      }
    });
    touchManager.on("remove", () => {
      if (!touchManager.touches || touchManager.touches.length === 0) {
        if (global.___scrollingInstance === this) {
          global.___scrollingInstance = undefined;
        }
      }

      if (!this.enabled) return;
      if (disabledScroll) return;

      const accelerationThreshold = 0.5;

      if (this._direction === "horizontal") {
        const tweenScale = Math.min(
          1.5,
          Math.max(0.6, Math.abs(touchItem.vx) / 0.9)
        );

        if (Math.abs(touchItem.vx) > accelerationThreshold) {
          this.setIndex(
            this.index + (touchItem.vx > 0 ? -1 : 1),
            true,
            tweenScale
          );
        } else if (Math.abs(touchItem.offsetX) > this._width * 0.25) {
          this.setIndex(this.index + (touchItem.offsetX > 0 ? -1 : 1), true);
        } else {
          this.setIndex(this.index, true);
        }
      } else {
        const tweenScale = Math.min(
          1.5,
          Math.max(0.6, Math.abs(touchItem.vy) / 0.9)
        );
        if (Math.abs(touchItem.vy) > accelerationThreshold) {
          this.setIndex(
            this.index + (touchItem.vy > 0 ? -1 : 1),
            true,
            tweenScale
          );
        } else if (Math.abs(touchItem.offsetY) > this._height * 0.25) {
          this.setIndex(this.index + (touchItem.offsetY > 0 ? -1 : 1), true);
        } else {
          this.setIndex(this.index, true);
        }
      }
    });

    // mousewheel
    eventTarget.addEventListener("wheel", this.wheelHandler, {
      passive: false,
    });

    this.currEventTarget = eventTarget;
  }

  /**
   * set scroll direction
   */
  public set direction(value: Direction | "vertical" | "horizontal") {
    switch (value) {
      case "horizontal":
        this._direction = "horizontal";
        break;
      case "vertical":
        this._direction = "vertical";
        break;
      default:
        console.error(`direction invalid value: ${value}`);
        return;
    }

    this.updateSize();
  }

  /**
   * get scroll direction
   */
  public get direction(): Direction | "vertical" | "horizontal" {
    return this._direction;
  }

  /**
   * set reverse flag
   */
  public set reversed(value: boolean) {
    if (this._reversed === value) return;
    this._reversed = value;
    this.updateSize();
  }

  /**
   * get reverse flag
   */
  public get reversed(): boolean {
    return this._reversed;
  }

  /**
   * get scroll position
   */
  public get scrollPosition() {
    return this._scrollPosition;
  }

  /**
   * set scroll position
   */
  protected setScrollPosition(value: number): void {
    this._scrollPosition = value;

    const width = this._width;
    const height = this._height;
    const itemMargin = this._itemMargin;
    const childCount = this.scroller.children.length;

    //
    let offsetX = 0;
    let offsetY = 0;
    if (this._direction === "horizontal") {
      offsetX = value * -1;
    } else {
      offsetY = value * -1;
    }

    const positions: number[] = [];

    // set item positions
    for (let i = 0; i < childCount; i++) {
      const childIndex = this._reversed ? childCount - i - 1 : i;
      const child = this.scroller.children[childIndex] as HTMLElement;

      let left = 0;
      let top = 0;
      if (this._direction === "horizontal") {
        left = i * (width + itemMargin) + offsetX;
        if (this.options.loop) {
          if (left + width + itemMargin < 0) {
            left += childCount * (width + itemMargin);
          } else if (left > width + itemMargin) {
            left -= childCount * (width + itemMargin);
          }
        }
        positions[childIndex] = left;
      } else {
        top = i * (height + itemMargin) + offsetY;
        if (this.options.loop) {
          if (top + height + itemMargin < 0) {
            top += childCount * (height + itemMargin);
          } else if (top > height + itemMargin) {
            top -= childCount * (height + itemMargin);
          }
        }
        positions[childIndex] = top;
      }
      child.style.width = `${width}px`;
      child.style.height = `${height}px`;
      child.style.transform = `translate3d(${left}px, ${top}px, 0)`;
    }

    this.updateScrollIndicator();

    // fire show, hide events
    const visibleIndexes: number[] = [];
    positions.forEach((pos, i) => {
      if (this._direction === "horizontal") {
        const left = pos;
        const right = pos + width;
        if ((left >= 0 && left < width) || (right > 0 && right < width)) {
          visibleIndexes.push(i);
        }
      } else {
        const top = pos;
        const bottom = pos + height;
        if ((top >= 0 && top < height) || (bottom > 0 && bottom < height)) {
          visibleIndexes.push(i);
        }
      }
    });

    if (this.visibleIndexes.join(",") !== visibleIndexes.join(",")) {
      const newVisibleIndexes = arrayDiff(this.visibleIndexes, visibleIndexes);
      const lastIndex = this.lastIndex;
      for (let index of newVisibleIndexes) {
        if (this._reversed) index = lastIndex - index - 1;

        const element = this.getElementAt(index);
        element.setAttribute("data-shown", "true");
        element.setAttribute("tabIndex", "0");
        element.addEventListener("keydown", this.keyDownHandler);
        element.addEventListener("mousedown", this.mouseDownHandler);

        this.emit("show", { index, element });
      }

      const hideIndexes = arrayDiff(visibleIndexes, this.visibleIndexes);
      for (let index of hideIndexes) {
        if (this._reversed) index = lastIndex - index - 1;
        const element = this.getElementAt(index);
        if (element) {
          element.removeAttribute("data-shown");
          element.removeAttribute("tabIndex");
          element.removeEventListener("keydown", this.keyDownHandler);
          element.removeEventListener("mousedown", this.mouseDownHandler);
          this.emit("hide", { index, element });
        }
      }

      this.visibleIndexes = visibleIndexes;
    }

    this.emit("scroll", { scrollPosition: this._scrollPosition });
  }

  /**
   * update scroll indicator
   */
  protected updateScrollIndicator() {
    if (!this.enabledScrollIndicator || this.options.loop) {
      this.setIndicatorVisible(false);
      return;
    }
    const indicatorMargin = this.indicatorMargin;
    const childCount = this.scroller.children.length;

    if (this._direction === "horizontal") {
      const maxScrollPosition = this.scrollerWidth - this._width;
      let indicatorWidth = (this._width - indicatorMargin * 2) / childCount;
      let indicatorPositionX =
        indicatorMargin +
        (this._width - indicatorMargin * 2 - indicatorWidth) *
          (this._scrollPosition / maxScrollPosition);
      if (indicatorMargin - indicatorPositionX > 0) {
        indicatorWidth -= indicatorMargin - indicatorPositionX;
        indicatorPositionX = indicatorMargin;
      }
      const indicatorOffsetWidth =
        indicatorPositionX + indicatorWidth + 3 - this._width;
      if (indicatorOffsetWidth > 0) {
        indicatorWidth -= indicatorOffsetWidth;
      }
      this.indicator.style.transform = `translate3d(${indicatorPositionX}px, 0px, 0)`;
      this.indicator.style.width = indicatorWidth + "px";
    } else {
      const maxScrollPosition = this.scrollerHeight - this._height;
      let indicatorHeight = (this._height - indicatorMargin * 2) / childCount;
      let indicatorPositionY =
        indicatorMargin +
        (this._height - indicatorMargin * 2 - indicatorHeight) *
          (this._scrollPosition / maxScrollPosition);
      if (indicatorMargin - indicatorPositionY > 0) {
        indicatorHeight -= indicatorMargin - indicatorPositionY;
        indicatorPositionY = indicatorMargin;
      }
      const indicatorOffsetHeight =
        indicatorPositionY + indicatorHeight + indicatorMargin - this._height;
      if (indicatorOffsetHeight > 0) {
        indicatorHeight -= indicatorOffsetHeight;
      }
      this.indicator.style.transform = `translate3d(0, ${indicatorPositionY}px, 0)`;
      this.indicator.style.height = indicatorHeight + "px";
    }
  }

  /**
   * set indicator visibility
   */
  protected setIndicatorVisible(visible: boolean): void {
    if (this.options.loop) return;
    if (this.indicatorVisible === visible) return;
    if (visible && !this.enabledScrollIndicator) return;
    this.indicatorVisible = visible;

    if (this.setDirectionIndicatorTimer) {
      window.clearTimeout(this.setDirectionIndicatorTimer);
    }

    if (visible) {
      this.indicator.classList.add("show");
    } else {
      this.indicator.classList.remove("show");
    }
    this.updateScrollIndicator();
  }

  /**
   * flash scroll indicator
   */
  public flashScrollIndicator(): void {
    this.setIndicatorVisible(true);
    if (this.setDirectionIndicatorTimer) {
      window.clearTimeout(this.setDirectionIndicatorTimer);
    }
    this.setDirectionIndicatorTimer = window.setTimeout(() => {
      this.setIndicatorVisible(false);
    }, 1000);
  }

  /**
   * set item index
   */
  public setIndex(
    index: number,
    animate = false,
    tweenScale = 1,
    callback?: () => void
  ): void {
    const width = this._width;
    const height = this._height;
    const itemMargin = this._itemMargin;
    const beforeIndex = this._index;
    const childCount = this.scroller.children.length;
    const currentIndex = this._index;
    const currentScrollPosition = this._scrollPosition;
    index = Math.floor(index);

    let nextIndex = index;
    if (this.options.loop && childCount > 0) {
      while (nextIndex < 0) {
        nextIndex += childCount;
      }
      while (nextIndex > childCount - 1) {
        nextIndex -= childCount;
      }
    }
    nextIndex = Math.max(0, Math.min(childCount - 1, nextIndex));

    const beforeElem = this.getElementAt(beforeIndex);
    const hasFocus = document.activeElement === beforeElem;
    if (hasFocus) {
      beforeElem.blur();
    }

    const onChanged = () => {
      this.transitioning = false;
      this.setIndicatorVisible(false);
      this.emit("change", { fromIndex: currentIndex, index: nextIndex });
      if (callback) callback();
    };

    this.cancelTween();

    this._index = nextIndex;

    if (hasFocus) {
      const nextElem = this.getElementAt(nextIndex);
      nextElem.setAttribute("tabIndex", "0");
      nextElem.focus();
    }

    if (this.enabledFireEvent && beforeIndex !== nextIndex) {
      this.emit("changing", { fromIndex: currentIndex, index: nextIndex });
    }

    let positionIndex = !this._reversed
      ? nextIndex
      : this.lastIndex - nextIndex;
    if (this.options.loop) {
      positionIndex = !this._reversed ? nextIndex : this.lastIndex - nextIndex;
    }

    if (animate) {
      this.transitioning = true;
      if (this._direction === "horizontal") {
        const nextScrollPositionX = positionIndex * (width + itemMargin);
        const pos = { x: currentScrollPosition };
        const duration =
          Math.min(
            900,
            Math.max(
              300,
              Math.abs(nextScrollPositionX - currentScrollPosition) * 0.9
            )
          ) / tweenScale;

        // Tween
        this.scrollTween = new Tween(pos)
          .to(
            {
              x: nextScrollPositionX,
            },
            duration * this.speedRatio,
            Ease.sineOut
          )
          .onUpdate(() => {
            this.setScrollPosition(pos.x);
          })
          .call(() => {
            if (this.scrollTween) {
              setTimeout(() => {
                this.scrollTween = undefined;
              }, this.mouseWheelScrollDelay);
            }
            this.setScrollPosition(nextIndex * (width + itemMargin));
            onChanged();
          });
      } else {
        const nextScrollPositionY = positionIndex * (height + itemMargin);
        const pos = { y: currentScrollPosition };
        const duration = Math.min(
          900,
          Math.max(
            300,
            Math.abs(nextScrollPositionY - currentScrollPosition) * 0.9
          )
        );

        // Tween
        this.scrollTween = new Tween(pos)
          .to(
            {
              y: nextScrollPositionY,
            },
            duration * this.speedRatio,
            Ease.sineOut
          )
          .onUpdate(() => {
            this.setScrollPosition(pos.y);
          })
          .call(() => {
            if (this.scrollTween) {
              setTimeout(() => {
                this.scrollTween = undefined;
              }, this.mouseWheelScrollDelay);
            }
            this.setScrollPosition(nextIndex * (height + itemMargin));
            onChanged();
          });
      }
    } else {
      if (this._direction === "horizontal") {
        this.setScrollPosition(
          positionIndex * (this._width + this._itemMargin)
        );
      } else {
        this.setScrollPosition(
          positionIndex * (this._height + this._itemMargin)
        );
      }
      onChanged();
    }

    this.flashScrollIndicator();
  }

  /**
   * set current item index
   */
  public set index(value: number) {
    this.setIndex(value);
  }

  /**
   * get current item index
   */
  public get index(): number {
    return this._index;
  }

  /**
   * get last item index
   */
  public get lastIndex(): number {
    return this.scroller.children.length - 1;
  }

  /**
   * get HTMLElement by item index
   */
  public getElementAt(index: number): HTMLElement {
    return this.scroller.children.item(index) as HTMLElement;
  }

  /**
   * get animating flag
   */
  public get animating(): boolean {
    return !!this.scrollTween;
  }

  /**
   * item margin
   */
  public set itemMargin(value: number) {
    this._itemMargin = value;
    this.updateSize();
  }
  public get itemMargin(): number {
    return this._itemMargin;
  }

  /**
   * set carousel size
   */
  public updateSize(): void {
    // if (!this._width || !this._height) return;

    const width = this.container.offsetWidth;
    const height = this.container.offsetHeight;

    this._width = width;
    this._height = height;

    const n = this.scroller.children.length;
    for (let i = 0; i < n; i++) {
      const child = this.scroller.children[i] as HTMLElement;
      child.style.position = "absolute";
      child.style.top = child.style.left = "0";
      child.style.willChange = "transform";
    }

    const indicatorMargin = this.indicatorMargin;
    const indicatorWidth = this.indicatorWidth;
    this.indicator.style.minWidth = indicatorWidth + "px";
    this.indicator.style.minHeight = indicatorWidth + "px";
    this.indicator.style.borderRadius = indicatorWidth + "px";

    if (this._direction === "horizontal") {
      this.scrollerWidth =
        this.scroller.children.length * (width + this._itemMargin) -
        this._itemMargin;
      this.scrollerHeight = height;
      this.indicator.style.top = "auto";
      this.indicator.style.bottom = indicatorMargin + "px";
      this.indicator.style.right = "auto";
      this.indicator.style.left = "0x";
      this.indicator.style.height = indicatorWidth + "px";
    } else {
      this.scrollerWidth = width;
      this.scrollerHeight =
        this.scroller.children.length * (height + this._itemMargin) -
        this._itemMargin;
      this.indicator.style.top = "0px";
      this.indicator.style.bottom = "auto";
      this.indicator.style.right = indicatorMargin + "px";
      this.indicator.style.left = "auto";
      this.indicator.style.width = indicatorWidth + "px";
    }

    this.setScrollPosition(this._scrollPosition);

    this.enabledFireEvent = false;
    this.setIndex(this._index);
    this.enabledFireEvent = true;
  }

  /**
   * reset
   */
  public reset() {
    this.updateSize();
  }

  /**
   * dispose
   */
  public dispose() {
    window.removeEventListener("resize", this.updateHandler);
    if (this.touchManager) {
      this.touchManager.dispose();
    }
    if (this.currEventTarget) {
      this.currEventTarget.removeEventListener("wheel", this.wheelHandler);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.indicator.parentNode) {
      this.indicator.parentNode.removeChild(this.indicator);
    }
    if (global.___scrollingInstance === this) {
      global.___scrollingInstance = undefined;
    }
  }

  /**
   * getSize
   */
  public get width() {
    return this._width;
  }
  public get height() {
    return this._height;
  }

  /**
   * cancel tween
   */
  protected cancelTween(): void {
    if (this.scrollTween) {
      this.scrollTween.stop();
      this.scrollTween = undefined;
    }
  }
}

type Direction = "horizontal" | "vertical";

interface CarouselOption {
  eventTarget?: HTMLElement | null;
  scrollerClassName?: string;
  indicatorClassName?: string;
  loop?: boolean;
}

interface CarouselEventMap {
  show: CarouselShowHideEvent;
  hide: CarouselShowHideEvent;
  changing: CarouselChangeEvent;
  change: CarouselChangeEvent;
  scroll: CarouselScrollEvent;
}

export interface CarouselShowHideEvent {
  type: "show" | "hide";
  index: number;
  element: HTMLElement;
}

export interface CarouselChangeEvent {
  type: "changing" | "change";
  index: number;
  fromIndex: number;
}

export interface CarouselScrollEvent {
  type: "scroll";
  scrollPosition: number;
}
