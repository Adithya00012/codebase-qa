import fs from "fs";
import path from "path";
import { parseFiles } from "./parseFiles";

const testDir = path.join(__dirname, "__test_fixture__");

beforeAll(() => {
    fs.mkdirSync(testDir, { recursive: true });
    fs.writeFileSync(path.join(testDir, "app.js"), "console.log('hi')");
    fs.writeFileSync(path.join(testDir, "readme.md"), "# hello");
    fs.writeFileSync(path.join(testDir, "script.py"), "print('hi')");
});

afterAll(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
});

describe("parseFiles", () => {
    it("only returns allowed extensions", async () => {
        const files = await parseFiles(testDir);
        const paths = files.map((f) => f.filePath);
        expect(paths).toContain("app.js");
        expect(paths).toContain("script.py");
        expect(paths).not.toContain("readme.md");
    });

    it("reads file content correctly", async () => {
        const files = await parseFiles(testDir);
        const app = files.find((f) => f.filePath === "app.js");
        expect(app?.content).toBe("console.log('hi')");
    });
});