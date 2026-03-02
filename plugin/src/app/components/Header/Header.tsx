import cx from "classnames";
import styles from "./Header.module.css";
import { SidebarIcon } from "../Icons/Icons";
import { IconButton } from "../IconButton/IconButton";
import type { ConnectionStatus } from "../../types";

interface HeaderProps {
  status: ConnectionStatus;
  statusLabel?: string | null;
  title?: string | null;
  onToggleSidebar?: () => void;
}

export function Header({ status, statusLabel, title, onToggleSidebar }: HeaderProps) {
  const isConnected = status === "connected";
  return (
    <div className={styles.root}>
      <IconButton icon={<SidebarIcon />} label="Toggle sidebar" onClick={onToggleSidebar} />
      <span className={styles.title}>{title || ""}</span>
      <div className={styles.status}>
        <span className={cx(styles.dot, isConnected ? styles.connected : styles.disconnected)} />
        <span className={styles.label}>
          {statusLabel || (isConnected ? "Connected" : "Disconnected")}
        </span>
      </div>
    </div>
  );
}
