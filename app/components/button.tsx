import * as React from "react";

import styles from "./button.module.scss";
import { useRef } from "react";
export function IconButton(props: {
  onClick?: () => void;
  icon: JSX.Element;
  text?: string;
  bordered?: boolean;
  shadow?: boolean;
  noDark?: boolean;
  className?: string;
  title?: string;
  disabled?: boolean;
}) {
    const buttonRef = useRef<HTMLTextAreaElement>(null);
    const handleClick = () => {
        console.log("--handleClick--",buttonRef);
        if(props.onClick){
            props.onClick();
        }
        if(buttonRef.current){
            buttonRef.current.blur();
        }
    };
  return (
    <button
        ref={buttonRef}
      className={
        styles["icon-button"] +
        ` ${props.bordered && styles.border} ${props.shadow && styles.shadow} ${
          props.className ?? ""
        } `
      }
      onClick={handleClick}
      title={props.title}
      disabled={props.disabled}
      role="button"
    >
      <div
        className={styles["icon-button-icon"] + ` ${props.noDark && "no-dark"}`}
      >
        {props.icon}
      </div>
      {props.text && (
        <div className={styles["icon-button-text"]}>{props.text}</div>
      )}
    </button>
  );
}
