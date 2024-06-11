import { TouchManager } from "@/lib/managers/TouchManager";
import { classNames, preventDefault } from "@/lib/utils/ElementUtil";
import React, {
  ReactNode,
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styles from "./RichList.module.scss";

export interface RichListItem {
  id: string | number;
}

export interface RichListProps<T> {
  /** 表示するアイテム */
  data?: T[];

  /** デフォルトデータ */
  defaultData?: T[];

  /** アイテムを開いたときのコンテンツ */
  itemRenderer?: (item: T, index: number) => ReactNode;

  /** ドラッグ中のアイテムの class  */
  draggingItemClassName?: string;

  /** 垂直ドラッグを有効化 */
  enabledVerticalSort?: boolean;

  /** 水平ドラッグを有効化 */
  enabledHorizontalSort?: boolean;

  /** ソートのトリガーになるクラス名 */
  sortTriggerClassName?: string;

  /** 移動ハンドラ */
  onMove?: (from: number, to: number) => void;

  /** 変更ハンドラ */
  onChange?: (items: T[]) => void;

  /** ソート開始 */
  onSortStart?: (item: T, index: number) => unknown;

  /** ソート終了 */
  onSortEnd?: (item: T, index: number) => unknown;

  /** コンテンツのスタイル */
  contentStyle?: React.CSSProperties;
}

export function RichList<T extends RichListItem>(props: RichListProps<T>) {
  const {
    data,
    defaultData,
    itemRenderer = defaultItemRenderer,
    draggingItemClassName,
    enabledVerticalSort,
    enabledHorizontalSort,
    sortTriggerClassName,
    onMove,
    onChange,
    onSortStart,
    onSortEnd,
    contentStyle,
    ...otherProps
  } = props;

  const [uuid] = useState(`${Date.now()}-${Math.floor(Math.random() * 10000)}`);
  const defaultSortTriggerClassName = `trigger-${uuid}`;
  const elemRef = useRef<HTMLDivElement>(null);
  const draggingDataIndexRef = useRef<number | undefined>(undefined);
  const setDraggingDataIndex = (index: number | undefined) => {
    draggingDataIndexRef.current = index;
  };

  const draggingItemElemRef = useRef<HTMLElement>();
  const contentRef = useRef<HTMLDivElement>(null);
  const [displayData, setDisplayData] = useState(defaultData || data || []);
  const dataRef = useRef(displayData);
  dataRef.current = displayData;

  useEffect(() => {
    if (data) {
      setDisplayData(data);
      dataRef.current = data;
    }
  }, [data]);

  const onMoveRef = useRef(onMove);
  const onChangeRef = useRef(onChange);
  const onSortStartRef = useRef(onSortStart);
  const onSortEndRef = useRef(onSortEnd);
  useEffect(() => {
    onMoveRef.current = onMove;
    onChangeRef.current = onChange;
    onSortStartRef.current = onSortStart;
    onSortEndRef.current = onSortEnd;
  }, [onMove, onChange, onSortStart, onSortEnd]);

  const sortable = useMemo(() => {
    return enabledVerticalSort && displayData?.length > 1;
  }, [displayData?.length, enabledVerticalSort]);

  // ドラッグ処理
  useEffect(() => {
    const elem = elemRef.current;
    if (!elem || !sortable) return;

    let itemRectList: ItemRect[] | undefined;

    let fromIndex = -1;
    let toIndex = -1;

    const touchManager = new TouchManager(elem);
    touchManager.autoPreventDefault = false;
    touchManager.on("move", async (event) => {
      const { offsetX, offsetY } = event.items[0];

      const draggingElem = draggingItemElemRef.current;
      if (!draggingElem) return;

      const data = dataRef.current;
      const draggingDataIndex = parseInt(
        draggingElem.getAttribute("data-index") || "",
        10
      );
      const draggingData = data[draggingDataIndex];

      const scrollOffset = contentRef.current?.scrollTop ?? 0;

      // ドラッグ開始
      // 閾値以上動いたらドラッグとみなす
      if (!itemRectList && (Math.abs(offsetX) > 5 || Math.abs(offsetY) > 5)) {
        await onSortStartRef.current?.(draggingData, draggingDataIndex);

        fromIndex = draggingDataIndex;
        toIndex = fromIndex;

        // 全体の高さを固定する
        const rect = elem.getBoundingClientRect();
        elem.style.height =
          elem.style.minHeight =
          elem.style.maxHeight =
            `${rect.height}px`;

        draggingElem.style.transition = "none";
        draggingElem.style.zIndex = "1";

        // 各アイテムの位置を固定する
        const itemElements = elem.querySelectorAll<HTMLElement>(
          `.__sortable-list-item-${uuid}`
        );
        itemRectList = [];
        for (let i = 0; i < itemElements.length; i++) {
          const itemElem = itemElements.item(i);
          const itemRect = itemElem.getBoundingClientRect();
          itemRectList[i] = {
            index: i,
            elem: itemElem,
            rect: itemRect,
          };
        }

        for (let i = 0; i < itemRectList.length; i++) {
          const { elem: itemElem, rect: itemRect } = itemRectList[i];
          itemElem.style.position = "absolute";
          itemElem.style.top = `${itemRect.top - rect.top}px`;
          itemElem.style.left = `${itemRect.left - rect.left}px`;
          itemElem.style.width = `${itemRect.width}px`;
          itemElem.style.height = `${itemRect.height}px`;
        }

        setDraggingDataIndex(draggingDataIndex);
      }

      if (!itemRectList) return;

      const draggingElemRect = draggingElem.getBoundingClientRect();
      draggingElem.style.transform = `translate(${
        !enabledHorizontalSort ? 0 : offsetX
      }, ${
        !enabledVerticalSort
          ? 0
          : offsetY + (contentRef.current?.scrollTop ?? 0)
      }px)`;

      // ドラッグしている Element の現在の順番
      const currIndex = itemRectList
        .map((item) => item.elem)
        .indexOf(draggingElem);

      // 新しい順番の位置を計算
      let newIndex = currIndex;
      let match = false;

      for (let i = 0; i < itemRectList.length; i++) {
        const itemRect = itemRectList[i];
        const adjustedTop = itemRect.rect.top - scrollOffset;
        if (
          draggingElemRect.top < adjustedTop + itemRect.rect.height / 2 &&
          draggingElemRect.left < itemRect.rect.left + itemRect.rect.width / 2
        ) {
          // 新しい順番: i
          if (itemRectList[i].elem === draggingElem) {
            match = true;
            break;
          }
          newIndex = i;
          match = true;
          break;
        }
      }
      if (!match) {
        const lastRect = itemRectList.slice().pop();
        if (
          (lastRect &&
            draggingElemRect.top >
              lastRect.rect.top + lastRect.rect.height / 2) ||
          (lastRect &&
            draggingElemRect.left >
              lastRect.rect.left + lastRect.rect.width / 2)
        ) {
          newIndex = itemRectList.length - 1;
        }
      }

      // 順番が変わる
      if (currIndex !== newIndex) {
        const itemElemList = itemRectList.map((item) => item.elem);

        itemElemList.splice(currIndex, 1);
        itemElemList.splice(newIndex, 0, draggingElem);

        const rect = elem.getBoundingClientRect();
        for (let i = 0; i < itemRectList.length; i++) {
          itemRectList[i].elem = itemElemList[i];
          const { elem: itemElem, rect: itemRect } = itemRectList[i];
          if (itemElem !== draggingElem) {
            itemElem.style.top = `${itemRect.top - rect.top}px`;
            itemElem.style.left = `${itemRect.left - rect.left}px`;
          }
        }

        toIndex = newIndex;
      }
    });

    // 解除
    touchManager.on("remove", async () => {
      const stopScrolling = () => {
        clearInterval(scrollIntervalRef.current!);
        scrollIntervalRef.current = null;
      };
      contentRef.current?.addEventListener("mouseup", stopScrolling);
      const draggingElem = draggingItemElemRef.current;
      if (!draggingElem || !itemRectList) return;

      const data = dataRef.current;
      const rect = elem.getBoundingClientRect();
      const draggingElemRect = draggingElem.getBoundingClientRect();

      draggingElem.style.top = `${draggingElemRect.top - rect.top}px`;
      draggingElem.style.left = `${draggingElemRect.left - rect.left}px`;
      draggingElem.style.transform = "";
      draggingElem.style.transition = "";
      draggingElem.style.zIndex = "";

      requestAnimationFrame(() => {
        if (itemRectList) {
          const targetIndex = itemRectList
            .map((item) => item.elem)
            .indexOf(draggingElem);
          draggingElem.style.top = `${
            itemRectList[targetIndex].rect.top - rect.top
          }px`;
          draggingElem.style.left = `${
            itemRectList[targetIndex].rect.left - rect.left
          }px`;
        }
      });

      setTimeout(() => {
        if (!itemRectList) return;
        const order = itemRectList.map((item) =>
          parseInt(item.elem.getAttribute("data-index") || "", 10)
        );

        // 並び替え
        const newItems: T[] = [];
        for (let i = 0; i < order.length; i++) {
          newItems.push(data[order[i]]);
        }

        dataRef.current = newItems;
        onChangeRef.current?.(newItems);
        setDisplayData(newItems);

        // スタイルを解除
        elem.style.minHeight = elem.style.maxHeight = elem.style.height = "";
        for (let i = 0; i < itemRectList.length; i++) {
          const itemElem = itemRectList[i].elem;
          itemElem.style.top = "";
          itemElem.style.left = "";
          itemElem.style.width = "";
          itemElem.style.height = "";
          itemElem.style.position = "";
          itemElem.style.transform = "";
          itemElem.style.zIndex = "";
        }
        itemRectList = undefined;
        draggingItemElemRef.current = undefined;
        setDraggingDataIndex(undefined);

        const index = parseInt(
          draggingElem.getAttribute("data-index") || "",
          10
        );
        onSortEndRef.current?.(data[index], toIndex);

        if (fromIndex !== toIndex) {
          onMoveRef.current?.(fromIndex, toIndex);
        }
      }, 300);
    });

    return () => {
      touchManager.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortable, enabledHorizontalSort, enabledVerticalSort, uuid]);

  const scrollIntervalRef = useRef<number | null>(null); // スクロールの間隔保持用

  const onMouseMove = useCallback((e: { clientY: number }) => {
    if (!contentRef.current) return;
    const threshold = 30; // スクロール開始の閾値
    const scrollStep = 5; // スクロールpx数
    const containerTop = contentRef.current.getBoundingClientRect().top;
    const containerBottom = contentRef.current.getBoundingClientRect().bottom;
    const mouseY = e.clientY;
    const dragging = draggingItemElemRef.current ? true : false;

    const startScrolling = (step: number) => {
      const interval = 20;

      // stopScrolling
      clearInterval(scrollIntervalRef.current!);
      scrollIntervalRef.current = null;

      if (!contentRef?.current?.scrollTop) return;
      scrollIntervalRef.current = window.setInterval(() => {
        if (!contentRef.current) return;
        contentRef.current.scrollTop += step;
      }, interval);
    };

    if (mouseY < containerTop + threshold && dragging) {
      // マウスが上端に近い場合、上スクロール
      startScrolling(-scrollStep);
    } else if (mouseY > containerBottom - threshold && dragging) {
      // マウスが下端に近い場合、下スクロール
      startScrolling(scrollStep);
    } else {
      // stopScrolling
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
      scrollIntervalRef.current = null;
    }
  }, []);

  // マウスダウン
  const onMouseDownItem = useCallback(
    (event: SyntheticEvent<HTMLElement>) => {
      // トリガーをチェック
      if (
        sortTriggerClassName &&
        event.target instanceof HTMLElement &&
        !event.target.classList.contains(sortTriggerClassName)
      ) {
        return;
      }

      preventDefault(event);

      const draggingElem = event.currentTarget;
      draggingItemElemRef.current = draggingElem;

      const onMouseUp = () => {
        window.removeEventListener("mouseup", onMouseUp);
        window.removeEventListener("mousemove", onMouseMove);
        draggingElem.style.transition = "";
        draggingElem.style.zIndex = "";
        setDraggingDataIndex(undefined);
        draggingItemElemRef.current = undefined;

        // stopScrolling
        if (scrollIntervalRef.current) {
          clearInterval(scrollIntervalRef.current);
        }
        scrollIntervalRef.current = null;

        const placeholder = document.getElementById("drag-placeholder");
        if (placeholder?.parentNode) {
          placeholder.parentNode.removeChild(placeholder);
        }
      };
      window.addEventListener("mouseup", onMouseUp);
      window.addEventListener("mousemove", onMouseMove);
      draggingElem.addEventListener("touchend", onMouseUp);
    },
    [onMouseMove, sortTriggerClassName]
  );

  return (
    <div ref={elemRef} className={classNames(styles.component)} {...otherProps}>
      <div className={styles.content} style={contentStyle} ref={contentRef}>
        {displayData.map((item, index) => {
          const dragging = draggingDataIndexRef.current === index;
          return (
            <div
              key={item.id}
              className={classNames(
                `__sortable-list-item-${uuid}`,
                dragging ? draggingItemClassName : "",
                sortTriggerClassName ? undefined : defaultSortTriggerClassName
              )}
              data-index={index}
              onMouseDown={(e) => {
                if (sortable) onMouseDownItem(e);
              }}
              onTouchStart={(e) => {
                if (sortable) onMouseDownItem(e);
              }}
              style={{
                zIndex: dragging ? 10 : undefined,
                transition: dragging ? undefined : "all 0.15s ease-out 0s",
              }}
            >
              {itemRenderer(item, index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ItemRect {
  index: number;
  elem: HTMLElement;
  rect: DOMRect;
}

function defaultItemRenderer<T extends RichListItem>(item: T) {
  return (
    <div
      style={{
        padding: ".5em",
        border: "1px solid #ddd",
        borderRadius: ".3em",
        backgroundColor: "#fff",
      }}
    >
      {item.toString()}
    </div>
  );
}
