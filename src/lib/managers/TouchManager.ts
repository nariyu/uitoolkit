import { EventEmitter } from "../events/EventEmitter";
import { Vector2 } from "../geom/Vector2";
import { Clock } from "../utils/Clock";

let touchCount = 0;

// optimize touch event
let _Moving = false;
(() => {
  if (typeof window === "undefined") return;
  const THRESHOLD = 5;
  let pos = { x: 0, y: 0 };
  const win: Window = window;
  if ("ontouchstart" in window) {
    win.addEventListener("touchstart", (event: TouchEvent) => {
      _Moving = false;
      const touch = event.changedTouches[0];
      pos = { x: touch.pageX, y: touch.pageY };
    });
    win.addEventListener("touchmove", (event: TouchEvent) => {
      if (_Moving) return;
      const touch = event.changedTouches[0];
      if (
        Math.abs(touch.pageX - pos.x) > THRESHOLD ||
        Math.abs(touch.pageY - pos.y) > THRESHOLD
      ) {
        _Moving = true;
      }
    });
  } else {
    win.addEventListener("mousedown", (event: MouseEvent) => {
      _Moving = false;
      pos = { x: event.pageX, y: event.pageY };
    });
    win.addEventListener("mousemove", (event: MouseEvent) => {
      if (_Moving) return;
      if (
        Math.abs(event.pageX - pos.x) > THRESHOLD ||
        Math.abs(event.pageY - pos.y) > THRESHOLD
      ) {
        _Moving = true;
      }
    });
  }
})();

/**
 * TouchManager
 */
export class TouchManager<T = unknown> extends EventEmitter<
  TouchManagerEventMap<T>
> {
  public static get moving(): boolean {
    return _Moving;
  }

  private disposed = false;

  public touches: TouchList | undefined;
  public autoPreventDefault = true;

  /**
   * constructor
   */
  constructor(public target: HTMLElement) {
    super();

    let touching = false;

    const touchList: { [key: string]: TouchItem<T> } = {};

    const touchStartHandler = (event: MouseEvent | TouchEvent) => {
      // if (this.autoPreventDefault) {
      //   event.preventDefault();
      // }

      touching = true;

      const items: TouchItem<T>[] = [];

      if (event.type.match(/^touch/)) {
        const touchEvent = event as TouchEvent;
        this.touches = touchEvent.touches;
        const changedTouches = touchEvent.changedTouches;
        const n = changedTouches.length;
        for (let i = 0; i < n; i++) {
          const touch = changedTouches[i];
          const touchX = touch.pageX;
          const touchY = touch.pageY;
          const identifier = touch.identifier + "+";
          const item = new TouchItem<T>(++touchCount + "", touchX, touchY);
          item.event = event;
          touchList[identifier] = item;

          items.push(item);
        }
      } else {
        const mouseEvent = event as MouseEvent;
        const touchX = mouseEvent.pageX;
        const touchY = mouseEvent.pageY;
        const identifier = "0+";
        const item = new TouchItem<T>(++touchCount + "", touchX, touchY);
        item.event = event;
        touchList[identifier] = item;
        items.push(item);
      }

      this.emit("add", { items, originalEvent: event });
    };

    const touchMoveHandler = (event: MouseEvent | TouchEvent) => {
      if (this.disposed) {
        target.removeEventListener("touchstart", touchStartHandler);
        target.removeEventListener("mousedown", touchStartHandler);
        document.removeEventListener("touchmove", touchMoveHandler);
        document.removeEventListener("mousemove", touchMoveHandler);
        document.removeEventListener("touchend", touchEndHandler);
        document.removeEventListener("mouseup", touchEndHandler);
        document.removeEventListener("mouseleave", touchEndHandler);
        return;
      }
      if (!touching) return;

      if (this.autoPreventDefault && event.cancelable) {
        event.preventDefault();
      }

      const items: TouchItem<T>[] = [];

      let touchX = 0;
      let touchY = 0;
      let identifier = "";
      if (event.type.match(/^touch/)) {
        const touchEvent = event as TouchEvent;
        this.touches = touchEvent.touches;
        const changedTouches = touchEvent.changedTouches;
        const n = changedTouches.length;
        for (let i = 0; i < n; i++) {
          const touch = changedTouches[i];
          touchX = touch.pageX;
          touchY = touch.pageY;
          identifier = touch.identifier + "+";
          const item = touchList[identifier];
          if (!item) continue;

          item.moveTo(touchX, touchY);
          items.push(item);
        }
      } else if (touchList["0+"]) {
        const mouseEvent = event as MouseEvent;
        const item = touchList["0+"];

        touchX = mouseEvent.pageX;
        touchY = mouseEvent.pageY;

        item.moveTo(touchX, touchY);
        items.push(item);
      }

      this.emit("move", { items, originalEvent: event });
    };

    const touchEndHandler = (event: MouseEvent | TouchEvent) => {
      if (!touching) return;
      // event.preventDefault();

      const items: TouchItem<T>[] = [];

      if (event.type.match(/^touch/)) {
        const touchEvent = event as TouchEvent;
        const ids: string[] = [];
        const touches = (this.touches = touchEvent.touches);
        const n = touches.length;
        for (let i = 0; i < n; i++) {
          const touch = touches[i];
          ids.push(touch.identifier + "+");
        }
        for (const id in touchList) {
          if (ids.indexOf(id) === -1) {
            const item = touchList[id];
            delete touchList[id];
            items.push(item);
          }
        }
        if (touches.length === 0) {
          touching = false;
        }
      } else {
        if (touchList["0+"]) {
          const item = touchList["0+"];
          delete touchList["0+"];
          items.push(item);
        }
        touching = false;
      }

      this.emit("remove", { items, originalEvent: event });
    };

    target.addEventListener("touchstart", touchStartHandler, {
      passive: false,
    });
    target.addEventListener("mousedown", touchStartHandler, { passive: false });
    document.addEventListener("touchmove", touchMoveHandler, {
      passive: false,
    });
    document.addEventListener("mousemove", touchMoveHandler, {
      passive: false,
    });
    document.addEventListener("touchend", touchEndHandler, { passive: false });
    document.addEventListener("mouseup", touchEndHandler, { passive: false });
    document.addEventListener("mouseleave", touchEndHandler, {
      passive: false,
    });
  }

  /**
   * dispose
   */
  public dispose() {
    this.disposed = true;
  }
}

interface TouchManagerEventMap<T> {
  add: TouchManagerEvent<T>;
  move: TouchManagerEvent<T>;
  remove: TouchManagerEvent<T>;
}

export interface TouchManagerEvent<T = unknown> {
  type: "add" | "move" | "remove";
  items: TouchItem<T>[];
  originalEvent: Event;
}

/**
 * TouchItem
 */
export class TouchItem<T = unknown> extends Vector2 {
  public pointerID: string;
  public vx = 0;
  public vy = 0;
  public moveX = 0;
  public moveY = 0;
  public offsetX = 0;
  public offsetY = 0;
  public userData: T | undefined;
  public event: Event | undefined;

  private clock: Clock;
  private firstPoint: Vector2;
  private _vx: number[];
  private _vy: number[];

  /**
   * コンストラクタ
   */
  constructor(pointerID: string, x: number, y: number) {
    super(x, y);

    this.pointerID = pointerID;

    this.clock = new Clock();
    this.firstPoint = new Vector2(x, y);
    this._vx = [];
    this._vy = [];
  }

  /**
   * 移動
   */
  public moveTo(x: number, y: number) {
    const n = 2;

    // 移動量を計算する 直近n回の平均
    const delta = this.clock.getDelta();

    this._vx.push((x - this.x) / delta);
    while (this._vx.length > n) this._vx.shift();
    this.vx = 0;
    for (const i of this._vx) this.vx += i;
    this.vx /= this._vx.length;

    this._vy.push((y - this.y) / delta);
    while (this._vy.length > n) this._vy.shift();
    this.vy = 0;
    for (const i of this._vy) this.vy += i;
    this.vy /= this._vy.length;

    this.moveX = x - this.x;
    this.moveY = y - this.y;

    const offset = Vector2.sub(this, this.firstPoint);
    this.offsetX = offset.x;
    this.offsetY = offset.y;

    this.x = x;
    this.y = y;
  }

  /**
   * 複製をする
   */
  public clone(): TouchItem<T> {
    const touchItem = new TouchItem<T>(++touchCount + "", this.x, this.y);
    touchItem.userData = this.userData;
    return touchItem;
  }
}
