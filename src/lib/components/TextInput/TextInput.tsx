import { classNames, preventDefault } from "@/lib/utils/ElementUtil";
import {
  CSSProperties,
  InputHTMLAttributes,
  ReactNode,
  SyntheticEvent,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import styles from "./TextInput.module.scss";

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  inputMode?: "numeric" | "url" | "search" | "decimal" | "tel" | "email";
  defaultValue?: string;
  type?: "text" | "password" | "email" | "tel";
  containerStyle?: CSSProperties;
  labelClassName?: string;
  rightContent?: ReactNode;
  inputClassName?: string;
  disabled?: boolean;
  error?: boolean;
  shape?: "rectangle" | "rounded";
  inputStyle?: "normal" | "transparent";
  onChangeValue?: (value: string) => void;
  onAutoFill?: () => void;
}

export interface TextInputHandler {
  focus: () => void;
  blur: () => void;
  getValue: () => string;
  getAutoFilled: () => boolean;
}

export const TextInput = forwardRef<TextInputHandler, TextInputProps>(
  function TextInput(props, ref) {
    const {
      label,
      inputMode,
      defaultValue,
      type,
      containerStyle,
      labelClassName,
      inputClassName,
      rightContent,
      disabled,
      error,
      shape = "rectangle",
      inputStyle = "normal",
      onChangeValue,
      onAutoFill,
      ...inputProps
    } = props;
    const inputRef = useRef<HTMLInputElement>(null);

    const [value, setValue] = useState(
      typeof defaultValue === "string" ? defaultValue : ""
    );
    const [focused, setFocused] = useState(false);

    // メソッド
    const methods = useMemo(() => {
      return {
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
          const autoFilledElems =
            document.querySelectorAll(":-webkit-autofill");
          for (let i = 0; i < autoFilledElems.length; i++) {
            const autoFilledElem = autoFilledElems.item(i);
            if (autoFilledElem === inputRef.current) {
              return true;
            }
          }
          return false;
        },
      };
    }, []);
    useImperativeHandle(ref, () => methods, [methods]);

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
          if (methods.getAutoFilled()) {
            if (onAutoFill) onAutoFill();
          }
        });
      },
      [methods, onAutoFill]
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
      if (onChangeValue) {
        onChangeValue(value);
      }
    }, [value, onChangeValue]);

    return (
      <div
        className={styles.component}
        style={containerStyle}
        data-ui="TextInput"
        data-has-value={focused || value !== ""}
        data-has-error={error ? "true" : undefined}
        data-shape={shape}
        data-style={inputStyle}
      >
        <div className={styles.content}>
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
            inputMode={inputMode}
            defaultValue={defaultValue}
            disabled={disabled ? true : undefined}
            onChange={onChangeInput}
            onFocus={onFocusInput}
            onBlur={onBlurInput}
            onKeyDown={onKeyDownInput}
            {...inputProps}
          />
          {rightContent && (
            <div
              className={styles.rightContent}
              onClick={() => {
                inputRef.current?.focus();
              }}
            >
              {rightContent}
            </div>
          )}
        </div>
      </div>
    );
  }
);
