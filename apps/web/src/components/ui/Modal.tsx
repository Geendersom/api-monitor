import { useEffect, useId, type ReactNode } from "react";

type ModalProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export const Modal = ({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
}: ModalProps) => {
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="modal-root" role="presentation">
      <button
        type="button"
        className="modal-backdrop"
        aria-label="Fechar modal"
        onClick={onClose}
      />
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="modal__header">
          <div>
            <h2 id={titleId} className="modal__title">
              {title}
            </h2>
            {subtitle ? <p className="modal__subtitle">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            className="modal__close"
            aria-label="Fechar"
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <div className="modal__body">{children}</div>
        {footer ? <footer className="modal__footer">{footer}</footer> : null}
      </section>
    </div>
  );
};
