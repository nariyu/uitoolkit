import React, { ReactNode } from 'react';
import styles from './MenuSection.module.scss';

/**
 * メニューセクション
 */
interface MenuSectionProps {
  title?: string;
  children?: ReactNode;
}
export const MenuSection = (props: MenuSectionProps) => {
  const { title, children } = props;
  return (
    <div className={styles.section}>
      {typeof title === 'string' && (
        <div className={styles.sectionTitle}>{title}</div>
      )}
      {children}
    </div>
  );
};
