import { describe, expect, it } from "vitest";

import {
  attachmentMediaKind,
  isPreviewableAttachment,
  normalizeAttachmentContentType,
  shouldTranscodeAttachmentImage,
} from "./attachment-media";

describe("attachment-media", () => {
  it("recovers common image content types from the file extension when the provider stores octet-stream", () => {
    expect(normalizeAttachmentContentType("application/octet-stream", "voucher.jfif")).toBe("image/jpeg");
    expect(normalizeAttachmentContentType("application/octet-stream", "voucher.heic")).toBe("image/heic");
    expect(normalizeAttachmentContentType("application/octet-stream", "voucher.tiff")).toBe("image/tiff");
  });

  it("treats generic-image attachments as previewable images when the file extension is known", () => {
    expect(attachmentMediaKind({ contentType: "application/octet-stream", fileName: "voucher.jfif" })).toBe("image");
    expect(isPreviewableAttachment({ contentType: "application/octet-stream", fileName: "voucher.jfif" })).toBe(true);
  });

  it("flags heic and tiff inputs for jpeg transcoding in the inline viewer", () => {
    expect(shouldTranscodeAttachmentImage({ contentType: "application/octet-stream", fileName: "voucher.heic" })).toBe(true);
    expect(shouldTranscodeAttachmentImage({ contentType: "image/tiff", fileName: "voucher.tiff" })).toBe(true);
    expect(shouldTranscodeAttachmentImage({ contentType: "image/jpeg", fileName: "voucher.jpg" })).toBe(false);
  });
});
