import { classNames, preventDefault } from "@/lib/utils/ElementUtil";
import {
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import styles from "./Pagination.module.scss";

interface PaginationProps {
  className?: string;
  totalPages: number;
  showPageLength?: number;
  page?: number;
  disabled?: boolean;
  onChanging?: (page: number) => Promise<boolean>;
  onChange?: (page: number) => void;
}
export const Pagination = (props: PaginationProps) => {
  const {
    className,
    showPageLength = 10,
    page = 1,
    totalPages,
    disabled,
    onChanging,
    onChange,
  } = props;

  const [currentPage, setCurrentPage] = useState(page);
  useEffect(() => {
    setCurrentPage(page);
  }, [page]);

  // 表示するページのリスト
  const pages = useMemo(() => {
    const startPage = Math.max(
      1,
      currentPage - Math.floor((showPageLength - 1) / 2)
    );
    const endPage = Math.min(
      totalPages,
      currentPage + Math.ceil((showPageLength - 1) / 2)
    );

    const pages: number[] = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    while (pages.length < showPageLength) {
      let added = false;
      if (pages[0] > 1) {
        pages.unshift(pages[0] - 1);
        added = true;
      }

      const finalPage = pages[pages.length - 1];
      if (pages.length < showPageLength && finalPage < totalPages) {
        pages.push(finalPage + 1);
        added = true;
      }

      if (!added) {
        break;
      }
    }

    return pages;
  }, [totalPages, currentPage, showPageLength]);

  // クリック
  const onClick = useCallback(
    async (event: SyntheticEvent<HTMLElement>) => {
      preventDefault(event);

      const page = parseInt(
        event.currentTarget.getAttribute("data-page") as string,
        10
      );
      if (!isNaN(page)) {
        if (onChanging) {
          const result = await onChanging(page);
          if (result === true) {
            setCurrentPage(page);
            if (onChange) {
              onChange(page);
            }
          }
        } else {
          setCurrentPage(page);
          if (onChange) {
            onChange(page);
          }
        }
      }
    },
    [onChanging, onChange]
  );

  return (
    <div
      className={classNames(styles.component, className)}
      aria-disabled={disabled}
    >
      <div className={styles.container}>
        <div
          className={styles.prev}
          data-page={currentPage - 1}
          aria-hidden={currentPage <= 1}
          onClick={onClick}
        >
          <span>前へ</span>
        </div>
        {pages.map((page) => (
          <div
            key={page}
            className={classNames(
              styles.page,
              currentPage === page ? styles.current : undefined
            )}
            data-page={page}
            onClick={onClick}
          >
            <span>{page}</span>
          </div>
        ))}
        <div
          className={styles.next}
          data-page={currentPage + 1}
          aria-hidden={totalPages <= currentPage}
          onClick={onClick}
        >
          <span>次へ</span>
        </div>
      </div>
    </div>
  );
};
