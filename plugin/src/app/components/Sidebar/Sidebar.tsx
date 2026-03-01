import { useState, useRef, useEffect } from "react";
import cx from "classnames";
import styles from "./Sidebar.module.css";
import { SidebarIcon, PlusSmallIcon, MoreIcon, TrashIcon } from "../Icons/Icons";
import { IconButton } from "../IconButton/IconButton";
import type { ChatSession } from "../../types";

interface SidebarProps {
  open: boolean;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onLoadSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onNewChat: () => void;
  onClose: () => void;
}

export function Sidebar({
  open,
  sessions,
  currentSessionId,
  onLoadSession,
  onDeleteSession,
  onNewChat,
  onClose,
}: SidebarProps) {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpenId) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpenId]);

  return (
    <>
      {open && (
        <div
          className={cx(styles.overlay, open && styles.overlayVisible)}
          onClick={onClose}
        />
      )}
      <div className={cx(styles.panel, open && styles.panelOpen)}>
        <div className={styles.header}>
          <span className={styles.headerTitle}>Claude Canvas</span>
          <IconButton icon={<SidebarIcon />} label="Close sidebar" onClick={onClose} />
        </div>
        <div className={styles.scrollArea}>
          <div className={styles.sectionLabel}>Recents</div>
          <div className={styles.list}>
            {sessions.length === 0 ? (
              <div className={styles.empty}>No conversations yet</div>
            ) : (
              sessions
                .slice()
                .sort((a, b) => b.updatedAt - a.updatedAt)
                .map((session) => (
                  <div
                    key={session.id}
                    className={cx(
                      styles.chatRow,
                      session.id === currentSessionId && styles.chatRowActive
                    )}
                  >
                    <button
                      className={styles.chatLabel}
                      onClick={() => onLoadSession(session.id)}
                    >
                      {session.title}
                    </button>
                    <div className={styles.menuAnchor} ref={menuOpenId === session.id ? menuRef : undefined}>
                      <button
                        className={styles.moreButton}
                        onClick={() => setMenuOpenId(menuOpenId === session.id ? null : session.id)}
                      >
                        <MoreIcon />
                      </button>
                      {menuOpenId === session.id && (
                        <div className={styles.menu}>
                          <button
                            className={styles.menuItem}
                            onClick={() => {
                              setMenuOpenId(null);
                              onDeleteSession(session.id);
                            }}
                          >
                            <TrashIcon className={styles.menuItemIcon} />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
        <div className={styles.footer}>
          <button className={styles.newChatButton} onClick={onNewChat}>
            <span className={styles.iconContainer}>
              <span className={styles.stateLayer} />
              <PlusSmallIcon className={styles.plusIcon} />
            </span>
            <span className={styles.newChatLabel}>New chat</span>
          </button>
        </div>
      </div>
    </>
  );
}
