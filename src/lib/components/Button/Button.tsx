import { HTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.scss";

interface Props extends HTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
}
export const Button = (props: Props) => {
  const { children } = props;
  return (
    <button className={styles.component} {...props}>
      {children}
    </button>
  );
};
