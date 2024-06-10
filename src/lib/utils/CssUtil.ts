export interface AnimationProperty {
  from?: number | number[];
  to: number | number[];
  template: string;
  ease?: (t: number) => number;
  transform?: (...values: number[]) => (number | string)[];
}

/**
 * CSSUtil
 */
export class CSSUtil {
  static keyframeResolution = 250;

  /**
   * remove css tag
   */
  static removeCSS(id: string) {
    const style = document.querySelector<HTMLElement>(`style#${id}`);
    if (style && style.parentNode) {
      style.parentNode.removeChild(style);
    }
  }

  /**
   * create css tag
   */
  static createCSS(id: string, content: string): boolean {
    const header = document.querySelector<HTMLElement>("head");
    if (document.getElementById(id)) return false;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = content;
    if (header) header.appendChild(style);
    return true;
  }

  /**
   * generate animation keyframes
   * @param props
   */
  static generateKeyframes(
    name: string,
    ...props: AnimationProperty[]
  ): string {
    const resolution = this.keyframeResolution;
    let css = "";
    css += `@keyframes ${name} {`;
    for (let i = 0; i <= resolution; i++) {
      const ratio = i / resolution;

      css += `\n  ${ratio * 100}% {`;

      for (const prop of props) {
        const fromList = Array.isArray(prop.from) ? prop.from : [prop.from];
        const toList = Array.isArray(prop.to) ? prop.to : [prop.to];
        const ease = prop.ease ? prop.ease : (t: number) => t;

        let values: (number | string)[] = [];
        for (let j = 0; j < toList.length; j++) {
          const from =
            typeof fromList[j] === "undefined" ? 0 : (fromList[j] as number);
          const to = typeof toList[j] === "undefined" ? 1 : toList[j];
          const value = ease(ratio) * (to - from) + from;
          values.push(value);
        }
        if (prop.transform) {
          values = prop.transform.apply(
            this,
            values.map((value) =>
              typeof value === "string" ? parseInt(value, 10) : value
            )
          );
        }

        let template = prop.template.replace(/;?$/, ";");
        for (let k = 0; k < values.length; k++) {
          template = template.replace(
            new RegExp(`\\$${k + 1}`, "g"),
            `${values[k]}`
          );
        }
        css += `\n    ${template}`;
      }
      css += `\n  }`;
    }
    css += `\n}`;
    // console.log(css)
    css = css
      .replace(/\n+\s+/g, "")
      .replace(/,\s+/g, ",")
      .replace(/:\s+/g, ":")
      .replace(/\s+([{}])/g, "$1")
      .replace(/([{}])\s+/g, "$1")
      .replace(/([0-9])\1{5,}/g, "$1$1$1");
    // console.log(css)
    return css;
  }

  /**
   * play animation
   */
  static playAnimation(
    elem: HTMLElement,
    animationClassName: string,
    keep?: boolean,
    callback?: () => void
  ) {
    if (!callback)
      callback = () => {
        return;
      };

    const clear = (force?: boolean) => {
      if (force || !keep) {
        elem.classList.remove(animationClassName);
      }
      clearTimeout(
        parseInt(elem.dataset["playAnimationTimer"] || "0", 10) || 0
      );
    };
    const trigger = () => {
      clear();
      delete elem.dataset["playAnimationTimer"];
      elem.removeEventListener("animationend", trigger);
      if (callback) callback();
    };
    clear(true);
    requestAnimationFrame(() => {
      elem.classList.add(animationClassName);
      elem.addEventListener("animationend", trigger);

      let style: CSSStyleDeclaration;
      if (window.getComputedStyle !== null) {
        if (
          elem.ownerDocument &&
          elem.ownerDocument.defaultView &&
          elem.ownerDocument.defaultView.opener
        ) {
          style = elem.ownerDocument.defaultView.getComputedStyle(
            elem,
            undefined
          );
        } else {
          style = getComputedStyle(elem);
        }
      } else {
        return;
      }

      let durationString = style.animationDuration || "";
      let duration = 500;

      const cssPrefixes = ["Webkit", "O", "Moz", "ms"];
      if (!durationString) {
        for (const prefix of cssPrefixes) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          durationString = (style as any)[prefix + "AnimationDuration"];
          if (durationString) {
            break;
          }
        }
      }

      if (durationString.indexOf("ms") !== -1) {
        duration = parseFloat(
          durationString.substr(0, durationString.indexOf("ms"))
        );
      } else if (durationString.indexOf("s") !== -1) {
        duration =
          parseFloat(durationString.substr(0, durationString.indexOf("s"))) *
          1000;
      }

      elem.dataset["playAnimationTimer"] = setTimeout(
        trigger,
        duration + 50
      ).toString();
    });
  }
}
