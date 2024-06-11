"use client";

import { NavigationControllerHandler } from "@/lib/components/NavigationController";
import {
  Dispatch,
  MutableRefObject,
  ReactNode,
  SetStateAction,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type Theme = "dark" | "light";

type WindowSize = { width: number; height: number };

type NavigationControllerState = {
  opened: boolean;
};

interface UserInfo {
  username: string;
  profileImageUrl: string;
  email: string;
  phoneNumber: string;
  happy: boolean;
}

export const defaultUserInfo: UserInfo = {
  username: "nariyu",
  profileImageUrl:
    "https://s.gravatar.com/avatar/fad811287984696321fe0297077833b4?s=300",
  email: "nariyu@example.com",
  phoneNumber: "09012345678",
  happy: false,
};

type IMainContext = {
  windowSize: WindowSize;
  theme: Theme;
  setTheme: Dispatch<SetStateAction<Theme>>;

  // Modal
  modalContainerRef: MutableRefObject<HTMLDivElement | null> | null;

  // Menu
  menuNavigationControllerRef: MutableRefObject<NavigationControllerHandler | null> | null;
  menuOpened: boolean;
  openMenu: () => void;
  closeMenu: () => void;

  // Modal NavigationController
  modalNavigationControllerRef: MutableRefObject<NavigationControllerHandler | null> | null;
  modalNavigationControllerOpened: boolean;
  openModalNavigationControllerModal: () => void;
  closeModalNavigationControllerModal: () => void;

  // User Info
  userInfo: UserInfo | undefined;
  setUserInfo: Dispatch<SetStateAction<UserInfo | undefined>>;
};

const defaultMainContext: IMainContext = {
  windowSize:
    typeof window === "undefined"
      ? { width: 0, height: 0 }
      : {
          width: window.innerWidth,
          height: window.innerHeight,
        },
  theme: typeof window === "undefined" ? "light" : "dark",
  setTheme: () => {},
  modalContainerRef: null,

  menuNavigationControllerRef: null,
  menuOpened: false,
  openMenu: () => {},
  closeMenu: () => {},

  modalNavigationControllerRef: null,
  modalNavigationControllerOpened: false,
  openModalNavigationControllerModal: () => {},
  closeModalNavigationControllerModal: () => {},

  userInfo: defaultUserInfo,
  setUserInfo: () => {},
};

const MainContext = createContext<IMainContext>(defaultMainContext);

export const useMainContext = () => useContext(MainContext);

export const MainContextProvider = ({ children }: { children: ReactNode }) => {
  // Window size
  useEffect(() => {
    const onResize = () => {
      defaultMainContext.windowSize = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
    };
    onResize();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Theme
  const [theme, setTheme] = useState<Theme>(
    typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
  );

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", (event) => {
          setTheme(event.matches ? "dark" : "light");
        });
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);

    const manifestElem = document.querySelector('link[rel="manifest"]');
    if (manifestElem) {
      manifestElem.setAttribute("href", `/manifest-${theme}.json`);
    }
    const themeColorElem = document.querySelector('meta[name="theme-color"]');
    if (themeColorElem) {
      themeColorElem.setAttribute(
        "content",
        theme === "dark" ? "#000" : "#fff"
      );
    }
  }, [theme]);

  // ModalContainer
  const modalContainerRef = useRef<HTMLDivElement | null>(null);

  // Menu State
  const menuNavigationControllerRef =
    useRef<NavigationControllerHandler | null>(null);
  const [menuState, setMenuState] = useState<NavigationControllerState>({
    opened: false,
  });
  const openMenu = useCallback(() => {
    setMenuState((curr) => ({ ...curr, opened: true }));
  }, []);
  const closeMenu = useCallback(() => {
    setMenuState((curr) => ({ ...curr, opened: false }));
  }, []);

  // Modal NavigationController
  const modalNavigationControllerRef =
    useRef<NavigationControllerHandler | null>(null);
  const [modalNavigationControllerState, setModalNavigationControllerState] =
    useState<NavigationControllerState>({
      opened: false,
    });
  const openModalNavigationControllerModal = useCallback(() => {
    setModalNavigationControllerState((currValue) => ({
      ...currValue,
      opened: true,
    }));
  }, [setModalNavigationControllerState]);
  const closeModalNavigationControllerModal = useCallback(() => {
    setModalNavigationControllerState((currValue) => ({
      ...currValue,
      opened: false,
    }));
  }, [setModalNavigationControllerState]);

  // User Info
  const [userInfo, setUserInfo] = useState<UserInfo | undefined>(
    defaultUserInfo
  );

  return (
    <MainContext.Provider
      value={{
        ...defaultMainContext,
        theme,
        setTheme,

        modalContainerRef,

        menuNavigationControllerRef,
        menuOpened: menuState.opened,
        openMenu,
        closeMenu,

        modalNavigationControllerRef,
        modalNavigationControllerOpened: modalNavigationControllerState.opened,
        openModalNavigationControllerModal,
        closeModalNavigationControllerModal,

        userInfo,
        setUserInfo,
      }}
    >
      {children}
    </MainContext.Provider>
  );
};
