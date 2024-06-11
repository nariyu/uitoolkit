import { useMainContext } from "@/example/hooks/useMainContext";
import { Button } from "@/lib/components/Button";
import { preventDefault } from "@/lib/utils/ElementUtil";
import { SyntheticEvent, useCallback } from "react";
import styles from "./Content.module.scss";
import { Content2BContent, Content2BTitle } from "./Content2b";

export const Content2 = () => {
  const { modalNavigationControllerRef } = useMainContext();

  // Next ボタン
  const onClickNextNavigation = useCallback(
    (event: SyntheticEvent) => {
      preventDefault(event);

      modalNavigationControllerRef?.current?.pushView(
        <Content2BTitle />,
        <Content2BContent />
      );
    },
    [modalNavigationControllerRef]
  );

  return (
    <div className={styles.component}>
      <p>Hello!</p>
      <Button data-block onClick={onClickNextNavigation}>
        Next
      </Button>
    </div>
  );
};

export const Content2Icon = () => <span style={{ opacity: 0.3 }}>🌷</span>;
export const Content2IconSelected = () => <>🌷</>;
