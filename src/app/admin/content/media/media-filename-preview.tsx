"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type RefObject,
} from "react";

import styles from "./media-filename-preview.module.css";

export type MediaFilenamePreviewProps = {
  originalFilename: string;
  previewUrl: string;
};

type FocusTarget = {
  focus: () => void;
};

type FocusTargetRef = {
  current: FocusTarget | null;
};

type RequestFrame = (callback: FrameRequestCallback) => number;

type MediaPreviewImageState = {
  previewUrl: string;
  imageFailed: boolean;
};

export function shouldCloseMediaPreviewFromBackdrop({
  target,
  currentTarget,
}: {
  target: unknown;
  currentTarget: unknown;
}) {
  return target === currentTarget;
}

export function isMediaPreviewEscapeKey({ key }: { key: string }) {
  return key === "Escape";
}

export function scheduleMediaPreviewFailureReset(
  previewUrl: string,
  setImageState: (state: MediaPreviewImageState) => void,
  requestFrame?: RequestFrame,
) {
  const resetFailure = () => {
    setImageState({ previewUrl, imageFailed: false });
  };

  if (requestFrame) {
    return requestFrame(resetFailure);
  }

  if (
    typeof window !== "undefined" &&
    typeof window.requestAnimationFrame === "function"
  ) {
    return window.requestAnimationFrame(resetFailure);
  }

  resetFailure();
  return null;
}

export function handleMediaPreviewDialogKeyDown(
  event: {
    key: string;
    preventDefault: () => void;
    stopPropagation: () => void;
  },
  onClose: () => void,
  closeButtonRef: FocusTargetRef,
) {
  if (isMediaPreviewEscapeKey(event)) {
    event.preventDefault();
    event.stopPropagation();
    onClose();
    return;
  }

  if (event.key === "Tab") {
    event.preventDefault();
    event.stopPropagation();
    closeButtonRef.current?.focus();
  }
}

export function scheduleMediaPreviewTriggerFocus(
  triggerRef: FocusTargetRef,
  requestFrame?: RequestFrame,
) {
  if (requestFrame) {
    return requestFrame(() => triggerRef.current?.focus());
  }

  if (
    typeof window !== "undefined" &&
    typeof window.requestAnimationFrame === "function"
  ) {
    return window.requestAnimationFrame(() => triggerRef.current?.focus());
  }

  triggerRef.current?.focus();
  return null;
}

type MediaFilenamePreviewDialogProps = MediaFilenamePreviewProps & {
  imageFailed: boolean;
  titleId: string;
  closeButtonRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onImageError: () => void;
};

/** Vista pura para mantener comprobables los estados del popup sin un DOM de pruebas. */
export function MediaFilenamePreviewDialog({
  originalFilename,
  previewUrl,
  imageFailed,
  titleId,
  closeButtonRef,
  onClose,
  onImageError,
}: MediaFilenamePreviewDialogProps) {
  const filenameId = `${titleId}-filename`;
  const showImage = Boolean(previewUrl) && !imageFailed;

  return (
    <div
      className={styles.backdrop}
      data-testid="media-preview-backdrop"
      onKeyDown={(event) =>
        handleMediaPreviewDialogKeyDown(event, onClose, closeButtonRef)
      }
      onClick={(event) => {
        if (shouldCloseMediaPreviewFromBackdrop(event)) {
          onClose();
        }
      }}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={filenameId}
      >
        <header className={styles.header}>
          <div className={styles.heading}>
            <h2 id={titleId} className={styles.title}>
              Vista previa de imagen
            </h2>
            <p
              id={filenameId}
              className={styles.filename}
              title={originalFilename}
            >
              {originalFilename}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.closeButton}
            autoFocus
            onClick={onClose}
          >
            Cerrar
          </button>
        </header>

        <div className={showImage ? styles.previewFrame : styles.errorState}>
          {showImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- La preview usa una URL runtime ya optimizada y debe mantener sus dimensiones intrinsecas.
            <img
              className={styles.previewImage}
              src={previewUrl}
              alt={originalFilename}
              onError={onImageError}
            />
          ) : (
            <p role="status">No se pudo cargar la imagen</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function MediaFilenamePreview({
  originalFilename,
  previewUrl,
}: MediaFilenamePreviewProps) {
  const usablePreviewUrl = previewUrl.trim();

  if (!usablePreviewUrl) {
    return (
      <span className={styles.unavailable} title={originalFilename}>
        <span className={styles.unavailableFilename}>{originalFilename}</span>
        <span className={styles.unavailableState}>Sin imagen asociada</span>
      </span>
    );
  }

  return (
    <MediaFilenamePreviewController
      originalFilename={originalFilename}
      previewUrl={usablePreviewUrl}
    />
  );
}

function MediaFilenamePreviewController({
  originalFilename,
  previewUrl,
}: MediaFilenamePreviewProps) {
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const restoreFrameRef = useRef<number | null>(null);
  const previousPreviewUrlRef = useRef(previewUrl);
  const [open, setOpen] = useState(false);
  const [imageState, setImageState] = useState<MediaPreviewImageState>({
    previewUrl,
    imageFailed: false,
  });
  const imageFailed =
    imageState.previewUrl === previewUrl && imageState.imageFailed;

  const closeDialog = useCallback(() => {
    setOpen(false);

    if (typeof window === "undefined") {
      return;
    }

    if (
      restoreFrameRef.current !== null &&
      typeof window.cancelAnimationFrame === "function"
    ) {
      window.cancelAnimationFrame(restoreFrameRef.current);
    }

    restoreFrameRef.current = scheduleMediaPreviewTriggerFocus(triggerRef);
  }, []);

  useEffect(() => {
    if (previousPreviewUrlRef.current === previewUrl) {
      return;
    }

    previousPreviewUrlRef.current = previewUrl;
    const frameId = scheduleMediaPreviewFailureReset(previewUrl, setImageState);

    return () => {
      if (
        frameId !== null &&
        typeof window !== "undefined" &&
        typeof window.cancelAnimationFrame === "function"
      ) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const frameId = scheduleMediaPreviewTriggerFocus(closeButtonRef);
    return () => {
      if (
        frameId !== null &&
        typeof window !== "undefined" &&
        typeof window.cancelAnimationFrame === "function"
      ) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [open]);

  useEffect(
    () => () => {
      if (
        restoreFrameRef.current !== null &&
        typeof window !== "undefined" &&
        typeof window.cancelAnimationFrame === "function"
      ) {
        window.cancelAnimationFrame(restoreFrameRef.current);
      }
    },
    [],
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        title={originalFilename}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setImageState({ previewUrl, imageFailed: false });
          setOpen(true);
        }}
      >
        {originalFilename}
      </button>

      {open ? (
        <MediaFilenamePreviewDialog
          originalFilename={originalFilename}
          previewUrl={previewUrl}
          imageFailed={imageFailed}
          titleId={titleId}
          closeButtonRef={closeButtonRef}
          onClose={closeDialog}
          onImageError={() => setImageState({ previewUrl, imageFailed: true })}
        />
      ) : null}
    </>
  );
}
