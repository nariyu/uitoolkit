/**
 * JSON をハイライトする
 * @param data
 */
export const highlightJson = (data: unknown) => {
  if (!data) return '';

  const formattedJson = JSON.stringify(
    data,
    (_, v) => {
      const obj: { [key: string]: unknown } = {};
      return !(v instanceof Array || v === null) && typeof v === 'object'
        ? Object.keys(v)
            .sort()
            .reduce((r, k) => {
              r[k] = v[k];
              return r;
            }, obj)
        : v;
    },
    '  ',
  );

  let str = escapeHTML(formattedJson);
  str = str.replace(
    /(?:(&quot;[^&]*?&quot;: (?:true|false))|(&quot;[^&]*?&quot;: -?\d+(?:\.\d+)?)|(&quot;[^&]*?&quot;:)|(&quot;.*?(?<!\\)&quot;))/g,
    (match, bool, num, key, sstr) => {
      if (bool) {
        return bool.replace(
          /(&quot;[^&]+?&quot;:) (true|false)/,
          '<span class="key">$1</span> <span class="bool">$2</span>',
        );
      }
      if (num) {
        return num.replace(
          /(&quot;[^&]+?&quot;:) (-?\d+(?:\.\d+)?)/,
          '<span class="key">$1</span> <span class="num">$2</span>',
        );
      }
      if (key) {
        return '<span class="key">' + key + '</span>';
      }
      if (sstr) {
        return '<span class="string">' + sstr + '</span>';
      }
      return match;
    },
  );

  return str;
};

const escapeHTML = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br/>');
};
