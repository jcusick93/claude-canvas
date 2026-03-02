import { useState, useRef, useEffect, useCallback } from "react";

const DURATION = 250; // ms

interface CollapseItemProps {
  children: React.ReactNode;
  itemKey: string;
  onExited?: () => void;
}

/** Wraps a single item with enter/exit collapse animation */
function CollapseItem({ children, itemKey, onExited }: CollapseItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"entering" | "entered" | "exiting">("entering");

  // Enter animation
  useEffect(() => {
    const el = ref.current;
    if (!el || state !== "entering") return;

    // Measure natural height
    el.style.height = "auto";
    const height = el.scrollHeight;

    // Start collapsed
    el.style.height = "0px";
    el.style.opacity = "0";
    el.style.overflow = "hidden";

    // Force reflow
    el.getBoundingClientRect();

    // Animate to full height
    el.style.transition = `height ${DURATION}ms cubic-bezier(.4,0,.2,1), opacity ${DURATION}ms cubic-bezier(.4,0,.2,1)`;
    el.style.height = `${height}px`;
    el.style.opacity = "1";

    const timer = setTimeout(() => {
      el.style.height = "auto";
      el.style.transition = "";
      el.style.overflow = "visible";
      setState("entered");
    }, DURATION);

    return () => clearTimeout(timer);
  }, [state, itemKey]);

  return (
    <div ref={ref}>
      {children}
    </div>
  );
}

interface ManagedItem<T> {
  item: T;
  key: string;
  exiting: boolean;
}

interface CollapseListProps<T> {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
}

/** Manages a list of items with collapse enter/exit animations */
export function CollapseList<T>({ items, getKey, renderItem }: CollapseListProps<T>) {
  const [managed, setManaged] = useState<ManagedItem<T>[]>([]);

  useEffect(() => {
    const currentMap = new Map<string, T>();
    for (const item of items) {
      currentMap.set(getKey(item), item);
    }

    setManaged((prev) => {
      // Build a set of keys in the new items list
      const currentKeys = new Set(currentMap.keys());

      // Start from the previous order — this preserves positions
      // Walk prev list: update items that still exist, mark removed as exiting
      const result: ManagedItem<T>[] = [];
      const seen = new Set<string>();

      for (const m of prev) {
        if (currentKeys.has(m.key)) {
          // Item still exists — update it
          result.push({ item: currentMap.get(m.key)!, key: m.key, exiting: false });
          seen.add(m.key);
        } else if (!m.exiting) {
          // Item was removed — mark as exiting (keep in place)
          result.push({ ...m, exiting: true });
          seen.add(m.key);
        } else {
          // Already exiting — keep it
          result.push(m);
          seen.add(m.key);
        }
      }

      // Append any new items that weren't in prev
      for (const item of items) {
        const key = getKey(item);
        if (!seen.has(key)) {
          result.push({ item, key, exiting: false });
        }
      }

      return result;
    });
  }, [items, getKey]);

  const handleExited = useCallback((key: string) => {
    setManaged((prev) => prev.filter((m) => m.key !== key));
  }, []);

  return (
    <>
      {managed.map((m) =>
        m.exiting ? (
          <CollapseExit key={m.key} onExited={() => handleExited(m.key)}>
            {renderItem(m.item)}
          </CollapseExit>
        ) : (
          <CollapseItem key={m.key} itemKey={m.key}>
            {renderItem(m.item)}
          </CollapseItem>
        )
      )}
    </>
  );
}

/** Handles exit collapse animation, then removes from DOM */
function CollapseExit({ children, onExited }: { children: React.ReactNode; onExited: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const height = el.scrollHeight;
    el.style.height = `${height}px`;
    el.style.opacity = "1";
    el.style.overflow = "hidden";

    // Force reflow
    el.getBoundingClientRect();

    el.style.transition = `height ${DURATION}ms cubic-bezier(.4,0,.2,1), opacity ${DURATION}ms cubic-bezier(.4,0,.2,1)`;
    el.style.height = "0px";
    el.style.opacity = "0";

    const timer = setTimeout(onExited, DURATION);
    return () => clearTimeout(timer);
  }, [onExited]);

  return <div ref={ref}>{children}</div>;
}
