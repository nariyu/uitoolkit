import {
  SyntheticEvent,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { classNames, preventDefault } from "../../utils/ElementUtil";

import styles from "./TextInput.module.scss";

interface Props {
  label?: string;
  placeholder?: string;
  name?: string;
  inputMode?: "numeric" | "url" | "search" | "decimal" | "tel" | "email";
  autoComplete?: string;
  autoCorrect?: boolean;
  defaultValue?: string;
  type?: "text" | "password" | "email" | "tel";
  pattern?: string;
  maxLength?: number;
  labelClassName?: string;
  inputClassName?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
  onAutoFill?: () => void;
}
export interface TextInputHandler {
  focus: () => void;
  blur: () => void;
  getValue: () => string;
  getAutoFilled: () => boolean;
}
export const TextInput = forwardRef<TextInputHandler, Props>(
  function TextInput(props, ref) {
    const {
      label,
      placeholder,
      name,
      inputMode,
      autoComplete,
      autoCorrect,
      defaultValue,
      type,
      pattern,
      maxLength,
      labelClassName,
      inputClassName,
      disabled,
      onChange,
      onAutoFill,
    } = props;
    const inputRef = useRef<HTMLInputElement>(null);

    const [value, setValue] = useState(
      typeof defaultValue === "string" ? defaultValue : ""
    );
    const [focused, setFocused] = useState(false);

    useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          const input = inputRef.current;
          if (input) input.focus();
        },
        blur: () => {
          const input = inputRef.current;
          if (input) input.blur();
        },
        getValue: () => {
          const input = inputRef.current;
          return input ? input.value : "";
        },
        getAutoFilled: () => {
          const autoFilledElements =
            document.querySelectorAll(":-webkit-autofill");
          for (let i = 0; i < autoFilledElements.length; i++) {
            const autoFilledElem = autoFilledElements.item(i);
            if (autoFilledElem === inputRef.current) {
              return true;
            }
          }
          return false;
        },
      }),
      []
    );

    const onClickLabel = useCallback((event: SyntheticEvent) => {
      preventDefault(event);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, []);

    const onChangeInput = useCallback(
      (event: SyntheticEvent<HTMLInputElement>) => {
        preventDefault(event);
        setValue(event.currentTarget.value);

        requestAnimationFrame(() => {
          if (!ref || typeof ref === "function") return;
          const impl = ref.current;
          if (impl) {
            if (impl.getAutoFilled()) {
              if (onAutoFill) onAutoFill();
            }
          }
        });
      },
      [onAutoFill, ref]
    );
    const onFocusInput = useCallback(() => {
      setFocused(true);
    }, []);
    const onBlurInput = useCallback(() => {
      setFocused(false);
    }, []);

    const onKeyDownInput = useCallback(
      (event: SyntheticEvent<HTMLInputElement, KeyboardEvent>) => {
        if (type === "password") {
          if (
            event.nativeEvent.key === "Backspace" ||
            event.nativeEvent.key === "Delete"
          ) {
            event.currentTarget.value = "";
          }
        }
      },
      [type]
    );

    useEffect(() => {
      if (onChange) {
        onChange(value);
      }
    }, [value, onChange]);

    return (
      <div
        className={styles.component}
        data-has-value={focused || value !== ""}
      >
        {typeof label === "string" ? (
          <div
            className={classNames(styles.label, labelClassName)}
            onClick={onClickLabel}
          >
            {label}
          </div>
        ) : null}
        <input
          ref={inputRef}
          className={classNames(styles.input, inputClassName)}
          type={type || "text"}
          pattern={pattern}
          name={name}
          inputMode={inputMode}
          autoComplete={autoComplete || name}
          autoCorrect={autoCorrect === false ? "off" : undefined}
          autoCapitalize={autoCorrect === false ? "off" : undefined}
          placeholder={placeholder}
          defaultValue={defaultValue}
          maxLength={maxLength}
          disabled={disabled ? true : undefined}
          onChange={onChangeInput}
          onFocus={onFocusInput}
          onBlur={onBlurInput}
          onKeyDown={onKeyDownInput}
        />
      </div>
    );
  }
);
