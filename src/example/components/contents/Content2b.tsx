import { useMainContext } from "@/example/hooks/useContext";
import { Button } from "@/lib/components/Button";
import { useCallback } from "react";
import styles from "./Content2b.module.scss";
import { Content2CContent, Content2CTitle } from "./Content2c";

export const Content2BTitle = () => <>I am...</>;
export const Content2BContent = () => {
  const { modalNavigationController } = useMainContext();

  const nextView = useCallback(() => {
    modalNavigationController?.pushView(
      <Content2CTitle />,
      <Content2CContent />
    );
  }, [modalNavigationController]);

  return (
    <div className={styles.component}>
      <p>I am Nariyu.</p>
      <Button data-block onClick={nextView}>
        Next
      </Button>
    </div>
  );
};
