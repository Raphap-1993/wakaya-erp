import { beforeEach, describe, expect, it, vi } from "vitest";

const { readPublicMediaMock } = vi.hoisted(() => ({
  readPublicMediaMock: vi.fn(),
}));

vi.mock("@/lib/content/media/content-media-service", () => ({
  contentMediaService: {
    readPublicMedia: readPublicMediaMock,
  },
}));

async function loadRoute() {
  return import("./route");
}

describe("GET /media/[...path]", () => {
  beforeEach(() => {
    vi.resetModules();
    readPublicMediaMock.mockReset();
  });

  it("serves stored webp media", async () => {
    readPublicMediaMock.mockResolvedValue({
      buffer: Buffer.from("webp-binary"),
      contentType: "image/webp",
    });

    const { GET } = await loadRoute();
    const response = await GET(new Request("http://localhost/media/bungalows/test.webp"), {
      params: { path: ["bungalows", "test.webp"] },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/webp");
    expect(await response.arrayBuffer()).toEqual(Buffer.from("webp-binary").buffer.slice(Buffer.from("webp-binary").byteOffset, Buffer.from("webp-binary").byteOffset + Buffer.from("webp-binary").byteLength));
  });
});
