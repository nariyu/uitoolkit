/**
 * RequiredPartial
 * 指定したパラメータを必須にする型
 *
 * USAGE:
 *   ```ts
 *   type Options = {
 *     foo?: string;
 *     bar?: string;
 *     baz?: string;
 *   }
 *   type CustomOptions = RequiredPartial<Options, 'foo' | 'bar'>
 *
 *   // OK
 *   const options: CustomOptions = {
 *     foo: 'foo',
 *     bar: 'bar',
 *   };
 *
 *   // OK
 *   const options: CustomOptions = {
 *     foo: 'foo',
 *     bar: 'bar',
 *     baz: 'baz',
 *   };
 *
 *   // NG
 *   const options: CustomOptions = {};
 *   const options: CustomOptions = { bar: 'bar' };
 *   ```
 *
 */
declare type RequiredPartial<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;

/**
 * RequireOne
 * パラメータのいずれか一つ以上が必要な型
 * USAGE:
 *   ```ts
 *   type Options = RequireOne<{
 *     foo?: string;
 *     bar?: string;
 *     baz?: string;
 *   }>;
 *
 *   // OK
 *   const options: Options = { foo: 'foo' };
 *   const options: Options = { bar: 'bar' };
 *   const options: Options = { foo: 'foo', bar: 'bar' ;
 *
 *   // NG
 *   const options: Options = {};
 */
declare type RequiredOne<T, K extends keyof T = keyof T> = K extends keyof T
  ? Required<Pick<T, K>> & Omit<T, K>
  : never;

/**
 * RequiredAnyOne
 * パラメータのいずれか一つが必要で、同時に二つ以上のパラメータを使用できない型
 *
 * USAGE:
 *   ```ts
 *   type Options = RequiredAnyOne<{
 *     foo: string;
 *     bar: string;
 *   }>
 *
 *   // OK
 *   const options: Options = { foo: 'foo' };
 *   const options: Options = { bar: 'foo' };
 *
 *   // 2つを同時に使うと NG
 *   const options: Options = {
 *     foo: 'foo',
 *     bar: 'bar',
 *   };
 *   ```
 */
declare type RequiredAnyOne<T> = {
  [K in keyof T]-?: Required<Pick<T, K>> &
    Partial<Record<Exclude<keyof T, K>, undefined>>;
}[keyof T];
