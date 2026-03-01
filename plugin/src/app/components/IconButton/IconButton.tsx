import cx from "classnames";
import styles from "./IconButton.module.css";

interface IconButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  label: string;
  variant?: "primary" | "secondary" | "tertiary";
  disabled?: boolean;
  className?: string;
}

export function IconButton({
  icon,
  onClick,
  label,
  variant = "tertiary",
  disabled,
  className,
}: IconButtonProps) {
  return (
    <button
      className={cx(styles.root, styles[variant], className)}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
    >
      {icon}
    </button>
  );
}
