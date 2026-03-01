import cx from "classnames";
import styles from "./Header.module.css";
import { SuccessIcon, ErrorIcon, SidebarIcon } from "../Icons/Icons";
import { IconButton } from "../IconButton/IconButton";
import type { ConnectionStatus } from "../../types";

interface HeaderProps {
  status: ConnectionStatus;
  statusLabel?: string | null;
  onToggleSidebar?: () => void;
}

export function Header({ status, statusLabel, onToggleSidebar }: HeaderProps) {
  const isConnected = status === "connected";
  return (
    <div className={styles.root}>
      <IconButton icon={<SidebarIcon />} label="Toggle sidebar" onClick={onToggleSidebar} />
      <div className={styles.status}>
        <span className={cx(styles.statusIcon, isConnected ? styles.connected : styles.disconnected)}>
          {isConnected ? <SuccessIcon /> : <ErrorIcon />}
        </span>
        <span className={styles.label}>
          {statusLabel || (isConnected ? "Connected" : "Disconnected")}
        </span>
      </div>
    </div>
  );
}
