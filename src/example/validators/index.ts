/** メールアドレスのバリデーション */
export const validateEmail = (value: string) => {
  if (!value) return false;

  return !!value.match(/^[^@]+@[-a-z0-9]+(\.[a-z][a-z]+)+$/);
};

/**
 * 電話番号のバリデーション
 */
export const validatePhoneNumber = (value: string) => {
  if (!value) return false;
  return !!value.match(/^\d{10,11}$/);
};
