import { ReactNode, SyntheticEvent, useCallback, useState } from "react";
import { classNames, preventDefault } from "../../utils/ElementUtil";
import style from "./PopUp.module.scss";
import { PopupManager } from "./PopUpManager";

interface ButtonProps {
  label: string;
  primary?: boolean;
  onClick?: () => Promise<unknown> | void;
}
interface Props {
  children?: ReactNode;
  onClose?: () => void;
  buttons?: ButtonProps[];
}
export const Popup = (props: Props) => {
  const { children, onClose, buttons } = props;

  const [closed, setClosed] = useState(false);

  /** OK */
  const onClickButton = useCallback(
    (event: SyntheticEvent<HTMLElement>) => {
      preventDefault(event);

      let promise: Promise<unknown> | undefined;

      const indexStr = event.currentTarget.getAttribute("data-index");
      if (typeof indexStr === "string") {
        const index = parseInt(indexStr, 10);
        if (buttons) {
          const button = buttons[index];
          if (button && button.onClick) {
            const p = button.onClick();
            if (p) {
              promise = p;
            }
          }
        }
      }

      if (onClose) {
        onClose();
      }

      setClosed(true);
      if (promise) {
        promise.finally(() => {
          PopupManager.close();
        });
      } else {
        PopupManager.close();
      }
    },
    [onClose, buttons]
  );

  return (
    <div
      className={classNames(style.component, closed ? style.closed : undefined)}
      role="dialog"
      onClick={(event) => preventDefault(event)}
    >
      <div className={style.content}>{children}</div>

      <div className={style.footer}>
        {buttons ? (
          buttons.map((button, index) => (
            <button
              key={index}
              className={style.btn}
              data-index={index}
              data-primary={button.primary ? true : undefined}
              onClick={onClickButton}
            >
              {button.label}
            </button>
          ))
        ) : (
          <button
            className={style.btn}
            data-primary="true"
            onClick={onClickButton}
          >
            OK
          </button>
        )}
      </div>
    </div>
  );
};
