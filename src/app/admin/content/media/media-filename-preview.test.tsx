import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import {
  MediaFilenamePreview,
  MediaFilenamePreviewDialog,
  addMediaPreviewKeydownListener,
  isMediaPreviewEscapeKey,
  resolveMediaPreviewImageState,
  scheduleMediaPreviewTriggerFocus,
} from "./media-filename-preview";

function findElement(
  node: ReactNode,
  type: "button" | "img",
): ReactElement<Record<string, unknown>> | undefined {
  if (!isValidElement(node)) {
    return undefined;
  }

  if (node.type === type) {
    return node as ReactElement<Record<string, unknown>>;
  }

  const children = (node.props as { children?: ReactNode }).children;
  for (const child of Children.toArray(children)) {
    const match = findElement(child, type);
    if (match) {
      return match;
    }
  }

  return undefined;
}

describe("MediaFilenamePreview", () => {
  it("muestra el nombre completo como trigger de dialogo en el estado cerrado", () => {
    const html = renderToStaticMarkup(
      <MediaFilenamePreview
        originalFilename="Selva Wakaya.JPG"
        previewUrl="/media/assets/asset_1/heroDesktop.webp"
      />,
    );

    expect(html).toContain("Selva Wakaya.JPG");
    expect(html).toContain('title="Selva Wakaya.JPG"');
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).not.toContain('role="dialog"');
  });

  it("renderiza el dialogo abierto con nombre accesible, imagen y foco inicial en Cerrar", () => {
    const html = renderToStaticMarkup(
      <MediaFilenamePreviewDialog
        originalFilename="Selva Wakaya.JPG"
        previewUrl="/media/assets/asset_1/heroDesktop.webp"
        imageFailed={false}
        titleId="media-preview-title"
        closeButtonRef={{ current: null }}
        onClose={() => undefined}
        onImageError={() => undefined}
      />,
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-labelledby="media-preview-title"');
    expect(html).toContain('id="media-preview-title"');
    expect(html).toContain("Vista previa de imagen");
    expect(html).toContain("Selva Wakaya.JPG");
    expect(html).toContain('src="/media/assets/asset_1/heroDesktop.webp"');
    expect(html).toContain('alt="Selva Wakaya.JPG"');
    expect(html).toContain("autofocus");
    expect(html).toContain("Cerrar");
  });

  it.each([
    { previewUrl: "", imageFailed: false },
    { previewUrl: "/media/assets/asset_1/detail.webp", imageFailed: true },
  ])(
    "muestra un error amigable sin imagen rota",
    ({ previewUrl, imageFailed }) => {
      const html = renderToStaticMarkup(
        <MediaFilenamePreviewDialog
          originalFilename="Selva Wakaya.JPG"
          previewUrl={previewUrl}
          imageFailed={imageFailed}
          titleId="media-preview-title"
          closeButtonRef={{ current: null }}
          onClose={() => undefined}
          onImageError={() => undefined}
        />,
      );

      expect(html).toContain("No se pudo cargar la imagen");
      expect(html).not.toContain("<img");
      expect(html).not.toContain(previewUrl ? previewUrl : 'src=""');
    },
  );

  it("conecta el error de imagen con el estado amigable", () => {
    const onImageError = vi.fn();
    const view = MediaFilenamePreviewDialog({
      originalFilename: "Selva Wakaya.JPG",
      previewUrl: "/media/assets/asset_1/detail.webp",
      imageFailed: false,
      titleId: "media-preview-title",
      closeButtonRef: { current: null },
      onClose: () => undefined,
      onImageError,
    });

    const image = findElement(view, "img");
    expect(image).toBeDefined();
    (image?.props.onError as (() => void) | undefined)?.();
    expect(onImageError).toHaveBeenCalledOnce();
  });

  it("cierra solo cuando el click ocurre directamente en el backdrop", () => {
    const onClose = vi.fn();
    const view = MediaFilenamePreviewDialog({
      originalFilename: "Selva Wakaya.JPG",
      previewUrl: "/media/assets/asset_1/detail.webp",
      imageFailed: false,
      titleId: "media-preview-title",
      closeButtonRef: { current: null },
      onClose,
      onImageError: () => undefined,
    });
    const onBackdropClick = view.props.onClick;
    const backdrop = {};

    (
      onBackdropClick as (event: {
        target: unknown;
        currentTarget: unknown;
      }) => void
    )({
      target: {},
      currentTarget: backdrop,
    });
    expect(onClose).not.toHaveBeenCalled();

    (
      onBackdropClick as (event: {
        target: unknown;
        currentTarget: unknown;
      }) => void
    )({
      target: backdrop,
      currentTarget: backdrop,
    });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("conecta el boton Cerrar con la misma accion de cierre", () => {
    const onClose = vi.fn();
    const view = MediaFilenamePreviewDialog({
      originalFilename: "Selva Wakaya.JPG",
      previewUrl: "/media/assets/asset_1/detail.webp",
      imageFailed: false,
      titleId: "media-preview-title",
      closeButtonRef: { current: null },
      onClose,
      onImageError: () => undefined,
    });

    const closeButton = findElement(view, "button");
    (closeButton?.props.onClick as (() => void) | undefined)?.();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("reconoce Escape sin tratar otras teclas como cierre", () => {
    expect(isMediaPreviewEscapeKey({ key: "Escape" })).toBe(true);
    expect(isMediaPreviewEscapeKey({ key: "Enter" })).toBe(false);
  });

  it("instala y limpia el listener que cierra con Escape y contiene Tab", () => {
    let listener: ((event: KeyboardEvent) => void) | undefined;
    const addEventListener = vi.fn(
      (_type: "keydown", next: (event: KeyboardEvent) => void) => {
        listener = next;
      },
    );
    const removeEventListener = vi.fn();
    const onEscape = vi.fn();
    const focusClose = vi.fn();
    const preventDefault = vi.fn();

    const cleanup = addMediaPreviewKeydownListener(
      { addEventListener, removeEventListener },
      onEscape,
      { current: { focus: focusClose } },
    );

    expect(addEventListener).toHaveBeenCalledOnce();
    listener?.({ key: "Escape" } as KeyboardEvent);
    expect(onEscape).toHaveBeenCalledOnce();

    listener?.({ key: "Tab", preventDefault } as unknown as KeyboardEvent);
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(focusClose).toHaveBeenCalledOnce();

    cleanup();
    expect(removeEventListener).toHaveBeenCalledWith("keydown", listener);
  });

  it("resetea un error cuando cambia la URL sin desmontar el controlador", () => {
    const failedState = {
      previewUrl: "/media/assets/asset_1/detail.webp",
      imageFailed: true,
    };

    expect(
      resolveMediaPreviewImageState(
        failedState,
        "/media/assets/asset_2/detail.webp",
      ),
    ).toEqual({
      previewUrl: "/media/assets/asset_2/detail.webp",
      imageFailed: false,
    });
    expect(
      resolveMediaPreviewImageState(
        failedState,
        "/media/assets/asset_1/detail.webp",
      ),
    ).toBe(failedState);
  });

  it("devuelve el foco al trigger en el siguiente animation frame", () => {
    const focus = vi.fn();
    let callback: FrameRequestCallback | undefined;
    const requestFrame = vi.fn((next: FrameRequestCallback) => {
      callback = next;
      return 7;
    });

    const frameId = scheduleMediaPreviewTriggerFocus(
      { current: { focus } },
      requestFrame,
    );

    expect(frameId).toBe(7);
    expect(focus).not.toHaveBeenCalled();
    callback?.(0);
    expect(focus).toHaveBeenCalledOnce();
  });
});
