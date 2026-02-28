import cx from "classnames";
import styles from "./StatusDot.module.css";
import type { ConnectionStatus } from "../../types";

interface StatusDotProps {
  status: ConnectionStatus;
}

export function StatusDot({ status }: StatusDotProps) {
  return (
    <div
      className={cx(styles.dot, { [styles.connected]: status === "connected" })}
    />
  );
}
