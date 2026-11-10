import {
  useEffect,
  useRef,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import styles from './Sheet.module.css';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  titleId: string;
  children: ReactNode;
}

function openDialog(dialog: HTMLDialogElement): void {
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
}

function closeDialog(dialog: HTMLDialogElement): void {
  if (typeof dialog.close === 'function') dialog.close();
  else dialog.removeAttribute('open');
}

/** Modal bottom sheet on a native <dialog>: the browser traps focus and restores it on close. */
export function Sheet({ open, onClose, titleId, children }: SheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pressStartedOnBackdrop = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    if (open && !dialog.open) openDialog(dialog);
    if (!open && dialog.open) closeDialog(dialog);
  }, [open]);

  const handlePointerDown = (event: PointerEvent<HTMLDialogElement>) => {
    pressStartedOnBackdrop.current = event.target === event.currentTarget;
  };

  // A drag that starts inside the sheet and ends on the backdrop must not dismiss it.
  const handleClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget && pressStartedOnBackdrop.current) onClose();
    pressStartedOnBackdrop.current = false;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.sheet}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={() => {
        if (open) onClose();
      }}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {open && <div className={styles.panel}>{children}</div>}
    </dialog>
  );
}
