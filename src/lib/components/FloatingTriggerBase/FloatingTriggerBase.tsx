import {
  forwardRef,
  ReactNode,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { classNames, preventDefault } from '../../utils/ElementUtil';
import styles from './FloatingTriggerBase.module.scss';

export interface FloatingTriggerProps {
  className?: string;
  children: ReactNode;
  disabled?: boolean;
  floatingContent?: ReactNode;
  floatingContentClassName?: string;
  offsetY?: number;
}

export interface FloatingTriggerHandler {
  close?: () => void;
}

export const FloatingTriggerBase = forwardRef<
  FloatingTriggerHandler,
  FloatingTriggerProps
>(function FloatingTriggerBase(props, ref) {
  const {
    className,
    children,
    disabled,
    floatingContent,
    floatingContentClassName,
    offsetY = 0,
  } = props;

  const elemRef = useRef<HTMLDivElement>(null);
  const floatingContentElemRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect>();

  const [floatingContentShown, setFloatingContentShown] = useState(false);

  const [, setCancel] = useState(false);

  useImperativeHandle(
    ref,
    () => {
      return {
        close: () => {
          setFloatingContentShown(false);
        },
      };
    },
    [],
  );

  useEffect(() => {
    if (floatingContentShown) {
      const compElem = elemRef.current;
      if (compElem) {
        setRect(compElem.getBoundingClientRect());
      }

      const onScroll = () => {
        if (compElem) {
          setRect(compElem.getBoundingClientRect());
        }
      };

      const onClick = (event: Event) => {
        const floatingContentElem = floatingContentElemRef.current;
        if (event.target instanceof Element) {
          let elem = event.target;

          while (elem.parentElement) {
            if (elem === compElem || elem === floatingContentElem) {
              preventDefault(event);
              return;
            }
            elem = elem.parentElement;
          }
        }

        if (event.target === elemRef.current) {
          preventDefault(event);
          return;
        }

        setFloatingContentShown(false);
      };

      window.addEventListener('click', onClick);
      // window.addEventListener('mousedown', onClick);
      window.addEventListener('scroll', onScroll);
      window.addEventListener('wheel', onScroll);
      window.addEventListener('resize', onScroll);

      return () => {
        window.removeEventListener('click', onClick);
        // window.removeEventListener('mousedown', onClick);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('wheel', onScroll);
        window.removeEventListener('resize', onScroll);
      };
    }
  }, [floatingContentShown]);

  return (
    <div
      ref={elemRef}
      className={classNames(styles.component, className)}
      aria-disabled={disabled}
      onClick={() => {
        setFloatingContentShown(!floatingContentShown);
        setCancel(true);
      }}
    >
      {children || <div className={styles.buttonIcon} />}

      {floatingContentShown && rect && (
        <FloatingContent
          ref={floatingContentElemRef}
          targetRect={rect}
          offsetY={offsetY}
          className={floatingContentClassName}
        >
          {floatingContent}
        </FloatingContent>
      )}
    </div>
  );
});

interface FloatingContentProps {
  targetRect: DOMRect;
  children: ReactNode;
  offsetY: number;
  className?: string;
}
const FloatingContent = forwardRef<HTMLDivElement, FloatingContentProps>(
  function FloatingTriggerContent(props, elemRef) {
    const { targetRect, children, offsetY, className } = props;

    const [shown, setShown] = useState(false);

    useEffect(() => {
      const elem =
        elemRef && typeof elemRef !== 'function' ? elemRef.current : null;
      if (elem) {
        const rect = elem.getBoundingClientRect();

        const top = targetRect.top + targetRect.height + offsetY;

        if (top + rect.height <= window.innerHeight) {
          elem.style.top = `${top}px`;
        } else if (targetRect.top - rect.height > 0) {
          elem.style.top = `${targetRect.top - rect.height - offsetY}px`;
        } else {
          elem.style.top = `${
            top - (top + rect.height - window.innerHeight)
          }px`;
        }

        if (targetRect.left + rect.width <= window.innerWidth) {
          elem.style.left = `${targetRect.left}px`;
        } else {
          elem.style.left = `${
            targetRect.left + targetRect.width - rect.width
          }px`;
        }

        setShown(true);
      }
    }, [elemRef, targetRect, shown, offsetY]);

    return createPortal(
      <div
        ref={elemRef}
        className={classNames(styles.floatingContent, className)}
        aria-hidden={!shown}
        // onClick={preventDefault}
      >
        {children}
      </div>,
      document.body,
    );
  },
);
