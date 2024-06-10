import { now, Ticker } from "./Ticker";

type EasingFunction = (amount: number) => number;
type TweenData<T> =
  | {
      type: "ease";
      props: Partial<T>;
      duration?: number;
      ease?: EasingFunction;
    }
  | { type: "function"; func: (target: T) => Promise<unknown> | void };

interface TweenOptions {
  loop?: number;
  debug?: boolean;
  elem?: HTMLElement;
}

/**
 * Tween
 */
export class Tween<T = unknown> implements PromiseLike<T> {
  /**
   * constructor
   * @param target
   * @param opts
   */
  constructor(target: T, opts?: TweenOptions) {
    this.target = target;
    this.opts = opts;
    this.updateClosure = this.update.bind(this);

    if (opts) {
      this.loop = opts.loop !== undefined ? opts.loop : 0;
    }

    Tween.add(this);
  }
  public get isPlaying() {
    return this._isPlaying;
  }
  public static tweens: Tween<unknown>[] = [];

  private target: T;
  private opts?: TweenOptions;
  private valuesStart?: Partial<T> | undefined | null;
  private valuesEnd?: Partial<T> | undefined | null;
  private duration = 0;
  private startTime = 0;
  private ease: EasingFunction = Ease.linear;

  private loop = 0;
  private stacks: TweenData<T>[] = [];
  private index = -1;

  private updateClosure: () => void;

  private onUpdateCallback: ((target: T) => void) | undefined;

  private _isPlaying = false;

  private static add<T>(tween: Tween<T>) {
    if (this.tweens.indexOf(tween as Tween<unknown>) !== -1) return;
    this.tweens.push(tween as Tween<unknown>);
    Ticker.add(tween.updateClosure);
  }
  private static remove<T>(tween: Tween<T>) {
    if (this.tweens.indexOf(tween as Tween<unknown>) === -1) return;
    this.tweens.splice(this.tweens.indexOf(tween as Tween<unknown>), 1);
    Ticker.remove(tween.updateClosure);
  }
  public static get<T>(target: T) {
    for (let i = this.tweens.length - 1; i >= 0; i--) {
      if (this.tweens[i].target === target) {
        return this.tweens[i] as Tween<T>;
      }
    }
    return new Tween(target);
  }
  public static killByTarget<T>(target: T) {
    for (let i = this.tweens.length - 1; i >= 0; i--) {
      if (this.tweens[i].target === target) {
        this.remove(this.tweens[i]);
      }
    }
  }

  /**
   * to
   * @param props
   * @param duration
   * @param delay
   */
  public to(
    props: Partial<T>,
    duration = 1000,
    ease?: EasingFunction
  ): Tween<T> {
    this.stacks.push({
      type: "ease",
      props,
      duration,
      ease,
    });

    if (!this._isPlaying) {
      this._isPlaying = true;
      requestAnimationFrame(this.start.bind(this));
    }

    return this;
  }

  /**
   *
   * @param milliseconds
   */
  public wait(milliseconds: number): Tween<T> {
    if (milliseconds === 0) return this;

    this.stacks.push({
      type: "ease",
      props: {},
      duration: milliseconds,
    });

    if (!this._isPlaying) {
      this._isPlaying = true;
      requestAnimationFrame(this.start.bind(this));
    }

    return this;
  }

  /**
   * call
   * @param calback
   */
  public call(callback: (target: T) => Promise<unknown> | void): Tween<T> {
    this.stacks.push({
      type: "function",
      func: callback,
    });

    if (!this._isPlaying) {
      this._isPlaying = true;
      requestAnimationFrame(this.start.bind(this));
    }

    return this;
  }

  /**
   * then
   * @param onfulfilled
   */
  public then<TResult1 = T, TResult2 = never>(
    onfulfilled?:
      | ((value: T) => TResult1 | Promise<TResult1>)
      | undefined
      | null,
    onrejected?:
      | ((reason: unknown) => TResult2 | Promise<TResult2>)
      | undefined
      | null
  ): Promise<TResult1 | TResult2> {
    if (onrejected) {
      console.log("onrejected parameter is unsupported");
    }

    return new Promise((resolve) => {
      this.stacks.push({
        type: "function",
        func: () => {
          if (onfulfilled) resolve(onfulfilled(this.target));
          else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            resolve({} as any);
          }
        },
      });
    });
  }

  /**
   * stop
   */
  public stop(): Tween<T> {
    if (!this._isPlaying) return this;
    this._isPlaying = false;
    Tween.remove(this);
    return this;
  }

  /**
   * onUpdate
   * @param onUpdateCallback
   */
  public onUpdate(onUpdateCallback: (target: T) => void): Tween<T> {
    this.onUpdateCallback = onUpdateCallback;
    return this;
  }

  /**
   * start tween
   */
  private start(): void {
    const data = this.stacks[++this.index];
    if (!data) {
      // all done
      if (this.loop === 0 || this.loop < -1) {
        this._isPlaying = false;

        Tween.remove(this);

        this.index = 0;
        this.stacks = [];

        return;
      }

      // inifinit loop
      else if (this.loop === Infinity || this.loop === -1) {
        this.index = -1;
        this.start();
        return;
      }

      // loop
      else {
        this.loop--;
        this.index = -1;
        this.start();
        return;
      }
    }

    this.valuesStart = this.valuesEnd = null;
    this._isPlaying = true;

    if (data.type === "function") {
      const result = data.func(this.target);
      if (result && result instanceof Promise) {
        result.then(() => {
          this.start();
        });
      } else {
        this.start();
      }
    } else {
      const { props, duration, ease } = data;

      this.valuesEnd = props;
      this.duration =
        typeof duration === "undefined" ? 1000 : Math.max(0, duration);
      this.ease = ease || Ease.linear;

      this.valuesStart = {};
      for (const prop in this.valuesEnd) {
        if (this.target[prop] === undefined) continue;
        this.valuesStart[prop] = this.target[prop];
      }

      this.startTime = now();
    }
  }

  /**
   * update
   * @param time
   */
  private update(): void {
    if (!this._isPlaying) return;

    const time = now();

    if (time < this.startTime) {
      return;
    }
    if (!this.valuesStart || !this.valuesEnd) {
      return;
    }

    let elapsed = (time - this.startTime) / this.duration;
    elapsed = this.duration === 0 || elapsed > 1 ? 1 : elapsed;

    if (this.opts && this.opts.debug) console.log(elapsed);
    const value = this.ease(elapsed);

    let changed = false;
    for (const prop in this.valuesEnd) {
      if (this.valuesStart[prop] === undefined) continue;

      const startValue = this.valuesStart[prop];
      const endValue = this.valuesEnd[prop];
      const start = typeof startValue === "number" ? startValue : 0;
      const end = typeof endValue === "number" ? endValue : 0;

      const val = elapsed === 1 ? end : start + (end - start) * value;
      if (typeof this.target[prop] === "number") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.target as any)[prop] = val;
      }

      const elem = this.opts ? this.opts.elem : undefined;
      if (elem) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const style = elem.style as any;
        if (typeof style[prop] === "string") {
          const propValue = style[prop] as string;
          let suffix = "";
          const matches = propValue.match(/([^\d]+)$/);
          if (matches) {
            suffix = matches[1];
          }
          style[prop] = `${val}${suffix}`;
        }
      }

      changed = true;
    }

    if (changed && this.onUpdateCallback) this.onUpdateCallback(this.target);

    if (elapsed === 1) {
      this.start();
      return;
    }
  }
}

// Pow
const getPowIn = (pow = 2) => {
  return (t: number) => {
    return Math.pow(t, pow);
  };
};
const getPowOut = (pow = 2) => {
  return (t: number) => {
    return 1 - Math.pow(1 - t, pow);
  };
};
const getPowInOut = (pow = 2) => {
  return (t: number) => {
    t *= 2;
    if (t < 1) return 0.5 * Math.pow(t, pow);
    return 1 - 0.5 * Math.abs(Math.pow(2 - t, pow));
  };
};

// Back
const getBackIn = (amount = 1.70158) => {
  return (t: number) => {
    return t * t * ((amount + 1) * t - amount);
  };
};
const getBackOut = (amount = 1.70158) => {
  return (t: number) => {
    return --t * t * ((amount + 1) * t + amount) + 1;
  };
};
const getBackInOut = (amount = 1.70158) => {
  amount *= 1.525;
  return (t: number) => {
    t *= 2;
    if (t < 1) return 0.5 * (t * t * ((amount + 1) * t - amount));
    return 0.5 * ((t -= 2) * t * ((amount + 1) * t + amount) + 2);
  };
};

// Elastic
const getElasticIn = (amplitude = 1, period = 0.3) => {
  const pi2 = Math.PI * 2;
  return (t: number) => {
    if (t === 0 || t === 1) return t;
    const s = (period / pi2) * Math.asin(1 / amplitude);
    return -(
      amplitude *
      Math.pow(2, 10 * (t -= 1)) *
      Math.sin(((t - s) * pi2) / period)
    );
  };
};
const getElasticOut = (amplitude = 1, period = 0.3) => {
  const pi2 = Math.PI * 2;
  return (t: number) => {
    if (t === 0 || t === 1) return t;
    const s = (period / pi2) * Math.asin(1 / amplitude);
    return (
      amplitude * Math.pow(2, -10 * t) * Math.sin(((t - s) * pi2) / period) + 1
    );
  };
};
const getElasticInOut = (amplitude = 2, period = 0.3 * 1.5) => {
  const pi2 = Math.PI * 2;
  return (t: number) => {
    const s = (period / pi2) * Math.asin(1 / amplitude);
    t *= 2;
    if (t < 1)
      return (
        -0.5 *
        (amplitude *
          Math.pow(2, 10 * (t -= 1)) *
          Math.sin(((t - s) * pi2) / period))
      );
    return (
      amplitude *
        Math.pow(2, -10 * (t -= 1)) *
        Math.sin(((t - s) * pi2) / period) *
        0.5 +
      1
    );
  };
};

export const Ease = {
  linear: (k: number) => k,

  getPowIn,
  getPowOut,
  getPowInOut,

  quadIn: getPowIn(2),
  quadOut: getPowOut(2),
  quadInOut: getPowInOut(2),

  cubicIn: getPowIn(3),
  cubicOut: getPowOut(3),
  cubicInOut: getPowInOut(3),

  quartIn: getPowIn(4),
  quartOut: getPowOut(4),
  quartInOut: getPowInOut(4),

  quintIn: getPowIn(5),
  quintOut: getPowOut(5),
  quintInOut: getPowInOut(5),

  sineIn: (k: number) => 1 - Math.cos((k * Math.PI) / 2),
  sineOut: (k: number) => Math.sin((k * Math.PI) / 2),
  sineInOut: (k: number) => 0.5 * (1 - Math.cos(Math.PI * k)),

  expoIn: (k: number) => (k === 0 ? 0 : Math.pow(1024, k - 1)),
  expoOut: (k: number) => (k === 1 ? 1 : 1 - Math.pow(2, -10 * k)),
  expoInOut: (k: number) => {
    if (k === 0) {
      return 0;
    }
    if (k === 1) {
      return 1;
    }
    k *= 2;
    // if (2 < 1) {
    //   return 0.5 * Math.pow(1024, k - 1);
    // }
    return 0.5 * (-Math.pow(2, -10 * (k - 1)) + 2);
  },

  circIn: (k: number) => 1 - Math.sqrt(1 - k * k),
  circOut: (k: number) => Math.sqrt(1 - --k * k),
  circInOut: (k: number) => {
    k *= 2;
    if (k < 1) {
      return -0.5 * (Math.sqrt(1 - k * k) - 1);
    }
    return 0.5 * (Math.sqrt(1 - (k -= 2) * k) + 1);
  },

  // Elastic
  getElasticIn,
  elasticIn: getElasticIn(1, 0.3),
  getElasticOut,
  elasticOut: getElasticOut(1, 0.3),
  getElasticInOut,
  elasticInOut: getElasticInOut(1, 0.3 * 1.5),

  getBackIn,
  backIn: getBackIn(1.70158),
  getBackOut,
  backOut: getBackOut(1.70158),
  getBackInOut,
  backInOut: getBackInOut(1.70158),

  bounceIn: (k: number) => 1 - Ease.bounceOut(1 - k),
  bounceOut: (k: number) => {
    if (k < 1 / 2.75) {
      return 7.5625 * k * k;
    } else if (k < 2 / 2.75) {
      return 7.5625 * (k -= 1.5 / 2.75) * k + 0.75;
    } else if (k < 2.5 / 2.75) {
      return 7.5625 * (k -= 2.25 / 2.75) * k + 0.9375;
    } else {
      return 7.5625 * (k -= 2.625 / 2.75) * k + 0.984375;
    }
  },
  bounceInOut: (k: number) =>
    k < 0.5
      ? Ease.bounceIn(k * 2) * 0.5
      : Ease.bounceOut(k * 2 - 1) * 0.5 + 0.5,
};
