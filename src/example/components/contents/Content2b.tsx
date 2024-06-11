import { useMainContext } from "@/example/hooks/useMainContext";
import { Button } from "@/lib/components/Button";
import { useCallback } from "react";
import styles from "./Content2b.module.scss";
import { Content2CContent, Content2CTitle } from "./Content2c";

export const Content2BTitle = () => <>I am...</>;
export const Content2BContent = () => {
  const { modalNavigationControllerRef } = useMainContext();

  const nextView = useCallback(() => {
    modalNavigationControllerRef?.current?.pushView(
      <Content2CTitle />,
      <Content2CContent />
    );
  }, [modalNavigationControllerRef]);

  return (
    <div className={styles.component}>
      <p>I am Nariyu.</p>
      <Button data-block onClick={nextView}>
        Next
      </Button>
    </div>
  );
};
