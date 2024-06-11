import { classNames, preventDefault } from "@/lib/utils/ElementUtil";
import { ReactNode, useMemo, useRef, useState } from "react";
import "remixicon/fonts/remixicon.css";
import {
  FloatingTriggerBase,
  FloatingTriggerHandler,
  FloatingTriggerProps,
} from "../FloatingTriggerBase";
import { TextInput } from "../TextInput";
import styles from "./FloatingMenuButton.module.scss";

interface MenuItem<T> {
  label: ReactNode;
  buttonLabel?: ReactNode;
  value?: T;
  disabled?: boolean;
  itemClassName?: string;
  variant?: "dark" | "default" | "alert" | "primary" | "text";
  onClick?: (value: T) => void;
}

export interface FloatingMenuButtonProps<T = unknown>
  extends Omit<FloatingTriggerProps, "children"> {
  items: (MenuItem<T> | null)[];
  defaultValue?: T;
  onChange?: (item: MenuItem<T>) => void;
  variant?: "dark" | "default";
  children?: ReactNode;
}

const checkType = (value: unknown) => {
  return typeof value === "string" || typeof value === "number";
};

export const FloatingMenuButton = (props: FloatingMenuButtonProps) => {
  const {
    items,
    children,
    offsetY = 5,
    defaultValue,
    onChange,
    variant = "dark",
    ...baseProps
  } = props;

  const floatingTriggerRef = useRef<FloatingTriggerHandler>(null);

  const displayItems = (items?.filter((item) => !!item) ||
    []) as MenuItem<unknown>[];

  const [value, setValue] = useState(defaultValue);

  const selectedLabel = useMemo(() => {
    const item = items.find((item) => item?.value === value);
    if (!item) return null;

    return ((checkType(item?.buttonLabel) && item.buttonLabel) ||
      (checkType(item?.label) && item.label) ||
      (checkType(item?.value) && item.value) ||
      "") as string | number;
  }, [value, items]);

  const content = useMemo(() => {
    if (children) {
      return children;
    }
    return (
      <TextInput
        value={
          typeof selectedLabel === "number"
            ? `${selectedLabel}`
            : selectedLabel ?? ""
        }
        readOnly
      />
    );
  }, [selectedLabel, children]);

  return (
    <FloatingTriggerBase
      ref={floatingTriggerRef}
      {...baseProps}
      offsetY={offsetY}
      floatingContent={
        <div className={classNames(styles.menu)} data-variant={variant}>
          {displayItems.map((item, index) => {
            return (
              <div
                key={index}
                className={classNames(styles.menuItem, item?.itemClassName)}
                aria-disabled={item.disabled}
                data-variant={item.variant ? item.variant : variant}
                onClick={(event) => {
                  preventDefault(event);

                  const value =
                    typeof item.value !== "undefined"
                      ? item.value
                      : typeof item.label === "string"
                        ? item.label
                        : item.label?.toString();

                  setValue(value);
                  item.onClick?.(value);
                  onChange?.(item);
                  floatingTriggerRef.current?.close?.();
                }}
              >
                {item.label}
              </div>
            );
          })}
        </div>
      }
    >
      {content}
    </FloatingTriggerBase>
  );
};
