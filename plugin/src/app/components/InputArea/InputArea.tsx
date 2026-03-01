import { useState } from "react";
import styles from "./InputArea.module.css";
import { ArrowUpIcon, StopIcon } from "../Icons/Icons";
import { IconButton } from "../IconButton/IconButton";

interface InputAreaProps {
  disabled: boolean;
  loading?: boolean;
  onSend: (text: string) => void;
  onStop?: () => void;
}

export function InputArea({ disabled, loading, onSend, onStop }: InputAreaProps) {
  const [value, setValue] = useState("");

  const handleSend = () => {
    const text = value.trim();
    if (!text) return;
    onSend(text);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasValue = value.trim().length > 0;

  return (
    <div className={styles.root}>
      <div className={styles.chatInput}>
        <div className={styles.inputRow}>
          <textarea
            className={styles.input}
            placeholder="How can I help you today?"
            disabled={disabled}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className={styles.toolbar}>
          {loading ? (
            <IconButton
              icon={<StopIcon />}
              label="Stop"
              variant="secondary"
              onClick={onStop}
            />
          ) : (
            <IconButton
              icon={<ArrowUpIcon />}
              label="Send"
              variant="primary"
              onClick={handleSend}
              disabled={disabled || !hasValue}
            />
          )}
        </div>
      </div>
    </div>
  );
}
