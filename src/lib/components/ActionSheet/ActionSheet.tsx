import {
  createRef,
  forwardRef,
  ReactNode,
  SyntheticEvent,
  useCallback,
  useImperativeHandle,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import { preventDefault } from "../../utils/ElementUtil";
import styles from "./ActionSheet.module.scss";

interface Props {
  title?: ReactNode;
  children: ReactNode;
  defaultShown?: boolean;
  onClose?: () => void;
}

export interface ActionSheetHandler {
  hide: () => void;
}

export const ActionSheet = forwardRef<ActionSheetHandler, Props>(
  function ActionSheet(props, ref) {
    const { title, children, defaultShown = true, onClose } = props;

    const [shown, setShown] = useState(defaultShown);

    useImperativeHandle(
      ref,
      () => ({
        hide: () => {
          setShown(false);
          if (onClose) onClose();
        },
      }),
      [onClose]
    );

    const onClickBackground = useCallback(
      (event: SyntheticEvent) => {
        preventDefault(event);
        setShown(false);
        if (onClose) onClose();
      },
      [onClose]
    );

    return (
      <>
        <div
          className={styles.background}
          aria-hidden={!shown}
          onClick={onClickBackground}
        />
        <div
          className={styles.component}
          data-ui="actionsheet"
          aria-hidden={!shown}
          onClick={preventDefault}
        >
          <div className={styles.content}>
            {title && <div className={styles.title}>{title}</div>}
            {children}
          </div>
        </div>
      </>
    );
  }
);

export interface ActionSheetOptions {
  container?: HTMLElement;
}

// Hooks
export const showActionSheet = (
  title: ReactNode | undefined,
  content: ReactNode,
  options?: ActionSheetOptions
) => {
  options = options || {};

  const container = options.container || document.body;

  const box = document.createElement("div");
  box.className = styles.container;

  container.appendChild(box);

  const actionSheetRef = createRef<ActionSheetHandler>();

  const root = createRoot(box);
  root.render(
    <ActionSheet
      ref={actionSheetRef}
      title={title}
      onClose={() => {
        box.classList.add(styles.hidden);
        if (global) {
          window.setTimeout(() => {
            if (box.parentElement) {
              box.parentElement.removeChild(box);
            }
          }, 500);
        }
      }}
    >
      {content}
    </ActionSheet>
  );

  return () => {
    if (actionSheetRef.current) {
      actionSheetRef.current.hide();
    }
  };
};
