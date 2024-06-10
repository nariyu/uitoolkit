import { ReactNode, useEffect, useRef } from "react";
import { TouchManager } from "../../managers/TouchManager";
import { classNames } from "../../utils/ElementUtil";
import styles from "./Notification.module.scss";

export enum NotificationType {
  Normal = "normal",
  Info = "info",
}

interface NotificationProps {
  type?: NotificationType;
  className?: string;
  children?: ReactNode;
  onClose?: () => void;
}
export const Notification = (props: NotificationProps) => {
  const { type, className, children, onClose } = props;

  const elemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const elem = elemRef.current;

    let touchManager: TouchManager | undefined;
    if (elem) {
      touchManager = new TouchManager(elem);
      touchManager.on("move", (event) => {
        const offsetY = Math.min(0, event.items[0].offsetY);
        elem.style.transform = `translate(0, ${offsetY}px)`;
      });
      touchManager.on("remove", (event) => {
        const offsetY = event.items[0].offsetY;
        if (-15 > offsetY) {
          if (onClose) {
            elem.style.transition = "transform 0.2s ease-out 0s";
            elem.style.transform = "translate(0, calc(-100% - 2rem))";
            onClose();
          }
        }
      });
    }

    return () => {
      if (touchManager) {
        touchManager.dispose();
      }
    };
  }, [onClose]);

  return (
    <div
      ref={elemRef}
      className={classNames(styles.component, className)}
      data-type={type}
    >
      <div className={styles.content}>{children}</div>
    </div>
  );
};
