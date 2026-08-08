import { chunkFile } from "./chunkFile";

describe("chunkFile", () => {
    it("splits a small function into a single chunk", async () => {
        const code = `function add(a, b) {\n  return a + b;\n}`;
        const chunks = await chunkFile(code, "js");
        expect(chunks.length).toBe(1);
        expect(chunks[0]).toContain("function add");
    });

    it("splits large code into multiple chunks", async () => {
        const bigFunction = Array(50)
            .fill("function foo() {\n  return 1;\n}\n")
            .join("\n");
        const chunks = await chunkFile(bigFunction, "js");
        expect(chunks.length).toBeGreaterThan(1);
    });

    it("returns empty array for empty input", async () => {
        const chunks = await chunkFile("", "js");
        expect(chunks.length).toBe(0);
    });
});