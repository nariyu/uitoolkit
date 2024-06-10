import { IVector2 } from '../geom/Vector2';
import { Ease, Tween } from '../tween/Tween';

/**
 *
 */
export const getScrollTop = () => {
  if (typeof window.scrollY === 'number') {
    return window.scrollY;
  } else if (document.scrollingElement) {
    return document.scrollingElement.scrollTop;
  } else {
    return (
      (document.documentElement && document.documentElement.scrollTop) ||
      document.body.scrollTop
    );
  }
};

/**
 *
 */
export const getScrollLeft = () => {
  if (typeof window.scrollX === 'number') {
    return window.scrollX;
  } else if (document.scrollingElement) {
    return document.scrollingElement.scrollLeft;
  } else {
    return (
      (document.documentElement && document.documentElement.scrollLeft) ||
      document.body.scrollLeft
    );
  }
};

/**
 *
 */
export const setScrollTop = (scrollTop: number) => {
  if (document.scrollingElement) {
    document.scrollingElement.scrollTop = scrollTop;
  } else if (document.documentElement) {
    document.documentElement.scrollTop = scrollTop;
  } else {
    document.body.scrollTop = scrollTop;
  }
};

/**
 *
 */
export const setScrollLeft = (scrollLeft: number) => {
  if (document.scrollingElement) {
    document.scrollingElement.scrollLeft = scrollLeft;
  } else if (document.documentElement) {
    document.documentElement.scrollLeft = scrollLeft;
  } else {
    document.body.scrollLeft = scrollLeft;
  }
};

/**
 *
 */
export const scrollTo = (
  target?: HTMLElement | number,
  duration?: number,
  offsetTop = 0,
  callback?: () => void,
): void => {
  // // if supported scrollIntoView() function, use scrollIntoView() function
  // if (!target && document.body.scrollIntoView) target = document.body;
  // if (target && (target as HTMLElement).scrollIntoView) {
  //   (target as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' });
  //   return;
  // }

  const scrollTop = getScrollTop();
  let nextScrollTop = 0;

  if (typeof target === 'number') {
    nextScrollTop = target;
  } else if (target) {
    nextScrollTop = target.getBoundingClientRect().top + scrollTop;
  }

  nextScrollTop += offsetTop;

  if (typeof duration === 'undefined') {
    duration = Math.min(
      1000,
      Math.max(0, (Math.abs(scrollTop - nextScrollTop) / 500) * 300),
    );
  }

  if (typeof scrollTop !== 'undefined') {
    const tweenObj = { scrollTop };
    new Tween(tweenObj)
      .to({ scrollTop: nextScrollTop }, duration, Ease.quadOut)
      .onUpdate(() => {
        window.scroll(0, tweenObj.scrollTop);
      })
      .call(() => {
        if (callback) callback();
      });
  }
};

/**
 *
 */
export const getMousePosition = (
  event: MouseEvent | TouchEvent,
): IVector2 | null => {
  let x = 0;
  let y = 0;
  if (event instanceof TouchEvent) {
    const touchEvent = event as TouchEvent;
    const touches = touchEvent.changedTouches;
    if (touches.length > 0) {
      const touch = touches[touches.length - 1];
      x = touch.clientX;
      y = touch.clientY;
    } else {
      return null;
    }
  } else if (event instanceof MouseEvent) {
    const mouseEvent = event as MouseEvent;
    x = mouseEvent.clientX;
    y = mouseEvent.clientY;
  } else {
    return null;
  }

  return { x, y };
};

/**
 * dispatchEvent
 */
export const dispatchEvent = (
  elem: EventTarget,
  type: string,
  data: unknown = {},
) => {
  try {
    const event = Object.assign(new CustomEvent(type), data);
    elem.dispatchEvent(event);
  } catch (e) {
    const event = document.createEvent('CustomEvent');
    event.initCustomEvent(type, false, false, data);
    elem.dispatchEvent(event);
  }
};

/**
 *
 */
export const classNames = (...names: (string | undefined)[]) => {
  return names.filter((name) => !!name).join(' ');
};

/**
 *
 * @param event
 */
export const preventDefault = (
  event: Pick<Event, 'preventDefault' | 'stopPropagation'>,
) => {
  event.preventDefault();
  event.stopPropagation();
};
