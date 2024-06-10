/**
 * Convert HSV to RGB
 * @param h 0 - 360
 * @param s 0.0 - 1.0
 * @param v 0.0 - 1.0
 * @returns { r: number, g: number; b: number; hex: string; }
 */
export const hsv2rgb = (h: number, s: number, v: number) => {
  h = h % 360;
  const c = v * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));

  let r = 0;
  let g = 0;
  let b = 0;
  if (0 <= hp && hp < 1) {
    [r, g, b] = [c, x, 0];
  }
  if (1 <= hp && hp < 2) {
    [r, g, b] = [x, c, 0];
  }
  if (2 <= hp && hp < 3) {
    [r, g, b] = [0, c, x];
  }
  if (3 <= hp && hp < 4) {
    [r, g, b] = [0, x, c];
  }
  if (4 <= hp && hp < 5) {
    [r, g, b] = [x, 0, c];
  }
  if (5 <= hp && hp < 6) {
    [r, g, b] = [c, 0, x];
  }

  const m = v - c;
  [r, g, b] = [r + m, g + m, b + m];

  r = Math.max(0, Math.min(255, Math.floor(r * 255)));
  g = Math.max(0, Math.min(255, Math.floor(g * 255)));
  b = Math.max(0, Math.min(255, Math.floor(b * 255)));

  const hex = rgb2hex(r, g, b);

  return { r, g, b, hex };
};

/**
 * Convert RGB to HSV
 * @param r 0 - 255
 * @param g 0 - 255
 * @param b 0 - 255
 * @returns { h: number; s: number; v: number } h = 0 - 360, s = 0.0 - 1.0, v = 0.0 - 1.0
 */
export const rgb2hsv = (r: number, g: number, b: number) => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h = 0;

  switch (min) {
    case max:
      h = 0;
      break;

    case r:
      h = 60 * ((b - g) / diff) + 180;
      break;

    case g:
      h = 60 * ((r - b) / diff) + 300;
      break;

    case b:
      h = 60 * ((g - r) / diff) + 60;
      break;
  }

  const s = max == 0 ? 0 : diff / max;
  const v = max / 255;

  return { h, s, v };
};

/**
 * Color to RGB
 * @param color 0x000000 - 0xffffff
 * @returns r = 0 - 255, g = 0 - 255, b = 0 - 255, hex = string
 */
export const color2rgb = (color: number) => {
  const b = color & 0xff;
  const g = (color & 0xff00) >>> 8;
  const r = (color & 0xff0000) >>> 16;
  return { r, g, b, hex: rgb2hex(r, g, b) };
};

/**
 * Color to HSV
 * @param color 0x000000 - 0xffffff
 * @returns h = 0 - 360, s = 0.0 - 1.0, v = 0.0 - 1.0
 */
export const color2hsv = (color: number) => {
  const { r, g, b } = color2rgb(color);
  return rgb2hsv(r, g, b);
};

/**
 * Color to HEX
 * @param color  0x000000 - 0xffffff
 * @returns HEX string
 */
export const color2hex = (color: number) => {
  const { r, g, b } = color2rgb(color);
  return rgb2hex(r, g, b);
};

/**
 * RGB を数字に変換
 */
export const rgb2color = (r: number, g: number, b: number) =>
  (r << 16) + (g << 8) + b;

/**
 * RGB to Hex
 * @param r 0 - 255
 * @param g 0 - 255
 * @param b 0 - 255
 * @returns HEX string
 */
export const rgb2hex = (r: number, g: number, b: number) =>
  '#' +
  [
    r.toString(16).padStart(2, '0'),
    g.toString(16).padStart(2, '0'),
    b.toString(16).padStart(2, '0'),
  ].join('');

/**
 * calculate brightness
 * @param color 0x000000 - 0xffffff
 * @returns 0 - 255
 */
export const calculateBrightness = (color: number) => {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  return Math.round((r + g + b) / 3);
};
