import { ButtonHTMLAttributes, ReactNode } from "react";

import styles from "@/styles/loadingButton.module.scss";

type LoadingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingLabel?: ReactNode;
};

export default function LoadingButton({
  loading = false,
  loadingLabel,
  disabled,
  className,
  children,
  ...rest
}: LoadingButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={`${styles.root}${className ? ` ${className}` : ""}`}
      disabled={disabled || loading}
      aria-busy={loading}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      <span className={styles.label}>{loading ? loadingLabel : children}</span>
    </button>
  );
}
