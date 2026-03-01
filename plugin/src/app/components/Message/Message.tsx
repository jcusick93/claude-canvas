import { useCallback, useEffect, useMemo, useState } from "react";
import cx from "classnames";
import { marked } from "marked";
import styles from "./Message.module.css";
import { MessageActions } from "../MessageActions/MessageActions";
import type { ChatMessage } from "../../types";

marked.setOptions({
  breaks: true,
  gfm: true,
});

// Customize rendered output
const defaultRenderer = new marked.Renderer();
const renderer = new marked.Renderer();
renderer.link = ({ href, text }) =>
  `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
renderer.table = function (token) {
  const html = defaultRenderer.table.call(this, token);
  return `<div class="${styles.tableScroll}">${html}</div>`;
};
marked.use({ renderer });

function copyToClipboard(text: string) {
  const el = document.createElement("textarea");
  el.value = text;
  el.style.position = "fixed";
  el.style.opacity = "0";
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
}

function renderMarkdown(text: string): string {
  const html = marked.parse(text);
  if (typeof html !== "string") return text;
  return html;
}

const WORD_INTERVAL = 30; // ms between each word appearing
const ACTIONS_DELAY = 150; // ms after last word before actions appear

interface MessageProps {
  message: ChatMessage;
  onRetry?: () => void;
}

/** Progressively reveals words for new assistant messages */
function AnimatedText({ text, onClick }: { text: string; onClick: (e: React.MouseEvent) => void }) {
  const words = useMemo(() => text.match(/\S+\s*/g) || [], [text]);
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount >= words.length) return;
    const timer = setTimeout(() => {
      setVisibleCount((c) => c + 1);
    }, WORD_INTERVAL);
    return () => clearTimeout(timer);
  }, [visibleCount, words.length]);

  return (
    <div className={styles.assistantText} onClick={onClick}>
      {words.slice(0, visibleCount).map((word, i) => (
        <span key={i} className={styles.wordReveal}>
          {word}
        </span>
      ))}
    </div>
  );
}

export function Message({ message: msg, onRetry }: MessageProps) {
  const html = useMemo(
    () => (msg.role === "assistant" ? renderMarkdown(msg.text) : null),
    [msg.role, msg.text]
  );

  const isNew = msg.role === "assistant" && msg.isNew !== false;
  const words = useMemo(() => (isNew ? (msg.text.match(/\S+\s*/g) || []) : []), [isNew, msg.text]);
  const [showActions, setShowActions] = useState(!isNew);

  // Show actions after all words have revealed
  useEffect(() => {
    if (!isNew) return;
    const totalTime = words.length * WORD_INTERVAL + ACTIONS_DELAY;
    const timer = setTimeout(() => setShowActions(true), totalTime);
    return () => clearTimeout(timer);
  }, [isNew, words.length]);

  // Intercept link clicks and open in the default browser via Figma API
  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest("a");
    if (anchor) {
      e.preventDefault();
      const url = anchor.getAttribute("href");
      if (url) {
        parent.postMessage({ pluginMessage: { type: "open_external", url } }, "*");
      }
    }
  }, []);

  if (msg.role === "assistant") {
    return (
      <div className={styles.assistantWrapper}>
        <div className={cx(styles.msg, styles.assistant)}>
          {isNew ? (
            <AnimatedText text={msg.text} onClick={handleClick} />
          ) : (
            <div
              className={styles.assistantText}
              onClick={handleClick}
              dangerouslySetInnerHTML={{ __html: html! }}
            />
          )}
        </div>
        {showActions && (
          <div className={cx(isNew && styles.actionsAnimate)}>
            <MessageActions
              onCopy={() => copyToClipboard(msg.text)}
              onRetry={onRetry}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cx(styles.msg, styles[msg.role])}>{msg.text}</div>
  );
}
