import styles from "./Header.module.css";
import { StatusDot } from "../StatusDot/StatusDot";
import type { ConnectionStatus } from "../../types";

interface HeaderProps {
  status: ConnectionStatus;
}

export function Header({ status }: HeaderProps) {
  return (
    <div className={styles.root}>
      <StatusDot status={status} />
      <span className={styles.title}>Claude Canvas</span>
      <span className={styles.statusLabel}>
        {status === "connected" ? "Connected to Claude" : "Disconnected"}
      </span>
    </div>
  );
}
