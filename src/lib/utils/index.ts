/**
 * throttle
 * @param fn
 * @param wait
 */
export const throttle = (fn: () => void, wait: number) => {
  let execTime = 0;
  let timer = 0;
  const result = () => {
    if (timer) clearTimeout(timer);
    if (execTime + wait > Date.now()) {
      timer = window.setTimeout(result, 10);
      return;
    }
    execTime = Date.now();
    fn();
  };
  return result;
};
