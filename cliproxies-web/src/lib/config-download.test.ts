import { describe, it, expect, beforeEach, vi } from "vitest";
import { downloadConfig } from "./config-download";

// Mock document methods
const mockCreateElement = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();
const mockClick = vi.fn();
const mockRevokeObjectURL = vi.fn();
const mockCreateObjectURL = vi.fn();

describe("config-download", () => {
  const originalDocument = global.document;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock DOM environment
    global.URL = {
      ...global.URL,
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    } as unknown as typeof URL;

    global.document = {
      ...originalDocument,
      createElement: mockCreateElement,
      body: {
        ...originalDocument.body,
        appendChild: mockAppendChild,
        removeChild: mockRemoveChild,
      },
    } as unknown as Document;

    mockCreateObjectURL.mockReturnValue("blob:mock-url");
    mockCreateElement.mockReturnValue({
      href: "",
      download: "",
      click: mockClick,
    } as unknown as HTMLAnchorElement);
  });

  it("creates a blob with correct content type", () => {
    const content = "test: config";
    downloadConfig(content);

    expect(mockCreateObjectURL).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "text/yaml",
      }),
    );
  });

  it("uses default filename when not provided", () => {
    const content = "test: config";
    downloadConfig(content);

    const anchor = mockCreateElement.mock.results[0].value as HTMLAnchorElement;
    expect(anchor.download).toBe("config.yaml");
  });

  it("uses provided filename", () => {
    const content = "test: config";
    const filename = "custom-config.yaml";
    downloadConfig(content, filename);

    const anchor = mockCreateElement.mock.results[0].value as HTMLAnchorElement;
    expect(anchor.download).toBe(filename);
  });

  it("creates and clicks an anchor element", () => {
    const content = "test: config";
    downloadConfig(content);

    expect(mockCreateElement).toHaveBeenCalledWith("a");
    expect(mockAppendChild).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(mockRemoveChild).toHaveBeenCalled();
  });

  it("sets the blob URL as anchor href", () => {
    const content = "test: config";
    mockCreateObjectURL.mockReturnValue("blob:test-url");

    downloadConfig(content);

    const anchor = mockCreateElement.mock.results[0].value as HTMLAnchorElement;
    expect(anchor.href).toBe("blob:test-url");
  });

  it("revokes the object URL after download", () => {
    const content = "test: config";
    mockCreateObjectURL.mockReturnValue("blob:test-url");

    downloadConfig(content);

    expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:test-url");
  });

  it("handles multi-line YAML content", () => {
    const content = `
port: 8317
api-keys:
  - key1
  - key2
debug: false
    `.trim();

    downloadConfig(content);

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
  });

  it("handles empty content", () => {
    const content = "";
    downloadConfig(content);

    expect(mockCreateObjectURL).toHaveBeenCalled();
  });

  it("handles special characters in filename", () => {
    const content = "test: config";
    const filename = "config (1) [test].yaml";

    downloadConfig(content, filename);

    const anchor = mockCreateElement.mock.results[0].value as HTMLAnchorElement;
    expect(anchor.download).toBe(filename);
  });
});
