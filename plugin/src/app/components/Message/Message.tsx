import cx from "classnames";
import styles from "./Message.module.css";
import type { ChatMessage } from "../../types";

interface MessageProps {
  message: ChatMessage;
}

export function Message({ message: msg }: MessageProps) {
  return (
    <div className={cx(styles.msg, styles[msg.role])}>{msg.text}</div>
  );
}
