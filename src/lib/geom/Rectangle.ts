import { IVector2 } from './Vector2';

/**
 * Rectangle
 */
export class Rectangle implements IRectangle {
  /**
   * constructor
   */
  constructor(x?: number, y?: number, width?: number, height?: number) {
    if (x !== undefined) this.x = x;
    if (y !== undefined) this.y = y;
    if (width !== undefined) this.width = width;
    if (height !== undefined) this.height = height;
  }
  public x = 0;
  public y = 0;
  public width = 0;
  public height = 0;

  public static multiplyScalar(rect: IRectangle, value: number): Rectangle {
    return new Rectangle(
      rect.x * value,
      rect.y * value,
      rect.width * value,
      rect.height * value,
    );
  }
  public static divisionScalar(rect: IRectangle, value: number): Rectangle {
    return new Rectangle(
      rect.x / value,
      rect.y / value,
      rect.width / value,
      rect.height / value,
    );
  }

  /**
   *
   */
  public intersect(rect: IRectangle): Rectangle | null {
    const sx = Math.max(this.x, rect.x);
    const sy = Math.max(this.y, rect.y);
    const ex = Math.min(this.x + this.width, rect.x + rect.width);
    const ey = Math.min(this.y + this.height, rect.y + rect.height);

    const w = ex - sx;
    const h = ey - sy;
    if (w > 0 && h > 0) {
      return new Rectangle(sx, sy, w, h);
    }
    return null; //
  }

  /**
   *
   */
  public contains(vec: IVector2): boolean {
    return (
      this.x < vec.x &&
      this.x + this.width > vec.x &&
      this.y < vec.y &&
      this.y + this.height > vec.y
    );
  }

  public multiplyScalar(value: number): Rectangle {
    this.x *= value;
    this.y *= value;
    this.width *= value;
    this.height *= value;
    return this;
  }
  public divisionScalar(value: number): Rectangle {
    this.x /= value;
    this.y /= value;
    this.width /= value;
    this.height /= value;
    return this;
  }
  public clone(): Rectangle {
    return new Rectangle(this.x, this.y, this.width, this.height);
  }
}

export interface IRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}
