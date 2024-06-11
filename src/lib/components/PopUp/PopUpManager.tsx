import { Root, createRoot } from "react-dom/client";
import { preventDefault } from "../../utils/ElementUtil";
import styles from "./PopUpManager.module.scss";

type PopUpOptions = {
  enabledCloseByBackground?: boolean;
};

export class PopupManager {
  private static data: {
    popUp: JSX.Element;
    options: PopUpOptions;
  }[] = [];
  private static root: Root;
  private static popUpContainer: HTMLElement;
  private static popUpExists = false;

  public static open(popUp: JSX.Element, options: PopUpOptions = {}) {
    this.data.push({ popUp, options });

    if (this.data.length === 1) {
      this.renderPopUp();
    }
  }

  public static close() {
    const root = this.root;
    const popUpContainer = this.popUpContainer;
    if (popUpContainer) {
      this.data.shift();
      popUpContainer.classList.add(styles.closed);
      window.setTimeout(() => {
        root.unmount();
        if (popUpContainer.parentNode) {
          popUpContainer.parentNode.removeChild(popUpContainer);
        }
        this.popUpExists = false;
        this.renderPopUp();
      }, 300);
    }
  }

  private static renderPopUp() {
    if (this.popUpExists) return;
    const item = this.data[0];
    if (item) {
      this.popUpExists = true;
      const popUpContainer = document.createElement("div");
      popUpContainer.className = styles.popUpContainer;
      this.popUpContainer = popUpContainer;

      document.body.appendChild(popUpContainer);

      const root = createRoot(popUpContainer);
      this.root = root;

      root.render(
        <>
          <div
            className={styles.popUpContainerBackground}
            onClick={(event) => {
              preventDefault(event);
              if (item.options.enabledCloseByBackground) {
                this.close();
              }
            }}
          />
          {item.popUp}
        </>
      );
    }
  }
}
