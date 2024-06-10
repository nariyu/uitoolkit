import { useEffect, useState } from "react";
import { Ease, Tween } from "../../tween/Tween";

interface Props {
  count: number;
  transform?: (count: number) => number | string;
}
export const AnimationCounter = (props: Props) => {
  const { count, transform } = props;

  const [displayCount, setDisplayCount] = useState(count);

  useEffect(() => {
    let tween: Tween<{ c: number }> | undefined;

    if (displayCount < count) {
      const data = { c: displayCount };

      tween = new Tween(data)
        .to({ c: count }, Math.min(1000), Ease.expoOut)
        .onUpdate(({ c }) => {
          setDisplayCount(Math.floor(c));
        });
    }

    return () => {
      if (tween) {
        tween.stop();
      }
    };
  }, [count, displayCount]);

  return <>{transform ? transform(displayCount) : displayCount}</>;
};
