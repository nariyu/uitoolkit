import { ChevronLeft } from "@styled-icons/heroicons-outline";
import {
  ReactNode,
  RefObject,
  SyntheticEvent,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { classNames, preventDefault } from "../../utils/ElementUtil";
import styles from "./NavigationController.module.scss";

interface Props {
  defaultTitle?: ReactNode;
  defaultLeftButton?: ReactNode;
  defaultRightButton?: ReactNode;
  defaultNoBorder?: boolean;
  children?: ReactNode;
  onInitialized?: () => void;
  onPushView?: (view: ReactNode) => void;
  onChangeIndex?: (index: number) => void;
  onClose?: () => void;
  onClickDefaultLeftButton?: () => void;
  onClickDefaultRightButton?: () => void;
}
interface ViewOptions {
  name?: string;
  submit?: RefObject<Submittable> | (() => void);
  onClickLeftButton?: () => void;
}
export interface Submittable {
  submit: () => void;
}
export interface NavigationControllerHandler {
  pushView: (
    title: string | ReactNode,
    view: ReactNode,
    rightButton?: ReactNode,
    options?: ViewOptions
  ) => number;
  popView: () => number;
  removeByName: (name: string) => number;
  removeAllViews: () => void;
}
export const NavigationController = forwardRef<
  NavigationControllerHandler,
  Props
>(function NavigationController(props, ref) {
  const {
    defaultTitle,
    defaultLeftButton,
    onClickDefaultLeftButton,
    defaultRightButton,
    onClickDefaultRightButton,
    defaultNoBorder,
    children,
    onInitialized,
    onChangeIndex,
    onClose,
  } = props;

  const viewsRef = useRef<
    {
      title: string | ReactNode;
      view: ReactNode;
      rightButton?: ReactNode;
      options?: ViewOptions;
    }[]
  >([]);
  const [updateTime, setUpdateTime] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const reservedFuncRef = useRef<{
    timer: number;
    func: () => void;
  } | null>();

  // Push view
  const pushView = useCallback(
    (
      title: string | ReactNode,
      view: ReactNode,
      rightButton?: ReactNode,
      options?: ViewOptions
    ) => {
      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLElement) {
        activeElement.blur();
      }

      viewsRef.current = [
        ...viewsRef.current,
        { title, view, rightButton, options },
      ];
      setSelectedIndex(viewsRef.current.length - 1);
      setUpdateTime(Date.now());

      return viewsRef.current.length;
    },
    []
  );

  // Pop view
  const popView = useCallback(() => {
    if (reservedFuncRef.current) {
      window.clearTimeout(reservedFuncRef.current.timer);
      reservedFuncRef.current.func();
    }

    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }

    setSelectedIndex(viewsRef.current.length - 2);

    function func() {
      const newViews = viewsRef.current.slice();
      newViews.pop();
      viewsRef.current = newViews;
      setUpdateTime(Date.now());
      reservedFuncRef.current = null;
    }
    reservedFuncRef.current = {
      timer: window.setTimeout(func, 200),
      func,
    };

    if (viewsRef.current.length === 1 && onClose) {
      onClose();
    }

    return viewsRef.current.length - 1;
  }, [onClose]);

  // Remove by name
  const removeByName = useCallback(
    (name: string) => {
      const lastView = viewsRef.current[viewsRef.current.length - 1];
      if (lastView && lastView.options && lastView.options.name === name) {
        return popView();
      }

      for (const view of viewsRef.current) {
        if (view.options && view.options.name === name) {
          const index = viewsRef.current.indexOf(view);
          viewsRef.current.splice(index, 1);
          setSelectedIndex(viewsRef.current.length - 1);
          break;
        }
      }

      return viewsRef.current.length;
    },
    [popView]
  );

  // Remove all views
  const removeAllViews = useCallback(() => {
    while (viewsRef.current.length > 0) {
      if (popView() === 0) break;
    }
  }, [popView]);

  // 実装
  useImperativeHandle(
    ref,
    () => ({
      pushView,
      popView,
      removeByName,
      removeAllViews,
    }),
    [pushView, popView, removeByName, removeAllViews]
  );

  // 初期化
  useEffect(() => {
    if (onInitialized) onInitialized();
  }, [onInitialized]);

  // ビューが変わった
  useEffect(() => {
    if (onChangeIndex) {
      onChangeIndex(selectedIndex);
    }
  }, [selectedIndex, onChangeIndex]);

  /** 戻るボタン */
  const onClickPopViewButton = useCallback(
    (event: SyntheticEvent) => {
      preventDefault(event);

      const view = viewsRef.current[selectedIndex];
      if (view && view.options && view.options.onClickLeftButton) {
        view.options.onClickLeftButton();
      } else if (ref && typeof ref !== "function") {
        ref?.current?.popView();
      } else if (ref) {
        popView();
      }
    },
    [popView, ref, selectedIndex]
  );

  /** 右のボタン */
  const onClickRightButton = useCallback(
    (event: SyntheticEvent) => {
      preventDefault(event);

      if (selectedIndex >= 0) {
        const view = viewsRef.current[selectedIndex];
        if (view.options && view.options.submit) {
          if (typeof view.options.submit === "function") {
            view.options.submit();
          } else {
            const submittable = view.options.submit.current;
            if (submittable) {
              submittable.submit();
            }
          }
        }
      }
    },
    [selectedIndex, viewsRef]
  );

  return (
    <div className={styles.component} data-update={updateTime}>
      <div
        className={styles.header}
        data-noborder={viewsRef.current.length === 0 && defaultNoBorder}
      >
        <div className={styles.left}>
          {viewsRef.current.length === 0 ? (
            onClickDefaultLeftButton ? (
              <div
                className={styles.btn}
                role="button"
                data-position={0 <= selectedIndex ? "before" : "current"}
                onClick={onClickDefaultLeftButton}
              >
                {defaultLeftButton}
              </div>
            ) : (
              defaultLeftButton
            )
          ) : (
            viewsRef.current.map((_view, index) => (
              <div
                key={index}
                role="button"
                className={classNames(styles.icon, styles.leftArrow)}
                data-position={
                  index < selectedIndex
                    ? "before"
                    : index > selectedIndex
                      ? "after"
                      : "current"
                }
                onClick={onClickPopViewButton}
              >
                <ChevronLeft />
              </div>
            ))
          )}
        </div>

        <div className={styles.titleBox}>
          {defaultTitle ? (
            <div
              className={styles.title}
              aria-disabled={selectedIndex >= 0}
              data-default
            >
              {defaultTitle}
            </div>
          ) : null}
          {viewsRef.current.map((view, index) => (
            <div
              key={index}
              className={styles.title}
              data-position={
                index < selectedIndex
                  ? "before"
                  : index > selectedIndex
                    ? "after"
                    : "current"
              }
            >
              {view.title}
            </div>
          ))}
        </div>

        <div className={styles.right}>
          {viewsRef.current.length === 0 ? (
            onClickDefaultRightButton ? (
              <div
                className={styles.btn}
                role="button"
                onClick={onClickDefaultRightButton}
              >
                {defaultRightButton}
              </div>
            ) : (
              defaultRightButton
            )
          ) : selectedIndex >= 0 &&
            viewsRef.current[selectedIndex].rightButton ? (
            <div
              className={styles.btn}
              role="button"
              onClick={onClickRightButton}
            >
              {viewsRef.current[selectedIndex].rightButton}
            </div>
          ) : null}
        </div>
      </div>
      <div className={styles.body}>
        {children ? (
          <div
            className={styles.content}
            aria-disabled={viewsRef.current.length > 0}
            data-default
          >
            {children}
          </div>
        ) : null}
        {viewsRef.current.map((view, index) => (
          <div
            key={index}
            className={styles.content}
            data-position={
              index < selectedIndex
                ? "before"
                : index > selectedIndex
                  ? "after"
                  : "current"
            }
          >
            {view.view}
          </div>
        ))}
      </div>
    </div>
  );
});
