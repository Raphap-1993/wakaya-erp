import { readFileSync } from "node:fs";

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
  isMediaPreviewEscapeKey,
  scheduleMediaPreviewFailureReset,
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
  it("usa un outline de foco opaco y legible contra superficies blancas", () => {
    const stylesheet = readFileSync(
      new URL("./media-filename-preview.module.css", import.meta.url),
      "utf8",
    );

    expect(stylesheet).toContain("outline: 3px solid #234462;");
    expect(stylesheet).not.toMatch(/outline:\s*3px solid rgba\(/);
  });

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

  it("muestra un error amigable sin imagen rota", () => {
    const previewUrl = "/media/assets/asset_1/detail.webp";
    const html = renderToStaticMarkup(
      <MediaFilenamePreviewDialog
        originalFilename="Selva Wakaya.JPG"
        previewUrl={previewUrl}
        imageFailed={true}
        titleId="media-preview-title"
        closeButtonRef={{ current: null }}
        onClose={() => undefined}
        onImageError={() => undefined}
      />,
    );

    expect(html).toContain("No se pudo cargar la imagen");
    expect(html).not.toContain("<img");
    expect(html).not.toContain(previewUrl);
  });

  it.each(["", "  \n\t  "])(
    "muestra estado no interactivo cuando previewUrl está vacía",
    (previewUrl) => {
      const html = renderToStaticMarkup(
        <MediaFilenamePreview
          originalFilename="Selva Wakaya.JPG"
          previewUrl={previewUrl}
        />,
      );

      expect(html).toContain("Selva Wakaya.JPG");
      expect(html).toContain('title="Selva Wakaya.JPG"');
      expect(html).toContain("Sin imagen asociada");
      expect(html).not.toContain("<button");
      expect(html).not.toContain("<img");
      expect(html).not.toContain('aria-haspopup="dialog"');
      expect(html).not.toContain('role="dialog"');
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

  it("maneja Escape y Tab desde el backdrop sin propagar el evento", () => {
    const onClose = vi.fn();
    const focusClose = vi.fn();
    const view = MediaFilenamePreviewDialog({
      originalFilename: "Selva Wakaya.JPG",
      previewUrl: "/media/assets/asset_1/detail.webp",
      imageFailed: false,
      titleId: "media-preview-title",
      closeButtonRef: {
        current: { focus: focusClose } as unknown as HTMLButtonElement,
      },
      onClose,
      onImageError: () => undefined,
    });
    const onKeyDown = view.props.onKeyDown as
      | ((event: {
          key: string;
          shiftKey?: boolean;
          preventDefault: () => void;
          stopPropagation: () => void;
        }) => void)
      | undefined;

    expect(onKeyDown).toBeTypeOf("function");

    const escapeEvent = {
      key: "Escape",
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    };
    onKeyDown?.(escapeEvent);
    expect(escapeEvent.preventDefault).toHaveBeenCalledOnce();
    expect(escapeEvent.stopPropagation).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();

    const tabEvent = {
      key: "Tab",
      shiftKey: true,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    };
    onKeyDown?.(tabEvent);
    expect(tabEvent.preventDefault).toHaveBeenCalledOnce();
    expect(tabEvent.stopPropagation).toHaveBeenCalledOnce();
    expect(focusClose).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("resetea un error cuando cambia la URL sin desmontar el controlador", () => {
    const setImageState = vi.fn();
    let callback: FrameRequestCallback | undefined;
    const requestFrame = vi.fn((next: FrameRequestCallback) => {
      callback = next;
      return 9;
    });

    const frameId = scheduleMediaPreviewFailureReset(
      "/media/assets/asset_2/detail.webp",
      setImageState,
      requestFrame,
    );

    expect(frameId).toBe(9);
    expect(setImageState).not.toHaveBeenCalled();
    callback?.(0);
    expect(setImageState).toHaveBeenCalledWith({
      previewUrl: "/media/assets/asset_2/detail.webp",
      imageFailed: false,
    });
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
