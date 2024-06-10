import { ReactNode, useState } from "react";
import styles from "./TabNavigator.module.scss";

interface TabNavigatorItem {
  title?: string | ReactNode;
  accessibilityTitle?: string;
  icon?: ReactNode;
  selectedIcon?: ReactNode;
  disabled?: boolean;
  view?: ReactNode;
}

interface TabNavigatorProps {
  items: TabNavigatorItem[];
  defaultSelectedIndex?: number;
}
export const TabNavigator = (props: TabNavigatorProps) => {
  const { items, defaultSelectedIndex } = props;
  const [selectedIndex, setSelectedIndex] = useState(defaultSelectedIndex || 0);

  return (
    <div className={styles.component}>
      <div className={styles.viewStack}>
        {items.map((item, index) => (
          <div
            key={index}
            className={styles.view}
            aria-hidden={index !== selectedIndex}
          >
            {item.view}
          </div>
        ))}
      </div>
      <TabGroup
        {...props}
        selectedIndex={selectedIndex}
        onChange={(index) => setSelectedIndex(index)}
      />
    </div>
  );
};

interface TabGroupProps {
  items: TabNavigatorItem[];
  selectedIndex: number;
  onChange: (index: number) => void;
}
export const TabGroup = (props: TabGroupProps) => {
  const { items, selectedIndex, onChange } = props;
  return (
    <div className={styles.tabGroup} role="navigation">
      {items.map((item, index) => (
        <Tab
          key={index}
          {...item}
          selected={index === selectedIndex}
          onClick={() => onChange(index)}
        />
      ))}
    </div>
  );
};

interface TabProps extends TabNavigatorItem {
  selected: boolean;
  onClick: () => void;
}
export const Tab = (props: TabProps) => {
  const {
    title,
    accessibilityTitle,
    icon,
    selectedIcon,
    selected,
    disabled,
    onClick,
  } = props;
  return (
    <div
      className={styles.tab}
      role="tab"
      aria-selected={selected}
      aria-disabled={disabled}
      aria-label={typeof title === "string" ? title : accessibilityTitle}
      onClick={onClick}
    >
      <div className={styles.icon}>
        {selected
          ? selectedIcon || icon || <div className={styles.dummyIcon}></div>
          : icon || <div className={styles.dummyIcon}></div>}
      </div>
      {title && <div className={styles.title}>{title}</div>}
    </div>
  );
};
