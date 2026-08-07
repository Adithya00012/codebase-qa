import fg from "fast-glob";
import fs from "fs";
import path from "path";

const ALLOWED_EXTENSIONS = [".js", ".ts", ".tsx", ".jsx", ".py"];

export async function parseFiles(repoPath: string) {
  const pattern = "**/*.*";
  const allFiles = await fg(pattern, { cwd: repoPath, absolute: true });

  const filtered = allFiles.filter((file) =>
    ALLOWED_EXTENSIONS.includes(path.extname(file))
  );

  const results = filtered.map((filePath) => ({
    filePath: path.relative(repoPath, filePath),
    content: fs.readFileSync(filePath, "utf-8"),
  }));

  return results;
}