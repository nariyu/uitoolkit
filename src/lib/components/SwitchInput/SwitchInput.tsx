import {
  forwardRef,
  SyntheticEvent,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import style from "./SwitchInput.module.scss";

interface Props {
  label?: string;
  disabledLabel?: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}
interface SwitchInputHandler {
  getChecked: () => boolean;
}
export const SwitchInput = forwardRef<SwitchInputHandler, Props>(
  function SwitchInput(props, ref) {
    const {
      label,
      disabledLabel,
      defaultChecked,
      checked: forceChecked,
      onChange,
    } = props;

    const [checked, setChecked] = useState(!!defaultChecked);

    useEffect(() => {
      if (typeof forceChecked === "boolean") {
        setChecked(forceChecked);
      }
    }, [forceChecked]);

    useImperativeHandle(
      ref,
      () => ({
        getChecked: () => {
          return checked;
        },
      }),
      [checked]
    );

    // CLICK
    const onClick = useCallback(
      (event: SyntheticEvent) => {
        event.preventDefault();
        setChecked(!checked);
        if (onChange) {
          onChange(!checked);
        }
      },
      [checked, onChange]
    );

    return (
      <div
        className={style.component}
        role="switch"
        aria-checked={checked}
        onClick={onClick}
      >
        <div className={style.content}>
          <div className={style.switcher}>
            <div className={style.thumb}></div>
          </div>
          {typeof label === "string" ? (
            <div className={style.label}>
              {!checked && typeof disabledLabel === "string"
                ? disabledLabel
                : label}
            </div>
          ) : null}
        </div>
      </div>
    );
  }
);
