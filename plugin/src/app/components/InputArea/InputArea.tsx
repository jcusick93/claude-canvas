import { useState } from "react";
import styles from "./InputArea.module.css";

interface InputAreaProps {
  disabled: boolean;
  onSend: (text: string) => void;
}

export function InputArea({ disabled, onSend }: InputAreaProps) {
  const [value, setValue] = useState("");

  const handleSend = () => {
    const text = value.trim();
    if (!text) return;
    onSend(text);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className={styles.root}>
      <input
        className={styles.input}
        type="text"
        placeholder="Reply"
        disabled={disabled}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
