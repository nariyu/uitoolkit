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

type MenuState = {
  opened: boolean;
};
type NavigationControllerState = {
  shown: boolean;
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

  modalContainer: HTMLDivElement | null;
  setModalContainer: Dispatch<SetStateAction<HTMLDivElement | null>>;

  menuNavigationControllerRef: MutableRefObject<NavigationControllerHandler | null> | null;

  modalNavigationController: NavigationControllerHandler | null | undefined;
  setModalNavigationController: Dispatch<
    SetStateAction<NavigationControllerHandler | null>
  >;

  menuState: MenuState;
  setMenuState: Dispatch<SetStateAction<MenuState>>;

  modalNavigationControllerState: NavigationControllerState;
  showModalNavigationControllerModal: () => void;
  hideModalNavigationControllerModal: () => void;

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
  modalContainer: null,
  setModalContainer: () => {},
  menuNavigationControllerRef: null,
  modalNavigationController: null,
  setModalNavigationController: () => {},
  menuState: {
    opened: false,
  },
  setMenuState: () => {},
  modalNavigationControllerState: {
    shown: false,
  },
  showModalNavigationControllerModal: () => {},
  hideModalNavigationControllerModal: () => {},

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
  const [modalContainer, setModalContainer] = useState<HTMLDivElement | null>(
    null
  );

  // Menu State
  const menuNavigationControllerRef =
    useRef<NavigationControllerHandler | null>(null);
  const [menuState, setMenuState] = useState<MenuState>({
    opened: false,
  });

  // Modal NavigationController
  const [modalNavigationController, setModalNavigationController] =
    useState<NavigationControllerHandler | null>(null);
  const [modalNavigationControllerState, setNavigationControllerState] =
    useState<{
      shown: boolean;
    }>({
      shown: false,
    });

  const showModalNavigationControllerModal = useCallback(() => {
    setNavigationControllerState((currValue) => {
      return {
        ...currValue,
        shown: true,
      };
    });
  }, [setNavigationControllerState]);

  const hideModalNavigationControllerModal = useCallback(() => {
    setNavigationControllerState((currValue) => {
      return {
        ...currValue,
        shown: false,
      };
    });
  }, [setNavigationControllerState]);

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

        modalContainer,
        setModalContainer,
        menuNavigationControllerRef,
        modalNavigationController,
        setModalNavigationController,

        menuState,
        setMenuState,

        modalNavigationControllerState,
        showModalNavigationControllerModal,
        hideModalNavigationControllerModal,

        userInfo,
        setUserInfo,
      }}
    >
      {children}
    </MainContext.Provider>
  );
};
