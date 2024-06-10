import {
  convertTextValue,
  getCharacterLength,
  getValidationErrors,
} from './utils/FormUtil';

exports.module = describe('Form Validations', () => {
  // 文字数カウントテスト
  test('文字数カウント #1', () => {
    expect(getCharacterLength('😇😇😇')).toBe(3);
  });
  test('文字数カウント #2', () => {
    expect(getCharacterLength('こんにちは\n😇')).toBe(7);
  });
  test('文字数カウント #3', () => {
    expect(getCharacterLength('𩸽のひらき')).toBe(5);
  });

  // 必須テスト
  test('必須項目のテスト #1', () => {
    expect(
      getValidationErrors(
        { name: '' },
        {
          name: [
            {
              required: true,
              errorText: '名前は必須項目です。',
            },
          ],
        },
      ),
    ).toMatchObject({ name: '名前は必須項目です。' });
  });
  test('必須項目のテスト #2', () => {
    expect(
      getValidationErrors(
        { name: '名前' },
        {
          name: [
            {
              required: true,
              errorText: '名前は必須項目です。',
            },
          ],
        },
      ),
    ).toEqual(undefined);
  });

  // 文字列長バリデーションのテスト
  test('文字列長バリデーションのテスト #1', () => {
    expect(
      getValidationErrors(
        { name: '😇😇😇' },
        {
          name: [
            {
              length: { max: 3 },
              errorText: '名前は3文字以下で入力してください。',
            },
          ],
        },
      ),
    ).toEqual(undefined);
  });
  test('文字列長バリデーションのテスト #2-1', () => {
    expect(
      getValidationErrors(
        { name: 'こんにちは😇' },
        {
          name: [
            {
              length: { max: 5 },
              errorText: '名前は5文字以下で入力してください。',
            },
          ],
        },
      ),
    ).toEqual({ name: '名前は5文字以下で入力してください。' });
  });
  test('文字列長バリデーションのテスト #2-2', () => {
    expect(
      getValidationErrors(
        { name: 'こんにちは😇' },
        {
          name: [
            {
              length: { min: 6, max: 6 },
              errorText: '名前は6文字以下で入力してください。',
            },
          ],
        },
      ),
    ).toEqual(undefined);
  });
  test('文字列長バリデーションのテスト #2-3', () => {
    expect(
      getValidationErrors(
        { name: '🌕には𩸽' },
        {
          name: [
            {
              length: { min: 4, max: 4 },
              errorText: '名前は4文字以下で入力してください。',
            },
          ],
        },
      ),
    ).toEqual(undefined);
  });

  test('タブ文字をスペースに変換', () => {
    expect(convertTextValue('こんにちは\t😇')).toEqual('こんにちは 😇');
  });
});
