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
import styles from "./BottomSheet.module.scss";

interface Props {
  title?: ReactNode;
  children: ReactNode;
  defaultShown?: boolean;
  onClose?: () => void;
}

export interface BottomSheetHandler {
  hide: () => void;
}

export const BottomSheet = forwardRef<BottomSheetHandler, Props>(
  function BottomSheet(props, ref) {
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
          data-ui="bottomsheet"
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

export interface BottomSheetOptions {
  container?: HTMLElement;
}

// Hooks
export const showBottomSheet = (
  title: ReactNode | undefined,
  content: ReactNode,
  options?: BottomSheetOptions
) => {
  options = options || {};

  const container = options.container || document.body;

  const box = document.createElement("div");
  box.className = styles.container;

  container.appendChild(box);

  const actionSheetRef = createRef<BottomSheetHandler>();

  const root = createRoot(box);
  root.render(
    <BottomSheet
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
    </BottomSheet>
  );

  return () => {
    if (actionSheetRef.current) {
      actionSheetRef.current.hide();
    }
  };
};
