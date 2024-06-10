declare function escape(s: string): string;
declare function unescape(s: string): string;

/**
 * Cookie
 */
export class Cookie {
  /**
   * 種類
   */
  static type = "cookie";

  /**
   * 有効フラグ
   */
  static enabled = false;

  /**
   * プレフィックス
   */
  static prefix = "";

  /**
   * 値を取得する
   */
  static getItem(key: string): string | null {
    if (typeof window === "undefined") return null;
    if (!key || !Cookie.hasItem(key)) return null;
    if (key && this.prefix) key = this.prefix + key;

    const searchKey1 = escape(key) + "=";
    const index1 = document.cookie.indexOf(searchKey1);
    const searchKey2 = "; " + searchKey1;
    const index2 = document.cookie.indexOf(searchKey2);

    let matches: RegExpMatchArray | null = null;
    if (index1 === 0) {
      matches = document.cookie.match(/^([^;]+)/);
    } else if (index2 > 0) {
      matches = document.cookie.substr(index2 + 2).match(/^([^;]+)/);
    }
    if (!matches) return null;
    return unescape(matches[1].substr(matches[1].indexOf("=") + 1));
  }

  /**
   * 値を保存する
   */
  static setItem(
    key: string,
    value: string,
    expire?: number | string | Date,
    path?: string,
    domain?: string,
    secure = true
  ) {
    if (typeof window === "undefined") return;
    if (!key || /^(?:expires|max-age|path|domain|secure)$/i.test(key)) {
      return;
    }
    let expireString = "";

    if (key && this.prefix) key = this.prefix + key;

    if (expire === undefined) expire = Infinity;
    switch (typeof expire) {
      case "number":
        expireString =
          expire === Infinity
            ? "; expires=Tue, 19 Jan 2038 03:14:07 GMT"
            : "; max-age=" + expire;
        break;
      case "string":
        expireString = "; expires=" + expire;
        break;
      case "object":
        if (expire && expire.constructor === Date) {
          expireString = "; expires=" + expire.toUTCString();
        }
        break;
    }

    const cookieString =
      escape(key) +
      "=" +
      escape(value) +
      expireString +
      (domain ? "; domain=" + domain : "") +
      (path ? "; path=" + path : "") +
      (secure ? "; secure; SameSite=None" : "");
    document.cookie = cookieString;
  }

  /**
   * 値を削除する
   */
  static removeItem(key: string, path?: string): void {
    if (typeof window === "undefined") return;
    if (!key) {
      return;
    }
    if (key && this.prefix) key = this.prefix + key;
    document.cookie =
      escape(key) +
      "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" +
      (path ? "; path=" + path : "");
  }

  /**
   * 値があるかチェック
   */
  static hasItem(key: string): boolean {
    if (typeof window === "undefined") return false;
    if (!key) {
      return false;
    }
    if (key && this.prefix) key = this.prefix + key;
    const searchKey1 = escape(key) + "=";
    const searchKey2 = "; " + searchKey1;

    return (
      document.cookie.indexOf(searchKey1) === 0 ||
      document.cookie.indexOf(searchKey2) > 0
    );
  }

  /**
   * 保存されているキーを取得する
   */
  static keys(): string[] {
    if (typeof window === "undefined") return [];
    const keys = document.cookie
      .replace(/((?:^|\s*;)[^=]+)(?=;|$)|^\s*|\s*(?:=[^;]*)?(?:\1|$)/g, "")
      .split(/\s*(?:=[^;]*)?;\s*/);
    for (let nIdx = 0; nIdx < keys.length; nIdx++) {
      keys[nIdx] = unescape(keys[nIdx]);
    }
    return keys;
  }
}

// テスト
(() => {
  if (typeof window === "undefined") return;
  const data = "milkstoragetest=1";
  document.cookie = data + "; max-age=10";
  Cookie.enabled = document.cookie.indexOf(data) !== -1;
  document.cookie = "milkstoragetest=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
})();
