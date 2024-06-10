import { FormErrors, FormValidation, FormValues } from '../Form';

/**
 * フォームの値を取得する
 * @param formElem
 * @returns
 */
export const getFormValues = (formElem: HTMLFormElement) => {
  const values: FormValues = {};
  const formItems = formElem.querySelectorAll('input, textarea, select');
  Array.from(formItems).forEach(formItem => {
    if (
      !(formItem instanceof HTMLInputElement) &&
      !(formItem instanceof HTMLTextAreaElement) &&
      !(formItem instanceof HTMLSelectElement)
    ) {
      return;
    }

    if (!formItem.name) return;
    if (
      formItem instanceof HTMLInputElement &&
      formItem.getAttribute('type') === 'checkbox'
    ) {
      if (formItem.checked) {
        if (values[formItem.name]) {
          values[formItem.name] += `,${formItem.value}`;
        } else {
          values[formItem.name] = formItem.value;
        }
      }
    } else if (
      formItem instanceof HTMLInputElement &&
      formItem.getAttribute('type') === 'radio'
    ) {
      if (formItem.checked) {
        values[formItem.name] = formItem.value;
      } else {
        values[formItem.name] = values[formItem.name] ?? '';
      }
    } else {
      values[formItem.name] = convertTextValue(formItem.value);
    }
  });

  return values;
};

/**
 * テキストの値を変換する
 * @param value
 * @returns
 */
export function convertTextValue(value: string) {
  return value.replace(/\t/g, ' ').trim();
}

/**
 * フォームのバリデーションエラーを取得する
 * @param values
 * @param validations
 * @returns
 */
export function getValidationErrors(
  values: FormValues,
  validations?: { [key: string]: FormValidation[] },
) {
  const errors: FormErrors = {};

  if (validations) {
    const validationKeys = Object.keys(validations);
    for (const key of validationKeys) {
      const value = (() => {
        let val = key;
        if (!val.match(/\{[-_a-zA-Z0-9]+\}/)) {
          val = `{${val}}`;
        }
        return val.replace(/\{[-_a-zA-Z0-9]+\}/g, val => {
          const valKey = val.replace(/^{/, '').replace(/}$/, '');
          return values[valKey] || '';
        });
      })();
      const tests = validations[key];
      for (const test of tests) {
        // 必須チェック
        if (
          test.required &&
          (value === '' || value === undefined || value === null)
        ) {
          errors[key] = test.errorText || 'error';
          break;
        }

        // 正規表現チェック
        else if (test.test instanceof RegExp) {
          if (!value.match(test.test)) {
            errors[key] = test.errorText || 'error';
            break;
          }
        }

        // 関数チェック
        else if (test.test && !test.test?.(value)) {
          errors[key] = test.errorText || 'error';
          break;
        }

        // 文字列長チェック
        else if (test.length) {
          const { min, max } = test.length;
          const valueLength = getCharacterLength(value);
          if (
            (typeof min !== 'undefined' && valueLength < min) ||
            (typeof max !== 'undefined' && valueLength > max)
          ) {
            errors[key] = test.errorText || 'error';
            break;
          }
        }

        // 数字の範囲チェック
        else if (test.range) {
          const { min, max } = test.range;
          const valueNum = parseInt(value, 10);
          if (
            isNaN(valueNum) ||
            (typeof min !== 'undefined' && valueNum < min) ||
            (typeof max !== 'undefined' && valueNum > max)
          ) {
            errors[key] = test.errorText || 'error';
            break;
          }
        }
      }
    }
  }

  return Object.keys(errors).length > 0 ? errors : undefined;
}

export function getCharacterLength(str: string) {
  return Array.from(str).length;
}
