"use client";

import { NavigationController } from "@/lib/components/NavigationController";
import { TabNavigator } from "@/lib/components/TabNavigator";
import { preventDefault } from "@/lib/utils/ElementUtil";
import { SyntheticEvent, useCallback, useEffect, useState } from "react";
import {
  Content1,
  Content1Icon,
  Content1IconSelected,
} from "../components/contents/Content1";
import {
  Content2,
  Content2Icon,
  Content2IconSelected,
} from "../components/contents/Content2";
import {
  Content3,
  Content3Icon,
  Content3IconSelected,
} from "../components/contents/Content3";
import { Top } from "../components/top/Top";
import { useMainContext } from "../hooks/useMainContext";
import styles from "./MainScreen.module.scss";

/**
 * MainScreen
 */
export const MainScreen = () => {
  const { userInfo } = useMainContext();

  // Context
  const {
    modalContainerRef,
    menuNavigationControllerRef,
    modalNavigationControllerRef,
    closeMenu,
    modalNavigationControllerOpened,
    closeModalNavigationControllerModal,
  } = useMainContext();

  const [
    menuNavigationControllerViewIndex,
    setMenuNavigationControllerViewIndex,
  ] = useState(-1);

  // ログインしたらメニューを閉じる
  const hasUserInfo = !!userInfo;
  useEffect(() => {
    if (hasUserInfo) {
      menuNavigationControllerRef?.current?.removeAllViews();
    }
  }, [hasUserInfo, menuNavigationControllerRef]);

  // モーダルの背景クリック
  const onClickModalBackground = useCallback(
    (event: SyntheticEvent) => {
      preventDefault(event);

      menuNavigationControllerRef?.current?.removeAllViews();
      closeModalNavigationControllerModal();
    },
    [closeModalNavigationControllerModal, menuNavigationControllerRef]
  );

  return (
    <div className={styles.component}>
      <Top />

      {/* MODAL BACKGROUND */}
      <div
        className={styles.navigationControllerModal}
        aria-hidden={
          menuNavigationControllerViewIndex === -1 &&
          !modalNavigationControllerOpened
        }
        onClick={onClickModalBackground}
      />

      {/* MENU */}
      <div
        className={styles.navigationController}
        aria-hidden={menuNavigationControllerViewIndex === -1}
      >
        <NavigationController
          ref={(ref) => {
            if (menuNavigationControllerRef)
              menuNavigationControllerRef.current = ref;
          }}
          defaultNoBorder={true}
          onClose={closeMenu}
          onChangeIndex={(index) => {
            setMenuNavigationControllerViewIndex(index);
          }}
        />
      </div>

      {/* MODAL NAVIGATION CONTROLLER */}
      <div
        className={styles.navigationModal}
        aria-hidden={!modalNavigationControllerOpened}
      >
        <div
          ref={(ref) => {
            if (modalContainerRef) {
              modalContainerRef.current = ref;
            }
          }}
          className={styles.modalContainer}
        />
        <NavigationController
          ref={(ref) => {
            if (modalNavigationControllerRef)
              modalNavigationControllerRef.current = ref;
          }}
          defaultTitle="NavigationController + Modal"
          defaultLeftButton="Close"
          onClickDefaultLeftButton={closeModalNavigationControllerModal}
        >
          <TabNavigator
            items={[
              {
                title: "Home",
                icon: <Content1Icon />,
                selectedIcon: <Content1IconSelected />,
                view: <Content1 />,
              },
              {
                title: "Hello",
                icon: <Content2Icon />,
                selectedIcon: <Content2IconSelected />,
                view: <Content2 />,
              },
              {
                title: "Wow!",
                icon: <Content3Icon />,
                selectedIcon: <Content3IconSelected />,
                view: <Content3 />,
              },
            ]}
          />
        </NavigationController>
      </div>
    </div>
  );
};
