import { formatDate } from "@/lib/utils/DateUtil";
import { classNames, preventDefault } from "@/lib/utils/ElementUtil";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import styles from "./DatePicker.module.scss";

export interface DatePickerProps {
  defaultDisplayDate?: number | Date;
  defaultValue?: number | Date;
  defaultRange?: [number, number]; // デフォルトの範囲選択
  acceptedRange?: [number, number]; // 選択可能範囲
  disabled?: boolean;
  enabledRange?: boolean; // 範囲選択を有効化するか
  onRangeSelect?: (start: number | undefined, end: number | undefined) => void;
  onSelectDate?: (date: Date) => void;
}
export const DatePicker = (props: DatePickerProps) => {
  const {
    defaultDisplayDate,
    defaultValue,
    defaultRange,
    acceptedRange,
    disabled,
    enabledRange,
    onSelectDate,
  } = props;

  const [selectedTime, setSelectedTime] = useState(dateToTime(defaultValue));
  const [displayTime, setDisplayDate] = useState(
    dateToTime(defaultDisplayDate, selectedTime || Date.now())
  );

  const [weeks, setWeeks] = useState<number[][]>([]);

  // 範囲選択
  const [rangeStart, setRangeStart] = useState<number | undefined>(
    defaultRange?.[0] ? defaultRange[0] : undefined
  );
  const [rangeEnd, setRangeEnd] = useState<number | undefined>(
    defaultRange?.[1] ? defaultRange[1] : undefined
  );

  // カレンダーのセルを作る
  useEffect(() => {
    const date = new Date(displayTime ?? Date.now());
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    const startOfMonth = dayjs(date).startOf("month");
    let day = startOfMonth.subtract(startOfMonth.day(), "days").valueOf();
    (() => {
      const date = new Date(day);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    })();

    const endOfMonth = dayjs(date).endOf("month");
    const lastDay = endOfMonth.valueOf();

    const weeks: number[][] = [];

    // 次の週
    let week: number[] = [];
    let count = 0;
    while (day < lastDay && count++ < 100) {
      week = [];
      for (let i = 0; i < 7; i++) {
        week.push(day);
        day += 86400000;
      }
      weeks.push(week);
    }

    setWeeks(weeks);
  }, [displayTime]);

  // 今日
  const today = formatDate(new Date(), "YYYYMMDD");

  // 現在の月
  const currMonth = new Date(displayTime ?? Date.now()).getMonth();

  // selectedDate の 00:00:00
  const selectedDateX = selectedTime
    ? dayjs(dayjs(selectedTime).format("YYYY-MM-DDT00:00:00Z")).valueOf()
    : undefined;

  // 有効な範囲
  const dateRange = useMemo(() => {
    const ranges: [number, number][] = [];
    if (acceptedRange) {
      ranges.push([
        parseInt(formatDate(acceptedRange[0], "YYYYMMDD"), 10),
        parseInt(formatDate(acceptedRange[1], "YYYYMMDD"), 10),
      ]);
    } else {
      ranges.push([-Infinity, Infinity]);
    }
    return ranges;
  }, [acceptedRange]);

  const [displayYear, displayMonth] = useMemo(() => {
    return [
      new Date(displayTime ?? Date.now()).getFullYear(),
      new Date(displayTime ?? Date.now()).getMonth(),
    ];
  }, [displayTime]);

  const handleDateClick = (time: number) => {
    if (enabledRange) {
      // 現在の選択状態に基づいて新しい開始日と終了日を決定
      const newStart =
        rangeStart === undefined || rangeEnd !== undefined
          ? time
          : Math.min(rangeStart, time);
      const newEnd =
        rangeEnd === undefined && rangeStart !== undefined
          ? Math.max(rangeStart, time)
          : undefined;

      setRangeStart(newStart);
      setRangeEnd(newEnd);

      // 範囲選択が完了した場合（開始日と終了日が両方設定されている場合）
      if (newStart !== undefined && newEnd !== undefined) {
        props.onRangeSelect?.(newStart, newEnd);
      }
    } else {
      setSelectedTime(time);
      if (onSelectDate) {
        onSelectDate(new Date(time));
      }
    }
  };

  return (
    <div
      className={styles.component}
      aria-disabled={disabled ? "true" : undefined}
    >
      <div className={styles.content}>
        <div className={styles.col}>
          <div className={styles.title}>
            <div className={styles.year}>
              {displayYear}年
              <select
                className={styles.invisibleSelect}
                defaultValue={displayYear}
                onChange={(event) => {
                  const newDate = new Date(displayTime ?? Date.now());
                  newDate.setFullYear(parseInt(event.currentTarget.value, 10));
                  setDisplayDate(newDate.getTime());
                }}
              >
                {createList(displayYear - 10, displayYear + 10).map((year) => (
                  <option key={year} value={year}>
                    {year}年
                  </option>
                ))}
              </select>
              <i className={classNames(styles.icon, "ri-arrow-down-s-line")} />
            </div>
            <div className={styles.month}>
              {displayMonth + 1}月
              <select
                className={styles.invisibleSelect}
                defaultValue={displayMonth + 1}
                onChange={(event) => {
                  const newDate = new Date(displayTime ?? Date.now());
                  newDate.setMonth(parseInt(event.currentTarget.value, 10) - 1);
                  setDisplayDate(newDate.getTime());
                }}
              >
                {createList(1, 12).map((month) => (
                  <option key={month} value={month}>
                    {month}月
                  </option>
                ))}
              </select>
              <i className={classNames(styles.icon, "ri-arrow-down-s-line")} />
            </div>
            <div className={styles.flex} />
            <div
              role="button"
              className={classNames(styles.btn, styles.now)}
              aria-disabled={
                dayjs(displayTime).format("YYYYMM") === dayjs().format("YYYYMM")
              }
              onClick={(event) => {
                preventDefault(event);
                setDisplayDate(Date.now());
              }}
            >
              今日
            </div>
            <div
              role="button"
              className={styles.btn}
              onClick={(event) => {
                preventDefault(event);
                setDisplayDate(dayjs(displayTime).add(-1, "month").valueOf());
              }}
            >
              <i className={classNames(styles.icon, "ri-arrow-left-s-line")} />
            </div>
            <div
              role="button"
              className={styles.btn}
              onClick={(event) => {
                preventDefault(event);
                setDisplayDate(dayjs(displayTime).add(1, "month").valueOf());
              }}
            >
              <i className={classNames(styles.icon, "ri-arrow-right-s-line")} />
            </div>
          </div>

          <table key={displayTime} className={styles.calendarTable}>
            <thead>
              <tr>
                <td data-day="0">Sun</td>
                <td data-day="1">Mon</td>
                <td data-day="2">Tue</td>
                <td data-day="3">Wed</td>
                <td data-day="4">Thu</td>
                <td data-day="5">Fri</td>
                <td data-day="6">Sat</td>
              </tr>
            </thead>

            <tbody>
              {weeks.map((week) => (
                <tr key={week[0].valueOf()}>
                  {week.map((time) => {
                    const date = new Date(time);

                    const d = parseInt(formatDate(date, "YYYYMMDD"), 10);
                    const enabled = !!dateRange.find(
                      (range) => range[0] <= d && range[1] >= d
                    );

                    // 範囲選択のスタイルを適用
                    const isStart =
                      new Date(time).toDateString() ===
                      new Date(rangeStart ?? Date.now()).toDateString();
                    const isEnd =
                      new Date(time).toDateString() ===
                      new Date(rangeEnd ?? Date.now()).toDateString();
                    const inRange =
                      enabledRange &&
                      time >= (rangeStart ?? Date.now()) &&
                      time <= (rangeEnd ?? Date.now());

                    return (
                      <td
                        key={date.valueOf()}
                        data-curr-month={currMonth === date.getMonth()}
                        data-day={date.getDate()}
                        data-today={formatDate(date, "YYYYMMDD") === today}
                        aria-selected={time === selectedDateX}
                        aria-disabled={!enabled}
                        data-start={isStart ? "true" : undefined}
                        data-end={isEnd ? "true" : undefined}
                        data-range={inRange ? "true" : undefined}
                        onClick={(event) => {
                          preventDefault(event);
                          setSelectedTime(time);
                          handleDateClick(time);
                          if (onSelectDate) {
                            onSelectDate(new Date(time));
                          }
                        }}
                      >
                        <div className={styles.date}>
                          {date.getDate()}
                          <div className={styles.circle} />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

function dateToTime(
  date: undefined | number | Date,
  defaultValue?: number
): number | undefined {
  if (typeof date === "undefined") return defaultValue;
  else if (typeof date === "number") return date;
  else return date.getTime();
}

function createList(min: number, max: number) {
  const list: number[] = [];
  for (let i = min; i <= max; i++) list.push(i);
  return list;
}
