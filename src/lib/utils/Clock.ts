/**
 * Clock
 */
export class Clock {
  private start: number;
  private time: number;

  /**
   * constructor
   */
  constructor() {
    this.start = Date.now();
    this.time = this.start;
  }

  /**
   * getDelta
   */
  public getDelta(): number {
    const now = Date.now();
    const delta = now - this.time;
    this.time = now;
    return delta;
  }

  /**
   * getTime
   */
  public getTime(): number {
    return Date.now() - this.start;
  }
}
