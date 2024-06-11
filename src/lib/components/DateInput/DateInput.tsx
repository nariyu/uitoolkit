import { formatDate, getRelativeFormat } from "@/lib/utils/DateUtil";
import { classNames, preventDefault } from "@/lib/utils/ElementUtil";
import {
  CSSProperties,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { DatePicker } from "../DatePicker";
import {
  FloatingTriggerBase,
  FloatingTriggerHandler,
} from "../FloatingTriggerBase";
import { TimePicker, TimePickerHandler } from "../TimePicker";
import styles from "./DateInput.module.scss";

interface DateInputProps {
  name?: string;
  defaultValue?: number;
  defaultRange?: [number, number]; // デフォルトの範囲選択
  closeOnSelect?: boolean;

  enabledTimePicker?: boolean; // TimePickerの表示有無
  enabledTimeRange?: [number, number]; // 選択可能範囲
  minuteStep?: number;
  className?: string;
  style?: CSSProperties;
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  enabledRange?: boolean;
  error?: boolean;
  displayValueFormatter?: (date: Date) => string;
  onChange?: (date: Date) => void;
  onRangeSelect?: (
    start: Date | number | undefined,
    end: Date | number | undefined
  ) => void;
}

export interface DateInputHandler {
  setValue: (date: number | undefined) => void;
}

export const DateInput = forwardRef<DateInputHandler, DateInputProps>(
  function DateInput(props, ref) {
    const {
      name,
      defaultValue,
      defaultRange,
      closeOnSelect = true,

      enabledTimePicker = false,
      enabledTimeRange,
      minuteStep,

      className,
      style,
      size,
      disabled,
      enabledRange,
      error,
      displayValueFormatter,
      onChange,
      onRangeSelect,
    } = props;

    const inputElemRef = useRef<HTMLInputElement>(null);
    const timePickerRef = useRef<TimePickerHandler>(null);
    const floatingTriggerRef = useRef<FloatingTriggerHandler>(null);

    const [time, setTime] = useState(valueToTime(defaultValue));
    const initialHours = time ? new Date(time).getHours() : undefined;
    const [hours, setHours] = useState(initialHours);
    const [minutes, setMinutes] = useState(
      time ? new Date(time).getMinutes() : undefined
    );

    // 範囲選択
    const [rangeStart, setRangeStart] = useState<number | undefined>(
      defaultRange?.[0] || undefined
    );
    const [rangeEnd, setRangeEnd] = useState<number | undefined>(
      defaultRange?.[1] || undefined
    );
    const handleRangeSelection = useCallback(
      (start?: number, end?: number) => {
        if (typeof start !== "number" || typeof end !== "number") return;
        // 開始日と終了日を日付の早い順に設定
        const newStart = Math.min(start, end);
        const newEnd = Math.max(start, end);

        setRangeStart(newStart);
        setRangeEnd(newEnd);

        if (onRangeSelect) {
          onRangeSelect(new Date(newStart), new Date(newEnd));
        }
      },
      [onRangeSelect]
    );

    const amPm = useMemo(() => {
      if (initialHours && initialHours >= 12) {
        return "PM";
      } else {
        return "AM";
      }
    }, [initialHours]);

    useImperativeHandle(ref, () => {
      return {
        setValue: (value: number | undefined) => {
          setTime(value);
          setHours(value ? new Date(value).getHours() : undefined);
          setMinutes(value ? new Date(value).getMinutes() : undefined);
        },
      };
    }, []);

    useEffect(() => {
      if (time) {
        const date = new Date(time);

        // 日付が変更されたら TimePicker を変更する
        const timePicker = timePickerRef.current;

        if (timePicker) {
          timePicker.setHours(date.getHours());
          timePicker.setMinutes(date.getMinutes());
        }

        if (onChange) {
          date.setSeconds(0);
          date.setMilliseconds(0);
          onChange(date);
        }
      }
    }, [time, onChange]);

    const [dateTimeString, displayDateTimeString] = useMemo(() => {
      let formatString = "";
      enabledTimePicker
        ? (formatString = "YYYY年M月D日 H:mm")
        : (formatString = "YYYY年M月D日");

      const formatter =
        displayValueFormatter ||
        ((date: Date) => formatDate(date, formatString));

      if (enabledRange) {
        return [
          "",
          rangeStart && rangeEnd
            ? getDateRangeString(rangeStart, rangeEnd)
            : "",
        ];
      }

      return [
        time ? formatDate(time, "YYYY-MM-DDTHH:mm:ssZ") : "",
        time ? formatter(new Date(time)) : "",
      ];
    }, [
      enabledTimePicker,
      displayValueFormatter,
      time,
      enabledRange,
      rangeStart,
      rangeEnd,
    ]);

    useEffect(() => {
      if (inputElemRef.current) inputElemRef.current.value = dateTimeString;
    }, [dateTimeString]);

    const onSelectTime = useCallback(
      (hours: number, minutes: number) => {
        setHours(hours);
        setMinutes(minutes);

        if (time) {
          const date = new Date(time);
          date.setHours(hours);
          date.setMinutes(minutes);

          setTime(date.getTime());
        }
      },
      [time]
    );

    // const checkRange = useCallback(
    //   (date: Date) => {
    //     date.setSeconds(0);
    //     date.setMilliseconds(0);

    //     if (enabledTimeRange) {
    //       const min = enabledTimeRange[0];
    //       const max = enabledTimeRange[1];
    //       if (date.getTime() < min) {
    //         date.setTime(min);
    //       }
    //       if (date.getTime() > max) {
    //         date.setTime(max);
    //       }
    //     }
    //     return date;
    //   },
    //   [enabledTimeRange],
    // );

    return (
      <FloatingTriggerBase
        ref={floatingTriggerRef}
        offsetY={3}
        floatingContent={
          <div className={styles.calendarContainer} onClick={preventDefault}>
            <DatePicker
              defaultValue={time}
              defaultRange={defaultRange}
              acceptedRange={enabledTimeRange}
              enabledRange={enabledRange}
              onRangeSelect={handleRangeSelection}
              onSelectDate={(date) => {
                date.setHours(typeof hours === "number" ? hours : 0);
                date.setMinutes(typeof minutes === "number" ? minutes : 0);

                setTime(date.getTime());

                if (closeOnSelect && !enabledTimePicker && !enabledRange) {
                  floatingTriggerRef.current?.close?.();
                }
              }}
            />
            {enabledTimePicker && (
              <TimePicker
                ref={timePickerRef}
                defaultSelectedHours={hours}
                defaultSelectedMinutes={minutes}
                minuteStep={minuteStep}
                onSelectTime={(hours, minutes) => {
                  if (
                    typeof hours === "number" &&
                    typeof minutes === "number"
                  ) {
                    onSelectTime(hours, minutes);
                  }
                }}
                defaultSelectedAmPm={amPm}
              />
            )}
          </div>
        }
      >
        <div
          className={classNames(
            styles.component,
            error ? styles.error : undefined,
            className
          )}
          style={style}
          data-size={size}
          aria-disabled={disabled}
        >
          <div className={styles.value}>{displayDateTimeString}</div>
          <input
            ref={inputElemRef}
            className={styles.inputText}
            type="text"
            name={name}
          />
        </div>
      </FloatingTriggerBase>
    );
  }
);

function valueToTime(date: undefined | number | Date): number | undefined {
  if (typeof date === "undefined") return undefined;
  else if (typeof date === "number") return date;
  else return date.getTime();
}

function getDateRangeString(
  start: string | number | Date,
  end: string | number | Date,
  lang: "ja" | "en" = "ja"
) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const isSameYear = startDate.getFullYear() === endDate.getFullYear();

  const from = getRelativeFormat(startDate, "YYYY年M月D日", lang);
  const to = isSameYear
    ? getRelativeFormat(endDate, "M月D日", lang)
    : getRelativeFormat(endDate, "YYYY年M月D日", lang);

  if (lang === "en") return "From " + from + " To " + to;
  else return from + " 〜 " + to;
}
