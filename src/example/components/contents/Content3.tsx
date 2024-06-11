import { useMainContext } from "@/example/hooks/useMainContext";
import { showBottomSheet } from "@/lib/components/BottomSheet";
import { Button } from "@/lib/components/Button";
import styles from "./Content.module.scss";

export const Content3 = () => {
  const { modalContainerRef } = useMainContext();

  return (
    <div className={styles.component}>
      <Button
        onClick={() => {
          if (modalContainerRef?.current) {
            showBottomSheet(
              "Pretty!",
              <div
                style={{
                  padding: "1rem",
                  minHeight: "20rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "6rem",
                }}
              >
                🥰
              </div>,
              {
                container: modalContainerRef.current,
              }
            );
          }
        }}
      >
        Show ActionSheet
      </Button>
    </div>
  );
};

export const Content3Icon = () => <span style={{ opacity: 0.3 }}>⚽️</span>;
export const Content3IconSelected = () => <>⚽️</>;
