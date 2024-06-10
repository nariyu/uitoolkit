import { ExternalLinkOutline as ExternalLinkIcon } from "@styled-icons/evaicons-outline/ExternalLinkOutline";
import { ChevronRight } from "@styled-icons/heroicons-outline";
import { CSSProperties, ReactNode } from "react";
import { classNames } from "../../utils/ElementUtil";
import styles from "./MenuItem.module.scss";

/**
 * メニューアイテム
 */
interface MenuItemProps {
  title: ReactNode;
  titleStyle?: CSSProperties;
  info?: ReactNode;
  href?: string;
  centered?: boolean;
  icon?: "arrow" | ReactNode;
  onClick?: () => void;
}
export const MenuItem = (props: MenuItemProps) => {
  const { title, titleStyle, info, href, icon, centered, onClick } = props;

  if (typeof href === "string") {
    return (
      <a
        className={classNames(styles.component, styles.link)}
        role="listitem"
        href={href}
        target="_blank"
      >
        <div className={styles.menuItemTitle} style={titleStyle}>
          {title}
        </div>
        {typeof info == "string" && (
          <div className={styles.menuItemInfo}>{info}</div>
        )}
        <div className={styles.menuItemIcon}>
          <ExternalLinkIcon />
        </div>
      </a>
    );
  }

  return (
    <div
      className={classNames(
        styles.component,
        centered ? styles.centered : undefined,
        onClick ? styles.link : undefined
      )}
      role="listitem"
      onClick={onClick}
    >
      <div className={styles.menuItemTitle} style={titleStyle}>
        {title}
      </div>
      {typeof info == "string" && (
        <div className={styles.menuItemInfo}>{info}</div>
      )}
      {icon === "arrow" ? (
        <div className={styles.menuItemIcon}>
          <ChevronRight />
        </div>
      ) : icon ? (
        <div className={styles.menuItemIcon}>{icon}</div>
      ) : null}
    </div>
  );
};
