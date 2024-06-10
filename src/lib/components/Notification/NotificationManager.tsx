import { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Notification, NotificationType } from "./Notification";
import styles from "./NotificationManager.module.scss";

type CloseFunction = (forceClose?: boolean) => void;
let currNotify: HTMLElement | undefined;
let currCloseFunc: CloseFunction | undefined;

export class NotificationManager {
  /** add notification */
  public static add(
    text: ReactNode,
    type = NotificationType.Normal,
    duration = 5000
  ) {
    let closeTimer = 0;

    const closeFunc: CloseFunction = (forceClose = false) => {
      if (closeTimer) {
        window.clearTimeout(closeTimer);
        closeTimer = 0;
      }
      this.close(container, forceClose);
      forceClose = undefined;
    };

    const notification = (
      <Notification type={type} onClose={closeFunc}>
        {text}
      </Notification>
    );

    const container = document.createElement("div");
    container.className = styles.notifyContainer;

    currNotify = container;

    document.body.appendChild(container);

    const root = createRoot(container);
    root.render(notification);

    if (currCloseFunc) {
      currCloseFunc(true);
    }
    currCloseFunc = closeFunc;
    closeTimer = window.setTimeout(closeFunc, duration);

    return closeFunc;
  }

  /** close */
  public static close(container: HTMLElement, forceClose = false) {
    window.setTimeout(
      () => {
        if (forceClose) {
          container.classList.add(styles.fadeOut);
        }
        container.classList.add(styles.closed);
        if (currNotify === container) currNotify = undefined;
        window.setTimeout(() => {
          const root = createRoot(container);
          root.unmount();
          if (container.parentNode) {
            container.parentNode.removeChild(container);
          }
        }, 500);
      },
      forceClose ? 200 : 0
    );
  }
}
