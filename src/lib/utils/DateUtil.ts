/**
 * 日時を成形した文字列で取得する
 * @param {String} formatStr フォーマット
 * @param {Date} date 日付（オプション）
 * @return {String} フォーマット後の文字列
 */
export const formatDate = (
  dateTime?: Date | number,
  formatStr?: string | null,
): string => {
  let d: Date;

  if (dateTime === undefined) {
    d = new Date();
  } else if (typeof dateTime === 'number') {
    d = new Date(dateTime);
  } else {
    d = dateTime as Date;
  }

  if (!formatStr) {
    return formatDate(d, 'YYYY-MM-DD HH:mm:ss Z');
  }

  const fullYear = d.getFullYear();
  const month = d.getMonth();
  const monthString = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ][month];
  const date = d.getDate();
  const day = d.getDay();
  const dayStr = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ][day];
  const dayJPStr = ['日', '月', '火', '水', '木', '金', '土'][day];
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const seconds = d.getSeconds();
  const milliSeconds = d.getMilliseconds();
  const offsetTime = d.getTimezoneOffset() * -1;
  const offsetSymbol = offsetTime < 0 ? '-' : '+';
  const offsetHours = padZero(Math.floor(offsetTime / 60));
  const offsetMinutes = padZero(offsetTime % 60);

  formatStr = formatStr.replace(
    /YYYY|YY|MMMM|MMM|MM|M|DD|D|ddj|dj|dddd|ddd|dd|d|HH|H|hh|h|mm|m|ss|s|SSS|SS|S|ZZ|Z|[YMDdhmsXZc]/g,
    (str: string): string => {
      switch (str) {
        // years
        case 'YY':
          return (fullYear + '').substr(2);
        case 'YYYY':
          return `${fullYear}`;

        // months
        case 'M':
          return `${month + 1}`;
        case 'MM':
          return padZero(month + 1);
        case 'MMM':
          return monthString.substr(0, 3);
        case 'MMMM':
          return monthString;

        // date
        case 'D':
          return `${date}`;
        case 'DD':
          return padZero(date);

        // weeks
        case 'd':
          return `${day}`;
        case 'dd':
          return dayStr.substr(0, 2);
        case 'ddd':
          return dayStr.substr(0, 3);
        case 'dddd':
          return dayStr;
        case 'ddj':
          return dayJPStr + '曜日';
        case 'dj':
          return dayJPStr;

        // hours
        case 'H':
          return `${hours}`;
        case 'HH':
          return padZero(hours);
        case 'h':
          return `${hours % 12}`;
        case 'hh':
          return padZero(hours % 12);

        // minutes
        case 'm':
          return `${minutes}`;
        case 'mm':
          return padZero(minutes);

        // seconds
        case 's':
          return `${seconds}`;
        case 'ss':
          return padZero(seconds);

        // milli seconds
        case 'S':
          return `${milliSeconds}`;
        case 'SS':
          return padZero(milliSeconds);
        case 'SSS':
          return padZero(milliSeconds);

        // others
        case 'X':
          return `${Math.floor(d.getTime() / 1000)}`;

        // format
        case 'Z':
          return offsetSymbol + [offsetHours, offsetMinutes].join(':');
        case 'ZZ':
          return offsetSymbol + [offsetHours, offsetMinutes].join('');

        case 'c':
          return formatDate(d, 'YYYY-MM-DDTHH:mm:ssZ'); // ISO 8601

        default:
          return str;
      }
    },
  );

  return formatStr;
};

/**
 * 残り時間を計算する
 */
export const getRemainTime = (target: Date, now?: Date) => {
  if (!now) now = new Date();

  const remainSeconds = (target.getTime() - now.getTime()) / 1000;

  const dates = Math.floor(remainSeconds / 60 / 60 / 24);
  const hours = Math.floor(remainSeconds / 60 / 60) % 24;
  const minutes = Math.floor(remainSeconds / 60) % 60;
  const seconds = Math.floor(remainSeconds % 60);

  return { dates, hours, minutes, seconds };
};

//
const padZero = (num: number, maxLength = 2) =>
  `${num}`.padStart(maxLength, '0');
