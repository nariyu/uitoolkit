import { useMainContext } from "@/example/hooks/useContext";
import { showActionSheet } from "@/lib/components/ActionSheet";
import { Button } from "@/lib/components/Button";
import { CheckBox } from "@/lib/components/CheckBox";
import {
  NotificationManager,
  NotificationType,
} from "@/lib/components/Notification";
import { Popup } from "@/lib/components/PopUp";
import { PopupManager } from "@/lib/components/PopUp/PopUpManager";
import { ReactNode, useCallback } from "react";
import { MenuButton } from "../menu/Menu";
import styles from "./Top.module.scss";

export const Top = () => {
  const { showModalNavigationControllerModal } = useMainContext();

  const { theme, setTheme } = useMainContext();

  // ナビゲーションモーダルを開く
  const setNavigationModalType = useCallback(() => {
    showModalNavigationControllerModal();
  }, [showModalNavigationControllerModal]);

  // モーダルを表示する
  const openModal = useCallback(() => {
    PopupManager.open(
      <Popup>
        <div
          style={{
            minHeight: "10rem",
            padding: "3rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
            fontWeight: 600,
          }}
        >
          Hello!
        </div>
      </Popup>,
      true
    );
  }, []);

  // モーダルを表示する
  const openModal2 = useCallback(() => {
    PopupManager.open(
      <Popup
        buttons={[
          {
            label: "Tea",
            primary: true,
            onClick: () => {
              NotificationManager.add("I prefer tea to coffee.");
            },
          },
          {
            label: "Coffee",
            onClick: () => {
              NotificationManager.add("I prefer coffee to tea.");
            },
          },
        ]}
      >
        <div
          style={{
            minHeight: "10rem",
            padding: "3rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
            fontWeight: 600,
          }}
        >
          Which do you prefer?
        </div>
      </Popup>
    );
  }, []);

  return (
    <div className={styles.component}>
      {/* HEADER */}
      <div className={styles.title}>
        <div className={styles.titleLeft}></div>
        <div className={styles.titleContent}>
          <h1 className={styles.appName}>UI Toolkit</h1>
        </div>
        <div className={styles.titleRight}>
          <MenuButton />
        </div>
      </div>

      {/* CONTENT */}
      <div className={styles.content}>
        <Row>
          <Button onClick={setNavigationModalType}>
            NavigationController + Modal
          </Button>
        </Row>
        <Row>
          <Button
            onClick={() => {
              showActionSheet(
                "Wow!",
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
                  😍
                </div>
              );
            }}
          >
            ActionSheet
          </Button>
        </Row>
        <Row>
          <Button onClick={openModal}>Popup</Button>
        </Row>
        <Row>
          <Button onClick={openModal2}>Popup w/ Buttons</Button>
        </Row>
        <Row>
          <Button
            onClick={() => {
              NotificationManager.add("Yeah!!");
            }}
          >
            Notification (default)
          </Button>
        </Row>
        <Row>
          <Button
            onClick={() => {
              NotificationManager.add("Hello!", NotificationType.Info);
            }}
          >
            Notification (info)
          </Button>
        </Row>
        <Row>
          <CheckBox
            label="Dark Mode"
            checked={theme === "dark"}
            onChange={(checked) => setTheme(checked ? "dark" : "light")}
          />
        </Row>
        <Row>
          Source:{" "}
          <a href="https://github.com/nariyu/uitoolkit" target="_blank">
            github.com/nariyu/uitoolkit
          </a>
        </Row>
      </div>
    </div>
  );
};

interface RowProps {
  children?: ReactNode;
}
const Row = ({ children }: RowProps) => {
  return <div style={{ margin: "2rem" }}>{children}</div>;
};
