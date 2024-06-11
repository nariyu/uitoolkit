import { TouchManager } from "@/lib/managers/TouchManager";
import { classNames, preventDefault } from "@/lib/utils/ElementUtil";
import {
  ReactNode,
  SyntheticEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import styles from "./SortableList.module.scss";

export interface SortableListProps<T> {
  /** 表示するアイテム */
  items: T[];

  /**  */
  containerClassName?: string;

  /**  */
  itemRenderer?: (
    item: T,
    index: number,
    option: {
      selected: boolean;
    }
  ) => ReactNode;

  /** アイテムの class */
  itemClassName?: string;

  /** ドラッグ中のアイテムの class  */
  draggingItemClassName?: string;

  /**  */
  children?: ReactNode;

  /**  */
  additionalItemClassName?: string;

  /** 水平ドラッグを有効化 */
  enabledHorizontalSort?: boolean;

  /** 垂直ドラッグを有効化 */
  enabledVerticalSort?: boolean;

  /** 選択を有効化 */
  enabledSelect?: boolean;

  /** デフォルトの選択 */
  defaultSelectedId?: string;

  /** ソート開始 */
  onSortStart?: (ids: string[]) => void;

  /** ソート終了 */
  onSortEnd?: (ids: string[]) => void;

  /** 変更ハンドラ */
  onChange?: (items: T[]) => void;

  /** 選択 */
  onSelect?: (selectedId: string) => void;
}
export const SortableList = <T extends { id: string; disabled?: boolean }>(
  props: SortableListProps<T>
) => {
  const {
    items: _items,
    containerClassName,
    itemRenderer = (item) => SortableListItemRenderer(item),
    itemClassName,
    draggingItemClassName,
    children,
    additionalItemClassName,
    enabledHorizontalSort,
    enabledVerticalSort,
    enabledSelect,
    defaultSelectedId,
    onSortStart,
    onSortEnd,
    onChange,
    onSelect,
    ...otherProps
  } = props;

  const [items, setItems] = useState(_items);
  const elemRef = useRef<HTMLDivElement>(null);
  const targetElemRef = useRef<HTMLElement>();

  const [selectedId, setSelectedId] = useState(defaultSelectedId);

  useEffect(() => {
    setItems(_items);
  }, [_items]);

  const sortable = enabledVerticalSort || enabledHorizontalSort;

  // ドラッグ処理
  useEffect(() => {
    const elem = elemRef.current;
    if (elem && sortable) {
      let itemRectList: ItemRect[] | undefined;

      const touchManager = new TouchManager(elem);
      touchManager.on("move", (event) => {
        const { offsetX, offsetY } = event.items[0];

        const targetElem = targetElemRef.current;
        if (!targetElem) return;

        // 閾値以上動いたらドラッグとみなす
        if (!itemRectList && (Math.abs(offsetX) > 5 || Math.abs(offsetY) > 5)) {
          if (onSortStart) {
            onSortStart(items.map((item) => item.id));
          }

          // 全体の高さを固定する
          const rect = elem.getBoundingClientRect();
          elem.style.height =
            elem.style.minHeight =
            elem.style.maxHeight =
              `${rect.height}px`;

          if (draggingItemClassName) {
            targetElem.classList.add(draggingItemClassName);
          }
          targetElem.style.transition = "none";
          targetElem.style.zIndex = "1";

          // 各画像の位置を固定する
          const itemElems = elem.querySelectorAll<HTMLElement>(
            `.${styles.item}`
          );
          itemRectList = [];
          for (let i = 0; i < itemElems.length; i++) {
            const itemElem = itemElems.item(i);
            const itemRect = itemElem.getBoundingClientRect();
            itemRectList[i] = {
              index: i,
              elem: itemElem,
              rect: itemRect,
              ignore: itemElem.classList.contains(styles.additionalItem),
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
        }

        if (!itemRectList) return;

        targetElem.style.transform = `translate(${
          !enabledHorizontalSort ? 0 : offsetX
        }px, ${!enabledVerticalSort ? 0 : offsetY}px)`;

        const targetRect = targetElem.getBoundingClientRect();

        // 現在の順番
        const currIndex = itemRectList
          .map((item) => item.elem)
          .indexOf(targetElem);

        // 新しい順番の位置を計算
        let newIndex = currIndex;
        let match = false;
        for (let i = 0; i < itemRectList.length; i++) {
          const itemRect = itemRectList[i];
          if (itemRect.ignore) continue;
          if (
            targetRect.top < itemRect.rect.top + itemRect.rect.height / 2 &&
            targetRect.left < itemRect.rect.left + itemRect.rect.width / 2
          ) {
            // 新しい順番: i
            if (itemRectList[i].elem === targetElem) {
              match = true;
              break;
            }
            newIndex = i;
            match = true;
            break;
          }
        }
        if (!match) {
          const lastRect = itemRectList
            .slice()
            .filter((item) => !item.ignore)
            .pop();
          if (
            targetRect.top >
              (lastRect?.rect.top ?? 0) + (lastRect?.rect.height ?? 0) / 2 ||
            targetRect.left >
              (lastRect?.rect.left ?? 0) + (lastRect?.rect.width ?? 0) / 2
          ) {
            newIndex = itemRectList.filter((item) => !item.ignore).length - 1;
          }
        }

        // 順番が変わる
        if (currIndex !== newIndex) {
          const itemElemList = itemRectList.map((item) => item.elem);

          itemElemList.splice(currIndex, 1);
          itemElemList.splice(newIndex, 0, targetElem);

          const rect = elem.getBoundingClientRect();
          for (let i = 0; i < itemRectList.length; i++) {
            itemRectList[i].elem = itemElemList[i];
            const { elem: itemElem, rect: itemRect, ignore } = itemRectList[i];
            if (ignore) continue;
            if (itemElem !== targetElem) {
              itemElem.style.top = `${itemRect.top - rect.top}px`;
              itemElem.style.left = `${itemRect.left - rect.left}px`;
            }
          }
        }
      });

      // 解除
      touchManager.on("remove", () => {
        const targetElem = targetElemRef.current;
        if (!targetElem || !itemRectList) return;

        const rect = elem.getBoundingClientRect();
        const targetRect = targetElem.getBoundingClientRect();
        targetElem.style.top = `${targetRect.top - rect.top}px`;
        targetElem.style.left = `${targetRect.left - rect.left}px`;
        targetElem.style.transform = "";
        targetElem.style.transition = "";
        targetElem.style.zIndex = "";

        requestAnimationFrame(() => {
          if (!itemRectList) return;
          if (draggingItemClassName) {
            targetElem.classList.remove(draggingItemClassName);
          }
          const targetIndex =
            itemRectList.map((item) => item.elem).indexOf(targetElem) ?? 0;
          targetElem.style.top = `${
            (itemRectList?.[targetIndex]?.rect.top ?? 0) - rect.top
          }px`;
          targetElem.style.left = `${
            (itemRectList?.[targetIndex]?.rect.left ?? 0) - rect.left
          }px`;
        });

        setTimeout(() => {
          if (!itemRectList) return;
          const order = itemRectList
            .filter((item) => !item.ignore)
            .map((item) =>
              parseInt(item.elem.getAttribute("data-index") as string, 10)
            );

          // 並び替え
          const newItems: T[] = [];
          for (let i = 0; i < order.length; i++) {
            newItems.push(items[order[i]]);
          }

          if (onChange) {
            onChange(newItems);
          }
          setItems(newItems);

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
          }
          itemRectList = undefined;
          targetElemRef.current = undefined;

          if (onSortEnd) {
            onSortEnd(newItems.map((item) => item.id));
          }
        }, 300);
      });

      return () => {
        touchManager.dispose();
      };
    }
  }, [
    items,
    sortable,
    draggingItemClassName,
    enabledHorizontalSort,
    enabledVerticalSort,
    onSortStart,
    onSortEnd,
    onChange,
  ]);

  // マウスダウン
  const onMouseDownItem = useCallback(
    (event: SyntheticEvent<HTMLElement>) => {
      const targetElem = event.currentTarget;
      targetElemRef.current = targetElem;

      const onMouseUp = () => {
        window.removeEventListener("mouseup", onMouseUp);
        if (draggingItemClassName) {
          targetElem.classList.remove(draggingItemClassName);
        }
        targetElem.style.transition = "";
        targetElem.style.zIndex = "";
      };
      window.addEventListener("mouseup", onMouseUp);

      targetElem.addEventListener("touchend", onMouseUp);
    },
    [draggingItemClassName]
  );

  return (
    <div
      ref={elemRef}
      className={classNames(styles.component, containerClassName)}
      data-sortable-vertical={enabledVerticalSort ? "true" : undefined}
      data-sortable-horizontal={enabledHorizontalSort ? "true" : undefined}
      data-selectable={enabledSelect ? "true" : undefined}
      {...otherProps}
    >
      {items
        .reduce(
          (prev, curr) =>
            prev.map((prev) => prev.id).indexOf(curr.id) === -1
              ? [...prev, curr]
              : prev,
          [] as T[]
        )
        .map((item, index) => (
          <div
            key={index}
            className={classNames(styles.item, itemClassName)}
            data-index={index}
            data-disabled={item.disabled ? "true" : undefined}
            onMouseDown={sortable ? onMouseDownItem : undefined}
            onTouchStart={sortable ? onMouseDownItem : undefined}
            onClick={(event) => {
              preventDefault(event);
              if (onSelect) {
                setSelectedId(item.id);
                onSelect(item.id);
              }
            }}
          >
            {itemRenderer(item, index, {
              selected: selectedId === item.id,
            })}
          </div>
        ))}
      {children && (
        <div
          className={classNames(
            styles.item,
            itemClassName,
            styles.additionalItem,
            additionalItemClassName
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
};

interface ItemRect {
  index: number;
  elem: HTMLElement;
  rect: DOMRect;
  ignore?: boolean;
}

function SortableListItemRenderer<T>(item: T) {
  return <div className={styles.defaultListItem}>{`${item}`}</div>;
}
