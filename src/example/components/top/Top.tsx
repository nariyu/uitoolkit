import { useMainContext } from "@/example/hooks/useMainContext";
import { showBottomSheet } from "@/lib/components/BottomSheet";
import { Button } from "@/lib/components/Button";
import { DateInput } from "@/lib/components/DateInput";
import {
  NotificationManager,
  NotificationType,
} from "@/lib/components/Notification";
import { Popup } from "@/lib/components/PopUp";
import { PopupManager } from "@/lib/components/PopUp/PopUpManager";
import { SwitchInput } from "@/lib/components/SwitchInput";
import { TextInput } from "@/lib/components/TextInput";
import { ReactNode, useCallback } from "react";
import { MenuButton } from "../menu/Menu";
import styles from "./Top.module.scss";

export const Top = () => {
  const { openModalNavigationControllerModal } = useMainContext();

  const { theme, setTheme } = useMainContext();

  // ナビゲーションモーダルを開く
  const openNavigationModal = useCallback(() => {
    openModalNavigationControllerModal();
  }, [openModalNavigationControllerModal]);

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
      { enabledCloseByBackground: true }
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
          <Button onClick={openNavigationModal}>
            NavigationController + Modal
          </Button>
        </Row>
        <Row>
          <Button
            onClick={() => {
              showBottomSheet(
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
            BottomSheet
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
          <DateInput enabledTimePicker defaultValue={Date.now()} />
        </Row>
        <Row>
          <TextInput containerStyle={{ maxWidth: "15em" }} />
        </Row>
        <Row>
          <SwitchInput
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
