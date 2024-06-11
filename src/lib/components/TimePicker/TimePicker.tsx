import { TouchManager } from "@/lib/managers/TouchManager";
import { Ease, Tween } from "@/lib/tween/Tween";
import { preventDefault } from "@/lib/utils/ElementUtil";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import styles from "./TimePicker.module.scss";

export interface TimePickerProps {
  defaultSelectedHours?: number;
  defaultSelectedMinutes?: number;
  minuteStep?: number;
  timeRange?: number;
  defaultSelectedAmPm?: "AM" | "PM";
  lang?: string;
  onSelectTime?: (hours?: number, minutes?: number, amPm?: "AM" | "PM") => void;
}

export interface TimePickerHandler {
  setHours: (hours: number | undefined) => void;
  setMinutes: (minutes: number | undefined) => void;
}

export const TimePicker = forwardRef<TimePickerHandler, TimePickerProps>(
  function TimePicker(props, ref) {
    const {
      defaultSelectedHours,
      defaultSelectedMinutes,
      minuteStep = 1,
      timeRange = 24,
      onSelectTime,
    } = props;

    const hoursScrollerRef = useRef<HTMLDivElement>(null);
    const minutesScrollerRef = useRef<HTMLDivElement>(null);

    const [selectedHours, setSelectedHours] = useState(defaultSelectedHours);
    const [selectedMinutes, setSelectedMinutes] = useState(
      defaultSelectedMinutes
    );

    // 初期化
    useEffect(() => {
      const onWheel = (event: WheelEvent) => {
        event.preventDefault();
        const target = event.currentTarget as HTMLElement;
        target.scrollTop += event.deltaY;
      };

      let hoursTouchManager: TouchManager;
      let minutesTouchManager: TouchManager;

      // 時のスクロール位置調整
      const hoursScroller = hoursScrollerRef.current;
      if (hoursScroller) {
        hoursTouchManager = new TouchManager(hoursScroller);
        hoursTouchManager.on("move", (event) => {
          hoursScroller.scrollTop -= event.items[0].moveY;
        });

        hoursScroller.addEventListener("wheel", onWheel);

        // 初期表示
        if (typeof selectedHours === "number") {
          const displayHours = selectedHours;
          const itemElem = hoursScroller.querySelector(
            `[data-value="${displayHours}"]`
          );
          if (itemElem) {
            const itemRect = itemElem.getBoundingClientRect();
            const scrollerRect = hoursScroller.getBoundingClientRect();
            hoursScroller.scrollTop =
              itemRect.top -
              scrollerRect.top -
              (scrollerRect.height - itemRect.height) / 2;
          }
        }
      }

      // 分のスクロール位置調整
      const minutesScroller = minutesScrollerRef.current;
      if (minutesScroller) {
        minutesTouchManager = new TouchManager(minutesScroller);
        minutesTouchManager.on("move", (event) => {
          minutesScroller.scrollTop -= event.items[0].moveY;
        });

        minutesScroller.addEventListener("wheel", onWheel);

        // 初期表示
        if (typeof selectedMinutes === "number") {
          const itemElem = minutesScroller.querySelector(
            `[data-value="${selectedMinutes}"]`
          );
          if (itemElem) {
            const itemRect = itemElem.getBoundingClientRect();
            const scrollerRect = minutesScroller.getBoundingClientRect();
            minutesScroller.scrollTop =
              itemRect.top -
              scrollerRect.top -
              (scrollerRect.height - itemRect.height) / 2;
          }
        }
      }
      return () => {
        hoursTouchManager?.dispose();
        minutesTouchManager?.dispose();
        hoursScroller?.removeEventListener("wheel", onWheel);
        minutesScroller?.removeEventListener("wheel", onWheel);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeRange]);

    const hours = () => {
      const list: number[] = [];
      for (let i = 0; i < 24; i++) {
        list.push(i);
      }
      return list;
    };

    const minutes = useMemo(() => {
      const list: number[] = [];
      for (let i = 0; i < 60; i += minuteStep) {
        list.push(i);
      }
      return list;
    }, [minuteStep]);

    // Handler
    useImperativeHandle(
      ref,
      () => ({
        setHours: (hours: number | undefined) => {
          setSelectedHours(hours);
          if (selectedHours !== hours) {
            const hoursScroller = hoursScrollerRef.current;
            if (hoursScroller) {
              const itemElem = hoursScroller.querySelector(
                `[data-value="${hours}"]`
              );
              if (itemElem) {
                const scrollTop =
                  itemElem.getBoundingClientRect().top -
                  hoursScroller.getBoundingClientRect().top;
                Tween.get({ scrollTop: hoursScroller.scrollTop })
                  .to({ scrollTop }, 200, Ease.circOut)
                  .onUpdate((data) => {
                    hoursScroller.scrollTop = data.scrollTop;
                  });
              }
            }
          }
        },
        setMinutes: (minutes: number | undefined) => {
          setSelectedMinutes(minutes);
          if (selectedMinutes !== minutes) {
            const minutesScroller = minutesScrollerRef.current;
            if (minutesScroller) {
              const itemElem = minutesScroller.querySelector(
                `[data-value="${minutes}"]`
              );
              if (itemElem) {
                const scrollTop =
                  itemElem.getBoundingClientRect().top -
                  minutesScroller.getBoundingClientRect().top;
                Tween.get({ scrollTop: minutesScroller.scrollTop })
                  .to({ scrollTop }, 200, Ease.circOut)
                  .onUpdate((data) => {
                    minutesScroller.scrollTop = data.scrollTop;
                  });
              }
            }
          }
        },
      }),
      [selectedHours, selectedMinutes]
    );

    return (
      <div className={styles.component}>
        <div className={styles.container}>
          <div data-hours-type={timeRange} className={styles.title}>
            {timeRange === 12 ? (
              <>
                <div className={styles.time}>
                  {typeof selectedHours === "number"
                    ? selectedHours % 12 || 12 // 12時間表記で0または12を12として表示
                    : "--"}
                  :
                  {typeof selectedMinutes === "number"
                    ? selectedMinutes.toString().padStart(2, "0")
                    : "--"}
                  {(selectedHours as number) <= 11 ? " AM" : " PM"}
                </div>
              </>
            ) : (
              <>
                {typeof selectedHours === "number" ? selectedHours : "--"}:
                {typeof selectedMinutes === "number"
                  ? selectedMinutes.toString().padStart(2, "0")
                  : "--"}
              </>
            )}
          </div>
          <div className={styles.content}>
            <div className={styles.hours}>
              <div ref={hoursScrollerRef} className={styles.scroller}>
                {hours().map((hour) => (
                  <div
                    key={hour}
                    role="button"
                    className={styles.hour}
                    data-selected={selectedHours === hour}
                    data-value={hour}
                    onClick={(event) => {
                      preventDefault(event);
                      setSelectedHours(hour);
                      if (onSelectTime) onSelectTime(hour, selectedMinutes);
                    }}
                  >
                    {hour}
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.divider}>:</div>
            {/* 分 */}
            <div className={styles.minutes}>
              <div ref={minutesScrollerRef} className={styles.scroller}>
                {minutes.map((min) => (
                  <div
                    key={min}
                    role="button"
                    className={styles.min}
                    data-selected={selectedMinutes === min}
                    data-value={min}
                    onClick={(event) => {
                      preventDefault(event);
                      setSelectedMinutes(min);
                      if (onSelectTime) onSelectTime(selectedHours, min);
                    }}
                  >
                    {min < 10 ? `0${min}` : min}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
