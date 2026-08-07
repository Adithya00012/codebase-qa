import simpleGit from "simple-git";
import path from "path";

export async function cloneRepo(repoUrl: string, repoName: string) {
  const targetPath = path.join(__dirname, "..", "cloned_repos", repoName);
  const git = simpleGit();
  await git.clone(repoUrl, targetPath);
  return targetPath;
}