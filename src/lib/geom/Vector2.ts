/**
 * Vector2
 */
export class Vector2 implements IVector2 {
  /**
   * constructor
   * @param x x position
   * @param y y position
   */
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  public x: number;
  public y: number;

  public static distanceTo(vec1: IVector2, vec2: IVector2): number {
    return Math.sqrt(
      Math.pow(vec1.x - vec2.x, 2) + Math.pow(vec1.y - vec2.y, 2),
    );
  }
  public static radianTo(vec1: IVector2, vec2: IVector2): number {
    const radian = Math.atan2(vec2.y - vec1.y, vec2.x - vec1.x);
    return radian;
  }
  public static add(vec1: IVector2, vec2: IVector2): Vector2 {
    return new Vector2(vec1.x + vec2.x, vec1.y + vec2.y);
  }
  public static sub(vec1: IVector2, vec2: IVector2): Vector2 {
    return new Vector2(vec1.x - vec2.x, vec1.y - vec2.y);
  }
  public static multiplyScalar(vec: IVector2, value: number): Vector2 {
    return new Vector2(vec.x * value, vec.y * value);
  }
  public static divisionScalar(vec: IVector2, value: number): Vector2 {
    return new Vector2(vec.x / value, vec.y / value);
  }

  /**
   *
   */
  public distanceTo(vec: IVector2): number {
    return Math.sqrt(Math.pow(vec.x - this.x, 2) + Math.pow(vec.y - this.y, 2));
  }

  /**
   *
   */
  public radianTo(vec: IVector2): number {
    const radian = Math.atan2(vec.y - this.y, vec.x - this.x);
    return radian;
  }

  /**
   *
   */
  public pointTo(radian: number, distance: number): Vector2 {
    const x = distance * Math.cos(radian);
    const y = distance * Math.sin(radian);
    return new Vector2(x, y);
  }

  /**
   *
   */
  public rotate(radian: number): Vector2 {
    const distance = Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    const afterRdian = Math.atan2(this.y, this.x) + radian;
    this.x = Math.cos(afterRdian) * distance;
    this.y = Math.sin(afterRdian) * distance;
    return this;
  }

  public add(point: IVector2): Vector2 {
    this.x += point.x;
    this.y += point.y;
    return this;
  }
  public sub(point: IVector2): Vector2 {
    this.x -= point.x;
    this.y -= point.y;
    return this;
  }
  public multiplyScalar(value: number): Vector2 {
    this.x *= value;
    this.y *= value;
    return this;
  }
  public divisionScalar(value: number): Vector2 {
    this.x /= value;
    this.y /= value;
    return this;
  }
  public negate(): Vector2 {
    return this.multiplyScalar(-1);
  }
  public clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }
}

export interface IVector2 {
  x: number;
  y: number;
}
