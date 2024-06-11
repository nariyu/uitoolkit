import { classNames } from "@/lib/utils/ElementUtil";
import { Carousel as NativeCarousel } from "@/lib/views/Carousel";
import {
  CSSProperties,
  forwardRef,
  ReactNode,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";
import styles from "./Carousel.module.scss";

export interface CarouselProps {
  style?: CSSProperties;
  className?: string;
  views: ReactNode[];
  direction?: "horizontal" | "vertical";
  targetElem?: HTMLElement;
  enabledScrollIndicator?: boolean;
  onChanging?: (index: number, fromIndex: number) => void;
  onChange?: (index: number, fromIndex: number) => void;
  onShowView?: (index: number, element: HTMLElement) => void;
  onHideView?: (index: number, element: HTMLElement) => void;
  onScroll?: (scrollPosition: number) => void;
}

export interface CarouselHandler {
  setIndex: (index: number) => void;
  updateSize: () => void;
}
export const Carousel = forwardRef<CarouselHandler, CarouselProps>(
  function Carousel(props, ref) {
    const {
      style,
      className,
      views = [],
      direction,
      targetElem,
      enabledScrollIndicator,
      onChanging,
      onChange,
      onShowView,
      onHideView,
      onScroll,
    } = props;
    const elemRef = useRef<HTMLDivElement>(null);

    const nativeCarouselRef = useRef<NativeCarousel>();

    useLayoutEffect(() => {
      const elem = elemRef.current;
      if (elem) {
        const carousel = new NativeCarousel(elem, {
          eventTarget: targetElem,
        });
        carousel.enabledScrollIndicator = true;
        nativeCarouselRef.current = carousel;

        return () => {
          carousel.dispose();
        };
      }
    }, [targetElem]);

    useImperativeHandle(ref, () => {
      return {
        setIndex: (index) => {
          const nativeCarousel = nativeCarouselRef.current;
          if (nativeCarousel) {
            nativeCarousel.setIndex(index, true);
          }
        },
        updateSize: () => {
          const nativeCarousel = nativeCarouselRef.current;
          if (nativeCarousel) {
            nativeCarousel.updateSize();
          }
        },
      };
    });

    useEffect(() => {
      const nativeCarousel = nativeCarouselRef.current;
      if (nativeCarousel && targetElem) {
        nativeCarousel.setEventTarget(targetElem);
      }
    }, [targetElem]);

    useEffect(() => {
      const nativeCarousel = nativeCarouselRef.current;
      if (nativeCarousel && direction) {
        nativeCarousel.direction = direction;
      }
    }, [direction]);

    useEffect(() => {
      const nativeCarousel = nativeCarouselRef.current;
      if (nativeCarousel && typeof enabledScrollIndicator !== "undefined") {
        nativeCarousel.enabledScrollIndicator = enabledScrollIndicator;
      }
    }, [enabledScrollIndicator]);

    useEffect(() => {
      const nativeCarousel = nativeCarouselRef.current;
      if (nativeCarousel) {
        nativeCarousel.updateSize();
      }
    }, [style, className]);

    // Event Handler
    useEffect(() => {
      const nativeCarousel = nativeCarouselRef.current;

      if (nativeCarousel) {
        nativeCarousel.on("changing", (event) => {
          if (onChanging) onChanging(event.index, event.fromIndex);
        });
        nativeCarousel.on("change", (event) => {
          if (onChange) onChange(event.index, event.fromIndex);
        });
        nativeCarousel.on("show", (event) => {
          if (onShowView) onShowView(event.index, event.element);
        });
        nativeCarousel.on("hide", (event) => {
          if (onHideView) onHideView(event.index, event.element);
        });
        nativeCarousel.on("scroll", (event) => {
          if (onScroll) onScroll(event.scrollPosition);
        });
        return () => {
          nativeCarousel.off("changing");
          nativeCarousel.off("change");
          nativeCarousel.off("show");
          nativeCarousel.off("hide");
          nativeCarousel.off("scroll");
        };
      }
    }, [onChanging, onChange, onScroll, onHideView, onShowView]);

    // Render
    return (
      <div
        ref={elemRef}
        className={classNames(className, styles.component)}
        style={style}
      >
        <div className={styles.scroller}>
          {views.map((view, index) => (
            <div key={index} className={styles.view}>
              {view}
            </div>
          ))}
        </div>
      </div>
    );
  }
);
