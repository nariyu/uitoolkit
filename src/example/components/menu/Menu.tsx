import { MenuItem, MenuSection } from "@/lib/components/Menu";
import { Submittable } from "@/lib/components/NavigationController";
import { SwitchInput } from "@/lib/components/SwitchInput";
import { preventDefault } from "@/lib/utils/ElementUtil";
import { Menu as MenuIcon } from "@styled-icons/ionicons-solid/Menu";
import { SyntheticEvent, useCallback, useRef } from "react";
import { Config } from "../../config";

import { useMainContext } from "@/example/hooks/useMainContext";
import { EmailEdit, EmailEditSubmitButton, EmailEditTitle } from "./EmailEdit";
import styles from "./Menu.module.scss";
import {
  PhoneNumberEdit,
  PhoneNumberEditSubmitButton,
  PhoneNumberEditTitle,
} from "./PhoneNumberEdit";
import { SignInPanel } from "./SignInPanel";
import { UserInfo } from "./UserInfo";
import {
  UsernameEdit,
  UsernameEditSubmitButton,
  UsernameEditTitle,
} from "./UsernameEdit";

export const Menu = () => {
  const { menuNavigationControllerRef } = useMainContext();
  const { userInfo, setUserInfo } = useMainContext();

  // ビューの参照
  const usernameEditRef = useRef<Submittable>(null);
  const emailEditRef = useRef<Submittable>(null);
  const phoneEditRef = useRef<Submittable>(null);

  // 編集ボタン
  const onClickEditButton = useCallback(
    (type: string) => {
      if (!menuNavigationControllerRef?.current) return;

      if (type === "username") {
        menuNavigationControllerRef.current.pushView(
          <UsernameEditTitle />,
          <UsernameEdit
            ref={usernameEditRef}
            onClose={() => menuNavigationControllerRef.current?.popView()}
          />,
          <UsernameEditSubmitButton />,
          { submit: usernameEditRef }
        );
      } else if (type === "phone") {
        menuNavigationControllerRef.current.pushView(
          <PhoneNumberEditTitle />,
          <PhoneNumberEdit
            ref={phoneEditRef}
            onClose={() => menuNavigationControllerRef.current?.popView()}
          />,
          <PhoneNumberEditSubmitButton />,
          { submit: phoneEditRef }
        );
      } else if (type === "email") {
        menuNavigationControllerRef.current.pushView(
          <EmailEditTitle />,
          <EmailEdit
            ref={emailEditRef}
            onClose={() => menuNavigationControllerRef.current?.popView()}
          />,
          <EmailEditSubmitButton />,
          { submit: emailEditRef }
        );
      }
    },
    [menuNavigationControllerRef]
  );

  return (
    <div className={styles.component}>
      {userInfo ? (
        <>
          <UserInfo />
          <MenuSection title="Settings">
            <MenuItem
              title="Username"
              info={userInfo.username}
              icon="arrow"
              onClick={() => onClickEditButton("username")}
            />
            <MenuItem
              title="Email"
              info={userInfo.email}
              icon="arrow"
              onClick={() => onClickEditButton("email")}
            />
            <MenuItem
              title="Phone Number"
              info={userInfo.phoneNumber}
              icon="arrow"
              onClick={() => onClickEditButton("phone")}
            />
            <MenuItem
              title={userInfo.happy ? "Happy! 😍" : "Happy?"}
              icon={
                <SwitchInput
                  defaultChecked={userInfo.happy}
                  onChange={(checked) =>
                    setUserInfo((userInfo) =>
                      userInfo ? { ...userInfo, happy: checked } : undefined
                    )
                  }
                />
              }
            />
          </MenuSection>
          <MenuSection title="Links">
            <MenuItem
              title="Facebook"
              info="nariyu.jp"
              href="https://www.facebook.com/nariyu.jp"
            />
            <MenuItem
              title="Instagram"
              info="nariyu"
              href="https://www.instagram.com/nariyu/"
            />
          </MenuSection>
        </>
      ) : (
        <>
          <SignInPanel />
          <MenuSection title="Links">
            <MenuItem title="Google" href="https://www.google.com/" />
            <MenuItem title="Amazon" href="https://www.amazon.com/" />
            <MenuItem title="Facebook" href="https://www.facebook.com/" />
            <MenuItem title="Apple" href="https://www.apple.com/" />
            <MenuItem title="Microsoft" href="https://www.microsoft.com/" />
          </MenuSection>
        </>
      )}

      {userInfo && (
        <MenuSection>
          <MenuItem
            title="Sign out"
            centered
            titleStyle={{ color: "#f00" }}
            onClick={() => {
              setUserInfo(undefined);
            }}
          />
        </MenuSection>
      )}

      <VersionView />
    </div>
  );
};

// メニュータイトル
export const MenuTitle = () => {
  return <>Menu</>;
};

// メニューボタン
export const MenuButton = () => {
  const { openMenu, menuNavigationControllerRef } = useMainContext();

  const { userInfo } = useMainContext();

  // メニューを開く
  const onClickMenuOpenButton = useCallback(
    (event: SyntheticEvent) => {
      preventDefault(event);

      openMenu();

      menuNavigationControllerRef?.current?.pushView(<MenuTitle />, <Menu />);
    },
    [menuNavigationControllerRef, openMenu]
  );

  return (
    <div className={styles.menuBtn} onClick={onClickMenuOpenButton}>
      {userInfo ? (
        <div
          className={styles.icon}
          style={{ backgroundImage: `url(${userInfo.profileImageUrl})` }}
        />
      ) : (
        <MenuIcon />
      )}
    </div>
  );
};

// バージョン
const VersionView = () => {
  return (
    <div className={styles.versionInfo}>
      Version {Config.VERSION}
      <br />
      Commit {Config.VERCEL_GIT_COMMIT_SHA}
    </div>
  );
};
