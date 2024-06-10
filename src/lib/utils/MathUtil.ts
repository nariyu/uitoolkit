// 最大公約数を返す
export const getGcd = (...nums: number[]) => {
  let ans = nums[0];
  for (let i = 1; i < nums.length; i++) {
    ans = calc(ans, nums[i]);
  }
  return ans;
};

/**
 * n:n:n を返す
 * @param nums
 */
export const getGcdString = (...nums: number[]) => {
  const gcd = getGcd.apply(getGcd, nums);
  if (gcd === 0) return '';
  return nums.map((n) => n / gcd).join(':');
};

const calc = (a: number, b: number): number => (b > 0 ? calc(b, a % b) : a);
