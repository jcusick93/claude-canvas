import styles from "./MessageActions.module.css";
import { IconButton } from "../IconButton/IconButton";
import { CopyIcon, RedoIcon } from "../Icons/Icons";

interface MessageActionsProps {
  onCopy?: () => void;
  onRetry?: () => void;
}

export function MessageActions({ onCopy, onRetry }: MessageActionsProps) {
  return (
    <div className={styles.root}>
      <IconButton icon={<CopyIcon />} onClick={onCopy} label="Copy" />
      <IconButton icon={<RedoIcon />} onClick={onRetry} label="Retry" />
    </div>
  );
}
