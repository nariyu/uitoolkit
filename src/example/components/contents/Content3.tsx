import { useMainContext } from "@/example/hooks/useContext";
import { showActionSheet } from "@/lib/components/ActionSheet";
import { Button } from "@/lib/components/Button";
import styles from "./Content.module.scss";

export const Content3 = () => {
  const { modalContainer } = useMainContext();

  return (
    <div className={styles.component}>
      <Button
        onClick={() => {
          if (modalContainer) {
            showActionSheet(
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
                container: modalContainer,
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
