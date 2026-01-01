import { ReactNode } from "react";

import styles from "@/styles/menu/menu.module.scss";

type ModalProps = {
  isOpen: boolean;
  isVisible: boolean;
  title?: string;
  children: ReactNode;
};

export function Modal({ isOpen, isVisible, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className={`${styles.overlay} ${
        isVisible ? styles.overlayVisible : ""
      }`}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`${styles.modal} ${
          isVisible ? styles.modalVisible : ""
        }`}
      >
        {title ? <h3 className={styles.modalTitle}>{title}</h3> : null}
        {children}
      </div>
    </div>
  );
}
