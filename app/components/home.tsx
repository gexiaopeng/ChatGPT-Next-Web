"use client";

import MenugIcon from "../icons/menug.svg";

require("../polyfill");
import { useState, useEffect, useRef } from "react";

import { IconButton } from "./button";
import styles from "./home.module.scss";

import SettingsIcon from "../icons/settings.svg";
import GithubIcon from "../icons/github.svg";
import ChatGptIcon from "../icons/chatgpt.svg";
import ClosegIcon from "../icons/closeg.svg";

import BotIcon from "../icons/bot.svg";
import AddIcon from "../icons/add.svg";
import LoadingIcon from "../icons/three-dots.svg";
import CloseIcon from "../icons/close.svg";

import {createMessage, useChatStore} from "../store";
import { getCSSVar, isMobileScreen } from "../utils";
import Locale from "../locales";
import { Chat } from "./chat";

import dynamic from "next/dynamic";
import { REPO_URL } from "../constant";
import { ErrorBoundary } from "./error";
export function Loading(props: { noLogo?: boolean }) {
  return (
    <div className={styles["loading-content"]}>
      {!props.noLogo && <BotIcon />}
      <LoadingIcon />
    </div>
  );
}

const Settings = dynamic(async () => (await import("./settings")).Settings, {
  loading: () => <Loading noLogo />,
});

const ChatList = dynamic(async () => (await import("./chat-list")).ChatList, {
  loading: () => <Loading noLogo />,
});

function useSwitchTheme() {
  const config = useChatStore((state) => state.config);

  useEffect(() => {
    document.body.classList.remove("light");
    document.body.classList.remove("dark");

    if (config.theme === "dark") {
      document.body.classList.add("dark");
    } else if (config.theme === "light") {
      document.body.classList.add("light");
    }

    const metaDescriptionDark = document.querySelector(
      'meta[name="theme-color"][media]',
    );
    const metaDescriptionLight = document.querySelector(
      'meta[name="theme-color"]:not([media])',
    );

    if (config.theme === "auto") {
      metaDescriptionDark?.setAttribute("content", "#151515");
      metaDescriptionLight?.setAttribute("content", "#fafafa");
    } else {
      const themeColor = getCSSVar("--themeColor");
      metaDescriptionDark?.setAttribute("content", themeColor);
      metaDescriptionLight?.setAttribute("content", themeColor);
    }
  }, [config.theme]);
}

function useDragSideBar() {
  const limit = (x: number) => Math.min(500, Math.max(220, x));

  const chatStore = useChatStore();
  const startX = useRef(0);
  const startDragWidth = useRef(chatStore.config.sidebarWidth ?? 300);
  const lastUpdateTime = useRef(Date.now());

  const handleMouseMove = useRef((e: MouseEvent) => {
    if (Date.now() < lastUpdateTime.current + 100) {
      return;
    }
    lastUpdateTime.current = Date.now();
    const d = e.clientX - startX.current;
    const nextWidth = limit(startDragWidth.current + d);
    chatStore.updateConfig((config) => (config.sidebarWidth = nextWidth));
  });

  const handleMouseUp = useRef(() => {
    startDragWidth.current = chatStore.config.sidebarWidth ?? 300;
    window.removeEventListener("mousemove", handleMouseMove.current);
    window.removeEventListener("mouseup", handleMouseUp.current);
  });

  const onDragMouseDown = (e: MouseEvent) => {
    startX.current = e.clientX;

    window.addEventListener("mousemove", handleMouseMove.current);
    window.addEventListener("mouseup", handleMouseUp.current);
  };

  useEffect(() => {
    if (isMobileScreen()) {
      return;
    }

    document.documentElement.style.setProperty(
      "--sidebar-width",
      `${limit(chatStore.config.sidebarWidth ?? 300)}px`,
    );
  }, [chatStore.config.sidebarWidth]);

  return {
    onDragMouseDown,
  };
}


const useHasHydrated = () => {
  const [hasHydrated, setHasHydrated] = useState<boolean>(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  return hasHydrated;
};

let isInit=false;

function _Home() {
  const [createNewSession, currentIndex, removeSession,isRenameDelete] = useChatStore(
    (state) => [
      state.newSession,
      state.currentSessionIndex,
      state.removeSession,
      state.isRenameDelete,
    ],
  );
  const chatStore = useChatStore();
  const loading = !useHasHydrated();
  const [showSideBar, setShowSideBar] = useState(true);

  // setting
  const [openSettings, setOpenSettings] = useState(false);
  const config = useChatStore((state) => state.config);

  // drag side bar
  const { onDragMouseDown } = useDragSideBar();

  useSwitchTheme();
  const hiddenSidebar=()=>{
   setTimeout(()=>{
      console.log("--hiddenSidebar--",isRenameDelete,chatStore.isRenameDelete,chatStore.getRenameDelete(),new Date().getTime());
      setOpenSettings(false);
      if(chatStore.getRenameDelete()){
        chatStore.renameDelete(false);
      }else{
        setShowSideBar(false);
      }
    },10);
  };
  function initPage(){
    const queryParameters = new URLSearchParams(window.location.search);
    const role = queryParameters.get("r") || 1;
    console.log("=initPage,initPage:"+isInit+",role:"+role);
    if(!isInit){
      isInit=true;
      chatStore.setRole(role);
      createNewSession();
      setShowSideBar(false);
    }
  }
  const MIN_SWIPE_DISTANCE = 50; // minimum distance in pixels for a swipe to be registered
  let startX: number;
  function handleTouchStart(event: TouchEvent) {
    const element = event.target as HTMLElement;
    console.log("-handleTouchStart-",element);
    element.focus();
    const header = document.getElementById("sidebar-show") as HTMLElement;
    console.log("-header-",header);
    header?.focus();
    startX = event.touches[0].clientX;
  }

  function handleTouchMove(event: TouchEvent) {
    const currentX = event.touches[0].clientX;
    const distance = currentX - startX;
    if (distance < -MIN_SWIPE_DISTANCE) {
      // left swipe detected
      // do something here
      hiddenSidebar();
    }
  }

  useEffect(() => {
    initPage();
  }, []);

  if (loading) {
    return <Loading />;
  }
  return (
    <div
      className={`${
        config.tightBorder && !isMobileScreen()
          ? styles["tight-container"]
          : styles.container
      }`}

    >
      <div id="sidebar-show"
        className={styles.sidebar + ` ${showSideBar && styles["sidebar-show"]}`}
        onTouchStart={(e1) => handleTouchStart(e1 as any)}
        onTouchMove={(e2) => handleTouchMove(e2 as any)}
      >
        <div className={styles["sidebar-action-button-close"] + " " + styles.mobile}>
          <ClosegIcon
              onClick={hiddenSidebar}
          />
        </div>
        <div className={styles["sidebar-header"]}
             onClick={() => {
               hiddenSidebar();
             }}
        >
          <div className={styles["sidebar-title"]}
          >ChatGPT Next</div>
          <div className={styles["sidebar-sub-title"]}>
            Build your own AI assistant.
          </div>
          <div className={styles["sidebar-logo"]}>
            <ChatGptIcon />
          </div>
        </div>

        <div
          className={styles["sidebar-body"]}
          onClick={() => {
            hiddenSidebar();
          }}
        >
          <ChatList />
        </div>

        <div className={styles["sidebar-tail"]}

        >
          <div className={styles["sidebar-actions"]}>
            <div className={styles["sidebar-action"]}>
              <IconButton
                icon={<SettingsIcon />}
                onClick={() => {
                  setOpenSettings(true);
                  setShowSideBar(false);
                }}
                shadow
              />
            </div>
            <div className={styles["sidebar-action"]}>
              <a href={REPO_URL} target="_blank">
                <IconButton icon={<GithubIcon />} shadow />
              </a>
            </div>
          </div>
          <div>
            <IconButton
              icon={<AddIcon />}
              text={Locale.Home.NewChat}
              onClick={() => {
                createNewSession();
                setShowSideBar(false);
              }}
              shadow
            />
          </div>
        </div>

        <div
          className={styles["sidebar-drag"]}
          onMouseDown={(e) => onDragMouseDown(e as any)}
        ></div>
      </div>

      <div className={styles["window-content"]}>
        {openSettings ? (
          <Settings
            closeSettings={() => {
              setOpenSettings(false);
              if(!isMobileScreen()){
                setShowSideBar(true);
              }
           }}
          />
        ) : (
          <Chat
            key="chat"
            showSideBar={() => setShowSideBar(true)}
            sideBarShowing={showSideBar}
            setShowSettings={() =>setOpenSettings(true)}
            createNewSession={()=>createNewSession()}
          />
        )}
      </div>
    </div>
  );
}

export function Home() {
  return (
    <ErrorBoundary>
      <_Home></_Home>
    </ErrorBoundary>
  );
}
